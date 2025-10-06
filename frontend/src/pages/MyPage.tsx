import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CampDetail.css"; // 버튼/칩 공용 스타일 재사용

type AttendanceStatus = "출석" | "지각" | "결석";
type AttendanceRow = {
  date: string; // YYYY-MM-DD
  start?: string; // HH:mm
  total?: string; // HH:mm (총 방송시간)
  status: AttendanceStatus;
};

export default function MyPage() {
  const nav = useNavigate();

  // 프로필
  const nickname = localStorage.getItem("nickname") || "익명";
  const avatar = localStorage.getItem("avatar") || "👩‍💻";
  const email = localStorage.getItem("email") || "—";
  const github = localStorage.getItem("profile:github") || "—";
  const blog = localStorage.getItem("profile:blog") || "—";
  const track = (localStorage.getItem("profile:track") || "WEB").toUpperCase();
  const rawRole = (localStorage.getItem("role") || "STUDENT").toUpperCase();
  const role: "ADMIN" | "STUDENT" = rawRole === "ADMIN" ? "ADMIN" : "STUDENT";

  // 출석 (임시: 로컬 저장된 값 또는 더미)
  const rows: AttendanceRow[] = useMemo(() => {
    const saved = localStorage.getItem("attendance:me");
    if (saved) {
      try {
        return JSON.parse(saved) as AttendanceRow[];
      } catch {
        /* empty */
      }
    }
    // 기본 예시 데이터
    return [
      { date: "2025-02-01", start: "09:03", total: "04:15", status: "출석" },
      { date: "2025-02-02", start: "09:54", total: "02:00", status: "지각" },
      { date: "2025-02-03", start: undefined, total: "00:00", status: "결석" },
    ];
  }, []);

  const [openDetail, setOpenDetail] = useState<boolean>(false);

  return (
    <main className="wrap" style={{ maxWidth: 1000 }}>
      <header className="board-head" style={{ alignItems: "center" }}>
        <h1>마이페이지</h1>
        <button className="btn" onClick={() => nav("/settings")}>
          설정 가기 ✏️
        </button>
      </header>

      {/* 프로필 카드 */}
      <section className="mine" style={{ display: "grid", gap: 8, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ fontSize: 42 }}>{avatar}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ margin: 0 }}>{nickname}</h2>
                {/* 학습 구분 + 역할 뱃지 (요청) */}
                <span className="chip on">{track}</span>
                <span className="chip" title="역할(변경 불가)">
                  {role === "ADMIN" ? "ADMIN" : "STUDENT"}
                </span>
              </div>
              <div style={{ marginTop: 6, lineHeight: 1.8 }}>
                <div>이름: {localStorage.getItem("name") || "—"}</div>
                <div>email: {email}</div>
                <div>Github: {github}</div>
                <div>Blog: {blog}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 출석 현황 */}
      <section className="mine" style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h2 style={{ margin: 0 }}>출석 현황</h2>

          {/* “자세히 보기”를 테이블 펼침/접힘 토글*/}
          <button className="btn ghost" onClick={() => setOpenDetail((v) => !v)}>
            {openDetail ? "접기" : "자세히 보기"}
          </button>
        </div>
        {openDetail && <AttendanceTable rows={rows} />}
      </section>
    </main>
  );
}

function AttendanceTable({ rows }: { rows: AttendanceRow[] }) {
  return (
    <div className="mine" style={{ padding: 0 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "rgba(255,255,255,0.04)" }}>
            <th style={th}>학습일</th>
            <th style={th}>시작 시간</th>
            <th style={th}>총 방송시간</th>
            <th style={th}>상태</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.date} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <td style={td}>{r.date}</td>
              <td style={td}>{r.start ?? "-"}</td>
              <td style={td}>{r.total ?? "00:00"}</td>
              <td style={td}>
                <StatusPill status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }: { status: AttendanceStatus }) {
  const styles: Record<AttendanceStatus, React.CSSProperties> = {
    출석: { background: "#000", color: "#fff" },
    지각: { background: "rgba(118,106,255,0.25)", color: "#fff" },
    결석: { background: "rgba(255,255,255,0.18)", color: "#fff" },
  };
  return (
    <span
      className="chip"
      style={{ ...styles[status], border: "1px solid rgba(255,255,255,0.14)" }}
    >
      {status}
    </span>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "12px 14px", fontWeight: 700 };
const td: React.CSSProperties = { padding: "12px 14px" };
