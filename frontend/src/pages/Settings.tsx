import React, { useState } from "react";
import "../styles/Settings.css";

export default function Settings() {
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw && pw !== pw2) { setMsg("❌ 비밀번호가 일치하지 않습니다."); return; }
    localStorage.setItem("nickname", nickname.trim() || "사용자");
    if (pw) localStorage.setItem("password", pw); // 데모용. 실제로는 백엔드에서 처리
    setMsg("✅ 저장되었습니다.");
  };

  return (
    <main className="set">
      <section className="card">
        <h1>설정</h1>
        <form className="form" onSubmit={onSave}>
          <label>별명</label>
          <input className="ipt" value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="표시할 별명" />

          <label>비밀번호 변경</label>
          <input className="ipt" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="새 비밀번호" />
          <input className="ipt" type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="새 비밀번호 확인" />

          <button className="btn">저장</button>
          {msg && <div className="msg">{msg}</div>}
        </form>
      </section>
    </main>
  );
}
