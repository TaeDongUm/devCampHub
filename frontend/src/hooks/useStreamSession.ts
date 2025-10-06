import { useCallback, useEffect, useRef, useState } from "react";
import { startSession, heartbeat, stopSession, type StreamMeta } from "../api/stream";

const LS_KEY = "stream:server-session"; // { campId, sessionId }

export function useStreamSession(campId: string) {
  const [isStreaming, setStreaming] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [meta, setMeta] = useState<StreamMeta>({
    micOn: false,
    camOn: true,
    screenOn: true,
  });

  const hbTimer = useRef<number | null>(null);

  // 세션 복원
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw) as { campId: string; sessionId: string };
      if (s?.campId === campId && s.sessionId) {
        setSessionId(s.sessionId);
        setStreaming(true);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[useStreamSession] restore failed:", err);
    }
  }, [campId]);

  const begin = useCallback(
    async (initialMeta: StreamMeta) => {
      const res = await startSession(campId, initialMeta);
      const sid = res.session.sessionId;
      setSessionId(sid);
      setStreaming(true);
      setMeta(initialMeta);
      localStorage.setItem(LS_KEY, JSON.stringify({ campId, sessionId: sid }));
    },
    [campId]
  );

  const end = useCallback(
    async (finalMeta?: Partial<StreamMeta>) => {
      if (!sessionId) return;
      try {
        await stopSession(sessionId, { ...(meta || {}), ...(finalMeta || {}) });
      } catch (err) {
        // 네트워크 오류 등은 종료 UI는 진행
        // eslint-disable-next-line no-console
        console.warn("[useStreamSession] stop failed:", err);
      } finally {
        setStreaming(false);
        setSessionId(null);
        localStorage.removeItem(LS_KEY);
      }
    },
    [sessionId, meta]
  );

  // 하트비트: 30초
  useEffect(() => {
    if (!sessionId) return;

    const tick = async () => {
      try {
        await heartbeat(sessionId, meta);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[useStreamSession] heartbeat failed:", err);
      }
    };

    // 즉시 1회
    tick();
    hbTimer.current = window.setInterval(tick, 30000) as unknown as number;

    return () => {
      if (hbTimer.current != null) {
        window.clearInterval(hbTimer.current);
        hbTimer.current = null;
      }
    };
  }, [sessionId, meta]);

  return {
    isStreaming,
    sessionId,
    meta,
    setMeta,
    begin,
    end,
  };
}
