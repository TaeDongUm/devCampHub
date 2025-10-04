import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../styles/CampDetail.css";
import ChatPage from "./ChatPage";
import type { Camp } from "./DashBoardHome";

type Channel = "notice" | "qna" | "resources" | "lounge" | "study" | "live" | "mogakco";

export default function CampDetail() {
  const { campId } = useParams();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  // 캠프명 로드 (any 금지, Camp[]로 단언)
  const camps = JSON.parse(localStorage.getItem("camps:data") || "[]") as Camp[];
  const title = camps.find((c) => c.id === campId)?.name || "캠프";

  // 사이드바에서 고르는 현재 채널 (URL ?ch= 로 동기화해서 새로고침 복구)
  const initialCh = (sp.get("ch") as Channel) || "notice";
  const [ch, setCh] = useState<Channel>(initialCh);
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set("ch", ch);
    setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch]);

  // 채널 표시명
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

  // 라우팅 이동은 필요한 곳(출석/설정)만 유지
  const goSettings = () => nav("/settings");
  const goAttendance = () => nav(`/camp/${campId}/attendance`);

  return (
    <div className="camp">
      {/* 상단 바 */}
      <header className="camp-top">
        <div className="camp-title" onClick={() => nav("/dash")}>
          devCampHub / <span className="camp-crumb">{title}</span>
        </div>
        <div className="camp-actions">
          <button className="btn sm" onClick={goAttendance}>
            내 출석
          </button>
          <button className="btn sm" onClick={goSettings}>
            설정
          </button>
        </div>
      </header>

      <div className="camp-body">
        {/* 좌측: 사이드바 (요청대로 '내 폴더/검색' 제거) */}
        <aside className="camp-aside">
          <nav className="aside-nav">
            <div className="aside-section">채널</div>
            <button
              className={`aside-link as-btn ${ch === "notice" ? "active" : ""}`}
              onClick={() => setCh("notice")}
            >
              📢 공지사항
            </button>
            <button
              className={`aside-link as-btn ${ch === "qna" ? "active" : ""}`}
              onClick={() => setCh("qna")}
            >
              ❓ Q&A
            </button>
            <button
              className={`aside-link as-btn ${ch === "resources" ? "active" : ""}`}
              onClick={() => setCh("resources")}
            >
              📂 공유할 학습자료
            </button>
            <button
              className={`aside-link as-btn ${ch === "lounge" ? "active" : ""}`}
              onClick={() => setCh("lounge")}
            >
              💬 라운지(잡담/자유)
            </button>
            <button
              className={`aside-link as-btn ${ch === "study" ? "active" : ""}`}
              onClick={() => setCh("study")}
            >
              🧠 공부 질문
            </button>

            <div className="aside-section">실시간</div>
            <button
              className={`aside-link as-btn ${ch === "live" ? "active" : ""}`}
              onClick={() => setCh("live")}
            >
              🎥 실시간 강의(관리자)
            </button>
            <button
              className={`aside-link as-btn ${ch === "mogakco" ? "active" : ""}`}
              onClick={() => setCh("mogakco")}
            >
              👥 모각코
            </button>
          </nav>
        </aside>

        {/* 우측: 메인(히어로 고정) + 빨간 박스(채널 영역)만 교체 */}
        <main className="camp-main">
          {/* 퍼플 히어로 */}
          <div className="home-hero gradient">
            <h1>{title}</h1>
            <p className="muted">출석부 관리부터 소통까지, 이 캠프에서 함께 학습해요.</p>
          </div>

          {/* === 빨간 박스 영역: 채널에 따라 교체되는 부분 === */}
          <section className="switch-area">
            <div className="chat-room-head">
              <h3>{chLabel[ch]}</h3>
            </div>

            {/* 채팅형 채널 */}
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

            {/* 실시간 강의/모각코도 동일 영역에서 표시 */}
            {ch === "live" && (
              <div className="live-wrapper">
                <div className="video-surface on" style={{ height: 280 }}>
                  🎥 실시간 강의 화면 (추후 연동)
                </div>
                <div style={{ marginTop: 12 }}>
                  <ChatPage channel={`chat:live:${campId}`} placeholder="강의 채팅에 메시지…" />
                </div>
              </div>
            )}

            {ch === "mogakco" && (
              <div className="live-wrapper">
                <div className="video-surface on" style={{ height: 280 }}>
                  👥 모각코 개인 방송 영역 (예시)
                </div>
                <div style={{ marginTop: 12 }}>
                  <ChatPage
                    channel={`chat:mogakco:${campId}`}
                    placeholder="모각코 채팅에 메시지…"
                  />
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
