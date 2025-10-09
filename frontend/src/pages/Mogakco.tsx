import React, { useEffect, useState } from "react";
import ChatPage from "./ChatPage";
import { http } from "../api/http";
import { type StreamResponseDto } from "./LiveLecture"; // 타입 재사용

export default function Mogakco({ campId }: { campId: string }) {
  const [streams, setStreams] = useState<StreamResponseDto[]>([]);
  const [watch, setWatch] = useState<StreamResponseDto | null>(null);

  useEffect(() => {
    const fetchMogakcoStreams = async () => {
      try {
        const allStreams = await http<StreamResponseDto[]>(`/api/camps/${campId}/streams`);
        const mogakcoStreams = allStreams.filter((s) => s.type === "MOGAKCO");
        setStreams(mogakcoStreams);
      } catch (error) {
        console.error("모각코 정보를 불러오는 데 실패했습니다.", error);
      }
    };

    fetchMogakcoStreams();
    const interval = setInterval(fetchMogakcoStreams, 15000); // 15초마다 새로고침

    return () => clearInterval(interval);
  }, [campId]);

  return (
    <div>
      {streams.length === 0 ? (
        <div className="empty">현재 실시간 방송 중인 분들이 없습니다.</div>
      ) : (
        <div className="mine-grid" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
          {streams.map((s) => (
            <div
              key={s.streamId}
              className="mine-card"
              style={{ gridColumn: "span 4", cursor: "pointer" }}
              onClick={() => setWatch(s)}
            >
              <div className="video-surface" style={{ height: 120, marginBottom: 8 }}>
                🎥 {s.title}
              </div>
              <div className="meta">
                <strong>{s.ownerNickname}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {watch && (
        <div className="modal-bg" onClick={() => setWatch(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{watch.title}</h3>
            <div className="video-surface on" style={{ height: 320 }}>
              🙋 {watch.ownerNickname} 님 방송 (가상 플레이어)
            </div>
            <ChatPage key={`chat-mogakco-${watch.streamId}`} channel={`mogakco-${watch.streamId}`} />
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
