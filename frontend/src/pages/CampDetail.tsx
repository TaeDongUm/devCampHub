import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../styles/CampDetail.css";
import ChatPage from "./ChatPage";
import HeroCard from "../components/HeroCard";
import { useStreamSession, type StreamMeta } from "../hooks/useStreamSession";
import { http, API_BASE } from "../api/http";
import { type Camp } from "./DashBoardHome";
import BroadcastView from "../components/BroadcastView";
import CheckinForm from "../components/CheckinForm";

/* ===== Types ===== */
interface JwtPayload {
  sub: string; // email
  role: "ADMIN" | "STUDENT";
  nickname: string;
  iat: number;
  exp: number;
}

// 이 DTO는 LiveLecture, Mogakco 등 다른 파일에서도 필요할 수 있으므로, 추후 types.ts 파일 등으로 분리하는 것을 권장합니다.
interface StreamResponseDto {
  streamId: number;
  title: string;
  ownerNickname: string;
  type: "LECTURE" | "MOGAKCO";
  thumbnailUrl?: string; // Optional for now
}

type Channel = "notice" | "qna" | "resources" | "lounge" | "study" | "live" | "mogakco";
type Track = "WEB" | "ANDROID" | "IOS";
type Role = "ADMIN" | "STUDENT";

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function SideLink({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`aside-link as-btn ${active ? "active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

/* ===== Component ===== */
export default function CampDetail() {
  // @ts-ignore
  const { campId = "" } = useParams();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [nickname, setNickname] = useState("익명");
  const [role, setRole] = useState<Role>("STUDENT");
  const [camp, setCamp] = useState<Camp | null>(null);

  const myTrack: Track = (localStorage.getItem("profile:track") as Track) || "WEB";

  const logout = useCallback(() => {
    localStorage.clear();
    nav("/login");
  }, [nav]);

  const fetchCampData = useCallback(() => {
    http<Camp>(`/api/camps/${campId}`)
      .then(setCamp)
      .catch((err) => {
        console.error("Failed to fetch camp details:", err);
        alert("캠프 정보를 불러오는 데 실패했습니다.");
        nav("/dash");
      });
  }, [campId, nav]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        setNickname(payload.nickname);
        setRole(payload.role);
      } else {
        logout();
      }
    } else {
      logout();
    }
    fetchCampData();
  }, [campId, nav, fetchCampData, logout]);

  const {
    isStreaming,
    begin,
    end,
    localStream,
    remoteStreams,
    streamId,
    toggleAudio,
    toggleVideo,
    meta,
  } = useStreamSession(campId, nickname);

  const initialCh = (sp.get("ch") as Channel) || "notice";
  const [ch, setCh] = useState<Channel>(initialCh);
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set("ch", ch);
    setSp(next, { replace: true });
  }, [ch, setSp]);

  const [activeStreams, setActiveStreams] = useState<StreamResponseDto[]>([]);

  useEffect(() => {
    if (ch !== "mogakco" && ch !== "live") {
      setActiveStreams([]);
      return;
    }

    const fetchStreams = async () => {
      try {
        const streams = await http<StreamResponseDto[]>(`/api/camps/${campId}/streams`);
        if (ch === "live") {
          setActiveStreams(streams.filter((s) => s.type === "LECTURE"));
        } else {
          // mogakco
          setActiveStreams(streams.filter((s) => s.type === "MOGAKCO"));
        }
      } catch (error) {
        console.error("스트림 목록을 불러오는 데 실패했습니다.", error);
      }
    };

    fetchStreams();
    const interval = setInterval(fetchStreams, 10000); // 10초마다 목록 새로고침

    return () => clearInterval(interval);
  }, [ch, campId]);

  const [streamType, setStreamType] = useState<"LECTURE" | "MOGAKCO">("MOGAKCO");
  const [showCheckin, setShowCheckin] = useState(false);

  const beginStreaming = (form: Omit<StreamMeta, "type" | "track"> & { track: Track }) => {
    begin({ ...form, type: streamType });
    setShowCheckin(false);
  };

  const showTeach = role === "ADMIN" && ch === "live" && !isStreaming;
  const showCheckinBtn = role === "STUDENT" && ch === "mogakco" && !isStreaming;

  return (
    <div className="camp">
      <header className="camp-top">
        <div className="camp-title" onClick={() => nav("/student/home")}>
          devCampHub / <span className="camp-crumb">{camp ? camp.name : "..."}</span>
        </div>
        <div className="camp-actions">
          {showTeach && (
            <button
              className="btn sm"
              onClick={() => {
                setStreamType("LECTURE");
                setShowCheckin(true);
              }}
            >
              강의하기
            </button>
          )}
          {showCheckinBtn && (
            <button
              className="btn sm"
              onClick={() => {
                setStreamType("MOGAKCO");
                setShowCheckin(true);
              }}
            >
              체크인
            </button>
          )}
          {isStreaming && (
            <button className="btn sm danger" onClick={end}>
              체크아웃
            </button>
          )}
          <button className="btn sm" onClick={() => nav("/mypage")}>
            마이페이지
          </button>
          <button className="btn sm ghost" onClick={logout}>
            로그아웃
          </button>
        </div>
      </header>

      <div className="camp-body">
        <aside className="camp-aside">
          <nav className="aside-nav">
            <div className="aside-section">채널</div>
            <SideLink
              label="📢 공지사항"
              active={ch === "notice"}
              onClick={() => setCh("notice")}
            />
            <SideLink label="❓ Q&A" active={ch === "qna"} onClick={() => setCh("qna")} />
            <SideLink
              label="📂 공유할 학습자료"
              active={ch === "resources"}
              onClick={() => setCh("resources")}
            />
            <SideLink
              label="💬 라운지(잡담/자유)"
              active={ch === "lounge"}
              onClick={() => setCh("lounge")}
            />
            <SideLink label="🧠 공부 질문" active={ch === "study"} onClick={() => setCh("study")} />
            <div className="aside-section">실시간</div>
            <SideLink
              label="🎥 실시간 강의(관리자)"
              active={ch === "live"}
              onClick={() => setCh("live")}
            />
            <SideLink
              label="👥 모각코"
              active={ch === "mogakco"}
              onClick={() => setCh("mogakco")}
            />
          </nav>
        </aside>

        <main className="camp-main">
          <HeroCard title="devCampHub" subtitle="출석, 소통, 방송을 한 곳에서" className="mb-4" />
          <section className="switch-area">
            <div className="chat-room-head">
              <h3>{ch.toUpperCase()}</h3>
            </div>
            {["notice", "qna", "resources", "lounge", "study"].includes(ch) && (
              <ChatPage
                channel={`chat:${ch}:${campId}`}
                placeholder="메시지 보내기"
                nickname={nickname}
              />
            )}
            {(ch === "live" || ch === "mogakco") && (
              <div className="board" style={{ padding: 16 }}>
                {isStreaming && streamId ? (
                  <BroadcastView
                    campId={campId}
                    streamId={streamId}
                    currentStream={{
                      title: meta.title || "제목 없는 방송",
                      ownerNickname: nickname,
                    }}
                    nickname={nickname}
                    isStreaming={isStreaming}
                    localStream={localStream}
                    remoteStreams={remoteStreams}
                    toggleAudio={toggleAudio}
                    toggleVideo={toggleVideo}
                    endStream={end}
                    meta={meta}
                  />
                ) : (
                  <div className="video-grid">
                    {activeStreams.length > 0 ? (
                      activeStreams.map((stream) => (
                        <div
                          key={stream.streamId}
                          className="video-cell"
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            nav(`/camps/${campId}/${stream.type.toLowerCase()}/${stream.streamId}`)
                          }
                        >
                          {stream.thumbnailUrl ? (
                            <img
                              src={`${API_BASE}${stream.thumbnailUrl}`}
                              alt={stream.title}
                              style={{ width: "100%", height: 140, objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              className="video-surface on"
                              style={{
                                height: 140,
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <div style={{ fontWeight: "bold", fontSize: 16 }}>
                                {stream.title || "제목 없는 방송"}
                              </div>
                            </div>
                          )}
                          <div className="nickname">{stream.ownerNickname}</div>
                        </div>
                      ))
                    ) : (
                      <div className="empty" style={{ padding: 20, gridColumn: "1 / -1" }}>
                        현재 진행중인 방송이 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {showCheckin && (
        <div className="modal-bg" onClick={() => setShowCheckin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{streamType === "LECTURE" ? "강의하기(방송 시작)" : "모각코 체크인(방송 시작)"}</h3>
            <CheckinForm
              defaultTitle={meta.title}
              defaultTrack={myTrack}
              defaultMic={meta.micOn ?? false}
              defaultCam={meta.camOn ?? false}
              defaultScreen={meta.screenOn ?? false}
              onCancel={() => setShowCheckin(false)}
              onStart={(form) => beginStreaming(form)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
