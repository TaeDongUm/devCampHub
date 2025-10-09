import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import "../styles/DashBoardHome.css";

// JWT 토큰의 payload 타입
interface JwtPayload {
  sub: string; // email
  role: "ADMIN" | "STUDENT";
  nickname: string;
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
  status: "UPCOMING" | "ONGOING" | "FINISHED";
  inviteCode: string;
  creatorName: string;
  institutionName: string;
  capacity: number;
  currentMembers: number;
}

interface CampUpdateForm {
  name: string;
  description: string;
  institutionName: string;
  capacity: number;
}

type SortKey = "name" | "institutionName" | "startDate" | "status";
type SortDir = "asc" | "desc";

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
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
  const [myCamps, setMyCamps] = useState<Camp[]>([]);

  const fetchAllCamps = useCallback(() => {
    http<Camp[]>("/api/camps")
      .then((data) => data && setCamps(data))
      .catch((err) => console.error("전체 캠프 목록 로딩 실패:", err));
  }, []);

  const fetchMyCamps = useCallback(() => {
    http<Camp[]>("/api/camps/me")
      .then((data) => {
        if (data) {
          setMyCamps(data);
          console.log("My Camps data from API:", data);
        }
      })
      .catch((err) => console.error("내 캠프 목록 로딩 실패:", err));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        setRole(payload.role);
        setNickname(payload.nickname);
      } else {
        nav("/login");
      }
    } else {
      nav("/login");
    }
    fetchAllCamps();
    fetchMyCamps();
  }, [nav, fetchAllCamps, fetchMyCamps]);

  type Tab = "ONGOING" | "UPCOMING" | "FINISHED";
  const [tab, setTab] = useState<Tab>("ONGOING");
  const [q, setQ] = useState("");
  const [inst, setInst] = useState("all");

  const institutions = useMemo(() => ["all", ...Array.from(new Set(camps.map((c) => c.institutionName)))], [camps]);

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const onSort = (key: SortKey) => {
    setSortKey(key);
    setSortDir((d) => (sortKey === key && d === "asc" ? "desc" : "asc"));
  };

  const filteredSorted = useMemo(() => {
    let arr = camps.filter((c) => c.status === tab);
    if (q.trim()) arr = arr.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
    if (inst !== "all") arr = arr.filter((c) => c.institutionName === inst);
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

  // --- Create Camp --- //
  const [showCreate, setShowCreate] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ name: "", start: today, end: today, homepage: "", description: "", capacity: "1", institutionName: "" });
  const onForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const createCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCamp = await http<Camp>("/api/camps", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          homepageUrl: form.homepage,
          institutionName: form.institutionName,
          startDate: form.start,
          endDate: form.end,
          capacity: Number(form.capacity)
        }),
      });
      if (newCamp) alert(`캠프가 생성되었습니다. 초대 코드: ${newCamp.inviteCode}`);
      setShowCreate(false);
      fetchAllCamps();
      fetchMyCamps();
    } catch (err) {
      alert(`캠프 생성 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
    }
  };

  // --- Edit Camp --- //
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Camp | null>(null);
  const [editForm, setEditForm] = useState<CampUpdateForm>({ name: "", description: "", institutionName: "", capacity: 1 });
  const onEditForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditForm(s => ({ ...s, [e.target.name]: e.target.value }));

  const openEditModal = (camp: Camp) => {
    setEditingCamp(camp);
    setEditForm({ name: camp.name, description: camp.description, institutionName: camp.institutionName, capacity: camp.capacity });
    setShowEditModal(true);
  };

  const handleUpdateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCamp) return;
    try {
      await http(`/api/camps/${editingCamp.id}`, { method: "PATCH", body: JSON.stringify({ ...editForm, capacity: Number(editForm.capacity) }) });
      alert("캠프 정보가 수정되었습니다.");
      setShowEditModal(false);
      fetchAllCamps();
      fetchMyCamps();
    } catch (err) {
      alert(`수정 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
    }
  };

  const handleRegenerateCode = async () => {
    if (!editingCamp) return;
    if (!window.confirm("정말로 초대 코드를 새로 만드시겠습니까? 이전 코드는 더 이상 사용할 수 없게 됩니다.")) {
      return;
    }
    try {
      const updatedCamp = await http<Camp>(`/api/camps/${editingCamp.id}/regenerate-code`, { method: "PATCH" });
      if (updatedCamp) {
        setEditingCamp(updatedCamp);
        fetchMyCamps();
        alert(`새로운 초대 코드가 생성되었습니다: ${updatedCamp.inviteCode}`);
      }
    } catch (err) {
      alert(`코드 재생성 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
    }
  };

  // --- Join Camp --- //
  const [joinCamp, setJoinCamp] = useState<Camp | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);

  const verifyJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCamp) return;
    try {
      await http(`/api/camps/${joinCamp.id}/join`, { method: "POST", body: JSON.stringify({ inviteCode: joinCode }) });
      setJoinMsg("✅ 인증되었습니다. 이동합니다...");
      setTimeout(() => nav(`/camp/${joinCamp.id}`), 800);
    } catch (err) {
      setJoinMsg(`❌ ${err instanceof Error ? err.message : "코드가 올바르지 않습니다."}`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    nav("/login");
  };

  const onRowClick = (camp: Camp) => {
    if (role === "STUDENT" && camp.status === "UPCOMING") {
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
        <div className="brand" onClick={() => nav("/home")}>devCampHub</div>
        <div className="filters">
          <div className="chips">
            <button className={`chip ${tab === "ONGOING" ? "on" : ""}`} onClick={() => setTab("ONGOING")}>운영중</button>
            <button className={`chip ${tab === "UPCOMING" ? "on" : ""}`} onClick={() => setTab("UPCOMING")}>시작대기</button>
            <button className={`chip ${tab === "FINISHED" ? "on" : ""}`} onClick={() => setTab("FINISHED")}>종료</button>
          </div>
          <input className="ipt" placeholder="캠프 이름 검색" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="ipt" value={inst} onChange={(e) => setInst(e.target.value)}>
            {institutions.map((i) => <option key={i} value={i}>{i === "all" ? "전체" : i}</option>)}
          </select>
        </div>
        <div className="user">
          <span className="nick">{nickname}</span>
          <span className={`role ${role}`}>{role}</span>
          <button className="gear" title="설정" onClick={() => nav("/settings")}>⚙️</button>
          <button className="gbtn" onClick={handleLogout}><span className="gbtn-label">로그아웃</span></button>
        </div>
      </div>

      <section className="wrap">
        <header className="board-head">
          <h1>캠프 목록</h1>
          {role === "ADMIN" ? (
            <button className="gbtn" onClick={() => setShowCreate(true)}><span className="gbtn-label">캠프 만들기</span></button>
          ) : (
            <div className="hint">* 시작대기 캠프 행을 클릭하면 코드 입력 모달이 열립니다.</div>
          )}
        </header>

        <div className="board">
          <table>
            <thead>
              <tr>
                <th onClick={() => onSort("name")} className="th-sort">캠프명 {sortIcon("name")}</th>
                <th onClick={() => onSort("institutionName")} className="th-sort">교육 기관 {sortIcon("institutionName")}</th>
                <th>인원</th>
                <th onClick={() => onSort("startDate")} className="th-sort">시작일 {sortIcon("startDate")}</th>
                <th onClick={() => onSort("status")} className="th-sort">상태 {sortIcon("status")}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => (
                <tr key={c.id} onClick={() => onRowClick(c)} className="row">
                  <td className="title">{c.name}</td>
                  <td>{c.institutionName}</td>
                  <td>{c.currentMembers} / {c.capacity}</td>
                  <td>{c.startDate}</td>
                  <td><span className={`badge ${c.status}`}>{c.status}</span></td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={5} className="empty">조건에 맞는 캠프가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <label className="page-size">페이지 크기
            <select className="ipt" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
              {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</button>
          <span>{pageSafe} / {totalPages}</span>
          <button disabled={pageSafe >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>다음</button>
        </div>

        <section className="mine">
          <div className="mine-head"><h2>{role === "ADMIN" ? "내가 운영 중인 캠프" : "내가 참여 중인 캠프"}</h2></div>
          {myCamps.length === 0 ? (
            <div className="empty">{role === "ADMIN" ? "운영 중인 캠프가 없습니다." : "참여 중인 캠프가 없습니다."}</div>
          ) : (
            <div className="board">
              <table>
                <thead>
                  <tr>
                    <th>캠프명</th>
                    <th>상태</th>
                    <th>인원</th>
                    <th>기간</th>
                    {role === "ADMIN" && <th>교육 기관</th>}
                    {role === "ADMIN" && <th>관리</th>}
                  </tr>
                </thead>
                <tbody>
                  {myCamps.map((c) => (
                    <tr key={c.id} className="row">
                      <td className="title" onClick={() => nav(`/camp/${c.id}`)}>{c.name}</td>
                      <td><span className={`badge ${c.status}`}>{c.status}</span></td>
                      <td>{c.currentMembers} / {c.capacity}</td>
                      <td>{c.startDate} ~ {c.endDate}</td>
                      {role === "ADMIN" && <td>{c.institutionName}</td>}
                      {role === "ADMIN" && (
                        <td>
                          {c.status === "UPCOMING" && (
                            <button className="icon-btn" title="캠프 정보 수정" onClick={(e) => { e.stopPropagation(); openEditModal(c); }}>⚙️</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <label>교육 기관</label>
              <input name="institutionName" className="ipt" value={form.institutionName} onChange={onForm} required />
              <label>기간</label>
              <div className="dates">
                <input type="date" name="start" className="ipt" value={form.start} onChange={onForm} required />
                <span>~</span>
                <input type="date" name="end" className="ipt" value={form.end} onChange={onForm} required />
              </div>
              <label>홈페이지</label>
              <input name="homepage" className="ipt" value={form.homepage} onChange={onForm} placeholder="https://..." />
              <label>인원수</label>
              <input type="number" name="capacity" className="ipt" value={form.capacity} onChange={onForm} required min="1" />
              <label>설명</label>
              <textarea name="description" className="ipt ta" value={form.description} onChange={onForm} />
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowCreate(false)}>취소</button>
                <button type="submit" className="gbtn"><span className="gbtn-label">만들기</span></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingCamp && (
        <div className="modal-bg" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>캠프 정보 수정</h3>
            <form className="form" onSubmit={handleUpdateCamp}>
              <label>초대 코드</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input className="ipt" style={{ flexGrow: 1 }} value={editingCamp.inviteCode} readOnly />
                <button type="button" className="btn sm" onClick={handleRegenerateCode}>코드 재생성</button>
              </div>
              <hr style={{ margin: '20px 0' }} />
              <label>캠프 제목</label>
              <input name="name" className="ipt" value={editForm.name} onChange={onEditForm} required />
              <label>교육 기관</label>
              <input name="institutionName" className="ipt" value={editForm.institutionName} onChange={onEditForm} required />
              <label>인원수</label>
              <input type="number" name="capacity" className="ipt" value={editForm.capacity} onChange={(e) => setEditForm(s => ({...s, capacity: Number(e.target.value)}))} required min="1" />
              <label>설명</label>
              <textarea name="description" className="ipt ta" value={editForm.description} onChange={onEditForm} />
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowEditModal(false)}>취소</button>
                <button type="submit" className="btn">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {joinCamp && (
        <div className="modal-bg" onClick={() => setJoinCamp(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>캠프 참여하기</h3>
            <div className="modal-sub">선택된 캠프: <strong>{joinCamp.name}</strong></div>
            <form className="form" onSubmit={verifyJoin}>
              <label>공유 받은 코드를 넣어주세요</label>
              <input className="ipt" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="예: FE-START99" required />
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setJoinCamp(null)}>취소</button>
                <button type="submit" className="gbtn"><span className="gbtn-label">확인</span></button>
              </div>
              {joinMsg && <div className="join-msg">{joinMsg}</div>}
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
