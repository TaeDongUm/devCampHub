import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import "../styles/CampDetail.css";

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

type Track = "WEB" | "ANDROID" | "IOS";

export default function Settings() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<Partial<MyProfileResponse>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    http<MyProfileResponse>("/api/me")
      .then((data) => {
        if (data) setProfile(data);
      })
      .catch(() => setError("프로필 정보를 불러오는 데 실패했습니다."));
  }, []);

  const onFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onTrackChange = (track: Track) => {
    setProfile((p) => ({ ...p, track }));
  };

  const onSave = async () => {
    try {
      await http("/api/me", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      alert("프로필이 저장되었습니다.");
      nav("/mypage");
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "저장에 실패했습니다.");
      }
    }
  };

  return (
    <main className="wrap" style={{ maxWidth: 720 }}>
      <header className="board-head">
        <h1>설정</h1>
      </header>

      <section className="mine" style={{ padding: 16, display: "grid", gap: 12 }}>
        <label>닉네임</label>
        <input
          name="nickname"
          className="ipt"
          value={profile.nickname || ""}
          onChange={onFieldChange}
        />

        <label>email (변경 불가)</label>
        <input name="email" className="ipt" value={profile.email || ""} readOnly />

        <label>Github</label>
        <input
          name="githubUrl"
          className="ipt"
          value={profile.githubUrl || ""}
          onChange={onFieldChange}
        />

        <label>Blog</label>
        <input
          name="blogUrl"
          className="ipt"
          value={profile.blogUrl || ""}
          onChange={onFieldChange}
        />

        <label>학습 구분</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["WEB", "ANDROID", "IOS"] as Track[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${profile.track === t ? "on" : ""}`}
              onClick={() => onTrackChange(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <label>역할 (변경 불가)</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="chip">{profile.role}</span>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={onSave}>
            저장
          </button>
          <button className="btn ghost" onClick={() => nav(-1)}>
            취소
          </button>
        </div>
      </section>
    </main>
  );
}
