import { useEffect, useRef } from "react";
import type { StreamMeta } from "../hooks/useStreamSession";
import ChatPage from "../pages/ChatPage";

interface BroadcastViewProps {
  campId: string;
  streamId: number;
  currentStream: { title: string; ownerNickname: string };
  nickname: string;
  isStreaming: boolean;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  endStream: () => void;
  meta: Partial<StreamMeta>;
}

export default function BroadcastView({
  campId,
  streamId,
  currentStream,
  nickname,
  isStreaming,
  localStream,
  remoteStreams,
  toggleAudio,
  toggleVideo,
  endStream,
  meta,
}: BroadcastViewProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const channel = `mogakco:${campId}:mogakco-${streamId}`;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", gap: "16px" }}>
      {/* 왼쪽: 비디오 및 제어 영역 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* 비디오 영역 */}
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            backgroundColor: "#000",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {isStreaming && localStream && (
             <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          {!isStreaming && Object.values(remoteStreams).length > 0 ? (
            <video
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              ref={(video) => {
                if (video) video.srcObject = Object.values(remoteStreams)[0];
              }}
            />
          ) : (
            !isStreaming && <div style={{ color: "#999", textAlign: "center", paddingTop: "45%" }}>스트리머의 화면을 기다리는 중...</div>
          )}
        </div>

        {/* 정보창 ("1") - 비디오 아래로 이동 */}
        <div 
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #eee"
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "4px", fontSize: "18px" }}>{currentStream.title}</div>
          <div>{nickname} <span style={{ color: isStreaming ? "#ff8a8a" : "#8ad8ff" }}>({isStreaming ? "스트리머" : "참여자"})</span></div>
        </div>

        {/* 제어 버튼 */}
        {isStreaming && (
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button onClick={toggleAudio}>{meta.micOn ? "마이크 끄기" : "마이크 켜기"}</button>
            <button onClick={toggleVideo}>{meta.camOn ? "카메라 끄기" : "카메라 켜기"}</button>
            <button onClick={endStream} style={{ backgroundColor: "red", color: "white" }}>
              방송 종료
            </button>
          </div>
        )}
      </div>

      {/* 오른쪽: 채팅 */}
      <div style={{ width: "350px", borderLeft: "1px solid #ddd", paddingLeft: "16px", display: "flex", flexDirection: "column" }}>
        <ChatPage key={channel} channel={channel} nickname={nickname} />
      </div>
    </div>
  );
}
