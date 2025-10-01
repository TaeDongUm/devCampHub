import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/VerifyEmail.css";

function msToClock(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m)}:${String(s).padStart(2, "0")}`;
}

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"pending" | "success">("pending");
  const navigate = useNavigate();   // ✅ React Router 전용 네비게이터

  const startedAt = Number(localStorage.getItem("verify:startedAt") || 0);
  const ttlMs = Number(localStorage.getItem("verify:ttlMs") || (3 * 60 * 1000));
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
    if (expired) return;

    if (code === "1234") {
      setStatus("success");
      localStorage.setItem("verify:ok", "true");

      // ✅ 새로고침 없이 로그인 페이지로 이동
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } else {
      alert("잘못된 인증 코드입니다. (테스트: 1234 입력)");
    }
  };

  return (
    <main className="verify">
      <section className="verify-card">
        <h1 className="verify-title">이메일 인증</h1>
        <p className="verify-sub">
          입력하신 이메일 <strong>{email || "(미입력)"}</strong> 로 발송된 인증 코드를 입력하세요.
          <br /> (테스트용: 1234 입력 시 통과)
        </p>

        <div className={`verify-timer ${expired ? "expired" : ""}`}>
          남은 시간 <span>{msToClock(left)}</span>
        </div>

        {status === "pending" && (
          <form className="verify-form" onSubmit={onSubmit}>
            <input
              className="verify-input"
              placeholder="인증 코드 (테스트: 1234)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={10}
            />
            <button className="btn-primary" type="submit" disabled={!done || expired}>
              인증 완료
            </button>
          </form>
        )}

        {status === "success" && (
          <div className="verify-success">
            ✅ 인증 완료되었습니다. 잠시 후 로그인 페이지로 이동합니다...
          </div>
        )}

        {expired && (
          <div className="verify-expired">
            시간이 만료되었습니다. 재발송을 눌러 다시 시도하세요.
          </div>
        )}
      </section>
    </main>
  );
}
