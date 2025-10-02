import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DashboardHome.css";

type Role = "admin" | "student";
type Camp = {
  id: string;
  name: string;
  institution: string;
  phone?: string;
  homepage?: string;
  description?: string;
  members: number;
  period: string;
  status: "ongoing" | "upcoming" | "ended";
  code: string;
};

const seedCamps: Camp[] = [
  { id: "camp-net-2025", name: "네트워크 스터디 캠프", institution: "부스트캠프",
    phone: "02-000-0000", homepage: "https://example.org", description: "네트워크 기초와 실습 중심 과정",
    members: 20, period: "2025.01.01 ~ 2025.03.31", status: "ongoing", code: "NET-ABCD12" },
  { id: "camp-fe-2025", name: "프론트엔드 심화 캠프", institution: "부스트캠프",
    phone: "02-111-2222", homepage: "https://fe.example.org", description: "React, 상태관리, 배포까지",
    members: 28, period: "2025.04.01 ~ 2025.06.30", status: "upcoming", code: "FE-START99" },
  { id: "camp-algo-2024", name: "알고리즘 집중 캠프", institution: "CodeSchool",
    phone: "031-123-4567", homepage: "https://codeschool.test", description: "문제 해결력 강화 과정",
    members: 25, period: "2024.07.01 ~ 2024.09.30", status: "ended", code: "ALG-XXXXXX" },
];

