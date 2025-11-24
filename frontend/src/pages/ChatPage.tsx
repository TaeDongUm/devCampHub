import React, { useEffect, useMemo, useRef, useState } from "react";
import { useChat, type ChatMessage } from "../hooks/useChat";

// --- 헬퍼 함수들 (Helper functions remain the same) ---
type FileItem = { name: string; url: string; type: string };
const URL_RE = /\b((?:https?:\/|www\.)[^\s<>")\]]+)/gi;

function extractFencedCodeLoose(text: string): { code?: string; plain: string } {
  const start = text.indexOf("```");
  const end = text.lastIndexOf("```");
  if (start >= 0 && end > start + 2) {
    const inner = text.slice(start + 3, end);
    const firstNL = inner.indexOf("\n");
    const code = firstNL >= 0 ? inner.slice(firstNL + 1) : inner;
    const plain = (text.slice(0, start) + text.slice(end + 3)).trim();
    return { code, plain };
  }
  return { plain: text };
}

function renderText(text: string) {
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

const parseMessageContent = (content: string) => {
  try {
    return JSON.parse(content);
  } catch {
    return { text: content, code: undefined, files: [] };
  }
};

// --- 컴포넌트 Props 정의 ---
interface ChatPageProps {
  channel: string;
  nickname: string; // nickname을 prop으로 받습니다.
  placeholder?: string;
}

// --- 메인 컴포넌트 ---
export default function ChatPage({ channel, nickname, placeholder }: ChatPageProps) {
  // useChat 훅을 새로운 시그니처에 맞게 호출합니다.
  const {
    messages,
    sendMessage,
    sendingStatus,
    connectionState,
    manualReconnect,
    retryLastMessage,
  } = useChat(channel, nickname);

  const [text, setText] = useState<string>("");
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [lastMessage, setLastMessage] = useState<{
    text: string;
    code?: string;
    files?: any[];
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999 });
  }, [messages.length]);

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
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + value.length;
      el.focus();
    });
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = Array.from(e.target.files || []);
    if (fl.length === 0) return;
    const readers = fl.map(
      (f) =>
        new Promise<FileItem>((resolve) => {
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

  const doSend = () => {
    const base = text.trim();
    const hasFiles = files.length > 0;
    if (!base && !hasFiles) return;

    const { code, plain } = extractFencedCodeLoose(base);
    const messagePayload = { text: plain, code, files };

    // 마지막 메시지 저장 (재시도용)
    setLastMessage(messagePayload);

    sendMessage(messagePayload);

    setText("");
    setFiles([]);
    setShowEmoji(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSend();
  };

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      (ChatMessage & { parsedContent: ReturnType<typeof parseMessageContent> })[]
    >();
    messages.forEach((m) => {
      const k = dateKey(new Date(m.timestamp).getTime());
      const arr = map.get(k) || [];
      arr.push({ ...m, parsedContent: parseMessageContent(m.content) });
      map.set(k, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  }, [messages]);

  const EMOJIS = ["😀", "😂", "🥹", "😎", "🤩", "😴", "😭", "👍", "🔥", "💯", "✨", "🎉"];

  return (
    <div className="chat-page">
      {/* 연결 상태 표시 */}
      <div className="connection-status-bar">
        {connectionState === "connecting" && (
          <span className="status-connecting">🔵 연결 중...</span>
        )}
        {connectionState === "connected" && <span className="status-connected">🟢 연결됨</span>}
        {connectionState === "disconnected" && (
          <div className="status-disconnected">
            <span>🔴 연결 끊김</span>
            <button className="reconnect-btn" onClick={manualReconnect}>
              🔄 재연결 시도
            </button>
          </div>
        )}
        {connectionState === "reconnecting" && (
          <span className="status-reconnecting">🟡 재연결 중...</span>
        )}
      </div>

      {/* 전송 상태 표시 */}
      {sendingStatus.status === "sending" && (
        <div className="sending-indicator">
          <span>📤 전송 중...</span>
        </div>
      )}
      {sendingStatus.status === "retrying" && (
        <div className="sending-indicator retrying">
          <span>🔄 재시도 중... ({sendingStatus.retryCount}/3)</span>
        </div>
      )}
      {sendingStatus.status === "failed" && lastMessage && (
        <div className="sending-indicator failed">
          <span>❌ 전송 실패</span>
          <button className="retry-btn" onClick={() => retryLastMessage(lastMessage)}>
            다시 시도
          </button>
        </div>
      )}

      <div className="chat-list" ref={listRef}>
        {grouped.length === 0 && <div className="chat-empty">첫 메시지를 남겨보세요.</div>}
        {grouped.map(([k, arr]) => (
          <div key={k}>
            <div className="date-sep">
              <span className="date-chip">
                {formatDateLabel(new Date(arr[0].timestamp).getTime())}
              </span>
            </div>
            {arr.map((m, idx) => (
              <div key={idx} className={`chat-msg ${m.sender === nickname ? "mine" : ""}`}>
                <div className="chat-who">{m.sender}</div>
                <div className="chat-bubble-container">
                  <div className="chat-content-wrapper">
                    {" "}
                    {/* New wrapper div */}
                    <div className="chat-body">
                      {m.parsedContent.text && (
                        <div className="chat-text">{renderText(m.parsedContent.text)}</div>
                      )}
                      {m.parsedContent.code && (
                        <pre className="chat-code">
                          <code>{m.parsedContent.code}</code>
                        </pre>
                      )}
                      {Array.isArray(m.parsedContent.files) && m.parsedContent.files.length > 0 && (
                        <div className="attach-preview" style={{ marginTop: 8 }}>
                          {m.parsedContent.files.map((f: FileItem, fIdx: number) =>
                            f.type.startsWith("image/") ? (
                              <div className="file-thumb" key={fIdx}>
                                <img src={f.url} alt={f.name} />
                                <div className="file-cap">{f.name}</div>
                              </div>
                            ) : (
                              <a className="file-link" key={fIdx} href={f.url} download={f.name}>
                                {f.name}
                              </a>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="chat-timestamp">{m.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={onSubmit}>
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
