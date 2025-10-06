// src/pages/MyAttendance.tsx
import React from "react";

type Row = { date: string; start: string; totalMinutes: number };

function fmtMinutes(mm: number) {
  const h = Math.floor(mm / 60);
  const m = mm % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 23:59 평가 규칙:
 *   - 현재시각 < 해당일 23:59:59  => "출석대기중"
 *   - 현재시각 >= 23:59:59        => total>=240분 "출석" / 아니면 "미출석"
 */
function statusAtCutoff(row: Row, now = new Date()): "출석" | "미출석" | "출석대기중" {
  const cutoff = new Date(`${row.date}T23:59:59`);
  if (isNaN(cutoff.getTime())) return "미출석"; // date 파싱 실패시 안전장치
  if (now < cutoff) return "출석대기중";
  return row.totalMinutes >= 240 ? "출석" : "미출석";
}

export default function Attendance() {
  // 예시 데이터(백엔드 연동 전): start=최초 방송 시작, totalMinutes=그날 누적 방송시간
  const rows = (JSON.parse(localStorage.getItem("attendance:me") || "null") as Row[]) || [
    { date: "2025-02-01", start: "09:03", totalMinutes: 255 }, // 4h15m
    { date: "2025-02-02", start: "09:54", totalMinutes: 120 }, // 2h
    { date: "2025-02-03", start: "-", totalMinutes: 0 },
  ];

  const now = new Date();

  return (
    <main className="wrap" style={{ maxWidth: 1000 }}>
      <header className="board-head">
        <h1>내 출석 현황</h1>
      </header>
      <div className="board">
        <table>
          <thead>
            <tr>
              <th>학습일</th>
              <th>시작 시간</th>
              <th>총 방송시간</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const status = statusAtCutoff(r, now);
              const badgeClass =
                status === "출석"
                  ? "badge ongoing"
                  : status === "출석대기중"
                  ? "badge upcoming"
                  : "badge ended"; // 미출석
              return (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td>{r.start}</td>
                  <td>{fmtMinutes(r.totalMinutes)}</td>
                  <td>
                    <span className={badgeClass}>{status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
