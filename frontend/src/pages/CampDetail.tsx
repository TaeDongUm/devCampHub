import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../styles/CampDetail.css";
import ChatPage from "./ChatPage";
import LiveLecture from "./LiveLecture";
import Mogakco from "./Mogakco";
import type { Camp } from "./DashBoardHome";

type Channel = "notice" | "qna" | "resources" | "lounge" | "study" | "live" | "mogakco";
type Track = "WEB" | "ANDROID" | "IOS";
type Stream = {
  id: string;
  owner: string;
  title: string;
  track: Track;
  shareScreen: boolean;
  camOn: boolean;
  micOn: boolean;
  startedAt: number;
  viewers: number;
};

export default function CampDetail() {
  const { id: campId } = useParams(); // 기존 코드와 경로 param 이름 맞춰주세요. (/camp/:id)
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const camps = JSON.parse(localStorage.getItem("camps:data") || "[]") as Camp[];
  const title = camps.find((c) => c.id === campId)?.name || "캠프";

  const initialCh = (sp.get("ch") as Channel) || "notice";
  const [ch, setCh] = useState<Channel>(initialCh);
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set("ch", ch);
    setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch]);

  const chLabel: Record<Channel, string> = useMemo(
    () => ({
      notice: "공지사항",
      qna: "Q&A",
      resources: "공유할 학습자료",
      lounge: "라운지(잡담/자유)",
      study: "공부 질문",
      live: "실시간 강의",
      mogakco: "모각코",
    }),
    []
  );

  {
    /* 모각코 체크인 상태 / 모달은 CampDetail이 보유(상단 버튼 제어) */
  }
  const [isStreaming, setStreaming] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);

  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [screenOn, setScreenOn] = useState(true);
  const [shareTarget, setShareTarget] = useState<string>("데스크탑 화면 1");

  // 라우팅 이동
  const goMyPage = () => nav("/mypage");
  const logout = () => {
    localStorage.removeItem("token"); // 필요 시 조정
    nav("/login");
  };

  return (
    <div className="camp">
      {/* 상단 바 */}
      <header className="camp-top">
        <div className="camp-title" onClick={() => nav("/dashboard/home")}>
          devCampHub / <span className="camp-crumb">{title}</span>
        </div>
        <div className="camp-actions">
          {/* ✅ 모각코 채널일 때만 체크인/아웃 노출 (로그아웃 왼쪽) */}
          {ch === "mogakco" &&
            (isStreaming ? (
              <button
                className="btn sm danger"
                onClick={() => {
                  setStreaming(false);
                  setMicOn(false);
                  setCamOn(true);
                  setScreenOn(true);
                }}
              >
                체크아웃
              </button>
            ) : (
              <button className="btn sm" onClick={() => setShowCheckin(true)}>
                체크인
              </button>
            ))}
          <button className="btn sm" onClick={goMyPage}>
            마이페이지
          </button>
          <button className="btn sm ghost" onClick={logout}>
            로그아웃
          </button>
        </div>
      </header>

      <div className="camp-body">
        {/* 좌측 사이드바 */}
        <aside className="camp-aside">
          <nav className="aside-nav">
            <div className="aside-section">채널</div>
            {(
              ["notice", "qna", "resources", "lounge", "study", "live", "mogakco"] as Channel[]
            ).map((key) => (
              <button
                key={key}
                className={`aside-link as-btn ${ch === key ? "active" : ""}`}
                onClick={() => setCh(key)}
              >
                {key === "notice" && "📢 공지사항"}
                {key === "qna" && "❓ Q&A"}
                {key === "resources" && "📂 공유할 학습자료"}
                {key === "lounge" && "💬 라운지(잡담/자유)"}
                {key === "study" && "🧠 공부 질문"}
                {key === "live" && "🎥 실시간 강의(관리자)"}
                {key === "mogakco" && "👥 모각코"}
              </button>
            ))}
          </nav>
        </aside>

        {/* 우측 메인 */}
        <main className="camp-main">
          <div className="home-hero gradient">
            <h1>{title}</h1>
            <p className="muted">출석부 관리부터 소통까지, 이 캠프에서 함께 학습해요.</p>
          </div>

          <section className="switch-area">
            <div className="chat-room-head">
              <h3>{chLabel[ch]}</h3>
            </div>

            {/* 채팅형 채널 공통 */}
            {ch === "notice" && (
              <ChatPage channel={`chat:notice:${campId}`} placeholder="메시지 보내기" />
            )}
            {ch === "qna" && (
              <ChatPage channel={`chat:qna:${campId}`} placeholder="메시지 보내기" />
            )}
            {ch === "resources" && (
              <ChatPage channel={`chat:resources:${campId}`} placeholder="메시지 보내기" />
            )}
            {ch === "lounge" && (
              <ChatPage channel={`chat:lounge:${campId}`} placeholder="메시지 보내기" />
            )}
            {ch === "study" && (
              <ChatPage channel={`chat:study:${campId}`} placeholder="메시지 보내기" />
            )}

            {/* ✅ 분리된 채널 */}
            {ch === "live" && <LiveLecture campId={campId!} />}
            {ch === "mogakco" && (
              <Mogakco
                campId={campId!}
                isStreaming={isStreaming}
                onOpenCheckin={() => setShowCheckin(true)}
                onStopStreaming={() => setStreaming(false)}
              />
            )}
          </section>
        </main>
      </div>

      {/* ✅ 체크인 모달 (모각코 방송 시작 UI) */}
      {showCheckin && (
        <div className="modal-bg" onClick={() => setShowCheckin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>모각코 체크인(방송 시작)</h3>
            <CheckinForm
              campId={campId!}
              onCancel={() => setShowCheckin(false)}
              onStart={() => {
                setStreaming(true);
                setShowCheckin(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ✅ 내 방송 모달 (방송 중 항상 떠 있음) */}
      {isStreaming && (
        <div className="modal-bg">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>내 방송</h3>
            <div
              className={`video-surface ${camOn ? "on" : ""}`}
              style={{ height: 320, position: "relative" }}
            >
              {camOn ? "🎥 내 화면(가상 미리보기)" : "카메라 꺼짐"}
              <div style={{ position: "absolute", right: 12, bottom: 12, display: "flex", gap: 8 }}>
                {/* 마이크 */}
                <button
                  className="icon-btn"
                  title={micOn ? "마이크 켜짐" : "마이크 음소거"}
                  onClick={() => setMicOn((v) => !v)}
                >
                  {micOn ? "🎙️" : "🔇"}
                </button>
                {/* 카메라 */}
                <button
                  className="icon-btn"
                  title={camOn ? "카메라 끄기" : "카메라 켜기"}
                  onClick={() => setCamOn((v) => !v)}
                >
                  {camOn ? "📷" : "🚫📷"}
                </button>
                {/* 화면 공유 토글 */}
                <button
                  className="icon-btn"
                  title={screenOn ? "화면 공유 끄기" : "화면 공유 켜기"}
                  onClick={() => setScreenOn((v) => !v)}
                >
                  {screenOn ? "🖥️" : "🚫🖥️"}
                </button>
              </div>
            </div>
            <div className="form" style={{ marginTop: 8 }}>
              <label>공유할 화면(Zoom 연동 자리)</label>
              <select
                className="ipt"
                value={shareTarget}
                onChange={(e) => setShareTarget(e.target.value)}
              >
                <option>데스크탑 화면 1</option>
                <option>크롬 - devCampHub</option>
                <option>VSCode</option>
              </select>
            </div>
            <div className="modal-actions">
              <button
                className="btn ghost"
                onClick={() => {
                  setStreaming(false);
                  setMicOn(false);
                  setCamOn(true);
                  setScreenOn(true);
                }}
              >
                체크아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 간단 체크인 설정 폼 (줌 같은 선택 컨트롤) */
function CheckinForm({
  campId,
  onCancel,
  onStart,
}: {
  campId: string;
  onCancel: () => void;
  onStart: () => void;
}) {
  const [title, setTitle] = useState("");
  const [shareScreen, setShareScreen] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const track = (localStorage.getItem("profile:track") as "WEB" | "ANDROID" | "IOS") || "WEB";

  const save = () => {
    const me = localStorage.getItem("nickname") || "익명";
    const streams = JSON.parse(localStorage.getItem(`streams:${campId}`) || "[]") as Stream[];
    const mine = {
      id: `me-${me}`,
      owner: me,
      title: title || "제목 없는 방송",
      track,
      shareScreen,
      camOn,
      micOn,
      startedAt: Date.now(),
      viewers: 0,
    };
    const next = [mine, ...streams.filter((s) => s.id !== mine.id)];
    localStorage.setItem(`streams:${campId}`, JSON.stringify(next));
    onStart();
  };

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label>방송 제목</label>
      <input
        className="ipt"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="예: 오늘의 문제풀이"
      />

      <label>화면 공유</label>
      <div>
        <input
          type="checkbox"
          checked={shareScreen}
          onChange={(e) => setShareScreen(e.target.checked)}
        />{" "}
        사용
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
