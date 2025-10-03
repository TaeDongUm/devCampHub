import React from "react";
import { useParams } from "react-router-dom";
import ChatPanel from "./ChatPanel";

export default function Lounge() {
  const { campId } = useParams();
  return (
    <section className="board-page">
      <h3>💬 라운지(잡담/자유)</h3>
      <div className="room-split">
        <div className="room-video">
          <div className="video-surface off">자유 대화 공간</div>
        </div>
        <ChatPanel channel={`chat:lounge:${campId}`} placeholder="라운지에 메시지…" />
      </div>
    </section>
  );
}
