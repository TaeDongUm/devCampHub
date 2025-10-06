// src/pages/Mogakco.tsx  (신규)
import React, { useMemo, useState } from "react";
import ChatPage from "./ChatPage";

type Tab = "WEB" | "ANDROID" | "IOS";
type Stream = {
  id: string;
  owner: string;
  title: string;
  track: Tab;
  viewers: number;
  startedAt: number;
};

export default function Mogakco({
  campId,
}: // isStreaming,
// onOpenCheckin,
// onStopStreaming,
{
  campId: string;
  isStreaming: boolean;
  onOpenCheckin: () => void;
  onStopStreaming: () => void;
}) {
  const myTrack = (localStorage.getItem("profile:track") as Tab) || "WEB";
  const [tab, setTab] = useState<Tab>(myTrack);

  const all = (JSON.parse(localStorage.getItem(`streams:${campId}`) || "[]") as Stream[]).sort(
    (a, b) => b.startedAt - a.startedAt
  );
  const list = useMemo(() => all.filter((s) => s.track === tab), [all, tab]);

  // 시청 모달
  const [watch, setWatch] = useState<Stream | null>(null);

  return (
    <div>
      {/* 탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {(["WEB", "ANDROID", "IOS"] as Tab[]).map((t) => (
          <button key={t} className={`chip ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* 방송 카드 목록 */}
      {list.length === 0 ? (
        <div className="empty">현재 실시간 방송 중인 분들이 없습니다.</div>
      ) : (
        <div className="mine-grid" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
          {list.map((s) => (
            <div
              key={s.id}
              className="mine-card"
              style={{ gridColumn: "span 4", cursor: "pointer" }}
              onClick={() => setWatch(s)}
            >
              <div className="video-surface" style={{ height: 120, marginBottom: 8 }}>
                🎥 {s.title}
              </div>
              <div className="meta">
                <strong>{s.owner}</strong> · {s.track}
              </div>
              <div className="meta">{s.viewers}명 시청 중</div>
            </div>
          ))}
        </div>
      )}

      {/* 시청 모달 */}
      {watch && (
        <div className="modal-bg" onClick={() => setWatch(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{watch.title}</h3>
            <div className="video-surface on" style={{ height: 320 }}>
              🙋 {watch.owner} 님 방송 (가상 플레이어)
            </div>
            <div className="modal-sub">
              {watch.track} · {watch.viewers}명 시청 중
            </div>
            <ChatPage channel={`chat:mogakco:${campId}:${watch.id}`} placeholder="채팅 입력…" />
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setWatch(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
