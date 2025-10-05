// src/pages/MyPage.tsx  (신규)
import React from "react";
import { useNavigate } from "react-router-dom";

export default function MyPage() {
  const nav = useNavigate();
  const name = localStorage.getItem("profile:name") || "이름 미설정";
  const nick = localStorage.getItem("nickname") || "닉네임";
  const email = localStorage.getItem("profile:email") || "email@example.com";
  const github = localStorage.getItem("profile:github") || "";
  const blog = localStorage.getItem("profile:blog") || "";
  const track = (localStorage.getItem("profile:track") as "WEB" | "ANDROID" | "IOS") || "WEB";

  return (
    <main className="wrap" style={{ maxWidth: 960 }}>
      <header className="board-head">
        <h1>마이페이지</h1>
        <button className="gbtn" onClick={() => nav("/settings")} title="설정">
          <span className="gbtn-label">설정 가기 ✏️</span>
        </button>
      </header>

      <section className="mine" style={{ marginTop: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 52, textAlign: "center" }}>👩‍💻</div>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>{nick}</h2>
              <span className="badge ongoing" style={{ fontWeight: 800 }}>
                {track}
              </span>
              <button className="mini-gear" onClick={() => nav("/settings")} title="설정">
                ✏️
              </button>
            </div>
            <div className="meta">이름: {name}</div>
            <div className="meta">email: {email}</div>
            {!!github && (
              <div className="meta">
                Github:{" "}
                <a href={github} target="_blank" rel="noreferrer">
                  {github}
                </a>
              </div>
            )}
            {!!blog && (
              <div className="meta">
                Blog:{" "}
                <a href={blog} target="_blank" rel="noreferrer">
                  {blog}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 출석 현황 요약(링크) */}
      <section className="mine" style={{ marginTop: 12 }}>
        <div className="mine-head">
          <h2>출석 현황</h2>
          <button className="btn" onClick={() => nav("/attendance")}>
            자세히 보기
          </button>
        </div>
        <div className="meta">최근 10회 중 출석 8 · 지각 1 · 결석 1 (예시)</div>
      </section>
    </main>
  );
}
