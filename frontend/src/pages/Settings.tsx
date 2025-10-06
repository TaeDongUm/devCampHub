import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CampDetail.css";

type Track = "WEB" | "ANDROID" | "IOS";

export default function Settings() {
  const nav = useNavigate();

  // 프로필 필드
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [github, setGithub] = useState(localStorage.getItem("profile:github") || "");
  const [blog, setBlog] = useState(localStorage.getItem("profile:blog") || "");
  const [track, setTrack] = useState<Track>(
    (localStorage.getItem("profile:track") || "WEB").toUpperCase() as Track
  );

  // 역할은 읽기 전용(요청)
  const rawRole = (localStorage.getItem("role") || "STUDENT").toUpperCase();
  const role: "ADMIN" | "STUDENT" = rawRole === "ADMIN" ? "ADMIN" : "STUDENT";

  const onSave = () => {
    localStorage.setItem("name", name);
    localStorage.setItem("nickname", nickname);
    localStorage.setItem("email", email);
    localStorage.setItem("profile:github", github);
    localStorage.setItem("profile:blog", blog);
    localStorage.setItem("profile:track", track);
    // role은 저장하지 않음(변경 불가)
    nav("/mypage");
  };

  return (
    <main className="wrap" style={{ maxWidth: 720 }}>
      <header className="board-head">
        <h1>설정</h1>
      </header>

      <section className="mine" style={{ padding: 16, display: "grid", gap: 12 }}>
        <label>이름</label>
        <input className="ipt" value={name} onChange={(e) => setName(e.target.value)} />

        <label>별명</label>
        <input className="ipt" value={nickname} onChange={(e) => setNickname(e.target.value)} />

        <label>email</label>
        <input className="ipt" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Github</label>
        <input className="ipt" value={github} onChange={(e) => setGithub(e.target.value)} />

        <label>Blog</label>
        <input className="ipt" value={blog} onChange={(e) => setBlog(e.target.value)} />

        <label>학습 구분</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["WEB", "ANDROID", "IOS"] as Track[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${track === t ? "on" : ""}`}
              onClick={() => setTrack(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 역할: 읽기 전용 / 비활성화*/}
        <label>역할</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="chip" title="설정에서 변경할 수 없습니다.">
            {role}
          </span>
          <span className="muted" style={{ fontSize: 13 }}>
            ※ 역할은 관리자에서만 부여/변경됩니다.
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={onSave}>
            저장
          </button>
          <button className="btn ghost" onClick={() => nav(-1)}>
            취소
          </button>
        </div>
      </section>
    </main>
  );
}
