import React, { useState } from "react";
import { useParams } from "react-router-dom";

type Qa = { id: string; q: string; a?: string; who: string; at: number };

export default function Qna() {
  const { campId } = useParams();
  const key = `qna:${campId}`;
  const role = (localStorage.getItem("role") as "admin" | "student") || "student";
  const nick = localStorage.getItem("nickname") || "익명";
  const [list, setList] = useState<Qa[]>(() => JSON.parse(localStorage.getItem(key) || "[]"));
  const [q, setQ] = useState("");

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    const item: Qa = { id: Math.random().toString(36).slice(2, 9), q, who: nick, at: Date.now() };
    const next = [item, ...list];
    setList(next);
    localStorage.setItem(key, JSON.stringify(next));
    setQ("");
  };
  const answer = (id: string) => {
    const item = prompt("답변 내용을 입력하세요", "");
    if (item == null) return;
    const next = list.map((x) => (x.id === id ? { ...x, a: item } : x));
    setList(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  return (
    <section className="board-page">
      <h3>❓ Q&A</h3>

      <form className="editor" onSubmit={ask}>
        <input
          className="ipt"
          placeholder="질문을 입력하세요"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn">질문 등록</button>
      </form>

      <ul className="qa-list">
        {list.map((x) => (
          <li key={x.id} className="qa">
            <div className="qa-q">
              Q. {x.q} <span className="muted">— {x.who}</span>
            </div>
            <div className="qa-a">
              {x.a ? <>A. {x.a}</> : <span className="muted">답변 대기중</span>}
            </div>
            {role === "admin" && (
              <button className="btn sm ghost" onClick={() => answer(x.id)}>
                답변
              </button>
            )}
          </li>
        ))}
        {list.length === 0 && <div className="empty">등록된 질문이 없습니다.</div>}
      </ul>
    </section>
  );
}
