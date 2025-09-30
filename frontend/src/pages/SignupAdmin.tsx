import React, { useState } from "react";
import "../styles/SignupAdmin.css";

export default function SignupAdmin() {
  const [form, setForm] = useState({
    name: "", nickname: "", gender: "", username: "",
    email: "", password: ""
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // ⬇️ 이메일 인증 타이머 시작 기록 (3분)
    const startedAt = Date.now();
    localStorage.setItem("verify:role", "admin");
    localStorage.setItem("verify:email", form.email);
    localStorage.setItem("verify:startedAt", String(startedAt));
    localStorage.setItem("verify:ttlMs", String(3 * 60 * 1000)); // 3분
    window.location.href = "/verify";
  };

  return (
    <main className="sadmin">
      <section className="sadmin-card">
        <h1 className="sadmin-title">관리자 회원가입</h1>
        <form className="sadmin-form" onSubmit={submit}>
          <input name="name" placeholder="이름" className="sadmin-input" onChange={onChange} required />
          <input name="nickname" placeholder="별명" className="sadmin-input" onChange={onChange} />
          <select name="gender" className="sadmin-input" onChange={onChange} defaultValue="">
            <option value="" disabled>성별</option>
            <option value="male">남</option>
            <option value="female">여</option>
          </select>
          <input name="username" placeholder="아이디" className="sadmin-input" onChange={onChange} required />
          <input type="email" name="email" placeholder="이메일(인증용)" className="sadmin-input" onChange={onChange} required />
          <input type="password" name="password" placeholder="비밀번호" className="sadmin-input" onChange={onChange} required />
          <button className="btn-primary" type="submit">가입 후 인증번호 입력으로 이동</button>
        </form>
        <div className="sadmin-footer">이미 계정이 있나요? <a href="/login">로그인</a></div>
      </section>
    </main>
  );
}
