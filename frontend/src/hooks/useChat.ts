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
  const parts = fullChannelId.split(':');
  const channelName = parts[1]; // 예: "notice"
  const campId = parts[2];     // 예: "123"

  useEffect(() => {
    if (!fullChannelId || !nickname) return;

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

    const client = new Client({
      // 1. 웹소켓 접속 주소를 백엔드에 맞게 수정합니다. SockJS를 사용합니다.
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-stomp'),
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      onConnect: () => {
        console.log('Connected to WebSocket');
        // 2. 구독 경로를 백엔드에 맞게 수정합니다.
        client.subscribe(`/topic/chat/${campId}/${channelName}`, (message) => {
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
      reconnectDelay: 5000, // 5초마다 재연결 시도
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      console.log('Disconnected from WebSocket');
    };
  }, [fullChannelId, nickname, campId, channelName]); // fullChannelId나 nickname이 바뀌면 재연결합니다.

  const sendMessage = (messagePayload: { text: string; code?: string; files?: any[] }) => {
    if (clientRef.current && clientRef.current.connected) {
      // 3. API로 보낼 데이터 형식을 백엔드 ChatMessageDto에 맞춥니다.
      const chatMessageForApi = {
        sender: nickname,
        content: JSON.stringify(messagePayload), // 복합적인 내용은 content에 JSON 문자열로 담습니다.
        type: 'CHAT',
      };

      // 4. 발행 경로를 백엔드에 맞게 수정합니다.
      clientRef.current.publish({
        destination: `/app/chat/${campId}/${channelName}`,
        body: JSON.stringify(chatMessageForApi),
      });
    }
  };

  return { messages, sendMessage };
};
