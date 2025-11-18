import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// 백엔드의 ChatMessageDto와 형식을 맞춥니다.
export interface ChatMessage {
  content: string;
  sender: string;
  senderAvatar?: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE';
  timestamp: string;
}

// 훅의 인자를 channelId와 nickname으로 단순화합니다.
export const useChat = (fullChannelId: string, nickname: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const clientRef = useRef<Client | null>(null);

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
        const response = await fetch(`http://localhost:8080/api/camps/${campId}/chat/${channelName}/history`, {
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
      ? `http://localhost:8080/ws-stomp?token=${encodeURIComponent(token)}`
      : 'http://localhost:8080/ws-stomp';

    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log(`[useChat] WebSocket connected. Subscribing to /topic/chat/${campId}/${channelName}`);
        client.subscribe(`/topic/chat/${campId}/${channelName}`, (message) => {
          console.log('[useChat] Message received from topic:', message.body);
          try {
            const receivedMessage = JSON.parse(message.body) as ChatMessage;
            setMessages(prevMessages => [...prevMessages, receivedMessage]);
          } catch (e) {
            console.error("Failed to parse message body:", message.body, e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
      },
      reconnectDelay: 5000,
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      console.log('[useChat] Disconnected from WebSocket');
    };
  }, [fullChannelId, nickname, campId, channelName]);

  const sendMessage = (messagePayload: { text: string; code?: string; files?: any[] }) => {
    console.log('[useChat] sendMessage called with:', messagePayload);
    if (clientRef.current && clientRef.current.connected) {
      console.log('[useChat] Client is connected. Publishing message.');
      const chatMessageForApi = {
        sender: nickname,
        content: JSON.stringify(messagePayload),
        type: 'CHAT',
      };

      clientRef.current.publish({
        destination: `/app/chat/${campId}/${channelName}`,
        body: JSON.stringify(chatMessageForApi),
      });
    } else {
      console.error('[useChat] sendMessage failed: Client not connected.');
    }
  };

  return { messages, sendMessage };
};
