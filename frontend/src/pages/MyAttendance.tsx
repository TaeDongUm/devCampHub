import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

type Row = { date: string; start: string; end: string; status: "출석" | "결석" };

export default function MyAttendance() {
  const { campId } = useParams();
  const key = `att:${campId}`;
  const [rows, setRows] = useState<Row[]>(() => JSON.parse(localStorage.getItem(key) || "[]"));

  // 데모용: 오늘 체크 토글
  const today = useMemo(() => new Date().toISOString().slice(0, 10).replaceAll("-", "."), []);
  const toggleToday = () => {
    const exists = rows.find((r) => r.date === today);
    let next: Row[];
    if (exists) {
      next = rows.map((r) =>
        r.date === today ? { ...r, status: r.status === "출석" ? "결석" : "출석" } : r
      );
    } else {
      next = [{ date: today, start: "09:00:00", end: "19:00:00", status: "출석" }, ...rows];
    }
    setRows(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  return (
    <section className="att">
      <div className="att-head">
        <h3>내 출석 현황</h3>
        <button className="btn sm" onClick={toggleToday}>
          오늘 출석 토글
        </button>
      </div>
      <table className="att-table">
        <thead>
          <tr>
            <th>학습일</th>
            <th>시작 시간</th>
            <th>종료 시간</th>
            <th>출석 여부</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.date}</td>
              <td>{r.start}</td>
              <td>{r.end}</td>
              <td>{r.status}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="empty">
                기록이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
