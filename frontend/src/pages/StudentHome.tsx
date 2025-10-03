import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StudentHome.css";

type Camp = {
  id: string;
  name: string;
  joinedAt: string;
  attendanceRate: number;
};

const myCamps: Camp[] = [
  { id: "camp-net-2025", name: "네트워크 스터디 캠프", joinedAt: "2025.01.02", attendanceRate: 90 },
  { id: "camp-fe-2025",  name: "프론트엔드 심화 캠프", joinedAt: "2025.04.02", attendanceRate: 94 },
];

export default function StudentHome() {
  const [tab, setTab] = useState<"dashboard"|"camps"|"alerts">("camps");
  const nav = useNavigate();

  const goCamp = (id: string) => nav(`/camp/${id}`);

  return (
    <main className="sh">
      <section className="sh-wrap">
        <header className="sh-hero">
          <h1 className="sh-title">학생 홈</h1>
          <p className="sh-sub">참여 중인 캠프에서 배우고 기록하세요.</p>
          <div className="sh-tabs">
            <button className={tab==="dashboard"?"on":""} onClick={()=>setTab("dashboard")}>대시보드</button>
            <button className={tab==="camps"?"on":""} onClick={()=>setTab("camps")}>캠프</button>
            <button className={tab==="alerts"?"on":""} onClick={()=>setTab("alerts")}>알림</button>
          </div>
        </header>

        {tab==="dashboard" && (
          <section className="sh-grid">
            <div className="sh-card stat"><div className="k">총 캠프</div><div className="v">{myCamps.length}</div></div>
            <div className="sh-card stat"><div className="k">평균 출석률</div><div className="v">{Math.round(myCamps.reduce((s,c)=>s+c.attendanceRate,0)/myCamps.length)}%</div></div>
            <div className="sh-card stat"><div className="k">오늘 할 일</div><div className="v">2개</div></div>
            <div className="sh-card wide">
              <div className="sh-card-title">오늘의 미션 / 공지</div>
              <ul className="todo">
                <li>DNS 기본 정리 업로드</li>
                <li>오후 2시 Q&A 참여</li>
              </ul>
            </div>
          </section>
        )}

        {tab==="camps" && (
          <section className="sh-camps">
            <div className="sh-card-title">참여 중인 캠프</div>
            <ul className="camp-list">
              {myCamps.map(c=>(
                <li key={c.id} className="camp-item" onClick={()=>goCamp(c.id)}>
                  <div className="camp-name">{c.name}</div>
                  <div className="camp-meta">참여일: {c.joinedAt}</div>
                  <div className="camp-stat">출석률 {c.attendanceRate}%</div>
                </li>
              ))}
            </ul>
            <div className="join-area">
              <button className="btn outline">캠프 참여하기</button>
            </div>
          </section>
        )}

        {tab==="alerts" && (
          <section className="sh-alerts">
            <div className="sh-card-title">최근 알림</div>
            <ul className="alert-list">
              <li>오늘 10:00 — 출석 라운드 #3 시작</li>
              <li>어제 18:12 — 새 녹화 업로드</li>
            </ul>
          </section>
        )}
      </section>
    </main>
  );
}
