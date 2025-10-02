import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/CampDetail.css";

type Notice = { id: string; text: string; when: string };
type Qa = { id: string; question: string; answer?: string };
type Mission = { id: string; title: string; desc: string };
type ChatMsg = { id: string; who: string; text: string };

const initialNotices: Notice[] = [
  { id: "n1", text: "오전 10시 코어타임 시작합니다.", when: "오늘 09:55" },
  { id: "n2", text: "내일은 네트워크 실습 진행", when: "어제 18:10" },
];

const initialQa: Qa[] = [
  { id: "q1", question: "과제 제출 마감은 언제인가요?", answer: "이번 주 금요일 18:00 입니다." },
  { id: "q2", question: "녹화 업로드가 조금 늦어요.", answer: "인코딩 후 자동 업로드됩니다." },
];

const initialMissions: Mission[] = [
  { id: "m1", title: "DNS 정리", desc: "DNS 동작 방식 개념 정리해서 공유" },
  { id: "m2", title: "HTTP 실습", desc: "캡쳐 도구로 요청/응답 분석" },
];

const initialChat: ChatMsg[] = [
  { id: "c1", who: "운영", text: "안녕하세요. 오늘은 라운드 #3 시작합니다." },
  { id: "c2", who: "민수", text: "넵! 잘 들립니다." },
];

