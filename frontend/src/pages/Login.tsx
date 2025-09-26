import React from "react";
import "../styles/Login.css";

export default function Login() {
  const goSignup = () => (window.location.href = "/signup");

  return (
    <main className="login">
      <section className="login-card">
        <h1 className="login-title">로그인</h1>

        <form className="login-form" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="이메일" className="login-input" />
          <input type="password" placeholder="비밀번호" className="login-input" />
          <button type="submit" className="btn-primary">로그인</button>
        </form>

        <div className="login-tip">
          아이디가 없으신가요? <strong>회원가입 버튼을 누르세요!</strong>
        </div>
        <button className="btn-secondary" onClick={goSignup}>회원가입</button>
      </section>
    </main>
  );
}
