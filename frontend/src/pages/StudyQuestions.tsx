import React from "react";
import { useParams } from "react-router-dom";
import ChatPanel from "./ChatPanel";

export default function StudyQuestions() {
  const { campId } = useParams();
  return (
    <section className="board-page">
      <h3>🧠 공부 질문</h3>
      <div className="room-split">
        <div className="room-video">
          <div className="video-surface off">예시: 코드/에러 스냅샷을 올려보세요</div>
        </div>
        <ChatPanel channel={`chat:study:${campId}`} placeholder="공부 질문을 남겨보세요…" />
      </div>
    </section>
  );
}
