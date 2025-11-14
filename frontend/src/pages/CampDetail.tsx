import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../styles/CampDetail.css";
import ChatPage from "./ChatPage";
import HeroCard from "../components/HeroCard";
import { useStreamSession, type StreamMeta } from "../hooks/useStreamSession";
import { http, API_BASE } from "../api/http";
import { type Camp } from "./DashBoardHome";

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

  const { isStreaming, begin, end, localStream, streamId } = useStreamSession(campId, nickname);

  const initialCh = (sp.get("ch") as Channel) || "notice";
  const [ch, setCh] = useState<Channel>(initialCh);
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set("ch", ch);
    setSp(next, { replace: true });
  }, [ch, setSp]);

  const [tab, setTab] = useState<Track>("WEB");

  const [activeStreams, setActiveStreams] = useState<StreamResponseDto[]>([]);

  useEffect(() => {
    if (ch !== 'mogakco' && ch !== 'live') {
      setActiveStreams([]);
      return;
    }

    const fetchStreams = async () => {
      try {
        const streams = await http<StreamResponseDto[]>(`/api/camps/${campId}/streams`);
        if (ch === 'live') {
          setActiveStreams(streams.filter(s => s.type === 'LECTURE'));
        } else { // mogakco
          setActiveStreams(streams.filter(s => s.type === 'MOGAKCO'));
        }
      } catch (error) {
        console.error("스트림 목록을 불러오는 데 실패했습니다.", error);
      }
    };

    fetchStreams();
    const interval = setInterval(fetchStreams, 10000); // 10초마다 목록 새로고침

    return () => clearInterval(interval);
  }, [ch, campId]);


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

  const isMyStreamVisible = isStreaming;
  const showTeach = role === "ADMIN" && ch === "live" && !isStreaming;
  const showCheckinBtn = role === "STUDENT" && ch === "mogakco" && !isStreaming;
  const showCheckout = isMyStreamVisible;
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
                {isMyStreamVisible ? (
                  <MyBroadcastView campId={campId} streamId={streamId} meta={meta} nickname={nickname} avatar={myAvatar} viewers={0} participants={[]} onToggle={toggle} onCheckout={endStreaming} localStream={localStream} broadcastChannel={broadcastChannel} />
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      {(["WEB", "ANDROID", "IOS"] as Track[]).map((t) => <button key={t} className={`chip ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>{t}</button>)}
                    </div>
                    <div className="video-grid">
                      {activeStreams.length > 0 ? (
                        activeStreams.map((stream) => (
                          <div key={stream.streamId} className="video-cell" style={{ cursor: 'pointer' }} onClick={() => {
                            const targetPath = stream.type === 'LECTURE'
                              ? `/camps/${campId}/live/${stream.streamId}`
                              : `/camps/${campId}/mogakco/${stream.streamId}`;
                            nav(targetPath);
                          }}>
                            {stream.thumbnailUrl ? (
                              <img src={`${API_BASE}${stream.thumbnailUrl}`} alt={stream.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                            ) : (
                              <div className="video-surface on" style={{ height: 140, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 12 }}>
                                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{stream.title || '제목 없는 방송'}</div>
                              </div>
                            )}
                            <div className="nickname">{stream.ownerNickname}</div>
                          </div>
                        ))
                      ) : (
                        <div className="empty" style={{ padding: 20, gridColumn: '1 / -1' }}>현재 진행중인 방송이 없습니다.</div>
                      )}
                    </div>
                  </>
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

function MyBroadcastView({ campId, streamId, meta, nickname, avatar, viewers, participants, onToggle, onCheckout, localStream, broadcastChannel }: { campId: string; streamId: number | null; meta: Omit<StreamMeta, "type">; nickname: string; avatar?: string; viewers: number; participants: string[]; onToggle: (key: ToggleKey) => void; onCheckout: () => void; localStream: MediaStream | null; broadcastChannel: string; }) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // 썸네일 캡처 및 업로드
  useEffect(() => {
    if (!localStream || !streamId || !localVideoRef.current) return;

    const video = localVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 320; // 썸네일 너비
    canvas.height = 180; // 썸네일 높이 (16:9 비율)
    const context = canvas.getContext('2d');

    const uploadThumbnail = () => {
      if (context && video.readyState >= 2) { // 비디오 데이터가 준비되었는지 확인
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // 50% 품질의 JPEG
        
        http(`/api/camps/${campId}/streams/${streamId}/thumbnail`, {
          method: 'POST',
          body: JSON.stringify({ thumbnail: dataUrl }),
        }).catch(err => console.error("썸네일 업로드 실패:", err));
      }
    };

    // 30초마다 썸네일 업로드
    const interval = setInterval(uploadThumbnail, 30000);

    // 컴포넌트 마운트 시 한 번 즉시 실행
    setTimeout(uploadThumbnail, 1000); // 1초 후 첫 썸네일 업로드

    return () => clearInterval(interval);
  }, [localStream, streamId, campId]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 16 }}>
      <div style={{ position: "relative" }}>
        <video ref={localVideoRef} autoPlay playsInline muted className={`video-surface ${meta.camOn ? "on" : ""}`} style={{ height: 560, width: "100%", objectFit: "cover", background: "#222" }} />
        <div style={{ position: "absolute", left: 16, bottom: 16, display: "flex", gap: 12, alignItems: "center", background: "rgba(0,0,0,.45)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: "10px 14px", backdropFilter: "blur(4px)" }}>
          <div style={{ display: "grid" }}>
            <div style={{ fontWeight: 800 }}>{meta.title || "제목 없는 방송"}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, opacity: 0.9 }}>
              <span style={{ fontSize: 18 }}>{avatar || "🙂"}</span>
              <span>{nickname}</span>
              <span>· {meta.track}</span>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", right: 16, bottom: 16, display: "flex", gap: 8 }}>
          <button className="icon-btn" title={meta.micOn ? "마이크 켜짐" : "마이크 음소거"} onClick={() => onToggle("micOn")}>{meta.micOn ? "🎙️" : "🔇"}</button>
          <button className="icon-btn" title={meta.camOn ? "카메라 끄기" : "카메라 켜기"} onClick={() => onToggle("camOn")}>{meta.camOn ? "📷" : "🚫📷"}</button>
          <button className="icon-btn" title={meta.screenOn ? "화면 공유 끄기" : "화면 공유 켜기"} onClick={() => onToggle("screenOn")}>{meta.screenOn ? "🖥️" : "🚫🖥️"}</button>
          <button className="btn sm danger" onClick={onCheckout} style={{ marginLeft: 8 }}>체크아웃</button>
        </div>
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