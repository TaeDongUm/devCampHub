import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import "../styles/SignupAdmin.css";

export default function SignupAdmin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
    loginId: "",
    verificationCode: "",
  });
  const [error, setError] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [timer, setTimer] = useState(600); // 10분

  useEffect(() => {
    if (!isCodeSent || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCodeSent, timer]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSendCode = async () => {
    if (!form.email) {
      setError("이메일을 입력해주세요.");
      return;
    }
    try {
      setError("");
      await http("/api/auth/send-verification-code", {
        method: "POST",
        body: JSON.stringify({ email: form.email }),
      });
      setIsCodeSent(true);
      setTimer(600);
    } catch (e: any) {
      setError(e.message || "인증번호 발송에 실패했습니다.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await http("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...form, role: "ADMIN" }),
      });
      alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (e: any) {
      setError(e.message || "회원가입에 실패했습니다.");
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <main className="sadmin">
      <section className="sadmin-card">
        <h1 className="sadmin-title">관리자 회원가입</h1>
        <form className="sadmin-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="이메일"
              className="sadmin-input"
              onChange={onChange}
              required
              disabled={isCodeSent}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSendCode}
              disabled={isCodeSent}
            >
              {isCodeSent ? "재전송" : "인증번호 발송"}
            </button>
          </div>

          {isCodeSent && (
            <div className="input-group">
              <input
                type="text"
                name="verificationCode"
                placeholder="인증번호 6자리"
                className="sadmin-input"
                onChange={onChange}
                required
              />
              <span className="timer">{formatTime(timer)}</span>
            </div>
          )}

          <input
            type="password"
            name="password"
            placeholder="비밀번호 (8자 이상)"
            className="sadmin-input"
            onChange={onChange}
            required
          />
          <input
            name="nickname"
            placeholder="닉네임 (2자 이상 15자 이하)"
            className="sadmin-input"
            onChange={onChange}
            required
          />
          <input
            name="loginId"
            placeholder="로그인 ID (영문, 숫자, 특수문자 - _ 만 가능)"
            className="sadmin-input"
            onChange={onChange}
            required
          />

          {error && <p className="error-message">{error}</p>}

          <button className="btn-primary" type="submit">
            회원가입
          </button>
        </form>
        <div className="sadmin-footer">
          이미 계정이 있나요? <a href="/login">로그인</a>
        </div>
      </section>
    </main>
  );
}
