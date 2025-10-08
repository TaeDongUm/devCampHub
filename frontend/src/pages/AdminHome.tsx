import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import "../styles/AdminHome.css";
import "../styles/Modal.css"; // 모달을 위한 CSS 추가

// 백엔드의 DTO와 일치하는 타입
interface Camp {
    id: number;
    name: string;
    description: string;
    homepageUrl: string;
    startDate: string;
    endDate: string;
    status: 'PREPARING' | 'ONGOING' | 'FINISHED';
    inviteCode: string;
    creatorName: string;
}

interface CampCreateRequest {
    name: string;
    description: string;
    homepageUrl: string;
    startDate: string;
    endDate: string;
}

// 캠프 생성 모달 컴포넌트
const CreateCampModal = ({ onClose, onCampCreated }: { onClose: () => void; onCampCreated: (newCamp: Camp) => void; }) => {
    const [form, setForm] = useState<CampCreateRequest>({ name: "", description: "", homepageUrl: "", startDate: "", endDate: "" });
    const [error, setError] = useState("");

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newCamp = await http<Camp>("/api/camps", {
                method: "POST",
                body: JSON.stringify(form)
            });
            onCampCreated(newCamp);
            onClose();
        } catch (e: any) {
            setError("캠프 생성에 실패했습니다: " + e.message);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>새 캠프 만들기</h2>
                <form onSubmit={handleSubmit}>
                    <input name="name" placeholder="캠프 이름" onChange={onChange} required />
                    <textarea name="description" placeholder="캠프 설명" onChange={onChange} />
                    <input name="homepageUrl" placeholder="홈페이지 URL" onChange={onChange} />
                    <input type="date" name="startDate" onChange={onChange} required />
                    <input type="date" name="endDate" onChange={onChange} required />
                    {error && <p className="error-message">{error}</p>}
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>취소</button>
                        <button type="submit" className="btn-primary">생성</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function AdminHome() {
    const [tab, setTab] = useState<"dashboard" | "camps" | "alerts">("camps");
    const [camps, setCamps] = useState<Camp[]>([]);
    const [error, setError] = useState<string>("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const nav = useNavigate();

    const fetchCamps = async () => {
        try {
            const data = await http<Camp[]>("/api/camps");
            setCamps(data);
        } catch (e: any) {
            setError("캠프 목록을 불러오는 데 실패했습니다.");
            console.error(e);
        }
    };

    useEffect(() => {
        fetchCamps();
    }, []);

    const goCamp = (id: number) => nav(`/camp/${id}`);

    return (
        <main className="ah">
            {showCreateModal && 
                <CreateCampModal 
                    onClose={() => setShowCreateModal(false)} 
                    onCampCreated={(newCamp) => {
                        setCamps(prevCamps => [...prevCamps, newCamp]);
                    }}
                />
            }
            <section className="ah-wrap">
                <header className="ah-hero">
                    <h1 className="ah-title">관리자 홈</h1>
                    <p className="ah-sub">캠프 운영을 한곳에서 — 출석 · 방송/채팅 · 녹화/아카이브</p>
                    <div className="ah-tabs">
                        <button className={tab === "dashboard" ? "on" : ""} onClick={() => setTab("dashboard")}>대시보드</button>
                        <button className={tab === "camps" ? "on" : ""} onClick={() => setTab("camps")}>캠프</button>
                        <button className={tab === "alerts" ? "on" : ""} onClick={() => setTab("alerts")}>알림</button>
                    </div>
                </header>

                {error && <div className="error-message">{error}</div>}

                {tab === "camps" && (
                    <section className="ah-camps">
                        <div className="ah-card-title">내 캠프</div>
                        <ul className="camp-list">
                            {camps.map((c) => (
                                <li key={c.id} className="camp-item" onClick={() => goCamp(c.id)}>
                                    <div className="camp-name">{c.name} <span className={`camp-status ${c.status.toLowerCase()}`}>{c.status}</span></div>
                                    <div className="camp-meta">기간: {c.startDate} ~ {c.endDate}</div>
                                </li>
                            ))}
                        </ul>
                        <div className="ah-create">
                            <button className="btn outline" onClick={() => setShowCreateModal(true)}>캠프 만들기</button>
                            <div className="tip">* 캠프 생성은 3개월에 1회로 제한됩니다.</div>
                        </div>
                    </section>
                )}
            </section>
        </main>
    );
}
