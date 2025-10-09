import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../styles/CampDetail.css";
import ChatPage from "./ChatPage";
import HeroCard from "../components/HeroCard";
import { useStreamSession, type StreamMeta } from "../hooks/useStreamSession";
import { http } from "../api/http";
import { type Camp } from "./DashBoardHome";

/* ===== Types ===== */
interface JwtPayload {
  sub: string; // email
  role: "ADMIN" | "STUDENT";
  nickname: string;
  iat: number;
  exp: number;
}

type Channel = "notice" | "qna" | "resources" | "lounge" | "study" | "live" | "mogakco";
type Track = "WEB" | "ANDROID" | "IOS";
type Role = "ADMIN" | "STUDENT";
type ToggleKey = keyof Pick<StreamMeta, "micOn" | "camOn" | "screenOn">;

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

/* ===== Component ===== */
export default function CampDetail() {
  // @ts-ignore
  const { campId = "" } = useParams();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [nickname, setNickname] = useState("익명");
  const [role, setRole] = useState<Role>("STUDENT");
  const [camp, setCamp] = useState<Camp | null>(null);

  const myAvatar = localStorage.getItem("avatar") || "👩‍💻";
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

  const { isStreaming, begin, end, localVideoRef, remoteStreams } = useStreamSession(campId, nickname);

  const initialCh = (sp.get("ch") as Channel) || "notice";
  const [ch, setCh] = useState<Channel>(initialCh);
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set("ch", ch);
    setSp(next, { replace: true });
  }, [ch, setSp]);

  const [tab, setTab] = useState<Track>("WEB");

  const goMyPage = () => nav("/mypage");

  const [streamType, setStreamType] = useState<"LIVE" | "MOGAKCO">("MOGAKCO");
  const [meta, setMeta] = useState<Omit<StreamMeta, "type">>({ title: "", micOn: false, camOn: true, screenOn: true, track: myTrack });
  const [showCheckin, setShowCheckin] = useState(false);

  const beginStreaming = (form: Omit<StreamMeta, "type">, type: "LIVE" | "MOGAKCO") => {
    begin({ ...form, type });
    setMeta(form);
    setStreamType(type);
    setShowCheckin(false);
  };

  const endStreaming = () => end();
  const toggle = (k: ToggleKey) => setMeta((prev) => ({ ...prev, [k]: !prev[k] }));

  const isMyStreamVisible = isStreaming && ((streamType === "MOGAKCO" && role === "STUDENT" && ch === "mogakco") || (streamType === "LIVE" && role === "ADMIN" && ch === "live"));
  const showTeach = role === "ADMIN" && ch === "live" && !isStreaming;
  const showCheckinBtn = role === "STUDENT" && ch === "mogakco" && !isStreaming;
  const showCheckout = isMyStreamVisible;
  const hideHeaderTabs = isMyStreamVisible;
  const broadcastChannel = `chat:${ch}:${campId}`;

  return (
    <div className="camp">
      <header className="camp-top">
        <div className="camp-title" onClick={() => nav("/dash")}>
          devCampHub / <span className="camp-crumb">{camp ? camp.name : "Loading..."}</span>
        </div>
        <div className="camp-actions">
          {showTeach && <button className="btn sm" onClick={() => { setStreamType("LIVE"); setShowCheckin(true); }}>강의하기</button>}
          {showCheckinBtn && <button className="btn sm" onClick={() => { setStreamType("MOGAKCO"); setShowCheckin(true); }}>체크인</button>}
          {showCheckout && <button className="btn sm danger" onClick={endStreaming}>체크아웃</button>}
          <button className="btn sm" onClick={goMyPage}>마이페이지</button>
          <button className="btn sm ghost" onClick={logout}>로그아웃</button>
        </div>
      </header>

      <div className="camp-body">
        <aside className="camp-aside">
          <nav className="aside-nav">
            <div className="aside-section">채널</div>
            <SideLink label="📢 공지사항" active={ch === "notice"} onClick={() => setCh("notice")} />
            <SideLink label="❓ Q&A" active={ch === "qna"} onClick={() => setCh("qna")} />
            <SideLink label="📂 공유할 학습자료" active={ch === "resources"} onClick={() => setCh("resources")} />
            <SideLink label="💬 라운지(잡담/자유)" active={ch === "lounge"} onClick={() => setCh("lounge")} />
            <SideLink label="🧠 공부 질문" active={ch === "study"} onClick={() => setCh("study")} />
            <div className="aside-section">실시간</div>
            <SideLink label="🎥 실시간 강의(관리자)" active={ch === "live"} onClick={() => setCh("live")} />
            <SideLink label="👥 모각코" active={ch === "mogakco"} onClick={() => setCh("mogakco")} />
          </nav>
        </aside>

        <main className="camp-main">
          <HeroCard title="devCampHub" subtitle="출석, 소통, 방송을 한 곳에서" className="mb-4" />
          <section className="switch-area">
            <div className="chat-room-head"><h3>{ch.toUpperCase()}</h3></div>
            {["notice", "qna", "resources", "lounge", "study"].includes(ch) && <ChatPage channel={`chat:${ch}:${campId}`} placeholder="메시지 보내기" nickname={nickname} />}
            {(ch === "live" || ch === "mogakco") && (
              <div className="board" style={{ padding: 16 }}>
                {!hideHeaderTabs && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {(["WEB", "ANDROID", "IOS"] as Track[]).map((t) => <button key={t} className={`chip ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>{t}</button>)}
                  </div>
                )}
                {isMyStreamVisible ? (
                  <MyBroadcastView meta={meta} nickname={nickname} avatar={myAvatar} viewers={Object.keys(remoteStreams).length + 1} participants={Object.keys(remoteStreams)} onToggle={toggle} onCheckout={endStreaming} localVideoRef={localVideoRef} remoteStreams={remoteStreams} broadcastChannel={broadcastChannel} />
                ) : (
                  <div className="video-grid">
                    {Object.entries(remoteStreams).map(([streamNickname, stream]) => (
                      <div key={streamNickname} className="video-cell">
                        <RemoteVideoView stream={stream} nickname={streamNickname} />
                      </div>
                    ))}
                    {Object.keys(remoteStreams).length === 0 && <div className="empty" style={{ padding: 20 }}>현재 진행중인 방송이 없습니다.</div>}
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
            <h3>{streamType === "LIVE" ? "강의하기(방송 시작)" : "모각코 체크인(방송 시작)"}</h3>
            <CheckinForm defaultTitle={meta.title} defaultTrack={myTrack} defaultMic={meta.micOn} defaultCam={meta.camOn} defaultScreen={meta.screenOn} onCancel={() => setShowCheckin(false)} onStart={(form) => beginStreaming(form, streamType)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Sub components ===== */
function SideLink({ label, active, onClick }: { label: string; active: boolean; onClick: () => void; }) {
  return <button className={`aside-link as-btn ${active ? "active" : ""}`} onClick={onClick}>{label}</button>;
}

function MyBroadcastView({ meta, nickname, avatar, viewers, participants, onToggle, onCheckout, localVideoRef, remoteStreams, broadcastChannel }: { meta: Omit<StreamMeta, "type">; nickname: string; avatar?: string; viewers: number; participants: string[]; onToggle: (key: ToggleKey) => void; onCheckout: () => void; localVideoRef: React.RefObject<HTMLVideoElement | null>; remoteStreams: Record<string, MediaStream>; broadcastChannel: string; }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 16 }}>
      <div className="video-grid">
        <div className="video-cell">
          <video ref={localVideoRef} autoPlay playsInline muted className={`video-surface ${meta.camOn ? "on" : ""}`} style={{ height: "100%", width: "100%", objectFit: "cover", background: "#222" }} />
          <div className="nickname">{nickname} (나)</div>
        </div>
        {Object.entries(remoteStreams).map(([peerNickname, stream]) => (
          <div key={peerNickname} className="video-cell">
            <RemoteVideoView stream={stream} nickname={peerNickname} />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <div className="mine" style={{ padding: 12, maxHeight: 220, overflow: "auto" }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>참여자 <span style={{ opacity: 0.7, fontWeight: 500 }}>{viewers}명</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {participants.length === 0 ? <div className="muted">아직 참여자가 없어요.</div> : participants.map((name, idx) => <div key={`${name}-${idx}`} className="chip" style={{ justifyContent: "flex-start" }}>{name}</div>)}
          </div>
        </div>
        <ChatPage channel={broadcastChannel} placeholder="채팅 입력…" nickname={nickname} />
      </div>
    </div>
  );
}

function RemoteVideoView({ stream, nickname }: { stream: MediaStream; nickname: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (videoRef.current) { videoRef.current.srcObject = stream; } }, [stream]);
  return (
    <>
      <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", background: "#222" }} />
      <div className="nickname">{nickname}</div>
    </>
  );
}

function CheckinForm({ defaultTitle, defaultTrack, defaultMic, defaultCam, defaultScreen, onCancel, onStart }: { defaultTitle?: string; defaultTrack: Track; defaultMic: boolean; defaultCam: boolean; defaultScreen: boolean; onCancel: () => void; onStart: (v: Omit<StreamMeta, "type">) => void; }) {
  const [title, setTitle] = useState(defaultTitle || "");
  const [track, setTrack] = useState<Track>(defaultTrack);
  const [micOn, setMicOn] = useState(defaultMic);
  const [camOn, setCamOn] = useState(defaultCam);
  const [screenOn, setScreenOn] = useState(defaultScreen);

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); onStart({ title, track, micOn, camOn, screenOn }); }}>
      <label>방송 제목</label>
      <input className="ipt" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 오늘의 문제풀이" />
      <label>학습 구분</label>
      <div style={{ display: "flex", gap: 8 }}>
        {(["WEB", "ANDROID", "IOS"] as Track[]).map((t) => <button type="button" key={t} className={`chip ${track === t ? "on" : ""}`} onClick={() => setTrack(t)}>{t}</button>)}
      </div>
      <label>카메라</label>
      <div><input type="checkbox" checked={camOn} onChange={(e) => setCamOn(e.target.checked)} /> 내 얼굴 보이기</div>
      <label>마이크</label>
      <div><input type="checkbox" checked={micOn} onChange={(e) => setMicOn(e.target.checked)} /> 음소거 해제</div>
      <label>화면 공유</label>
      <div><input type="checkbox" checked={screenOn} onChange={(e) => setScreenOn(e.target.checked)} /> 화면 공유</div>
      <div className="modal-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn">체크인</button>
      </div>
    </form>
  );
}