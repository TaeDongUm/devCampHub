import React, { useState } from "react";
import { useParams } from "react-router-dom";

type FileItem = { id: string; name: string; url: string; at: number };

export default function Resources() {
  const { campId } = useParams();
  const key = `res:${campId}`;
  const [list, setList] = useState<FileItem[]>(() => JSON.parse(localStorage.getItem(key) || "[]"));
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    const f: FileItem = { id: Math.random().toString(36).slice(2, 9), name, url, at: Date.now() };
    const next = [f, ...list];
    setList(next);
    localStorage.setItem(key, JSON.stringify(next));
    setName("");
    setUrl("");
  };

  return (
    <section className="board-page">
      <h3>📂 공유할 학습자료</h3>
      <form className="editor" onSubmit={add}>
        <input
          className="ipt"
          placeholder="자료명"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="ipt"
          placeholder="URL (https://…)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="btn">추가</button>
      </form>
      <ul className="file-list">
        {list.map((f) => (
          <li key={f.id} className="file">
            <a href={f.url} target="_blank" rel="noreferrer">
              {f.name}
            </a>
          </li>
        ))}
        {list.length === 0 && <div className="empty">공유된 자료가 없습니다.</div>}
      </ul>
    </section>
  );
}
