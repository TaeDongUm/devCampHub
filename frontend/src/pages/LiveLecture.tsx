import { useEffect, useState } from "react";
import { http } from "../api/http";
import ChatPage from "./ChatPage";

// CampDetail.tsx에서 복사해온 decodeJwt 함수
interface JwtPayload {
  sub: string; // email
  role: "ADMIN" | "STUDENT";
  nickname: string;
  iat: number;
  exp: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export interface StreamResponseDto {
  streamId: number;
  title: string;
  ownerNickname: string;
  type: "LECTURE" | "MOGAKCO";
}

export default function LiveLecture({ campId }: { campId: string }) {
  const [lectureStream, setLectureStream] = useState<StreamResponseDto | null>(null);
  const [nickname, setNickname] = useState("익명"); // nickname 상태 추가

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        setNickname(payload.nickname);
      }
    }

    const fetchLectureStream = async () => {
      try {
        const streams = await http<StreamResponseDto[]>(`/api/camps/${campId}/streams`);
        const lecture = streams.find((s) => s.type === "LECTURE");
        setLectureStream(lecture || null);
      } catch (error) {
        console.error("강의 정보를 불러오는 데 실패했습니다.", error);
      }
    };

    fetchLectureStream();
    const interval = setInterval(fetchLectureStream, 15000); // 15초마다 새로고침

    return () => clearInterval(interval);
  }, [campId]);

  return (
    <div className="live-wrapper">
      {lectureStream ? (
        <>
          <div className="video-surface on" style={{ height: 320 }}>
            🎥 {lectureStream.title} ({lectureStream.ownerNickname}님)
          </div>
          <div style={{ marginTop: 12 }}>
            <ChatPage
              key={`chat-lecture-${lectureStream.streamId}`}
              channel={`lecture-${lectureStream.streamId}`}
              nickname={nickname} // nickname prop 추가
            />
          </div>
        </>
      ) : (
        <div className="video-surface off" style={{ height: 320 }}>
          진행 중인 강의가 없습니다.
        </div>
      )}
    </div>
  );
}
