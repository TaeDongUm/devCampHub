import { useCallback, useEffect, useRef, useState } from "react";
import { http } from "../api/http";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface StreamMeta {
  title: string;
  type: 'LECTURE' | 'MOGAKCO';
  micOn: boolean;
  camOn: boolean;
  screenOn: boolean;
  track: 'WEB' | 'ANDROID' | 'IOS';
}

interface StreamResponseDto {
    streamId: number;
    title: string;
    ownerNickname: string;
    type: 'LECTURE' | 'MOGAKCO';
}

export function useStreamSession(campId: string, nickname: string, joinStreamId?: string) {
  const [isStreaming, setStreaming] = useState<boolean>(false);
  const [streamId, setStreamId] = useState<number | null>(
    joinStreamId ? parseInt(joinStreamId, 10) : null
  );
  const [meta, setMeta] = useState<Partial<StreamMeta>>({});
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const stompClient = useRef<Client | null>(null);

  const createPeerConnection = useCallback((peerNickname: string, currentStreamId: number) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    pc.oniceconnectionstatechange = () => {
      console.log(`[${peerNickname}] ICE connection state: ${pc.iceConnectionState}`);
    };
    pc.onconnectionstatechange = () => {
      console.log(`[${peerNickname}] Peer connection state: ${pc.connectionState}`);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && stompClient.current?.connected) {
        stompClient.current.publish({ 
          destination: `/app/signal/${currentStreamId}`, 
          body: JSON.stringify({ 
            type: 'ice', 
            sender: nickname, 
            receiver: peerNickname, 
            data: event.candidate 
          }) 
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`[${peerNickname}] Track received`, event.streams[0]);
      setRemoteStreams(prev => ({ ...prev, [peerNickname]: event.streams[0] }));
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => { pc.addTrack(track, localStreamRef.current!); });
    }

    peerConnections.current[peerNickname] = pc;
    return pc;
  }, [nickname]);

  const begin = useCallback(async (initialMeta: StreamMeta): Promise<number | undefined> => {
    try {
      const streamRes = await http<StreamResponseDto>(`/api/camps/${campId}/streams`, {
        method: 'POST',
        body: JSON.stringify({ title: initialMeta.title, type: initialMeta.type, track: initialMeta.track })
      });

      let stream: MediaStream;
      if (initialMeta.screenOn) {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: initialMeta.micOn });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ video: initialMeta.camOn, audio: initialMeta.micOn });
      }
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      setMeta(initialMeta);
      setStreamId(streamRes.streamId);
      setStreaming(true);
      return streamRes.streamId;
    } catch (err) {
      console.error("스트리밍 시작 실패:", err);
      alert("미디어 장치를 사용할 수 없습니다. 장치가 연결되어 있는지, 브라우저에서 접근 권한이 허용되었는지 확인해주세요.");
    }
  }, [campId]);

  const end = useCallback(async () => {
    if (!streamId) return;
    // 스트림 종료 API 호출 추가
    try {
      await http(`/api/camps/${campId}/streams/${streamId}`, { method: 'DELETE' });
    } catch (error) {
      console.error("스트림 종료 API 호출 실패:", error);
    }
    
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setStreaming(false);
    setStreamId(null);
    // 모든 peer-connection 종료
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    // stomp client 비활성화
    if (stompClient.current?.active) {
      stompClient.current.deactivate();
    }
  }, [campId, streamId]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setMeta(prev => ({ ...prev, micOn: !prev.micOn }));
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setMeta(prev => ({ ...prev, camOn: !prev.camOn }));
    }
  }, []);

  useEffect(() => {
    if (!nickname || !streamId) {
        return;
    }

    const token = localStorage.getItem('token');
    const sockJsUrl = token 
      ? `http://localhost:8080/ws-stomp?token=${encodeURIComponent(token)}`
      : 'http://localhost:8080/ws-stomp';

    const client = new Client({
        webSocketFactory: () => new SockJS(sockJsUrl),
        reconnectDelay: 5000,
        onConnect: () => {
            client.subscribe(`/topic/signal/${streamId}`, async message => {
                const signal = JSON.parse(message.body);
                const sender = signal.sender;
                if (sender === nickname) return;
                if (signal.receiver && signal.receiver !== nickname) return;

                let pc = peerConnections.current[sender];
                if (!pc) {
                  pc = createPeerConnection(sender, streamId);
                }

                switch (signal.type) {
                  case 'user-joined': {
                    if (nickname > sender) { // 중복 offer 방지
                      const offer = await pc.createOffer();
                      await pc.setLocalDescription(offer);
                      client.publish({ destination: `/app/signal/${streamId}`, body: JSON.stringify({ type: 'offer', sender: nickname, receiver: sender, data: offer }) });
                    }
                    break;
                  }
                  case 'offer': {
                      await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
                      const answer = await pc.createAnswer();
                      await pc.setLocalDescription(answer);
                      client.publish({ destination: `/app/signal/${streamId}`, body: JSON.stringify({ type: 'answer', sender: nickname, receiver: sender, data: answer }) });
                      break;
                  }
                  case 'answer': {
                      await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
                      break;
                  }
                  case 'ice': {
                      await pc.addIceCandidate(new RTCIceCandidate(signal.data));
                      break;
                  }
                  case 'user-left': {
                      if (peerConnections.current[sender]) {
                          peerConnections.current[sender].close();
                          delete peerConnections.current[sender];
                      }
                      setRemoteStreams(prev => {
                          const newState = { ...prev };
                          delete newState[sender];
                          return newState;
                      });
                      break;
                  }
              }
            });

            // 본인을 제외한 기존 참여자 목록을 요청하고, 연결을 시작
            client.publish({
                destination: `/app/signal/join`,
                body: JSON.stringify({
                    streamId: streamId.toString(),
                    nickname: nickname
                })
            });
        }
    });

    client.activate();
    stompClient.current = client;

    return () => {
        if (client.active) {
          client.deactivate();
        }
        Object.values(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};
        setRemoteStreams({});
    };
  }, [streamId, nickname, createPeerConnection]);

  return {
    isStreaming,
    streamId,
    meta,
    begin,
    end,
    localStream,
    remoteStreams,
    toggleAudio,
    toggleVideo,
  };
}
