import "../styles/SignupChoice.css";

export default function SignupChoice() {
  return (
    <main className="choice">
      <section className="choice-card">
        <h1 className="choice-title">회원가입</h1>
        <p className="choice-sub">역할을 선택하세요</p>
        <div className="choice-actions">
          <button className="btn-primary" onClick={() => (window.location.href = "/signup/admin")}>
            관리자 회원가입
          </button>
          <button className="btn-outline" onClick={() => (window.location.href = "/signup/student")}>
            학생 회원가입
          </button>
        </div>
        <div className="choice-footer">
          이미 계정이 있으신가요? <a href="/login">로그인</a>
        </div>
      </section>
    </main>
  );
}
