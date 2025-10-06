// src/components/HeroCardIllustrated.tsx
import React from "react";
import HeroCard from "./HeroCard";

/** devCampHub 느낌의 간단한 랩탑+방송 SVG */
function LaptopBroadcastSVG() {
  return (
    <svg
      viewBox="0 0 520 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="broadcast illustration"
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#60a5fa" />
        </linearGradient>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#93c5fd" />
        </linearGradient>
      </defs>

      {/* 오브젝트 그림자 */}
      <ellipse cx="260" cy="320" rx="180" ry="24" fill="rgba(0,0,0,.25)" />

      {/* 랩탑 */}
      <rect
        x="120"
        y="70"
        width="280"
        height="170"
        rx="12"
        fill="#0f172a"
        stroke="url(#g1)"
        strokeWidth="2"
      />
      <rect x="135" y="85" width="250" height="140" rx="8" fill="#0b1220" />
      {/* 화면 안 그라데이션 */}
      <rect x="135" y="85" width="250" height="140" rx="8" fill="url(#g2)" opacity=".18" />
      {/* LIVE 배지 */}
      <rect x="150" y="98" width="56" height="22" rx="12" fill="#ef4444" />
      <text x="178" y="114" fill="#fff" fontSize="12" textAnchor="middle" fontWeight="700">
        LIVE
      </text>
      {/* 카메라 아이콘 */}
      <circle cx="360" cy="155" r="22" fill="#111827" stroke="#93c5fd" />
      <path d="M352 150h14v10l10-6v16l-10-6v10h-14z" fill="#93c5fd" />
      {/* 웨이브/오디오 막대 */}
      {Array.from({ length: 10 }).map((_, i) => {
        const x = 170 + i * 18,
          h = 8 + (i % 5) * 6;
        return (
          <rect
            key={i}
            x={x}
            y={180 - h}
            width="10"
            height={h}
            rx="2"
            fill="#a78bfa"
            opacity={0.9 - i * 0.06}
          />
        );
      })}

      {/* 키보드/바닥 */}
      <rect
        x="90"
        y="250"
        width="340"
        height="18"
        rx="4"
        fill="#111827"
        stroke="rgba(255,255,255,.15)"
      />
      <rect x="70" y="268" width="380" height="14" rx="3" fill="#0b1220" />
    </svg>
  );
}

export default function HeroCardIllustrated() {
  return (
    <HeroCard
      title="devCampHub"
      subtitle="출석, 소통, 방송을 한 곳에서"
      illustration={<LaptopBroadcastSVG />}
    />
  );
}
