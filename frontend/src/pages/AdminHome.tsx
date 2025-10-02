import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminHome.css";

type Camp = {
  id: string;
  name: string;
  period: string;
  members: number;
  stats: { attendance: number; recordings: number; archives: number };
};

const dummyCamps: Camp[] = [
  {
    id: "camp-net-2025",
    name: "네트워크 스터디 캠프",
    period: "2025.01.01 ~ 2025.03.31",
    members: 20,
    stats: { attendance: 85, recordings: 12, archives: 8 },
  },
  {
    id: "camp-fe-2025",
    name: "프론트엔드 심화 캠프",
    period: "2025.04.01 ~ 2025.06.30",
    members: 28,
    stats: { attendance: 88, recordings: 9,  archives: 11 },
  },
];

export default function AdminHome() {
  const [tab, setTab] = useState<"dashboard"|"camps"|"alerts">("camps");
  const nav = useNavigate();

  const goCamp = (id: string) => nav(`/camp/${id}`);

  return (
    <main className="ah">
      <section className="ah-wrap">
        {/* 헤더 */}
        <header className="ah-hero">
          <h1 className="ah-title">관리자 홈</h1>
          <p className="ah-sub">캠프 운영을 한곳에서 — 출석 · 방송/채팅 · 녹화/아카이브</p>

          {/* 상단 탭 */}
          <div className="ah-tabs">
            <button className={tab==="dashboard"?"on":""} onClick={()=>setTab("dashboard")}>대시보드</button>
            <button className={tab==="camps"?"on":""} onClick={()=>setTab("camps")}>캠프</button>
            <button className={tab==="alerts"?"on":""} onClick={()=>setTab("alerts")}>알림</button>
          </div>
        </header>

        {/* 탭 컨텐츠 */}
        {tab === "dashboard" && (
          <section className="ah-grid">
            <div className="ah-card stat"><div className="k">총 캠프</div><div className="v">{dummyCamps.length}</div></div>
            <div className="ah-card stat"><div className="k">전체 참여 인원</div><div className="v">{dummyCamps.reduce((s,c)=>s+c.members,0)}</div></div>
            <div className="ah-card stat"><div className="k">최근 녹화</div><div className="v">4개</div></div>
            <div className="ah-card stat"><div className="k">대기중 문의</div><div className="v">3건</div></div>

            <div className="ah-card wide">
              <div className="ah-card-title">빠른 작업</div>
              <div className="ah-actions">
                <button className="btn ghost">공지 작성</button>
                <button className="btn ghost">출석 라운드 시작</button>
                <button className="btn ghost">방송 시작</button>
                <button className="btn ghost">자료 업로드</button>
              </div>
            </div>
          </section>
        )}

        {tab === "camps" && (
          <section className="ah-camps">
            <div className="ah-card-title">내 캠프</div>
            <ul className="camp-list">
              {dummyCamps.map((c) => (
                <li key={c.id} className="camp-item" onClick={() => goCamp(c.id)}>
                  <div className="camp-name">{c.name}</div>
                  <div className="camp-meta">기간: {c.period} · 인원: {c.members}명</div>
                  <div className="camp-stats">
                    <span>출석률 {c.stats.attendance}%</span>
                    <span>녹화 {c.stats.recordings}개</span>
                    <span>아카이브 {c.stats.archives}개</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="ah-create">
              <button className="btn outline">캠프 만들기</button>
              <div className="tip">* 캠프 생성은 3개월에 1회로 제한됩니다.</div>
            </div>
          </section>
        )}

        {tab === "alerts" && (
          <section className="ah-alerts">
            <div className="ah-card-title">최근 알림</div>
            <ul className="alert-list">
              <li>오늘 10:00 — 출석 라운드 #3 종료</li>
              <li>어제 18:12 — “네트워크 스터디 캠프” 녹화 업로드 완료</li>
              <li>어제 09:00 — 공지: 오늘 오후 Q&A 세션</li>
            </ul>
          </section>
        )}
      </section>
    </main>
  );
}
