import React, { useEffect, useState } from "react";
import { http } from "../api/http";
import ChatPage from "./ChatPage";

export interface StreamResponseDto {
    streamId: number;
    title: string;
    ownerNickname: string;
    type: 'LECTURE' | 'MOGAKCO';
}

export default function LiveLecture({ campId }: { campId: string }) {
    const [lectureStream, setLectureStream] = useState<StreamResponseDto | null>(null);

    useEffect(() => {
        const fetchLectureStream = async () => {
            try {
                const streams = await http<StreamResponseDto[]>(`/api/camps/${campId}/streams`);
                const lecture = streams.find(s => s.type === 'LECTURE');
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
                        <ChatPage key={`chat-lecture-${lectureStream.streamId}`} />
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
