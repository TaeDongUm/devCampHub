import React, { useEffect, useMemo, useState } from "react";
import "../styles/VerifyEmail.css";

function msToClock(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m)}:${String(s).padStart(2, "0")}`;
}

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const startedAt = Number(localStorage.getItem("verify:startedAt") || 0);
  const ttlMs = Number(localStorage.getItem("verify:ttlMs") || (3*60*1000));
  const role = localStorage.getItem("verify:role") || "";
  const email = localStorage.getItem("verify:email") || "";

  const [left, setLeft] = useState<number>(() => Math.max(0, startedAt + ttlMs - Date.now()));
  const expired = left <= 0;

  useEffect(() => {
    if (expired) return;
    const t = setInterval(() => {
      setLeft(Math.max(0, startedAt + ttlMs - Date.now()));
    }, 250);
    return () => clearInterval(t);
  }, [expired, startedAt, ttlMs]);

  const done = useMemo(() => code.trim().length >= 4, [code]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!done || expired) return;
    // ⬇️ 인증 성공 가정: 검증 상태 저장
    localStorage.setItem("verify:ok", "true");
    // 이후 역할에 따라 홈 이동
    window.location.href = role === "admin" ? "/admin/home" : "/student/home";
  };

  const reset = () => {
    // 타이머 재시작(재발송 가정) — 실제론 이메일 재발송 API 필요
    const now = Date.now();
    localStorage.setItem("verify:startedAt", String(now));
    setLeft(Math.max(0, now + ttlMs - Date.now()));
  };

  return (
    <main className="verify">
      <section className="verify-card">
        <h1 className="verify-title">이메일 인증</h1>
        <p className="verify-sub">입력하신 이메일 <strong>{email || "(미입력)"}</strong> 로 발송된 인증 코드를 입력하세요.</p>

        <div className={`verify-timer ${expired ? "expired" : ""}`}>
          남은 시간 <span>{msToClock(left)}</span>
        </div>

        <form className="verify-form" onSubmit={onSubmit}>
          <input
            className="verify-input"
            placeholder="인증 코드 (4자리 이상)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={10}
          />
          <button className="btn-primary" type="submit" disabled={!done || expired}>
            인증 완료
          </button>
        </form>

        <div className="verify-actions">
          <button className="btn-outline" onClick={reset}>인증 메일 재발송(타이머 초기화)</button>
          <a className="verify-cancel" href="/login">취소하고 로그인 화면으로</a>
        </div>

        {expired && <div className="verify-expired">시간이 만료되었습니다. 재발송을 눌러 다시 시도하세요.</div>}
      </section>
    </main>
  );
}
