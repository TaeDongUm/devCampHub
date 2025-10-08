import { useCallback, useEffect, useRef, useState } from "react";
import { http } from "../api/http";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// ... (타입 정의는 이전과 유사하게 유지) ...

export function useStreamSession(campId: string, nickname: string) {
  const [isStreaming, setStreaming] = useState<boolean>(false);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [meta, setMeta] = useState<Partial<StreamMeta>>({});
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const stompClient = useRef<Client | null>(null);

  const begin = useCallback(async (initialMeta: StreamMeta) => {
    // 1. 스트림 세션 생성 API 호출
    const stream = await http<any>(`/api/camps/${campId}/streams`, {
      method: 'POST',
      body: JSON.stringify({ title: initialMeta.title, type: initialMeta.type })
    });
    setStreamId(stream.streamId);
    setStreaming(true);
    setMeta(initialMeta);

    // 2. WebSocket 연결 및 시그널링 시작
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        // 2.1. 방 참여 메시지 전송
        client.publish({ destination: `/app/signal/${stream.streamId}`, body: JSON.stringify({ type: 'join', sender: nickname }) });

        // 2.2. 다른 참여자들의 시그널 수신 구독
        client.subscribe(`/topic/signal/${stream.streamId}`, message => {
          const signal = JSON.parse(message.body);
          // TODO: offer, answer, ice-candidate 등 메시지 타입에 따라 WebRTC 연결 처리
          console.log("Signal received:", signal);
        });
      }
    });

    client.activate();
    stompClient.current = client;

    // 3. 로컬 미디어 스트림 가져오기
    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

  }, [campId, nickname]);

  const end = useCallback(async () => {
    if (!streamId) return;
    
    // WebRTC 연결 종료
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};

    // WebSocket 연결 종료
    stompClient.current?.deactivate();

    // 스트림 종료 API 호출
    await http(`/api/camps/${campId}/streams/${streamId}`, { method: 'DELETE' });

    setStreaming(false);
    setStreamId(null);
  }, [campId, streamId]);

  return { isStreaming, streamId, meta, setMeta, begin, end, localVideoRef };
}
