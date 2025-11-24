import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// 백엔드의 ChatMessageDto와 형식을 맞춥니다.
export interface ChatMessage {
  clientMsgId?: number; // 클라이언트가 생성한 메시지 ID
  content: string;
  sender: string;
  senderAvatar?: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE';
  timestamp: string;
}

// 메시지 전송 상태 타입
export type SendingStatus = 'idle' | 'sending' | 'retrying' | 'failed';

// 훅의 인자를 channelId와 nickname으로 단순화합니다.
export const useChat = (fullChannelId: string, nickname: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sendingStatus, setSendingStatus] = useState<{
    status: SendingStatus;
    retryCount: number;
  }>({ status: 'idle', retryCount: 0 });
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  >('connecting');
  const clientRef = useRef<Client | null>(null);
  // ACK를 기다리는 메시지들 (Map<clientMsgId, payload>)
  const pendingMessagesRef = useRef<Map<number, { text: string; code?: string; files?: unknown[] }>>(new Map());
  // 마지막 실패한 메시지 ID (재시도용)
  const lastFailedMsgIdRef = useRef<number | null>(null);

  // fullChannelId에서 campId와 channelName을 추출합니다.
  // 두 가지 포맷을 모두 처리:
  // 1. "chat:channelName:campId" (일반 채널)
  // 2. "type:campId:channelName" (스트리밍 채널)
  const parts = fullChannelId.split(':');
  let campId: string;
  let channelName: string;

  if (parts[0] === 'chat') {
    channelName = parts[1];
    campId = parts[2];
  } else {
    campId = parts[1];
    channelName = parts[2];
  }

  useEffect(() => {
    if (!fullChannelId || !nickname) return;

    console.log(`[useChat] Initializing for channel: ${fullChannelId}`);
    console.log(`[useChat] Parsed campId: ${campId}, channelName: ${channelName}`);

    const fetchChatHistory = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8080/api/camps/${campId}/chat/${channelName}/history`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const history: ChatMessage[] = await response.json();
        setMessages(history); // 과거 메시지로 초기화
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };

    fetchChatHistory();

    const token = localStorage.getItem('token');
    const sockJsUrl = token 
      ? `http://127.0.0.1:8080/ws-stomp?token=${encodeURIComponent(token)}`
      : 'http://127.0.0.1:8080/ws-stomp';

    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      // Heartbeat 추가 (연결 끊김 빠른 감지)
      heartbeatIncoming: 4000, // 4초마다 서버로부터 ping 기대
      heartbeatOutgoing: 4000, // 4초마다 클라이언트가 ping 전송
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`[useChat] WebSocket connected. Subscribing to /topic/chat/${campId}/${channelName}`);
        setConnectionState('connected');
        
        // 채팅 메시지 구독
        client.subscribe(`/topic/chat/${campId}/${channelName}`, (message) => {
          console.log('[useChat] Message received from topic:', message.body);
          try {
            const receivedMessage = JSON.parse(message.body) as ChatMessage;
            setMessages(prevMessages => [...prevMessages, receivedMessage]);
          } catch (e) {
            console.error("Failed to parse message body:", message.body, e);
          }
        });

        // ACK 구독 - 서버가 메시지를 처리했다는 확인
        client.subscribe('/user/queue/ack', (message) => {
          try {
            const ack = JSON.parse(message.body) as { clientMsgId: number; status: string };
            console.log('[useChat 시도4] ACK received:', ack);
            
            if (ack.status === 'DELIVERED') {
              // pending에서 제거 → 타임아웃 취소
              pendingMessagesRef.current.delete(ack.clientMsgId);
              setSendingStatus({ status: 'idle', retryCount: 0 });
            }
          } catch (e) {
            console.error("Failed to parse ACK:", message.body, e);
          }
        });
      },
      onDisconnect: () => {
        console.log('❌ WebSocket disconnected');
        setConnectionState('disconnected');
      },
      onWebSocketClose: () => {
        console.log('🔄 WebSocket closed, reconnecting...');
        setConnectionState('reconnecting');
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
        setConnectionState('disconnected');
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      console.log('[useChat] Disconnected from WebSocket');
    };
  }, [fullChannelId, nickname, campId, channelName]);

  const sendMessage = async (
    messagePayload: { text: string; code?: string; files?: unknown[] },
    retryMsgId?: number // 재시도 시 기존 msgId 사용
  ) => {
    console.log('[useChat] sendMessage called with:', messagePayload);

    // 전송 시작 표시
    setSendingStatus({ status: 'sending', retryCount: 0 });
    
    // UI 표시를 위한 시뮬레이션 지연 (실제 네트워크 전송 시간 모사)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 테스트 모드: 텍스트에 "fail"이 포함되면 강제로 실패
    if (messagePayload.text.toLowerCase().includes('fail')) {
      console.error('[useChat] TEST MODE: Simulating failure');
      setSendingStatus({ status: 'failed', retryCount: 0 });
      return;
    }

    if (!clientRef.current || !clientRef.current.connected) {
      console.error('[useChat] Client not connected - Message sending failed');
      setSendingStatus({ status: 'failed', retryCount: 0 });
      return;
    }

    console.log('[useChat] Client is connected. Publishing message.');
    
    // 재시도면 기존 ID, 신규면 새로 생성
    const clientMsgId = retryMsgId ?? (Date.now() * 1000 + Math.floor(Math.random() * 1000));
    console.log('[useChat 시도4] clientMsgId:', clientMsgId, retryMsgId ? '(RETRY)' : '(NEW)');
    
    // pending에 저장 (ACK 대기용)
    pendingMessagesRef.current.set(clientMsgId, messagePayload);
    
    const chatMessageForApi = {
      clientMsgId, // 메시지 ID 포함
      sender: nickname,
      content: JSON.stringify(messagePayload),
      type: 'CHAT',
    };

    try {
      clientRef.current.publish({
        destination: `/app/chat/${campId}/${channelName}`,
        body: JSON.stringify(chatMessageForApi),
      });
      
      console.log('[useChat 시도4] Message sent. Waiting for ACK...');
      
      // 5초 타임아웃 - ACK 안 오면 실패 처리
      setTimeout(() => {
        if (pendingMessagesRef.current.has(clientMsgId)) {
          console.error('[useChat 시도4] ❌ ACK timeout - Message delivery failed!');
          lastFailedMsgIdRef.current = clientMsgId; // 재시도용 저장
          pendingMessagesRef.current.delete(clientMsgId);
          setSendingStatus({ status: 'failed', retryCount: 0 });
        }
      }, 5000);
      
    } catch (error) {
      console.error('[useChat] sendMessage error:', error);
      lastFailedMsgIdRef.current = clientMsgId; // 재시도용 저장
      pendingMessagesRef.current.delete(clientMsgId);
      setSendingStatus({ status: 'failed', retryCount: 0 });
    }
  };

  // 수동 재연결 함수
  const manualReconnect = () => {
    if (clientRef.current) {
      setConnectionState('reconnecting');
      clientRef.current.deactivate();

      setTimeout(() => {
        clientRef.current?.activate();
      }, 500);
    }
  };

  // 수동 재시도 함수
  const retryLastMessage = (messagePayload: { text: string; code?: string; files?: unknown[] }) => {
    setSendingStatus({ status: 'idle', retryCount: 0 });
    const retryMsgId = lastFailedMsgIdRef.current; // 실패한 msgId 재사용
    sendMessage(messagePayload, retryMsgId ?? undefined);
  };

  return { 
    messages, 
    sendMessage,
    sendingStatus,
    connectionState,
    manualReconnect,
    retryLastMessage,
  };
};
