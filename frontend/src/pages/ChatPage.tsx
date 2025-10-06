import React, { useEffect, useMemo, useRef, useState } from "react";

export type ExtraValues = Record<string, string | number | boolean | null | undefined>;

// 파일 타입 분리
type FileItem = { name: string; url: string; type: string };

// 추가 확장 슬롯(동적으로 쓸 수도 있을 때)은 any 대신 unknown
type ExtraMap = Record<string, unknown>;

export type Msg = {
  id: string;
  who: string;
  text: string; // 일반 텍스트(링크 포함)
  at: number; // ms
  // extra는 구체 필드 + 확장 슬롯의 교차 타입으로 정의
  extra?: { code?: string; files?: FileItem[] } & ExtraMap;
};

type ChatPageProps = {
  channel: string;
  placeholder?: string;
  renderExtra?: never; // (단일 컴포즈로 통일)
  onSend?: never;
};

// URL 감지(간단 버전)
const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"')\]]+)/gi;

/** 텍스트에 들어있는 첫 번째 fenced code( ``` ) 를 뽑아냄
 * - 코드블럭 바깥의 텍스트는 그대로 유지
 */
function extractFencedCodeLoose(text: string): { code?: string; plain: string } {
  const start = text.indexOf("```");
  const end = text.lastIndexOf("```");
  if (start >= 0 && end > start + 2) {
    const inner = text.slice(start + 3, end);
    // 언어 힌트 한 줄 제거
    const firstNL = inner.indexOf("\n");
    const code = firstNL >= 0 ? inner.slice(firstNL + 1) : inner;
    const plain = (text.slice(0, start) + text.slice(end + 3)).trim();
    return { code, plain };
  }
  return { plain: text };
}

