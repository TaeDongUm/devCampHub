import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import "../styles/StudentHome.css";

interface Camp {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    status: 'PREPARING' | 'ONGOING' | 'FINISHED';
    creatorName: string;
}

export default function StudentHome() {
    const [tab, setTab] = useState<"dashboard" | "camps" | "alerts">("camps");
    const [myCamps, setMyCamps] = useState<Camp[]>([]);
    const [error, setError] = useState<string>("");
    const nav = useNavigate();

    useEffect(() => {
        // TODO: 현재는 모든 캠프를 가져오고 있으나, 학생이 "참여한" 캠프만 가져오는 API(예: /api/me/camps)가 필요합니다.
        const fetchMyCamps = async () => {
            try {
                const data = await http<Camp[]>("/api/camps"); 
                setMyCamps(data);
            } catch (e: any) {
                setError("참여 중인 캠프 목록을 불러오는 데 실패했습니다.");
            }
        };
        fetchMyCamps();
    }, []);

    const goCamp = (id: number) => nav(`/camp/${id}`);
    const goExplore = () => nav('/explore-camps');

    return (
        <main className="sh">
            <section className="sh-wrap">
                <header className="sh-hero">
                    <h1 className="sh-title">학생 홈</h1>
                    <p className="sh-sub">참여 중인 캠프에서 배우고 기록하세요.</p>
                    <div className="sh-tabs">
                        <button className={tab === "dashboard" ? "on" : ""} onClick={() => setTab("dashboard")}>대시보드</button>
                        <button className={tab === "camps" ? "on" : ""} onClick={() => setTab("camps")}>캠프</button>
                        <button className={tab === "alerts" ? "on" : ""} onClick={() => setTab("alerts")}>알림</button>
                    </div>
                </header>

                {error && <div className="error-message">{error}</div>}

                {tab === "camps" && (
                    <section className="sh-camps">
                        <div className="sh-card-title">참여 중인 캠프</div>
                        <ul className="camp-list">
                            {myCamps.map(c => (
                                <li key={c.id} className="camp-item" onClick={() => goCamp(c.id)}>
                                    <div className="camp-name">{c.name} <span className={`camp-status ${c.status.toLowerCase()}`}>{c.status}</span></div>
                                    <div className="camp-meta">운영: {c.creatorName}</div>
                                    <div className="camp-meta">기간: {c.startDate} ~ {c.endDate}</div>
                                </li>
                            ))}
                        </ul>
                        <div className="join-area">
                            <button className="btn outline" onClick={goExplore}>다른 캠프 참여하기</button>
                        </div>
                    </section>
                )}
            </section>
        </main>
    );
}

