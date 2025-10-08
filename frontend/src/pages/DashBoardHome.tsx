import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import "../styles/DashBoardHome.css";

// JWT 토큰의 payload 타입
interface JwtPayload {
  sub: string; // email
  role: "ADMIN" | "STUDENT";
  iat: number;
  exp: number;
}

// 백엔드 DTO와 일치하는 타입
export interface Camp {
  id: number;
  name: string;
  description: string;
  homepageUrl: string;
  startDate: string;
  endDate: string;
  status: "PREPARING" | "ONGOING" | "FINISHED";
  inviteCode: string;
  creatorName: string;
}

type SortKey = "name" | "creatorName" | "startDate" | "status";
type SortDir = "asc" | "desc";

// JWT 토큰을 디코딩하는 간단한 함수
function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function DashboardHome() {
  const nav = useNavigate();

  const [role, setRole] = useState<"ADMIN" | "STUDENT">("STUDENT");
  const [nickname, setNickname] = useState("사용자");

  const [camps, setCamps] = useState<Camp[]>([]);
  const [myCamps, setMyCamps] = useState<Camp[]>([]); // TODO: 내 캠프 API 연동 필요

  const fetchCamps = () => {
    http<Camp[]>("/api/camps")
      .then((data) => {
        if (data) {
          setCamps(data);
          // TODO: "내 캠프" 목록은 별도 API(/api/me/camps)로 가져와야 함. 지금은 전체 목록으로 임시 처리.
          setMyCamps(data);
        }
      })
      .catch((err) => {
        console.error("캠프 목록 로딩 실패:", err);
        alert("캠프 목록을 불러오는 데 실패했습니다.");
      });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        setRole(payload.role);
        setNickname(payload.sub);
      }
    } else {
      nav("/login");
    }
    fetchCamps();
  }, [nav]);

  type Tab = "ONGOING" | "PREPARING" | "FINISHED";
  const [tab, setTab] = useState<Tab>("ONGOING");
  const [q, setQ] = useState("");
  const [inst, setInst] = useState("all");

  const institutions = useMemo(
    () => ["all", ...Array.from(new Set(camps.map((c) => c.creatorName)))],
    [camps]
  );

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const onSort = (key: SortKey) => {
    setSortKey(key);
    setSortDir((d) => (sortKey === key && d === "asc" ? "desc" : "asc"));
  };

  const filteredSorted = useMemo(() => {
    let arr = camps.filter((c) => c.status === tab);
    if (q.trim()) arr = arr.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
    if (inst !== "all") arr = arr.filter((c) => c.creatorName === inst);

    return [...arr].sort((a, b) => {
      const valA = a[sortKey] || "";
      const valB = b[sortKey] || "";
      const comp = String(valA).localeCompare(String(valB), "ko");
      return sortDir === "asc" ? comp : -comp;
    });
  }, [camps, tab, q, inst, sortKey, sortDir]);

  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = filteredSorted.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const createCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCamp = await http<Camp>("/api/camps", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          homepageUrl: form.homepage,
          startDate: form.start,
          endDate: form.end,
        }),
      });
      if (newCamp) {
        alert(`캠프가 생성되었습니다. 초대 코드: ${newCamp.inviteCode}`);
      }
      setShowCreate(false);
      fetchCamps();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`캠프 생성 실패: ${err.message}`);
      }
    }
  };

  const verifyJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCamp) return;

    try {
      await http(`/api/camps/${joinCamp.id}/join`, {
        method: "POST",
        body: JSON.stringify({ inviteCode: joinCode }),
      });
      setJoinMsg("✅ 인증되었습니다. 이동합니다...");
      fetchCamps();
      setTimeout(() => nav(`/camp/${joinCamp.id}`), 800);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setJoinMsg(`❌ ${err.message || "코드가 올바르지 않습니다."}`);
      }
    }
  };

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", start: "", end: "", homepage: "", description: "" });
  const onForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const [joinCamp, setJoinCamp] = useState<Camp | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);

  const onRowClick = (camp: Camp) => {
    if (role === "STUDENT" && camp.status === "PREPARING") {
      setJoinCamp(camp);
      setJoinCode("");
      setJoinMsg(null);
    } else {
      nav(`/camp/${camp.id}`);
    }
  };

  const sortIcon = (key: SortKey) => (sortKey !== key ? "↕" : sortDir === "asc" ? "↑" : "↓");

  return (
    <main className="dash">
      <div className="nav">
        <div className="brand" onClick={() => nav("/home")}>
          devCampHub
        </div>
        <div className="filters">
          <div className="chips">
            <button
              className={`chip ${tab === "ONGOING" ? "on" : ""}`}
              onClick={() => setTab("ONGOING")}
            >
              운영중
            </button>
            <button
              className={`chip ${tab === "PREPARING" ? "on" : ""}`}
              onClick={() => setTab("PREPARING")}
            >
              시작대기
            </button>
            <button
              className={`chip ${tab === "FINISHED" ? "on" : ""}`}
              onClick={() => setTab("FINISHED")}
            >
              종료
            </button>
          </div>
          <input
            className="ipt"
            placeholder="캠프 이름 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="ipt" value={inst} onChange={(e) => setInst(e.target.value)}>
            {institutions.map((i) => (
              <option key={i} value={i}>
                {i === "all" ? "전체" : i}
              </option>
            ))}
          </select>
        </div>
        <div className="user">
          <span className="nick">{nickname}</span>
          <span className={`role ${role}`}>{role}</span>
          <button className="gear" title="설정" onClick={() => nav("/settings")}>
            ⚙️
          </button>
        </div>
      </div>

      <section className="wrap">
        <header className="board-head">
          <h1>캠프 목록</h1>
          {role === "ADMIN" ? (
            <button className="gbtn" onClick={() => setShowCreate(true)}>
              <span className="gbtn-label">캠프 만들기</span>
            </button>
          ) : (
            <div className="hint">* 시작대기 캠프 행을 클릭하면 코드 입력 모달이 열립니다.</div>
          )}
        </header>

        <div className="board">
          <table>
            <thead>
              <tr>
                <th onClick={() => onSort("name")} className="th-sort">
                  캠프명 {sortIcon("name")}
                </th>
                <th onClick={() => onSort("creatorName")} className="th-sort">
                  운영 {sortIcon("creatorName")}
                </th>
                <th onClick={() => onSort("startDate")} className="th-sort">
                  시작일 {sortIcon("startDate")}
                </th>
                <th onClick={() => onSort("status")} className="th-sort">
                  상태 {sortIcon("status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => (
                <tr key={c.id} onClick={() => onRowClick(c)} className="row">
                  <td className="title">{c.name}</td>
                  <td>{c.creatorName}</td>
                  <td>{c.startDate}</td>
                  <td>
                    <span className={`badge ${c.status}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    조건에 맞는 캠프가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <label className="page-size">
            페이지 크기
            <select
              className="ipt"
              value={pageSize}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            이전
          </button>
          <span>
            {pageSafe} / {totalPages}
          </span>
          <button
            disabled={pageSafe >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            다음
          </button>
        </div>

        <section className="mine">
          <div className="mine-head">
            <h2>{role === "ADMIN" ? "내가 운영 중인 캠프" : "내가 참여 중인 캠프"}</h2>
          </div>
          {myCamps.length === 0 ? (
            <div className="empty">
              {role === "ADMIN" ? "운영 중인 캠프가 없습니다." : "참여 중인 캠프가 없습니다."}
            </div>
          ) : (
            <ul className="mine-grid">
              {myCamps.map((c) => (
                <li key={c.id} className="mine-card">
                  <div className="row1">
                    <div className="title" onClick={() => nav(`/camp/${c.id}`)}>
                      {c.name}
                    </div>
                  </div>
                  <div className="meta">운영: {c.creatorName}</div>
                  <div className="meta">
                    기간: {c.startDate} ~ {c.endDate}
                  </div>
                  <div className={`badge ${c.status}`}>{c.status}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      {showCreate && (
        <div className="modal-bg" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>캠프 만들기</h3>
            <form className="form" onSubmit={createCamp}>
              <label>캠프 제목</label>
              <input name="name" className="ipt" value={form.name} onChange={onForm} required />
              <label>기간</label>
              <div className="dates">
                <input
                  type="date"
                  name="start"
                  className="ipt"
                  value={form.start}
                  onChange={onForm}
                  required
                />
                <span>~</span>
                <input
                  type="date"
                  name="end"
                  className="ipt"
                  value={form.end}
                  onChange={onForm}
                  required
                />
              </div>
              <label>홈페이지</label>
              <input
                name="homepage"
                className="ipt"
                value={form.homepage}
                onChange={onForm}
                placeholder="https://..."
              />
              <label>설명</label>
              <textarea
                name="description"
                className="ipt ta"
                value={form.description}
                onChange={onForm}
              />
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowCreate(false)}>
                  취소
                </button>
                <button type="submit" className="gbtn">
                  <span className="gbtn-label">만들기</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {joinCamp && (
        <div className="modal-bg" onClick={() => setJoinCamp(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>캠프 참여하기</h3>
            <div className="modal-sub">
              선택된 캠프: <strong>{joinCamp.name}</strong>
            </div>
            <form className="form" onSubmit={verifyJoin}>
              <label>공유 받은 코드를 넣어주세요</label>
              <input
                className="ipt"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="예: FE-START99"
                required
              />
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setJoinCamp(null)}>
                  취소
                </button>
                <button type="submit" className="gbtn">
                  <span className="gbtn-label">확인</span>
                </button>
              </div>
              {joinMsg && <div className="join-msg">{joinMsg}</div>}
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