/** 텍스트 안 링크 자동 하이라이트 + 줄바꿈 보존 */
function renderText(text: string) {
  // 줄 단위로 쪼개서 <br/> 보존 (Shift+Enter 포함)
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {renderLineWithLinks(line)}
      {i < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}
function renderLineWithLinks(line: string) {
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  line.replace(URL_RE, (match, url, offset) => {
    if (offset > lastIndex) out.push(<span key={lastIndex}>{line.slice(lastIndex, offset)}</span>);
    const href = url.startsWith("http") ? url : `https://${url}`;
    out.push(
      <a key={offset} href={href} target="_blank" rel="noreferrer">
        {url}
      </a>
    );
    lastIndex = offset + match.length;
    return match;
  });
  if (lastIndex < line.length) out.push(<span key={lastIndex}>{line.slice(lastIndex)}</span>);
  return out;
}

function dateKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function formatDateLabel(ts: number) {
  const df = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" });
  return df.format(new Date(ts));
}

export default function ChatPage({ channel, placeholder }: ChatPageProps) {
  const nickname = localStorage.getItem("nickname") || "익명";

  const [msgs, setMsgs] = useState<Msg[]>(() => JSON.parse(localStorage.getItem(channel) || "[]"));
  const [text, setText] = useState<string>("");

  // 툴바 상태
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 파일 미리보기 상태
  const [files, setFiles] = useState<FileItem[]>([]);

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999 });
  }, [msgs.length]);

  const onPlainChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const insertAtCursor = (value: string) => {
    const el = textareaRef.current;
    if (!el) {
      setText((t) => (t || "") + value);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + value + el.value.slice(end);
    setText(next);
    // caret 재배치
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + value.length;
      el.focus();
    });
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 파일 선택
  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = Array.from(e.target.files || []);
    if (fl.length === 0) return;
    const readers = fl.map(
      (f) =>
        new Promise<{ name: string; url: string; type: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              name: f.name,
              url: typeof reader.result === "string" ? reader.result : "",
              type: f.type,
            });
          reader.readAsDataURL(f);
        })
    );
    Promise.all(readers).then((arr) => setFiles((prev) => [...prev, ...arr]));
    e.currentTarget.value = "";
  };

  // 전송
  const doSend = () => {
    const base = text.trim();
    const hasFiles = files.length > 0;
    if (!base && !hasFiles) return;

    const { code, plain } = extractFencedCodeLoose(base);

    const msg: Msg = {
      id: Math.random().toString(36).slice(2, 9),
      who: nickname,
      text: plain,
      at: Date.now(),
      extra: {
        ...(code ? { code } : {}),
        ...(hasFiles ? { files } : {}),
      },
    };

    const next = [...msgs, msg];
    setMsgs(next);
    localStorage.setItem(channel, JSON.stringify(next));

    // reset
    setText("");
    setFiles([]);
    setShowEmoji(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSend();
  };

  // 날짜별 그룹
  const grouped = useMemo(() => {
    const map = new Map<string, Msg[]>();
    msgs.forEach((m) => {
      const k = dateKey(m.at);
      const arr = map.get(k) || [];
      arr.push(m);
      map.set(k, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  }, [msgs]);

  // 간단 이모지 목록(데모)
  const EMOJIS = ["😀", "😂", "🥹", "😎", "🤩", "😴", "😭", "👍", "🔥", "💯", "✨", "🎉"];

  return (
    <div className="chat-page">
      {/* 메시지 목록 + 날짜 구분선 */}
      <div className="chat-list" ref={listRef}>
        {grouped.length === 0 && <div className="chat-empty">첫 메시지를 남겨보세요.</div>}

        {grouped.map(([k, arr]) => (
          <div key={k}>
            <div className="date-sep">
              <span className="date-chip">{formatDateLabel(arr[0].at)}</span>
            </div>

            {arr.map((m) => (
              <div key={m.id} className="chat-msg">
                <div className="chat-who">{m.who}</div>
                <div className="chat-body">
                  {m.text && <div className="chat-text">{renderText(m.text)}</div>}

                  {m.extra?.code && (
                    <pre className="chat-code">
                      <code>{m.extra.code}</code>
                    </pre>
                  )}

                  {Array.isArray(m.extra?.files) && m.extra.files.length > 0 && (
                    <div className="attach-preview" style={{ marginTop: 8 }}>
                      {m.extra.files.map((f: FileItem, idx) =>
                        f.type.startsWith("image/") ? (
                          <div className="file-thumb" key={idx}>
                            <img src={f.url} alt={f.name} />
                            <div className="file-cap">{f.name}</div>
                          </div>
                        ) : (
                          <a className="file-link" key={idx} href={f.url} download={f.name}>
                            {f.name}
                          </a>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 입력 영역 */}
      <form className="chat-form" onSubmit={onSubmit}>
        {/* 툴바: + / 😀 */}
        <div className="chat-toolbar">
          <button
            type="button"
            className="tb-btn"
            title="파일 추가"
            onClick={() => fileInputRef.current?.click()}
          >
            ⊕
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={onPickFiles}
            accept="image/*,application/pdf,text/plain,application/zip,application/json"
          />

          <button
            type="button"
            className="tb-btn"
            title="이모지"
            onClick={() => setShowEmoji((v) => !v)}
          >
            🙂
          </button>

          {showEmoji && (
            <div className="emoji-pop">
              {EMOJIS.map((e) => (
                <button key={e} type="button" className="emoji" onClick={() => insertAtCursor(e)}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 선택한 파일 미리보기 */}
        {!!files.length && (
          <div className="extra-zone">
            <div className="attach-preview">
              {files.map((f, idx) =>
                f.type.startsWith("image/") ? (
                  <div className="file-thumb" key={idx}>
                    <img src={f.url} alt={f.name} />
                    <div className="file-cap">{f.name}</div>
                  </div>
                ) : (
                  <span className="file-link" key={idx}>
                    {f.name}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {/* 입력창 + 전송 버튼 (Shift+Enter 줄바꿈, Enter 전송) */}
        <div className="chat-input-box">
          <textarea
            ref={textareaRef}
            className="ipt chat-input ta"
            placeholder={placeholder || "메시지 보내기"}
            value={text}
            onChange={onPlainChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doSend();
              }
              // Shift+Enter는 기본 동작(줄바꿈) 유지
            }}
            rows={2}
          />
          <button type="submit" className="btn send-btn">
            보내기
          </button>
        </div>
      </form>
    </div>
  );
}
