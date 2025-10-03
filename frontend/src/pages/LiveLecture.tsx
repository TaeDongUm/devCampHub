import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ChatPanel from "../pages/ChatPanel";

export default function LiveLecture() {
  const { campId } = useParams();
  const role = (localStorage.getItem("role") as "admin" | "student") || "student";

  // 더미: 방송 ON/OFF 상태
  const [liveOn, setLiveOn] = useState(localStorage.getItem(`live:${campId}`) === "on");

  const toggleLive = () => {
    const next = !liveOn;
    setLiveOn(next);
    localStorage.setItem(`live:${campId}`, next ? "on" : "off");
  };

  const tips = useMemo(
    () => [
      "슬라이드 화면을 공유하세요.",
      "Q&A는 우측 채팅에서 해주세요.",
      "녹화 버튼을 잊지 마세요!",
    ],
    []
  );

  return (
    <section className="room">
      <div className="room-head">
        <h2>🎥 실시간 강의</h2>
        {role === "admin" ? (
          <button className={`btn ${liveOn ? "danger" : ""}`} onClick={toggleLive}>
            {liveOn ? "방송 종료" : "방송 시작"}
          </button>
        ) : (
          <span className="muted">{liveOn ? "방송중" : "대기중"}</span>
        )}
      </div>

      <div className="room-body">
        <div className="room-video">
          <div className={`video-surface ${liveOn ? "on" : "off"}`}>
            {liveOn ? "강의 화면 공유 중…" : "방송 대기 화면"}
          </div>
          <ul className="tip-list">
            {tips.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>

        <ChatPanel channel={`chat:live:${campId}`} placeholder="강의 채팅에 메시지…" />
      </div>
    </section>
  );
}
