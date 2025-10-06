// src/pages/LiveLecture.tsx  (신규)
import React from "react";
import ChatPage from "./ChatPage";

export default function LiveLecture({ campId }: { campId: string }) {
  return (
    <div className="live-wrapper">
      <div className="video-surface on" style={{ height: 320 }}>
        🎥 실시간 강의 화면 (추후 WebRTC/HLS 연동)
      </div>
      <div style={{ marginTop: 12 }}>
        <ChatPage channel={`chat:live:${campId}`} placeholder="강의 채팅에 메시지…" />
      </div>
    </div>
  );
}
