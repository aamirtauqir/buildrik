/**
 * Aquibra Progress Bar Block (card-style)
 * @license BSD-3-Clause
 */

import * as React from "react";
import { clamp } from "../../shared/utils/helpers";

export type ProgressBarProps = {
  title?: string;
  percent?: number; // 0 - 100
  completed?: number; // e.g. 32
  total?: number; // e.g. 42
  subtitle?: string;
};

export function ProgressBar({
  title = "Your Progress",
  percent = 93,
  completed = 32,
  total = 42,
  subtitle = "Finish course to get certificate.",
}: ProgressBarProps) {
  const pct = clamp(Math.round(percent), 0, 100);

  return (
    <div className="pb-page">
      <style>{css}</style>

      <div className="pb-card">
        <h1 className="pb-title">{title}</h1>

        <div className="pb-progress">
          <div className="pb-circle">{pct}%</div>

          <div className="pb-text">
            <h2 className="pb-h2">
              {completed} of {total} complete
            </h2>
            <p className="pb-p">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple skills wrapper for compatibility
export interface SkillsProgressProps {
  skills: { label: string; value: number; subtitle?: string }[];
}

export const SkillsProgress: React.FC<SkillsProgressProps> = ({ skills }) => (
  <div style={{ display: "grid", gap: 16 }}>
    {skills.map((skill, index) => (
      <ProgressBar
        key={index}
        title={skill.label}
        percent={skill.value}
        completed={skill.value}
        total={100}
        subtitle={skill.subtitle || "Keep going!"}
      />
    ))}
  </div>
);

export default ProgressBar;

export const progressBlockConfig = {
  id: "progress",
  label: "Progress Bar",
  category: "Components",
  elementType: "progress" as const,
  icon: "📊",
  content:
    '<div class="pb-card" data-aqb-type="progress">' +
    '<h1 class="pb-title">Your Progress</h1>' +
    '<div class="pb-progress">' +
    '<div class="pb-circle">93%</div>' +
    '<div class="pb-text">' +
    '<h2 class="pb-h2">32 of 42 complete</h2>' +
    '<p class="pb-p">Finish course to get certificate.</p>' +
    "</div>" +
    "</div>" +
    "</div>",
};

const css = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@500;700;900&family=Merriweather:wght@900&display=swap");

*{ margin:0; padding:0; box-sizing:border-box; }

.pb-page{
  font-family: "Inter", sans-serif;
  font-weight: 500;
  background: #f5f5fd;
  min-height: 100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 16px;
}

.pb-card{
  position: relative;
  max-width: 450px;
  width: 90%;
  padding: 50px;
  border-radius: 12px;
  background: #fff;
  box-shadow: -40px -40px 0 #d1d0f5;
}

.pb-title{
  font-family: "Merriweather", serif;
  font-weight: 900;
  font-size: 26px;
  color: #1b1a34;
  margin: 0 0 40px 0;
}

.pb-progress{
  display:flex;
  align-items:center;
  justify-content:center;
  margin-bottom: 10px;
}

.pb-circle{
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 6px solid #d5d4f0;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size: 24px;
  font-weight: 900;
  color: #3d3d5c;
  flex-shrink: 0;
}

.pb-text{ margin-left: 15px; }

.pb-h2{
  font-weight: 700;
  font-size: 24px;
  color: #1b1a34;
  margin: 0;
}

.pb-p{
  font-size: 14px;
  color: #1b1a34;
  margin: 6px 0 0 0;
  line-height: 1.6;
}

@media (max-width: 390px){
  .pb-progress{
    flex-wrap: wrap;
    gap: 30px;
  }
  .pb-text{
    margin-left: 0;
    text-align: center;
  }
}
`;
