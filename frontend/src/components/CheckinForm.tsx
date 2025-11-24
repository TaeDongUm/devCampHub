import { useState } from "react";
import type { StreamMeta } from "../hooks/useStreamSession";

type Track = "WEB" | "ANDROID" | "IOS";

interface CheckinFormProps {
  defaultTitle?: string;
  defaultTrack: Track;
  defaultMic: boolean;
  defaultCam: boolean;
  defaultScreen: boolean;
  onCancel: () => void;
  onStart: (v: Omit<StreamMeta, "type" | "track"> & { track: Track }) => void;
}

export default function CheckinForm({
  defaultTitle,
  defaultTrack,
  defaultMic,
  defaultCam,
  defaultScreen,
  onCancel,
  onStart,
}: CheckinFormProps) {
  const [title, setTitle] = useState(defaultTitle || "");
  const [track, setTrack] = useState<Track>(defaultTrack);
  const [micOn, setMicOn] = useState(defaultMic);
  const [camOn, setCamOn] = useState(defaultCam);
  const [screenOn, setScreenOn] = useState(defaultScreen);

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onStart({ title, track, micOn, camOn, screenOn });
      }}
    >
      <label>방송 제목</label>
      <input
        className="ipt"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="예: 오늘의 문제풀이"
      />
      <label>학습 구분</label>
      <div style={{ display: "flex", gap: 8 }}>
        {(["WEB", "ANDROID", "IOS"] as Track[]).map((t) => (
          <button
            type="button"
            key={t}
            className={`chip ${track === t ? "on" : ""}`}
            onClick={() => setTrack(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <label>카메라</label>
      <div>
        <input type="checkbox" checked={camOn} onChange={(e) => setCamOn(e.target.checked)} /> 내 얼굴 보이기
      </div>
      <label>마이크</label>
      <div>
        <input type="checkbox" checked={micOn} onChange={(e) => setMicOn(e.target.checked)} /> 음소거 해제
      </div>
      <label>화면 공유</label>
      <div>
        <input type="checkbox" checked={screenOn} onChange={(e) => setScreenOn(e.target.checked)} /> 화면 공유
      </div>
      <div className="modal-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn">
          체크인
        </button>
      </div>
    </form>
  );
}
