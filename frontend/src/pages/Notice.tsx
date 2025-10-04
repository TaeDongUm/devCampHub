import React from "react";
import { useParams } from "react-router-dom";
import ChatPage from "./ChatPage";

export default function Notice() {
  const { campId } = useParams();

  // 필요 시 역할 제한 (예: 관리자만 작성)
  // const role = (localStorage.getItem("role") as "admin" | "student") || "student";
  // const canWrite = role === "admin";

  return (
    <ChatPage
      channel={`chat:notice:${campId}`}
      placeholder="공지사항을 입력하세요"
      // extraInputs={null}
      onSend={(msg) => {
        // 예: 공지 채널에선 prefix를 붙이고 싶다면
        // if (!canWrite) return msg; // 제한하려면 여기서 early return 혹은 UI에서 버튼 비활
        return { ...msg /* , text: `📢 ${msg.text}` */ };
      }}
    />
  );
}
