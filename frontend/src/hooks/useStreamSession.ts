import { useCallback, useEffect, useRef, useState } from "react";
import { http } from "../api/http";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface StreamMeta {
  title: string;
  type: 'LIVE' | 'MOGAKCO';
  micOn: boolean;
  camOn: boolean;
  screenOn: boolean;
  track: 'WEB' | 'ANDROID' | 'IOS';
}

interface StreamResponseDto {
    streamId: number;
    title: string;
    ownerNickname: string;
    type: 'LIVE' | 'MOGAKCO';
}

export function useStreamSession(campId: string, nickname: string) {
  const [isStreaming, setStreaming] = useState<boolean>(false);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [meta, setMeta] = useState<Partial<StreamMeta>>({});
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const stompClient = useRef<Client | null>(null);

  const createPeerConnection = useCallback((peerNickname: string, currentStreamId: number) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    pc.onicecandidate = (event) => {
      if (event.candidate && stompClient.current?.connected) {
        stompClient.current.publish({ destination: `/app/signal/${currentStreamId}`, body: JSON.stringify({ type: 'ice', sender: nickname, data: event.candidate }) });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({ ...prev, [peerNickname]: event.streams[0] }));
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => { pc.addTrack(track, localStreamRef.current!); });
    }

    peerConnections.current[peerNickname] = pc;
    return pc;
  }, [nickname]);

  // 스트리밍 시작 (상태 설정만 담당)
  const begin = useCallback(async (initialMeta: StreamMeta) => {
    try {
      const stream = await http<StreamResponseDto>(`/api/camps/${campId}/streams`, {
        method: 'POST',
        body: JSON.stringify({ title: initialMeta.title, type: initialMeta.type })
      });
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = localStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      
      setMeta(initialMeta);
      setStreamId(stream.streamId);
      setStreaming(true);
    } catch (err) {
      console.error("스트리밍 시작 실패:", err);
    }
  }, [campId]);

  // 스트리밍 종료 (상태 초기화만 담당)
  const end = useCallback(async () => {
    if (!streamId) return;
    await http(`/api/camps/${campId}/streams/${streamId}`, { method: 'DELETE' });
    setStreaming(false);
    setStreamId(null);
  }, [campId, streamId]);

  // streamId가 생기거나 사라질 때 WebSocket 연결/해제 처리
  useEffect(() => {
    if (!isStreaming || !streamId) {
        return;
    }

    const client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        onConnect: () => {
            client.subscribe(`/topic/signal/${streamId}`, async message => {
                const signal = JSON.parse(message.body);
                const sender = signal.sender;
                if (sender === nickname) return;

                switch (signal.type) {
                case 'join': {
                    const pc = createPeerConnection(sender, streamId);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    client.publish({ destination: `/app/signal/${streamId}`, body: JSON.stringify({ type: 'offer', sender: nickname, data: offer }) });
                    break;
                }
                case 'offer': {
                    const pc = createPeerConnection(sender, streamId);
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    client.publish({ destination: `/app/signal/${streamId}`, body: JSON.stringify({ type: 'answer', sender: nickname, data: answer }) });
                    break;
                }
                case 'answer': {
                    const pc = peerConnections.current[sender];
                    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
                    break;
                }
                case 'ice': {
                    const pc = peerConnections.current[sender];
                    if (pc) await pc.addIceCandidate(new RTCIceCandidate(signal.data));
                    break;
                }
                case 'leave': {
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

            client.publish({ destination: `/app/signal/${streamId}`, body: JSON.stringify({ type: 'join', sender: nickname }) });
        }
    });

    client.activate();
    stompClient.current = client;

    // Cleanup 함수
    return () => {
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        Object.values(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};
        client.deactivate();
        setRemoteStreams({});
    };
  }, [isStreaming, streamId, nickname, createPeerConnection]);

  return {
    isStreaming,
    streamId,
    meta,
    setMeta,
    begin,
    end,
    localVideoRef,
    remoteStreams,
  };
}