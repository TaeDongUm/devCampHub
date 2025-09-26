import React, { useState } from "react";
import "../styles/Signup.css";

export default function Signup() {
  const [role, setRole] = useState<"admin" | "student" | null>(null);

  return (
    <main className="signup">
      <section className="signup-card">
        <h1 className="signup-title">회원가입</h1>

        {!role && (
          <div className="signup-choices">
            <button className="btn-primary" onClick={() => setRole("admin")}>관리자 회원가입</button>
            <button className="btn-outline" onClick={() => setRole("student")}>학생 회원가입</button>
          </div>
        )}

        {role === "admin" && (
          <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="관리자 이메일" className="signup-input" />
            <button type="submit" className="btn-primary">인증 메일 보내기</button>
          </form>
        )}

        {role === "student" && (
          <div className="signup-form">
            <button className="btn-primary">GitHub 계정으로 회원가입</button>
            <input type="email" placeholder="이메일" className="signup-input" />
            <input type="password" placeholder="비밀번호" className="signup-input" />
            <button className="btn-primary">이메일로 회원가입</button>
          </div>
        )}

        <div className="signup-footer">
          이미 계정이 있으신가요? <a href="/login">로그인</a>
        </div>
      </section>
    </main>
  );
}
