import { useState, useEffect, useRef } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { http } from '../api/http';

// 백엔드의 ChatMessageDto와 형식을 맞춥니다.
export interface ChatMessage {
  channel: string;
  sender: string;
  content: string;
  timestamp: string;
}

export const useChat = (campId: string, channel: string, nickname: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    // 이전 채팅 내역을 불러오는 함수
    const fetchPreviousMessages = async () => {
      try {
        // TODO: 백엔드에 이전 채팅 내역을 가져오는 API 구현 필요 (예: /api/camps/{campId}/chat/{channel})
        // const prevMessages = await http<ChatMessage[]>(`/api/camps/${campId}/chat/${channel}`);
        // setMessages(prevMessages);
      } catch (error) {
        console.error('Failed to fetch previous messages:', error);
      }
    };

    fetchPreviousMessages();

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      onConnect: () => {
        console.log('Connected to WebSocket');
        // 특정 채널을 구독합니다.
        client.subscribe(`/topic/chat/${campId}/${channel}`, (message: IMessage) => {
          const receivedMessage = JSON.parse(message.body) as ChatMessage;
          setMessages(prevMessages => [...prevMessages, receivedMessage]);
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      console.log('Disconnected from WebSocket');
    };
  }, [campId, channel]);

  const sendMessage = (messagePayload: { text: string; code?: string; files?: any[] }) => {
    if (clientRef.current && clientRef.current.connected) {
      const chatMessage = {
        channel,
        sender: nickname,
        content: JSON.stringify(messagePayload), // 객체를 JSON 문자열로 변환
        timestamp: new Date().toISOString(),
      };

      clientRef.current.publish({
        destination: `/app/chat/${campId}/${channel}`,
        body: JSON.stringify(chatMessage),
      });
    }
  };

  return { messages, sendMessage };
};
