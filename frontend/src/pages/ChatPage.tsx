import React, { useEffect, useMemo, useRef, useState } from "react";

export type ExtraValues = Record<string, string | number | boolean | null | undefined>;

export type Attachment = {
  id: string;
  name: string;
  type: string; // mime type
  dataUrl: string; // data URL (base64)
};

export type Msg = {
  id: string;
  who: string;
  text: string;
  at: number;
  extra?: {
    link?: string;
    image?: string; // 채널 확장 호환
    code?: string;
    files?: Attachment[];
    [k: string]: string | Attachment[] | undefined;
  };
};

type ChatPageProps = {
  channel: string;
  placeholder?: string;
  renderExtra?: (
    extraValues: ExtraValues,
    setExtraValues: React.Dispatch<React.SetStateAction<ExtraValues>>
  ) => React.ReactNode;
  onSend?: (msg: Msg, extraValues: ExtraValues) => Msg;
};

const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"')\]]+)/gi;

function extractFencedCode(text: string): { code?: string; plain: string } {
  const trimmed = text.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```") && trimmed.length > 6) {
    const inner = trimmed.slice(3, -3).trimStart();
    const firstNewline = inner.indexOf("\n");
    const code = firstNewline >= 0 ? inner.slice(firstNewline + 1) : inner;
    return { code, plain: "" };
  }
  return { plain: text };
}

function renderTextWithLinks(text: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const str = text;
  str.replace(URL_RE, (match, url, offset) => {
    if (offset > lastIndex) parts.push(<span key={lastIndex}>{str.slice(lastIndex, offset)}</span>);
    const href = url.startsWith("http") ? url : `https://${url}`;
    parts.push(
      <a key={offset} href={href} target="_blank" rel="noreferrer">
        {url}
      </a>
    );
    lastIndex = offset + match.length;
    return match;
  });
  if (lastIndex < str.length) parts.push(<span key={lastIndex}>{str.slice(lastIndex)}</span>);
  return parts;
}

