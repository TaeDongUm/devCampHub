import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const dummyUsers = [
    { username: "admin", password: "1234", role: "admin" },
    { username: "student", password: "1234", role: "student" },
  ];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const found = dummyUsers.find(
      (u) => u.username === identifier && u.password === password
    );

    if (!found) {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    localStorage.setItem("role", found.role); // ✅ 역할 저장
    if (found.role === "admin") {
      navigate("/admin/home");
    } else {
      navigate("/student/home");
    }
  };

  const goSignup = () => navigate("/signup");

  return (
    <main className="login">
      <section className="login-card">
        <h1 className="login-title">로그인</h1>

        <form className="login-form" onSubmit={onSubmit} noValidate>
          <input
            type="text"
            placeholder="아이디"
            className="login-input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn-primary">로그인</button>
        </form>

        {error && <div className="login-error">{error}</div>}

        <div className="login-tip">
          아이디가 없으신가요? <strong>회원가입 버튼을 누르세요!</strong>
        </div>
        <button className="btn-secondary" onClick={goSignup}>회원가입</button>
      </section>
    </main>
  );
}
