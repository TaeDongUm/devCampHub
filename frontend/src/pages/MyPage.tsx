import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import "../styles/CampDetail.css";

// 백엔드 DTO와 타입 일치
interface MyProfileResponse {
  id: number;
  email: string;
  nickname: string;
  role: "ADMIN" | "STUDENT";
  avatarUrl: string;
  track: string;
  githubUrl: string;
  blogUrl: string;
}

type AttendanceStatus = "출석" | "지각" | "결석";
type AttendanceRow = {
  date: string; // YYYY-MM-DD
  start?: string; // HH:mm
  total?: string; // HH:mm (총 방송시간)
  status: AttendanceStatus;
};

export default function MyPage() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [openDetail, setOpenDetail] = useState<boolean>(false);

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

  useEffect(() => {
    http<MyProfileResponse>("/api/me")
      .then((data) => {
        if (data) setProfile(data);
      })
      .catch((err) => console.error("프로필 로딩 실패:", err));
  }, []);

  if (!profile) {
    return <div>프로필 정보를 불러오는 중입니다...</div>;
  }

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
            <div style={{ fontSize: 42 }}>{profile.avatarUrl || "👩‍💻"}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ margin: 0 }}>{profile.nickname}</h2>
                <span className="chip on">{profile.track || "미설정"}</span>
                <span className="chip" title="역할(변경 불가)">
                  {profile.role}
                </span>
              </div>
              <div style={{ marginTop: 6, lineHeight: 1.8 }}>
                <div>email: {profile.email}</div>
                <div>Github: {profile.githubUrl || "미설정"}</div>
                <div>Blog: {profile.blogUrl || "미설정"}</div>
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
