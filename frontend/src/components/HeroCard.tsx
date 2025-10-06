import React from "react";
import "./HeroCard.css";

type Props = {
  title: string;
  subtitle?: string;
  className?: string;
  /** 오른쪽에 렌더할 일러스트(ReactNode). 없으면 텍스트만 중앙정렬 */
  illustration?: React.ReactNode;
};

export default function HeroCard({ title, subtitle, className, illustration }: Props) {
  return (
    <div className={`hero-card hero-purple ${className ?? ""}`}>
      <div className="hero-glow" />
      <div className={`hero-grid ${illustration ? "with-illust" : ""}`}>
        <div className="hero-content">
          <h1 className="hero-title">{title}</h1>
          {subtitle && <p className="hero-subtitle">{subtitle}</p>}
        </div>
        {illustration && <div className="hero-illustration">{illustration}</div>}
      </div>
    </div>
  );
}
