import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ChatPage from "./ChatPage";
import { http } from "../api/http";
import { useStreamSession } from "../hooks/useStreamSession";
import { type StreamResponseDto } from "./LiveLecture"; // 타입 재사용

// CampDetail.tsx에서 복사해온 decodeJwt 함수
interface JwtPayload {
  sub: string; // email
  role: "ADMIN" | "STUDENT";
  nickname: string;
  iat: number;
  exp: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function Mogakco() {
  const { campId, streamId: urlStreamId } = useParams<{ campId: string; streamId: string }>();
  const [streams, setStreams] = useState<StreamResponseDto[]>([]);
  const [currentStream, setCurrentStream] = useState<StreamResponseDto | null>(null);
  const [nickname, setNickname] = useState("익명");

  // useStreamSession 호출 (campId와 nickname이 있을 때)
  const { remoteStreams } = useStreamSession(campId || "", nickname);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        setNickname(payload.nickname);
      }
    }

    const fetchMogakcoStreams = async () => {
      try {
        const allStreams = await http<StreamResponseDto[]>(`/api/camps/${campId}/streams`);
        const mogakcoStreams = allStreams.filter((s) => s.type === "MOGAKCO");
        setStreams(mogakcoStreams);

        // URL에 streamId가 있으면 현재 스트림 설정
        if (urlStreamId) {
          const stream = mogakcoStreams.find((s) => s.streamId === parseInt(urlStreamId));
          setCurrentStream(stream || null);
        }
      } catch (error) {
        console.error("모각코 정보를 불러오는 데 실패했습니다.", error);
      }
    };

    fetchMogakcoStreams();
    const interval = setInterval(fetchMogakcoStreams, 15000); // 15초마다 새로고침

    return () => clearInterval(interval);
  }, [campId, urlStreamId]);

  // 스트리밍 페이지 보기 (URL에 streamId가 있을 때)
  if (urlStreamId && currentStream) {
    return (
      <div style={{ display: "flex", gap: "16px", height: "100vh" }}>
        {/* 왼쪽: 메인 비디오 영역 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h2>{currentStream.title}</h2>
          <div
            className="video-surface on"
            style={{
              flex: 1,
              backgroundColor: "#000",
              borderRadius: "8px",
              marginBottom: "16px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {Object.keys(remoteStreams).length > 0 ? (
              Object.entries(remoteStreams).map(([peerId, stream]) => (
                <video
                  key={peerId}
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  ref={(video) => {
                    if (video && stream) {
                      video.srcObject = stream;
                    }
                  }}
                />
              ))
            ) : (
              <div style={{ color: "#999", textAlign: "center", paddingTop: "50%" }}>
                원격 스트림 대기 중...
              </div>
            )}
          </div>

          {/* 참여자 목록 */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {Object.keys(remoteStreams).map((peerId) => (
              <div
                key={peerId}
                style={{
                  width: "100px",
                  height: "80px",
                  backgroundColor: "#333",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "12px",
                }}
              >
                {peerId}
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 채팅 */}
        <div style={{ width: "300px", borderLeft: "1px solid #ddd", paddingLeft: "16px" }}>
          <ChatPage
            key={`chat-mogakco-${currentStream.streamId}`}
            channel={`mogakco:${campId}:mogakco-${currentStream.streamId}`}
            nickname={nickname}
          />
        </div>
      </div>
    );
  }

  // 스트림 리스트 보기 (URL에 streamId가 없을 때)
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
              onClick={() => setCurrentStream(s)}
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

      {currentStream && !urlStreamId && (
        <div className="modal-bg" onClick={() => setCurrentStream(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{currentStream.title}</h3>
            <div className="video-surface on" style={{ height: 320 }}>
              🙋 {currentStream.ownerNickname} 님 방송 (가상 플레이어)
            </div>
            <ChatPage
              key={`chat-mogakco-${currentStream.streamId}`}
              channel={`mogakco:${campId}:mogakco-${currentStream.streamId}`}
              nickname={nickname}
            />
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setCurrentStream(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