export default function CampDetail() {
  const { id } = useParams(); // /camp/:id
  const [sideTab, setSideTab] = useState<"공지사항" | "Q&A" | "미션 공유" | "자유 채팅">("공지사항");
  const [topTab, setTopTab] = useState<"출석" | "녹화" | "아카이브">("출석");

  // 더미 상태
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [qa, setQa] = useState<Qa[]>(initialQa);
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const [chat, setChat] = useState<ChatMsg[]>(initialChat);

  // 입력 상태
  const [noticeText, setNoticeText] = useState("");
  const [qText, setQText] = useState("");
  const [aText, setAText] = useState("");
  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [chatText, setChatText] = useState("");

  const campName = useMemo(() => {
    if (!id) return "캠프";
    if (id.includes("net")) return "네트워크 스터디 캠프";
    if (id.includes("fe")) return "프론트엔드 심화 캠프";
    return "캠프";
  }, [id]);

  // 간단한 핸들러 (더미)
  const addNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeText.trim()) return;
    setNotices((prev) => [{ id: String(Date.now()), text: noticeText.trim(), when: "방금" }, ...prev]);
    setNoticeText("");
  };

  const addQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;
    setQa((prev) => [{ id: String(Date.now()), question: qText.trim() }, ...prev]);
    setQText("");
  };

  const answerQuestion = (qid: string) => {
    if (!aText.trim()) return;
    setQa((prev) => prev.map((q) => (q.id === qid ? { ...q, answer: aText.trim() } : q)));
    setAText("");
  };

  const addMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) return;
    setMissions((prev) => [{ id: String(Date.now()), title: mTitle.trim(), desc: mDesc.trim() }, ...prev]);
    setMTitle(""); setMDesc("");
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    setChat((prev) => [...prev, { id: String(Date.now()), who: "나", text: chatText.trim() }]);
    setChatText("");
  };

  return (
    <div className="camp">
      {/* 좌측 사이드바 */}
      <aside className="camp-side">
        <div className="side-head">캠프 메뉴</div>
        <ul className="side-list">
          {(["공지사항", "Q&A", "미션 공유", "자유 채팅"] as const).map((t) => (
            <li key={t} className={sideTab === t ? "on" : ""} onClick={() => setSideTab(t)}>
              {t}
            </li>
          ))}
        </ul>
      </aside>

      {/* 메인 */}
      <main className="camp-main">
        {/* 상단 헤더 + 가로 탭 */}
        <header className="camp-hero">
          <div className="camp-title">{campName}</div>
          <div className="camp-sub">출석 · 방송/채팅 · 녹화/아카이브</div>
          <div className="top-tabs">
            {(["출석", "녹화", "아카이브"] as const).map((t) => (
              <button key={t} className={topTab === t ? "on" : ""} onClick={() => setTopTab(t)}>
                {t}
              </button>
            ))}
          </div>
        </header>

        {/* 좌측 세로탭 콘텐츠 */}
        <section className="panel">
          <div className="panel-title">{sideTab}</div>

          {sideTab === "공지사항" && (
            <>
              <form className="row" onSubmit={addNotice}>
                <input className="input" placeholder="공지 작성..." value={noticeText} onChange={(e) => setNoticeText(e.target.value)} />
                <button className="btn">등록</button>
              </form>
              <ul className="notice-list">
                {notices.map((n) => (
                  <li key={n.id}>
                    <div className="n-text">{n.text}</div>
                    <div className="n-when">{n.when}</div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {sideTab === "Q&A" && (
            <>
              <form className="row" onSubmit={addQuestion}>
                <input className="input" placeholder="질문 남기기..." value={qText} onChange={(e) => setQText(e.target.value)} />
                <button className="btn">질문</button>
              </form>
              <ul className="qa-list">
                {qa.map((q) => (
                  <li key={q.id} className="qa-item">
                    <div className="q">Q. {q.question}</div>
                    <div className="a">{q.answer ? `A. ${q.answer}` : <em>답변 대기</em>}</div>
                    <div className="answer-row">
                      <input className="input" placeholder="운영진 답변..." value={aText} onChange={(e) => setAText(e.target.value)} />
                      <button className="btn ghost" onClick={() => answerQuestion(q.id)} type="button">답변 등록</button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {sideTab === "미션 공유" && (
            <>
              <form className="col" onSubmit={addMission}>
                <input className="input" placeholder="미션 제목" value={mTitle} onChange={(e) => setMTitle(e.target.value)} />
                <textarea className="textarea" placeholder="내용/링크 등" value={mDesc} onChange={(e) => setMDesc(e.target.value)} />
                <button className="btn">공유</button>
              </form>
              <ul className="mission-list">
                {missions.map((m) => (
                  <li key={m.id} className="mission-item">
                    <div className="m-title">{m.title}</div>
                    <div className="m-desc">{m.desc || "설명 없음"}</div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {sideTab === "자유 채팅" && (
            <div className="chat">
              <div className="chat-log">
                {chat.map((c) => (
                  <div key={c.id} className={`chat-item ${c.who === "나" ? "me" : ""}`}>
                    <span className="who">{c.who}</span>
                    <span className="text">{c.text}</span>
                  </div>
                ))}
              </div>
              <form className="row" onSubmit={sendChat}>
                <input className="input" placeholder="메시지 입력..." value={chatText} onChange={(e) => setChatText(e.target.value)} />
                <button className="btn">보내기</button>
              </form>
            </div>
          )}
        </section>

        {/* 상단 가로탭 콘텐츠 */}
        <section className="panel">
          <div className="panel-title">{topTab}</div>

          {topTab === "출석" && (
            <>
              <div className="stats">
                <div className="stat">
                  <div className="k">오늘 출석</div>
                  <div className="v">15/20</div>
                </div>
                <div className="stat">
                  <div className="k">지각</div>
                  <div className="v">2</div>
                </div>
                <div className="stat">
                  <div className="k">결석</div>
                  <div className="v">3</div>
                </div>
              </div>
              <table className="table">
                <thead><tr><th>라운드</th><th>시작</th><th>종료</th><th>상태</th></tr></thead>
                <tbody>
                  <tr><td>#3</td><td>10:00</td><td>12:00</td><td>종료</td></tr>
                  <tr><td>#2</td><td>10:00</td><td>12:00</td><td>종료</td></tr>
                  <tr><td>#1</td><td>10:00</td><td>12:00</td><td>종료</td></tr>
                </tbody>
              </table>
            </>
          )}

          {topTab === "녹화" && (
            <div className="grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="thumb">
                  <div className="ph">썸네일</div>
                  <div className="t">Day {i + 1} · 12:3{i}</div>
                </div>
              ))}
            </div>
          )}

          {topTab === "아카이브" && (
            <ul className="archive">
              <li><a href="#" onClick={(e)=>e.preventDefault()}>강의 자료: DNS.pdf</a></li>
              <li><a href="#" onClick={(e)=>e.preventDefault()}>실습 가이드: HTTP 캡쳐.md</a></li>
              <li><a href="#" onClick={(e)=>e.preventDefault()}>노션 페이지: 운영 규칙</a></li>
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
