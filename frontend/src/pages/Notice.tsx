import React, { useState } from "react";
import { useParams } from "react-router-dom";

type Post = { id: string; title: string; body: string; at: number };

export default function Notice() {
  const { campId } = useParams();
  const key = `notice:${campId}`;
  const role = (localStorage.getItem("role") as "admin" | "student") || "student";
  const [list, setList] = useState<Post[]>(() => JSON.parse(localStorage.getItem(key) || "[]"));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const p: Post = { id: Math.random().toString(36).slice(2, 9), title, body, at: Date.now() };
    const next = [p, ...list];
    setList(next);
    localStorage.setItem(key, JSON.stringify(next));
    setTitle("");
    setBody("");
  };

  return (
    <section className="board-page">
      <h3>📢 공지사항</h3>

      {role === "admin" && (
        <form className="editor" onSubmit={add}>
          <input
            className="ipt"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="ipt ta"
            placeholder="내용"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button className="btn">등록</button>
        </form>
      )}

      <ul className="post-list">
        {list.map((p) => (
          <li key={p.id} className="post">
            <div className="post-title">{p.title}</div>
            <div className="post-body">{p.body}</div>
          </li>
        ))}
        {list.length === 0 && <div className="empty">등록된 공지가 없습니다.</div>}
      </ul>
    </section>
  );
}
