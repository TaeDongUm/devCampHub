import React, { useState } from "react";

export default function Settings() {
  const [name, setName] = useState(localStorage.getItem("profile:name") || "");
  const [nick, setNick] = useState(localStorage.getItem("nickname") || "");
  const [email, setEmail] = useState(localStorage.getItem("profile:email") || "");
  const [github, setGithub] = useState(localStorage.getItem("profile:github") || "");
  const [blog, setBlog] = useState(localStorage.getItem("profile:blog") || "");
  // const [track, setTrack] = useState<"WEB" | "ANDROID" | "IOS">(
  //   (localStorage.getItem("profile:track") as any) || "WEB"
  // );
  type Track = "WEB" | "ANDROID" | "IOS";
  const [track, setTrack] = useState<Track>(
    (localStorage.getItem("profile:track") as Track) || "WEB"
  );

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("profile:name", name);
    localStorage.setItem("nickname", nick);
    localStorage.setItem("profile:email", email);
    localStorage.setItem("profile:github", github);
    localStorage.setItem("profile:blog", blog);
    localStorage.setItem("profile:track", track);
    alert("저장되었습니다.");
  };

  return (
    <main className="wrap" style={{ maxWidth: 720 }}>
      <header className="board-head">
        <h1>설정</h1>
      </header>
      <form className="form" onSubmit={save}>
        <label>이름</label>
        <input className="ipt" value={name} onChange={(e) => setName(e.target.value)} />

        <label>별명</label>
        <input className="ipt" value={nick} onChange={(e) => setNick(e.target.value)} />

        <label>이메일</label>
        <input className="ipt" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Github</label>
        <input
          className="ipt"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          placeholder="https://github.com/..."
        />

        <label>Blog</label>
        <input
          className="ipt"
          value={blog}
          onChange={(e) => setBlog(e.target.value)}
          placeholder="https://blog..."
        />

        <label>학습 구분(트랙)</label>
        {/* <select className="ipt" value={track} onChange={(e) => setTrack(e.target.value as any)}>
          <option value="WEB">WEB</option>
          <option value="ANDROID">ANDROID</option>
          <option value="IOS">IOS</option>
        </select> */}
        <select className="ipt" value={track} onChange={(e) => setTrack(e.target.value as Track)}>
          <option value="WEB">WEB</option>
          <option value="ANDROID">ANDROID</option>
          <option value="IOS">IOS</option>
        </select>

        <div className="modal-actions">
          <button className="btn" type="submit">
            저장
          </button>
        </div>
      </form>
    </main>
  );
}
