import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import "../styles/Login.css";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export default function Login() {
  //   const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginId, setLoginId] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!loginId || !password) {
      setError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      const response = await http<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ loginId, password }),
      });

      if (response?.accessToken) {
        localStorage.setItem("token", response.accessToken);
        // refreshToken은 추후 토큰 갱신 로직에 사용될 수 있습니다.
        // localStorage.setItem("refreshToken", response.refreshToken);
        navigate("/dashboard/home");
      } else {
        setError("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (e: unknown) {
      // http 유틸에서 던진 에러 메시지를 사용하거나 기본 메시지를 표시합니다.
      let errorMessage = "이메일 또는 비밀번호가 올바르지 않습니다.";
      if (e instanceof Error) {
        errorMessage = e.message.includes("Failed to fetch")
          ? "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
          : e.message;
      }
      setError(errorMessage);
    }
  };

  const goSignup = () => navigate("/signupchoice");

  return (
    <main className="login">
      <section className="login-card">
        <h1 className="login-title">로그인</h1>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <input
            type="loginId"
            placeholder="아이디"
            className="login-input"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">
            로그인
          </button>
        </form>

        {error && <div className="login-error">{error}</div>}

        <div className="login-tip">
          아이디가 없으신가요? <strong>회원가입 버튼을 누르세요!</strong>
        </div>
        <button className="btn-secondary" onClick={goSignup}>
          회원가입
        </button>
      </section>
    </main>
  );
}
