import React from "react";
import { useParams } from "react-router-dom";
import ChatPage from "./ChatPage";

export default function Qna() {
  const { campId } = useParams();

  return (
    <ChatPage
      channel={`chat:qna:${campId}`}
      placeholder="질문을 입력하세요"
      onSend={(msg) => {
        // 예: 질문임을 나타내는 접두어 추가를 원하면
        // return { ...msg, text: `❓ ${msg.text}` };
        return msg;
      }}
    />
  );
}
