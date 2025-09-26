import React from "react";
import "../styles/Home.css";

type Props = { onStart?: () => void };
export default function Home({ onStart }: Props) {
  const go = () => {
    if (onStart) return onStart();
    // 라우터 사용 시 앱에서 props로 넘겨주므로 여기서는 fallback
    window.location.href = "/login";
  };

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-chip">부스트캠프 통합 관리 • 출석 · 방송/채팅 · 녹화/아카이브</div>

        <h1 className="home-title">
          캠프 운영을 한곳에서.
          <br /> devCampHub (Camon-style)
        </h1>

        <p className="home-desc">
          실시간 방송/채팅으로 소통하고, 자동 출석과 녹화/아카이브로 운영 효율을 높입니다.
          관리자와 학생 모두 브라우저만 있으면 바로 시작할 수 있어요.
        </p>

        <div className="home-actions">
          <button className="btn-primary" onClick={go}>시작하기</button>
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-title">핵심 기능</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-title">실시간 방송</div>
            <div className="feature-desc">브라우저에서 바로 송출/시청, 화질 선택과 자동 음소거 지원.</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">실시간 채팅</div>
            <div className="feature-desc">공지/일반 채널로 코어타임 소통에 최적화.</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">자동 출석</div>
            <div className="feature-desc">세션 라운드 기반으로 출석/지각/결석 자동 집계.</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">녹화/아카이브</div>
            <div className="feature-desc">썸네일 생성과 저장소 연동으로 세션 기록을 한눈에.</div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-title">어떻게 동작하나요?</h2>
        <div className="how-grid">
          <div className="how-card">
            <div className="how-step">STEP 1</div>
            <div className="how-title">로그인</div>
            <div className="how-desc">관리자는 이메일 인증, 학생은 GitHub 또는 이메일 가입.</div>
          </div>
          <div className="how-card">
            <div className="how-step">STEP 2</div>
            <div className="how-title">세션 참여</div>
            <div className="how-desc">방송을 시작하거나 시청하고, 채팅으로 소통합니다.</div>
          </div>
          <div className="how-card">
            <div className="how-step">STEP 3</div>
            <div className="how-title">기록·관리</div>
            <div className="how-desc">출석은 자동으로, 녹화는 아카이브에서 다시 보세요.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
