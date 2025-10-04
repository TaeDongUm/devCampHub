import React, { useRef, useState, useEffect } from "react";

export type ExtraValues = Record<string, string | number | boolean | null | undefined>;

export type Msg = {
  id: string;
  who: string;
  text: string;
  at: number;
  extra?: {
    link?: string;
    image?: string; // dataURL
    code?: string;
    // 필요한 확장 필드는 여기 추가
    [k: string]: string | undefined;
  };
};

type ChatPageProps = {
  channel: string;
  placeholder?: string;
  /**
   * 채널별 확장 입력(UI)을 렌더링하는 함수.
   * - extraValues: 확장 입력값 저장소
   * - setExtraValues: 확장 입력값 업데이트
   */
  renderExtra?: (
    extraValues: ExtraValues,
    setExtraValues: React.Dispatch<React.SetStateAction<ExtraValues>>
  ) => React.ReactNode;

  /**
   * 메시지 전송 시 확장 입력을 메시지에 주입
   */
  onSend?: (msg: Msg, extraValues: ExtraValues) => Msg;
};

export default function ChatPage({ channel, placeholder, renderExtra, onSend }: ChatPageProps) {
  const nickname = localStorage.getItem("nickname") || "익명";
  const [msgs, setMsgs] = useState<Msg[]>(() => JSON.parse(localStorage.getItem(channel) || "[]"));
  const [text, setText] = useState<string>("");
  const [extraValues, setExtraValues] = useState<ExtraValues>({});
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999 });
  }, [msgs.length]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const base = text.trim();
    if (!base) return;

    let msg: Msg = {
      id: Math.random().toString(36).slice(2, 9),
      who: nickname,
      text: base,
      at: Date.now(),
    };

    if (onSend) {
      msg = onSend(msg, extraValues);
    }

    const next = [...msgs, msg];
    setMsgs(next);
    localStorage.setItem(channel, JSON.stringify(next));
    setText("");
    setExtraValues({});
  };

  return (
    <div className="chat-page">
      {/* 메시지 영역 (위) */}
      <div className="chat-list" ref={listRef}>
        {msgs.map((m) => (
          <div key={m.id} className="chat-msg">
            <div className="chat-who">{m.who}</div>
            <div className="chat-body">
              <div>{m.text}</div>

              {/* 확장 필드 */}
              {m.extra?.link && (
                <div>
                  🔗{" "}
                  <a href={m.extra.link} target="_blank" rel="noreferrer">
                    {m.extra.link}
                  </a>
                </div>
              )}
              {m.extra?.image && (
                <div style={{ marginTop: 6 }}>
                  <img
                    src={m.extra.image}
                    alt="upload"
                    style={{ maxWidth: 220, borderRadius: 8 }}
                  />
                </div>
              )}
              {m.extra?.code && (
                <pre className="chat-code">
                  <code>{m.extra.code}</code>
                </pre>
              )}
            </div>
          </div>
        ))}
        {msgs.length === 0 && <div className="chat-empty">첫 메시지를 남겨보세요.</div>}
      </div>

      {/* 입력 영역 (아래) */}
      <form className="chat-form" onSubmit={send}>
        <input
          className="ipt"
          placeholder={placeholder || "메시지를 입력하세요"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {renderExtra && (
          <div className="extra-inputs">{renderExtra(extraValues, setExtraValues)}</div>
        )}
        <button className="btn">보내기</button>
      </form>
    </div>
  );
}
