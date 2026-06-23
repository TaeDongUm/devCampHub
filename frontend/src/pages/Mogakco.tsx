import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../styles/CampDetail.css"; // CampDetail의 스타일 재사용
import { useStreamSession } from "../hooks/useStreamSession";
import { http } from "../api/http";
import { type Camp } from "./DashBoardHome";
import BroadcastView from "../components/BroadcastView"; // 새로 만든 컴포넌트 임포트

// --- Helper functions and types (CampDetail에서 가져옴) ---

interface JwtPayload {
  sub: string;
  role: "ADMIN" | "STUDENT";
  nickname: string;
  iat: number;
  exp: number;
}

interface StreamResponseDto {
  streamId: number;
  title: string;
  ownerNickname: string;
  type: "LECTURE" | "MOGAKCO";
}

type Channel = "notice" | "qna" | "resources" | "lounge" | "study" | "live" | "mogakco";

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

// --- Mogakco Component ---

export default function Mogakco() {
  const { campId = "", streamId: urlStreamId = "" } = useParams<{
    campId: string;
    streamId: string;
  }>();
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const [nickname, setNickname] = useState("익명");
  const [camp, setCamp] = useState<Camp | null>(null);
  const [currentStream, setCurrentStream] = useState<StreamResponseDto | null>(null);

  const { isStreaming, end, localStream, remoteStreams, toggleAudio, toggleVideo, meta } =
    useStreamSession(campId, nickname, urlStreamId);

  const logout = useCallback(() => {
    localStorage.clear();
    nav("/login");
  }, [nav]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = decodeJwt(token);
      if (payload) setNickname(payload.nickname);
      else logout();
    } else {
      logout();
    }

    // 캠프 정보 불러오기
    http<Camp>(`/api/camps/${campId}`)
      .then(setCamp)
      .catch(() => {
        alert("캠프 정보를 불러오는 데 실패했습니다.");
        nav("/student/home");
      });

    // 스트림 정보 불러오기
    http<StreamResponseDto[]>(`/api/camps/${campId}/streams`)
      .then((streams) => {
        const stream = streams.find((s) => s.streamId === parseInt(urlStreamId));
        if (stream) {
          setCurrentStream(stream);
        } else {
          throw new Error("Stream not found");
        }
      })
      .catch(() => {
        alert("스트림 정보를 불러오는 데 실패했습니다.");
        nav(`/camp/${campId}?ch=mogakco`);
      });
  }, [campId, urlStreamId, nav, logout]);

  const initialCh = (sp.get("ch") as Channel) || "mogakco";
  const [ch] = useState<Channel>(initialCh);
  useEffect(() => {
    // Mogakco 페이지에서는 URL을 바꾸지 않음 (페이지 이동 방지)
  }, [ch]);

  const goMyPage = () => nav("/mypage");
  const goCampDetail = () => nav(`/camp/${campId}?ch=mogakco`);

  if (!currentStream || !camp) {
    return <div>스트리밍 정보를 불러오는 중...</div>;
  }

  return (
    <div className="camp">
      <header className="camp-top">
        <div className="camp-title" onClick={goCampDetail}>
          devCampHub / <span className="camp-crumb">{camp.name}</span>
        </div>
        <div className="camp-actions">
          <button className="btn sm" onClick={goMyPage}>
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
              onClick={() => nav(`/camp/${campId}?ch=notice`)}
            />
            <SideLink
              label="❓ Q&A"
              active={ch === "qna"}
              onClick={() => nav(`/camp/${campId}?ch=qna`)}
            />
            <SideLink
              label="📂 공유할 학습자료"
              active={ch === "resources"}
              onClick={() => nav(`/camp/${campId}?ch=resources`)}
            />
            <SideLink
              label="💬 라운지(잡담/자유)"
              active={ch === "lounge"}
              onClick={() => nav(`/camp/${campId}?ch=lounge`)}
            />
            <SideLink
              label="🧠 공부 질문"
              active={ch === "study"}
              onClick={() => nav(`/camp/${campId}?ch=study`)}
            />
            <div className="aside-section">실시간</div>
            <SideLink
              label="🎥 실시간 강의(관리자)"
              active={ch === "live"}
              onClick={() => nav(`/camp/${campId}?ch=live`)}
            />
            <SideLink
              label="👥 모각코"
              active={ch === "mogakco"}
              onClick={() => nav(`/camp/${campId}?ch=mogakco`)}
            />
          </nav>
        </aside>

        <main className="camp-main">
          <BroadcastView
            campId={campId}
            streamId={parseInt(urlStreamId)}
            currentStream={currentStream}
            nickname={nickname}
            isStreaming={isStreaming}
            localStream={localStream}
            remoteStreams={remoteStreams}
            toggleAudio={toggleAudio}
            toggleVideo={toggleVideo}
            endStream={end}
            meta={meta}
          />
        </main>
      </div>
    </div>
  );
}