export default function ChatPage({ channel, placeholder, renderExtra, onSend }: ChatPageProps) {
  const nickname = localStorage.getItem("nickname") || "익명";

  const [msgs, setMsgs] = useState<Msg[]>(() => JSON.parse(localStorage.getItem(channel) || "[]"));
  const [text, setText] = useState<string>("");
  const [codeMode, setCodeMode] = useState<boolean>(false);
  const [codeText, setCodeText] = useState<string>("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiList = useMemo(
    () => ["😀", "😂", "😍", "👍", "🔥", "🙏", "🎉", "💯", "🤔", "🚀", "😎", "🥳"],
    []
  );
  const [extraValues, setExtraValues] = useState<ExtraValues>({});

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999 });
  }, [msgs.length]);

  // ---------- 파일 ----------
  const fileIptRef = useRef<HTMLInputElement>(null);
  const onPickFiles = () => fileIptRef.current?.click();
  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    selected.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        setFiles((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2, 9),
            name: f.name,
            type: f.type || "application/octet-stream",
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  // ---------- 이모지 ----------
  const addEmoji = (em: string) => {
    setText((t) => t + em);
    setShowEmoji(false);
  };

  // 입력창에서 ```만 입력 → 코드 모드 전환
  const onPlainChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    if (v.trim() === "```") {
      setText("");
      setCodeMode(true);
      setTimeout(() => setCodeText(""), 0);
      return;
    }
    setText(v);
  };

  const doSend = () => {
    // 코드 모드: Enter는 줄바꿈, 전송은 버튼/Enter 처리 분리
    if (codeMode) {
      const code = codeText.trim();
      if (!code && files.length === 0) return;
      let msg: Msg = {
        id: Math.random().toString(36).slice(2, 9),
        who: nickname,
        text: "",
        at: Date.now(),
        extra: { code, ...(files.length ? { files } : {}) },
      };
      if (onSend) msg = onSend(msg, extraValues);

      const next = [...msgs, msg];
      setMsgs(next);
      localStorage.setItem(channel, JSON.stringify(next));

      setCodeText("");
      setCodeMode(false);
      setFiles([]);
      setExtraValues({});
      return;
    }

    // 일반 메시지
    const base = text.trim();
    if (!base && files.length === 0) return;

    const { code, plain } = extractFencedCode(base);
    let msg: Msg = {
      id: Math.random().toString(36).slice(2, 9),
      who: nickname,
      text: plain,
      at: Date.now(),
      extra: { ...(code ? { code } : {}), ...(files.length ? { files } : {}) },
    };
    if (onSend) msg = onSend(msg, extraValues);

    const next = [...msgs, msg];
    setMsgs(next);
    localStorage.setItem(channel, JSON.stringify(next));

    setText("");
    setFiles([]);
    setExtraValues({});
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSend();
  };

  const hasPreview = files.length > 0;

  return (
    <div className="chat-page">
      {/* 메시지 목록 */}
      <div className="chat-list" ref={listRef}>
        {msgs.map((m) => (
          <div key={m.id} className="chat-msg">
            <div className="chat-who">{m.who}</div>
            <div className="chat-body">
              {m.text && <div>{renderTextWithLinks(m.text)}</div>}

              {m.extra?.code && (
                <pre className="chat-code">
                  <code>{m.extra.code}</code>
                </pre>
              )}

              {Array.isArray(m.extra?.files) && m.extra!.files!.length > 0 && (
                <div className="chat-files">
                  {m.extra!.files!.map((f) =>
                    f.type.startsWith("image/") ? (
                      <div className="file-thumb" key={f.id}>
                        <img src={f.dataUrl} alt={f.name} />
                        <div className="file-cap">{f.name}</div>
                      </div>
                    ) : (
                      <div className="file-link" key={f.id}>
                        <a href={f.dataUrl} download={f.name}>
                          📎 {f.name}
                        </a>
                      </div>
                    )
                  )}
                </div>
              )}

              {m.extra?.image && !m.extra.files && (
                <div style={{ marginTop: 6 }}>
                  <img
                    src={m.extra.image}
                    alt="upload"
                    style={{ maxWidth: 220, borderRadius: 8 }}
                  />
                </div>
              )}
              {m.extra?.link && (
                <div style={{ marginTop: 6 }}>
                  🔗{" "}
                  <a href={m.extra.link} target="_blank" rel="noreferrer">
                    {m.extra.link}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        {msgs.length === 0 && <div className="chat-empty">첫 메시지를 남겨보세요.</div>}
      </div>

      {/* 입력 영역 */}
      <form className="chat-form" onSubmit={onSubmit}>
        {/* 툴바 */}
        <div className="chat-toolbar">
          <button type="button" className="tb-btn" title="파일 추가" onClick={onPickFiles}>
            ⊕
          </button>
          <button
            type="button"
            className="tb-btn"
            title="이모지"
            onClick={() => setShowEmoji((s) => !s)}
          >
            😊
          </button>
          {showEmoji && (
            <div className="emoji-pop">
              {emojiList.map((em) => (
                <button key={em} type="button" className="emoji" onClick={() => addEmoji(em)}>
                  {em}
                </button>
              ))}
            </div>
          )}
          <input
            type="file"
            multiple
            ref={fileIptRef}
            style={{ display: "none" }}
            onChange={onFilesSelected}
          />
        </div>

        {/* 코드 모드 편집기 (Enter/Shift+Enter 모두 줄바꿈) */}
        {codeMode ? (
          <div className="code-compose">
            <textarea
              className="ipt ta"
              placeholder="코드를 입력하세요 (완료 후 '보내기')"
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              onKeyDown={() => {
                // 코드모드는 Enter 기본 동작 유지(줄바꿈), Shift+Enter도 줄바꿈
                // 전송 단축키는 정의하지 않음 (요청대로 줄바꿈만)
              }}
            />
            {hasPreview && (
              <div className="attach-preview">
                {files.map((f) =>
                  f.type.startsWith("image/") ? (
                    <div key={f.id} className="file-thumb">
                      <img src={f.dataUrl} alt={f.name} />
                      <div className="file-cap">{f.name}</div>
                    </div>
                  ) : (
                    <div key={f.id} className="file-link">
                      📎 {f.name}
                    </div>
                  )
                )}
              </div>
            )}
            <div className="compose-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setCodeMode(false);
                  setCodeText("");
                }}
              >
                코드 모드 취소
              </button>
              <button type="submit" className="btn send-btn">
                보내기
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 일반 입력: textarea로 변경 (Enter=전송, Shift+Enter=줄바꿈) */}
            <div className="chat-input-box">
              <textarea
                className="ipt chat-input ta"
                placeholder={
                  placeholder || "메시지를 입력하세요 (Shift+Enter 줄바꿈, ``` 입력 시 코드 모드)"
                }
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

            {(hasPreview || renderExtra) && (
              <div className="extra-zone">
                {hasPreview && (
                  <div className="attach-preview">
                    {files.map((f) =>
                      f.type.startsWith("image/") ? (
                        <div key={f.id} className="file-thumb">
                          <img src={f.dataUrl} alt={f.name} />
                          <div className="file-cap">{f.name}</div>
                        </div>
                      ) : (
                        <div key={f.id} className="file-link">
                          📎 {f.name}
                        </div>
                      )
                    )}
                  </div>
                )}
                {renderExtra && (
                  <div className="extra-inputs">{renderExtra(extraValues, setExtraValues)}</div>
                )}
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
}
