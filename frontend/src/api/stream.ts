// src/api/stream.ts
import { http } from "./http";

export type StreamMeta = {
  micOn: boolean;
  camOn: boolean;
  screenOn: boolean;
  shareTarget?: string;
  // 확장 가능 필드
  [k: string]: unknown;
};

export type StreamSession = {
  sessionId: string;
  userId: string;
  campId: string;
  startedAt: string; // ISO
  state: "OPEN" | "CLOSED" | "TIMEOUT";
};

type StartPayload = {
  type: "START";
  campId: string;
  meta?: StreamMeta;
};

type HeartbeatPayload = {
  type: "HEARTBEAT";
  sessionId: string;
  meta?: StreamMeta;
};

type StopPayload = {
  type: "STOP";
  sessionId: string;
  meta?: StreamMeta;
};

export async function startSession(campId: string, meta?: StreamMeta) {
  const body: StartPayload = { type: "START", campId, meta };
  return http<{ session: StreamSession }>("/streams/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function heartbeat(sessionId: string, meta?: StreamMeta) {
  const body: HeartbeatPayload = { type: "HEARTBEAT", sessionId, meta };
  // 서버가 204를 줄 수도 있으므로 반환 타입은 void로
  return http<void>("/streams/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function stopSession(sessionId: string, meta?: StreamMeta) {
  const body: StopPayload = { type: "STOP", sessionId, meta };
  return http<void>("/streams/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