export default function DashboardHome() {
  const nav = useNavigate();

  // 로그인 시 저장해둔 값 사용(더미)
  const role: Role = (localStorage.getItem("role") as Role) || "student";
  const nickname = localStorage.getItem("nickname") || "사용자";

  const [camps, setCamps] = useState<Camp[]>(() => {
    const saved = localStorage.getItem("camps:data");
    return saved ? (JSON.parse(saved) as Camp[]) : seedCamps;
  });

  // 상단 필터: 운영중/시작대기/종료
  type Tab = "ongoing" | "upcoming" | "ended";
  const [tab, setTab] = useState<Tab>("ongoing");

  // 검색/기관 필터(학생 UX만 필요하면 학생일 때만 노출되지만, 여기선 공통 적용)
  const [q, setQ] = useState("");
  const [inst, setInst] = useState("all");

  const institutions = useMemo(() => {
    const s = new Set(camps.map(c => c.institution));
    return ["all", ...Array.from(s)];
  }, [camps]);

  const filtered = useMemo(() => {
    let arr = camps.filter(c => c.status === tab);
    if (q.trim()) arr = arr.filter(c => c.name.toLowerCase().includes(q.trim().toLowerCase()));
    if (inst !== "all") arr = arr.filter(c => c.institution === inst);
    return arr;
  }, [camps, tab, q, inst]);

  const saveCamps = (next: Camp[]) => {
    setCamps(next);
    localStorage.setItem("camps:data", JSON.stringify(next));
  };

  // --- 관리자: 캠프 만들기 모달 ---
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", period: "", members: 20, institution: "",
    phone: "", homepage: "", description: ""
  });
  const onForm = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const {name, value} = e.target;
    setForm(s => ({...s, [name]: name==="members" ? Number(value) : value}));
  };
  const randomCode = () => Math.random().toString(36).slice(2,8).toUpperCase() + (Math.floor(Math.random()*90)+10);
  const createCamp = (e: React.FormEvent) => {
    e.preventDefault();
    const camp: Camp = {
      id: `camp-${Date.now()}`,
      name: form.name || "제목 없는 캠프",
      institution: form.institution || "기관 미정",
      phone: form.phone, homepage: form.homepage, description: form.description,
      members: form.members || 1, period: form.period || "기간 미정",
      status: "upcoming",
      code: randomCode()
    };
    const next = [camp, ...camps];
    saveCamps(next);
    setShowCreate(false);
    setTab("upcoming");
    alert(`캠프가 생성되었습니다.\n코드: ${camp.code}\n(시작 전까지 유효)`);
  };

  // --- 학생: 코드 입력 모달 ---
  const [joinCamp, setJoinCamp] = useState<Camp | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);
  const verifyJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCamp) return;
    if (joinCamp.status !== "upcoming") {
      setJoinMsg("시작 대기 중인 캠프만 참여할 수 있습니다.");
      return;
    }
    if (joinCode.trim() === joinCamp.code) {
      setJoinMsg("✅ 인증되었습니다. 이동합니다...");
      setTimeout(()=> nav(`/camp/${joinCamp.id}`), 800);
    } else {
      setJoinMsg("❌ 코드가 올바르지 않습니다.");
    }
  };

  // 행 클릭 동작
  const onRowClick = (camp: Camp) => {
    if (role === "student" && camp.status === "upcoming") {
      setJoinCamp(camp);
      setJoinCode("");
      setJoinMsg(null);
      return;
    }
    nav(`/camp/${camp.id}`);
  };

  return (
    <main className="dash">
      {/* 상단 네비게이션 바 */}
      <div className="nav">
        <div className="brand" onClick={()=>nav("/home")}>devCampHub</div>

        <div className="filters">
          <div className="chips">
            <button className={`chip ${tab==="ongoing"?"on":""}`} onClick={()=>setTab("ongoing")}>운영중</button>
            <button className={`chip ${tab==="upcoming"?"on":""}`} onClick={()=>setTab("upcoming")}>시작대기</button>
            <button className={`chip ${tab==="ended"?"on":""}`} onClick={()=>setTab("ended")}>종료</button>
          </div>
          <input className="ipt" placeholder="캠프 이름 검색" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="ipt" value={inst} onChange={e=>setInst(e.target.value)}>
            {institutions.map(i => <option key={i} value={i}>{i==="all"?"전체 기관":i}</option>)}
          </select>
        </div>

        <div className="user">
          <span className="nick">{nickname}</span>
          <span className={`role ${role}`}>{role==="admin"?"관리자":"학생"}</span>
          <button className="gear" title="설정" onClick={()=>nav("/settings")}>⚙️</button>
        </div>
      </div>

      {/* 게시판(테이블) */}
      <section className="wrap">
        <header className="board-head">
          <h1>캠프 목록</h1>
          {role==="admin" ? (
            <button className="gbtn" onClick={()=>setShowCreate(true)}><span className="gbtn-label">캠프 만들기</span></button>
          ) : (
            <div className="hint">* 시작대기 캠프 행을 클릭하면 코드 입력 모달이 열립니다.</div>
          )}
        </header>

        <div className="board">
          <table>
            <thead>
              <tr>
                <th style={{width:"34%"}}>캠프명</th>
                <th>교육기관</th>
                <th>기간</th>
                <th>인원</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={()=>onRowClick(c)} className="row">
                  <td className="title">{c.name}</td>
                  <td>{c.institution}</td>
                  <td>{c.period}</td>
                  <td>{c.members}명</td>
                  <td>
                    <span className={`badge ${c.status}`}>
                      {c.status==="ongoing"?"운영중":c.status==="upcoming"?"시작대기":"종료"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><td colSpan={5} className="empty">조건에 맞는 캠프가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 관리자: 캠프 만들기 모달 */}
      {showCreate && (
        <div className="modal-bg" onClick={()=>setShowCreate(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>캠프 만들기</h3>
            <form className="form" onSubmit={createCamp}>
              <label>캠프 제목 (기간 동안 수정 가능, 종료 후 수정 불가)</label>
              <input name="name" className="ipt" value={form.name} onChange={onForm} required />
              <label>기간</label>
              <input name="period" className="ipt" value={form.period} onChange={onForm} placeholder="YYYY.MM.DD ~ YYYY.MM.DD" required />
              <label>총 인원</label>
              <input name="members" type="number" min={1} className="ipt" value={form.members} onChange={onForm} />
              <label>교육기관</label>
              <input name="institution" className="ipt" value={form.institution} onChange={onForm} />
              <label>전화번호</label>
              <input name="phone" className="ipt" value={form.phone} onChange={onForm} placeholder="02-000-0000" />
              <label>교육기관 홈페이지</label>
              <input name="homepage" className="ipt" value={form.homepage} onChange={onForm} placeholder="https://..." />
              <label>교육과정 설명</label>
              <textarea name="description" className="ipt ta" value={form.description} onChange={onForm} />
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={()=>setShowCreate(false)}>취소</button>
                <button type="submit" className="gbtn"><span className="gbtn-label">만들기</span></button>
              </div>
              <div className="modal-hint">* 생성 즉시 코드가 발급되며 시작 전까지 유효합니다.</div>
            </form>
          </div>
        </div>
      )}

      {/* 학생: 참여 코드 모달 */}
      {joinCamp && (
        <div className="modal-bg" onClick={()=>setJoinCamp(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>캠프 참여하기</h3>
            <div className="modal-sub">선택된 캠프: <strong>{joinCamp.name}</strong></div>
            <form className="form" onSubmit={verifyJoin}>
              <label>공유 받은 코드를 넣어주세요</label>
              <input className="ipt" value={joinCode} onChange={e=>setJoinCode(e.target.value)} placeholder="예: FE-START99" />
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={()=>setJoinCamp(null)}>취소</button>
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
