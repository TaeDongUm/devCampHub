import React from "react";
import { Outlet, NavLink, useNavigate, useParams } from "react-router-dom";
import type { Camp } from "./DashBoardHome";
import "../styles/CampDetail.css";

export default function CampDetail() {
  const { campId } = useParams();
  const nav = useNavigate();

  // 캠프 타이틀은 로컬 보관된 목록에서 찾아오거나 campId를 표시
  const camps: Camp[] = JSON.parse(localStorage.getItem("camps:data") || "[]");
  const title = camps.find((c) => c.id === campId)?.name || "캠프";

  const go = (p: string) => nav(`/camp/${campId}/${p}`);

  return (
    <div className="camp">
      {/* 상단 바 */}
      <header className="camp-top">
        <div className="camp-title" onClick={() => nav("/dash")}>
          devCampHub / <span className="camp-crumb">{title}</span>
        </div>
        <div className="camp-actions">
          <button className="btn sm" onClick={() => go("attendance")}>
            내 출석
          </button>
          <button className="btn sm" onClick={() => nav("/settings")}>
            설정
          </button>
        </div>
      </header>

      <div className="camp-body">
        {/* 좌측 사이드바 (Darkscene 느낌) */}
        <aside className="camp-aside">
          <div className="aside-head">내 폴더</div>
          <div className="aside-search">
            <input className="ipt" placeholder="검색" />
          </div>

          <nav className="aside-nav">
            <div className="aside-section">채널</div>
            <NavLink to="notice" className="aside-link">
              📢 공지사항
            </NavLink>
            <NavLink to="qna" className="aside-link">
              ❓ Q&A
            </NavLink>
            <NavLink to="resources" className="aside-link">
              📂 공유할 학습자료
            </NavLink>
            <NavLink to="lounge" className="aside-link">
              💬 라운지(잡담/자유)
            </NavLink>
            <NavLink to="study-questions" className="aside-link">
              🧠 공부 질문
            </NavLink>

            <div className="aside-section">실시간</div>
            <NavLink to="live" className="aside-link">
              🎥 실시간 강의(관리자)
            </NavLink>
            <NavLink to="mogakco" className="aside-link">
              👥 모각코
            </NavLink>
          </nav>
        </aside>

        {/* 우측 메인 홈: 실시간 강의 / 모각코 카드 */}
        <main className="camp-main">
          <div className="home-hero">
            <h1>{title}</h1>
            <p className="muted">출석부 관리부터 소통까지, 이 캠프에서 함께 학습해요.</p>
          </div>

          <div className="home-grid">
            <section className="home-card">
              <div className="home-card-head">
                <span className="live-badge">LIVE</span>
                <h2>실시간 강의</h2>
                <p className="muted">관리자가 강의 방송을 여는 공간. 발표 화면 + 채팅.</p>
              </div>
              <div className="home-card-body">
                <div className="video-skel" />
                <div className="home-card-actions">
                  <button className="btn" onClick={() => go("live")}>
                    입장
                  </button>
                </div>
              </div>
            </section>

            <section className="home-card">
              <div className="home-card-head">
                <span className="live-badge ghost">ON AIR</span>
                <h2>모각코</h2>
                <p className="muted">학생이 각자 방송을 여는 허브. 개인 방송 + 채팅.</p>
              </div>
              <div className="home-card-body">
                <div className="video-skel" />
                <div className="home-card-actions">
                  <button className="btn" onClick={() => go("mogakco")}>
                    입장
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* 중첩 라우트 렌더링 (사이드바 클릭 시 우측에서 교체) */}
          <div className="camp-outlet">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
