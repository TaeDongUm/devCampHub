import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ChatPanel from "../pages/ChatPanel";

type Stream = { id: string; owner: string; title: string; on: boolean };

export default function Mogakco() {
  const { campId } = useParams();
  const nickname = localStorage.getItem("nickname") || "익명";
  const key = `mogakco:${campId}`;

  const [streams, setStreams] = useState<Stream[]>(() =>
    JSON.parse(localStorage.getItem(key) || "[]")
  );

  const myId = useMemo(() => {
    const id = localStorage.getItem("me:id") || `me-${Math.random().toString(36).slice(2, 7)}`;
    localStorage.setItem("me:id", id);
    return id;
  }, []);

  const start = () => {
    const title = prompt("방송 제목을 입력하세요", `${nickname}의 모각코`);
    if (!title) return;
    const me: Stream = { id: myId, owner: nickname, title, on: true };
    const next = [...streams.filter((s) => s.id !== myId), me];
    setStreams(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  const stop = () => {
    const next = streams.map((s) => (s.id === myId ? { ...s, on: false } : s));
    setStreams(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  return (
    <section className="room">
      <div className="room-head">
        <h2>👥 모각코</h2>
        <div className="room-actions">
          <button className="btn" onClick={start}>
            내 방송 시작
          </button>
          <button className="btn ghost" onClick={stop}>
            내 방송 종료
          </button>
        </div>
      </div>

      <div className="mogak-grid">
        {streams.length === 0 && (
          <div className="empty">아직 방송이 없습니다. 첫 방송을 시작해보세요!</div>
        )}
        {streams.map((s) => (
          <div key={s.id} className={`mogak-card ${s.on ? "on" : "off"}`}>
            <div className="mogak-thumb">{s.on ? "ON AIR" : "OFF"}</div>
            <div className="mogak-meta">
              <div className="mogak-title">{s.title}</div>
              <div className="muted">by {s.owner}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="room-split">
        <div className="room-video">
          <div className="video-surface on">내 화면(예시)</div>
        </div>
        <ChatPanel channel={`chat:mogakco:${campId}`} placeholder="모각코 채팅에 메시지…" />
      </div>
    </section>
  );
}
