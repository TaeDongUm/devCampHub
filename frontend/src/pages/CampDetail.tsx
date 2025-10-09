import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../styles/CampDetail.css";
import ChatPage from "./ChatPage";
import HeroCard from "../components/HeroCard";
import { useStreamSession, type StreamMeta } from "../hooks/useStreamSession";

/* ===== Types ===== */
type Channel = "notice" | "qna" | "resources" | "lounge" | "study" | "live" | "mogakco";
type Track = "WEB" | "ANDROID" | "IOS";
type Role = "ADMIN" | "STUDENT";
type ToggleKey = keyof Pick<StreamMeta, "micOn" | "camOn" | "screenOn">;

/* ===== Component ===== */
export default function CampDetail() {
  const { campId = "" } = useParams();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const myNickname = localStorage.getItem("nickname") || "익명";
  const myAvatar = localStorage.getItem("avatar") || "👩‍💻";
  const myTrack: Track = (localStorage.getItem("profile:track") as Track) || "WEB";

  const { isStreaming, begin, end, localVideoRef, remoteStreams } = useStreamSession(
    campId,
    myNickname
  );

  const rawRole = (localStorage.getItem("role") || "STUDENT").toUpperCase();
  const role: Role = rawRole === "ADMIN" ? "ADMIN" : "STUDENT";

  const initialCh = (sp.get("ch") as Channel) || "notice";
  const [ch, setCh] = useState<Channel>(initialCh);
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set("ch", ch);
    setSp(next, { replace: true });
  }, [ch, setSp]);

  const [tab, setTab] = useState<Track>("WEB");
  const campTitle = localStorage.getItem(`camp:${campId}:name`) || "devCampHub";

  const goMyPage = () => nav("/mypage");
  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  const [streamType, setStreamType] = useState<"LIVE" | "MOGAKCO">("MOGAKCO");
  const [meta, setMeta] = useState<Omit<StreamMeta, "type">>({
    title: "",
    micOn: false,
    camOn: true,
    screenOn: true,
    track: myTrack,
  });
  const [showCheckin, setShowCheckin] = useState(false);

  const beginStreaming = (form: Omit<StreamMeta, "type">, type: "LIVE" | "MOGAKCO") => {
    const fullMeta = { ...form, type };
    begin(fullMeta);
    setMeta(form);
    setStreamType(type);
    setShowCheckin(false);
  };

  const endStreaming = () => {
    end();
  };

  const toggle = (k: ToggleKey) => setMeta((prev) => ({ ...prev, [k]: !prev[k] }));

  const isMyStreamVisible =
    isStreaming &&
    ((streamType === "MOGAKCO" && role === "STUDENT" && ch === "mogakco") ||
      (streamType === "LIVE" && role === "ADMIN" && ch === "live"));
  const showTeach = role === "ADMIN" && ch === "live" && !isStreaming;
  const showCheckinBtn = role === "STUDENT" && ch === "mogakco" && !isStreaming;
  const showCheckout = isMyStreamVisible;
  const hideHeaderTabs = isMyStreamVisible;

  return (
    <div className="camp">
      <header className="camp-top">
        <div className="camp-title" onClick={() => nav("/dash")}>
          devCampHub / <span className="camp-crumb">{campTitle}</span>
        </div>
        <div className="camp-actions">
          {showTeach && (
            <button
              className="btn sm"
              onClick={() => {
                setStreamType("LIVE");
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
          {showCheckout && (
            <button className="btn sm danger" onClick={endStreaming}>
              체크아웃
            </button>
          )}
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
              <ChatPage channel={`chat:${ch}:${campId}`} placeholder="메시지 보내기" />
            )}
            {(ch === "live" || ch === "mogakco") && (
              <div className="board" style={{ padding: 16 }}>
                {!hideHeaderTabs && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {(["WEB", "ANDROID", "IOS"] as Track[]).map((t) => (
                      <button
                        key={t}
                        className={`chip ${tab === t ? "on" : ""}`}
                        onClick={() => setTab(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                {isMyStreamVisible ? (
                  <MyBroadcastView
                    meta={meta}
                    nickname={myNickname}
                    avatar={myAvatar}
                    viewers={Object.keys(remoteStreams).length + 1}
                    participants={Object.keys(remoteStreams)}
                    onToggle={toggle}
                    onCheckout={endStreaming}
                    localVideoRef={localVideoRef}
                    campId={campId}
                  />
                ) : (
                  <div className="mine-grid" style={{ gridTemplateColumns: "repeat(12,1fr)" }}>
                    {Object.entries(remoteStreams).map(([nickname, stream]) => (
                      <div key={nickname} className="mine-card" style={{ gridColumn: "span 4" }}>
                        <RemoteVideoView stream={stream} />
                        <div className="meta">
                          <strong>{nickname}</strong>
                        </div>
                      </div>
                    ))}
                    {Object.keys(remoteStreams).length === 0 && (
                      <div className="empty" style={{ padding: 20 }}>
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
            <h3>{streamType === "LIVE" ? "강의하기(방송 시작)" : "모각코 체크인(방송 시작)"}</h3>
            <CheckinForm
              defaultTitle={meta.title}
              defaultTrack={meta.track}
              defaultMic={meta.micOn}
              defaultCam={meta.camOn}
              defaultScreen={meta.screenOn}
              onCancel={() => setShowCheckin(false)}
              onStart={(form) => beginStreaming(form, streamType)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Sub components ===== */
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

function MyBroadcastView({
  meta,
  nickname,
  avatar,
  viewers,
  participants,
  onToggle,
  onCheckout,
  localVideoRef,
  campId,
}: {
  meta: Omit<StreamMeta, "type">;
  nickname: string;
  avatar?: string;
  viewers: number;
  participants: string[];
  onToggle: (key: ToggleKey) => void;
  onCheckout: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  campId: string;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 16 }}>
      <div style={{ position: "relative" }}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`video-surface ${meta.camOn ? "on" : ""}`}
          style={{ height: 560, width: "100%", objectFit: "cover", background: "#222" }}
        />
        <div
          style={{
            position: "absolute",
            left: 16,
            bottom: 16,
            display: "flex",
            gap: 12,
            alignItems: "center",
            background: "rgba(0,0,0,.45)",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 12,
            padding: "10px 14px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div style={{ display: "grid" }}>
            <div style={{ fontWeight: 800 }}>{meta.title || "제목 없는 방송"}</div>
            <div
              style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, opacity: 0.9 }}
            >
              <span style={{ fontSize: 18 }}>{avatar || "🙂"}</span>
              <span>{nickname}</span>
              <span>· {meta.track}</span>
              <span>· {viewers}명 시청 중</span>
            </div>
          </div>
          <button className="btn sm danger" onClick={onCheckout}>
            체크아웃
          </button>
        </div>
        <div style={{ position: "absolute", right: 16, bottom: 16, display: "flex", gap: 8 }}>
          <button
            className="icon-btn"
            title={meta.micOn ? "마이크 켜짐" : "마이크 음소거"}
            onClick={() => onToggle("micOn")}
          >
            {meta.micOn ? "🎙️" : "🔇"}
          </button>
          <button
            className="icon-btn"
            title={meta.camOn ? "카메라 끄기" : "카메라 켜기"}
            onClick={() => onToggle("camOn")}
          >
            {meta.camOn ? "📷" : "🚫📷"}
          </button>
          <button
            className="icon-btn"
            title={meta.screenOn ? "화면 공유 끄기" : "화면 공유 켜기"}
            onClick={() => onToggle("screenOn")}
          >
            {meta.screenOn ? "🖥️" : "🚫🖥️"}
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <div className="mine" style={{ padding: 12, maxHeight: 220, overflow: "auto" }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            참여자 <span style={{ opacity: 0.7, fontWeight: 500 }}>{viewers}명</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {participants.length === 0 ? (
              <div className="muted">아직 참여자가 없어요.</div>
            ) : (
              participants.map((name, idx) => (
                <div
                  key={`${name}-${idx}`}
                  className="chip"
                  style={{ justifyContent: "flex-start" }}
                >
                  {name}
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <ChatPage channel={`chat:my-broadcast:${campId}`} placeholder="채팅 입력…" />
        </div>
      </div>
    </div>
  );
}

function RemoteVideoView({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{ width: "100%", height: 140, objectFit: "cover", background: "#222" }}
    />
  );
}

function CheckinForm({
  defaultTitle,
  defaultTrack,
  defaultMic,
  defaultCam,
  defaultScreen,
  onCancel,
  onStart,
}: {
  defaultTitle?: string;
  defaultTrack: Track;
  defaultMic: boolean;
  defaultCam: boolean;
  defaultScreen: boolean;
  onCancel: () => void;
  onStart: (v: Omit<StreamMeta, "type">) => void;
}) {
  const [title, setTitle] = useState(defaultTitle || "");
  const [track, setTrack] = useState<Track>(defaultTrack);
  const [micOn, setMicOn] = useState(defaultMic);
  const [camOn, setCamOn] = useState(defaultCam);
  const [screenOn, setScreenOn] = useState(defaultScreen);

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onStart({ title, track, micOn, camOn, screenOn });
      }}
    >
      <label>방송 제목</label>
      <input
        className="ipt"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="예: 오늘의 문제풀이"
      />
      <label>학습 구분</label>
      <div style={{ display: "flex", gap: 8 }}>
        {(["WEB", "ANDROID", "IOS"] as Track[]).map((t) => (
          <button
            type="button"
            key={t}
            className={`chip ${track === t ? "on" : ""}`}
            onClick={() => setTrack(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <label>카메라</label>
      <div>
        <input type="checkbox" checked={camOn} onChange={(e) => setCamOn(e.target.checked)} /> 내
        얼굴 보이기
      </div>
      <label>마이크</label>
      <div>
        <input type="checkbox" checked={micOn} onChange={(e) => setMicOn(e.target.checked)} />{" "}
        음소거 해제
      </div>
      <label>화면 공유</label>
      <div>
        <input type="checkbox" checked={screenOn} onChange={(e) => setScreenOn(e.target.checked)} />{" "}
        화면 공유
      </div>
      <div className="modal-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn">
          체크인
        </button>
      </div>
    </form>
  );
}
