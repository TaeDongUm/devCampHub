import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { http } from "../api/http";

// 백엔드 DTO와 타입 일치
interface AttendanceResponse {
    date: string;
    totalMinutes: number;
    status: 'ATTENDANCE' | 'TARDY' | 'ABSENT';
}

function fmtMinutes(mm: number) {
  const h = Math.floor(mm / 60);
  const m = mm % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function Attendance() {
  const { campId } = useParams<{ campId: string }>();
  const [attendances, setAttendances] = useState<AttendanceResponse[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!campId) return;

    http<AttendanceResponse[]>(`/api/me/camps/${campId}/attendance`)
      .then(data => {
        if (data) setAttendances(data);
      })
      .catch(() => setError("출석 정보를 불러오는 데 실패했습니다."));

  }, [campId]);

  return (
    <main className="wrap" style={{ maxWidth: 1000 }}>
      <header className="board-head"><h1>내 출석 현황</h1></header>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="board">
        <table>
          <thead>
            <tr>
              <th>학습일</th>
              <th>총 학습 시간</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {attendances.map((r, i) => {
              const badgeClass =
                r.status === "ATTENDANCE"
                  ? "badge ongoing"
                  : r.status === "TARDY"
                  ? "badge upcoming"
                  : "badge ended";
              return (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td>{fmtMinutes(r.totalMinutes)}</td>
                  <td><span className={badgeClass}>{r.status}</span></td>
                </tr>
              );
            })}
            {attendances.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>출석 기록이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
