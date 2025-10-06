// src/pages/CampDetail.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../styles/CampDetail.css";
import ChatPage from "./ChatPage";

/* ===== Types ===== */
type Channel = "notice" | "qna" | "resources" | "lounge" | "study" | "live" | "mogakco";
type Track = "WEB" | "ANDROID" | "IOS";
type Role = "ADMIN" | "STUDENT";

type StreamCard = {
  id: string;
  title: string;
  nickname: string;
  avatar?: string;
  track: Track;
  viewers: number;
  ownerId: string;
  type: "LIVE" | "MOGAKCO";
};

type MyStreamMeta = {
  title: string;
  micOn: boolean;
  camOn: boolean;
  screenOn: boolean;
  track: Track;
};

type ToggleKey = keyof Pick<MyStreamMeta, "micOn" | "camOn" | "screenOn">;

/* ===== Component ===== */
export default function CampDetail() {
  const { campId } = useParams();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  // Role 정규화(대/소문자 섞여 저장되어도 안전)
  const rawRole = (localStorage.getItem("role") || "STUDENT").toUpperCase();
  const role: Role = rawRole === "ADMIN" ? "ADMIN" : "STUDENT";

  const myNickname = localStorage.getItem("nickname") || "익명";
  const myAvatar = localStorage.getItem("avatar") || "👩‍💻";
  const myTrack: Track = (localStorage.getItem("profile:track") as Track) || "WEB";

  // 채널/탭
  const initialCh = (sp.get("ch") as Channel) || "notice";
  const [ch, setCh] = useState<Channel>(initialCh);
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set("ch", ch);
    setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch]);

  const [tab, setTab] = useState<Track>("WEB");

  // 캠프명
  const campTitle = localStorage.getItem(`camp:${campId}:name`) || "devCampHub";

  // 상단 버튼
  const goMyPage = () => nav("/mypage");
  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  // 내 방송 상태
  const [isStreaming, setStreaming] = useState(false);
  const [streamType, setStreamType] = useState<"LIVE" | "MOGAKCO">("MOGAKCO");
  const [meta, setMeta] = useState<MyStreamMeta>({
    title: "",
    micOn: false,
    camOn: true,
    screenOn: true,
    track: myTrack,
  });

  const [viewersCount, setViewersCount] = useState<number>(0);
  const [participants, setParticipants] = useState<string[]>([]); // 별명 목록

  // 체크인/강의하기 모달
  const [showCheckin, setShowCheckin] = useState(false);

  // 시작/종료
  const beginStreaming = (next: MyStreamMeta, type: "LIVE" | "MOGAKCO") => {
    setMeta(next);
    setStreamType(type);
    setStreaming(true);
    // TODO(BE): START API & presence 구독 시작 → setViewersCount/setParticipants
  };
  const endStreaming = () => {
    // TODO(BE): STOP API
    setStreaming(false);
    setViewersCount(0);
    setParticipants([]);
  };

  // 토글
  const toggle = (k: ToggleKey) => setMeta((prev) => ({ ...prev, [k]: !prev[k] }));

  // 썸네일 데이터 (실제는 서버)
  const mockStreams: StreamCard[] = [
    {
      id: "L1",
      type: "LIVE",
      title: "[BE] 인증 구현 & 배포",
      nickname: "J023",
      avatar: "🧑‍🏫",
      track: "WEB",
      viewers: 152,
      ownerId: "admin-1",
    },
    {
      id: "S1",
      type: "MOGAKCO",
      title: "(방송 제목)",
      nickname: "j999",
      avatar: "🙂",
      track: "WEB",
      viewers: 2,
      ownerId: "stu-1",
    },
  ];
  const cards = useMemo(() => {
    const type = ch === "live" ? "LIVE" : ch === "mogakco" ? "MOGAKCO" : null;
    if (!type) return [];
    return mockStreams.filter((s) => s.type === type && s.track === tab);
  }, [ch, tab]);

  /* ===== 핵심 가시성 로직 =====
     - 내 방송 화면은 "내가 방송 중"이고
       채널과 방송 종류가 서로 일치할 때만 보인다.
       학생이 모각코 방송 중 → 모각코 탭에서만 노출
       관리자가 라이브 강의 중 → 실시간 강의 탭에서만 노출
  */
  const isMyStreamVisible =
    isStreaming &&
    ((streamType === "MOGAKCO" && role === "STUDENT" && ch === "mogakco") ||
      (streamType === "LIVE" && role === "ADMIN" && ch === "live"));

  // 상단 버튼 노출 조건(동시 노출 방지)
  const showTeach = role === "ADMIN" && ch === "live" && !isStreaming;
  const showCheckinBtn = role === "STUDENT" && ch === "mogakco" && !isStreaming;
  const showCheckout = isMyStreamVisible; // 현재 탭에서 내 방송을 볼 때만 체크아웃 노출

  // 내 방송 중이면 상단 탭(노란 박스) 숨김
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
          <div className="home-hero gradient">
            <h1>{campTitle}</h1>
            <p className="muted">출석부 관리부터 소통까지, 이 캠프에서 함께 학습해요.</p>
          </div>

          <section className="switch-area">
            <div className="chat-room-head">
              <h3>
                {ch === "mogakco" ? "모각코" : ch === "live" ? "실시간 강의" : ch.toUpperCase()}
              </h3>
            </div>

            {/* 일반 채널 */}
            {["notice", "qna", "resources", "lounge", "study"].includes(ch) && (
              <ChatPage channel={`chat:${ch}:${campId}`} placeholder="메시지 보내기" />
            )}

            {/* 실시간 허브 */}
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
                    viewers={viewersCount}
                    participants={participants}
                    onToggle={toggle}
                    onCheckout={endStreaming}
                  />
                ) : (
                  <>
                    {cards.length === 0 ? (
                      <div className="empty" style={{ padding: 20 }}>
                        {ch === "live"
                          ? "현재 방송이 없네요.."
                          : "현재 실시간 방송 중인 분들이 없습니다."}
                      </div>
                    ) : (
                      <div className="mine-grid" style={{ gridTemplateColumns: "repeat(12,1fr)" }}>
                        {cards.map((s) => (
                          <div key={s.id} className="mine-card" style={{ gridColumn: "span 4" }}>
                            <div
                              className="video-surface"
                              style={{
                                height: 140,
                                marginBottom: 8,
                                display: "grid",
                                placeItems: "center",
                              }}
                            />
                            <div className="meta">
                              <strong>{s.title}</strong>
                            </div>
                            <div
                              className="meta"
                              style={{ display: "flex", gap: 6, alignItems: "center" }}
                            >
                              <span style={{ fontSize: 20 }}>{s.avatar || "🙂"}</span>
                              <span>{s.nickname}</span> · <span>{s.track}</span> ·{" "}
                              <span>{s.viewers}명 시청 중</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* 체크인/강의하기 모달 */}
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
              onStart={(form) => {
                beginStreaming(
                  {
                    title: form.title || "제목 없는 방송",
                    micOn: form.micOn,
                    camOn: form.camOn,
                    screenOn: form.screenOn,
                    track: form.track,
                  },
                  streamType
                );
                setShowCheckin(false);
              }}
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
}: {
  meta: MyStreamMeta;
  nickname: string;
  avatar?: string;
  viewers: number;
  participants: string[];
  onToggle: (key: ToggleKey) => void;
  onCheckout: () => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 16 }}>
      <div style={{ position: "relative" }}>
        <div
          className={`video-surface ${meta.camOn ? "on" : ""}`}
          style={{ height: 560, display: "grid", placeItems: "center" }}
        >
          {meta.camOn ? "🎥 내 캠/화면 미리보기" : "카메라 꺼짐"}
        </div>

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
          <ChatPage channel="chat:my-broadcast" placeholder="채팅 입력…" />
        </div>
      </div>
    </div>
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
  onStart: (v: {
    title: string;
    track: Track;
    micOn: boolean;
    camOn: boolean;
    screenOn: boolean;
  }) => void;
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
