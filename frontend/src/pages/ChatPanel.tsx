import React, { useEffect, useRef, useState } from "react";

type Props = {
  channel: string; // localStorage 키
  placeholder?: string;
};

type Msg = { id: string; who: string; text: string; at: number };

export default function ChatPanel({ channel, placeholder }: Props) {
  const nickname = localStorage.getItem("nickname") || "익명";
  const [msgs, setMsgs] = useState<Msg[]>(() => JSON.parse(localStorage.getItem(channel) || "[]"));
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999 });
  }, [msgs.length]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const m: Msg = {
      id: Math.random().toString(36).slice(2, 9),
      who: nickname,
      text: t,
      at: Date.now(),
    };
    const next = [...msgs, m];
    setMsgs(next);
    localStorage.setItem(channel, JSON.stringify(next));
    setText("");
  };

  return (
    <aside className="chat">
      <div className="chat-head">채팅</div>
      <div className="chat-list" ref={listRef}>
        {msgs.map((m) => (
          <div key={m.id} className="chat-row">
            <div className="chat-who">{m.who}</div>
            <div className="chat-text">{m.text}</div>
          </div>
        ))}
        {msgs.length === 0 && <div className="chat-empty">첫 메시지를 남겨보세요.</div>}
      </div>
      <form className="chat-form" onSubmit={send}>
        <input
          className="ipt"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder || "메시지를 입력하세요"}
        />
        <button className="btn sm">보내기</button>
      </form>
    </aside>
  );
}
