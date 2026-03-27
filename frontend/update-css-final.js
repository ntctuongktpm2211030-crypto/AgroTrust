import fs from 'fs';

let content = fs.readFileSync('src/index.css', 'utf8');

// 1. Remove Grass Styles
content = content.replace(/\/\* ── PARALLAX GRASS ── \*\/[\s\S]*?\.grass-front \{[\s\S]*?\}/g, '/* Grass removed */');
content = content.replace(/@keyframes sway \{[\s\S]*?\}\n/g, '');

// 2. Redesign Lookup Result Card
// First, remove old lrc styles if they exist
content = content.replace(/\.lookup-result-card \{[\s\S]*?\.lrc-arrow \{[\s\S]*?\}/g, '');

// Now append new lrc styles
const newLrcStyles = `
/* ── NEW PREMIUM RESULT CARD ── */
.lookup-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  width: 100%;
}

.lookup-result-card {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  border-radius: 30px;
  padding: 28px;
  display: flex;
  gap: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
  overflow: hidden;
}

.lookup-result-card:hover {
  background: #fff;
  border-color: var(--green);
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 25px 50px rgba(34, 197, 94, 0.15);
}

.lrc-icon {
  width: 60px; height: 60px;
  background: var(--surface-bg);
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  font-size: 32px;
  flex-shrink: 0;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.05);
}

.lrc-content { flex: 1; display: flex; flex-direction: column; gap: 12px; }

.lrc-header { display: flex; flex-direction: column; gap: 4px; }
.lrc-batch-pill {
  font-size: 11px; font-weight: 800; text-transform: uppercase;
  background: rgba(34, 197, 94, 0.1); color: var(--green);
  padding: 4px 10px; border-radius: 10px; align-self: flex-start;
}
.lrc-title { font-size: 22px; font-weight: 800; color: var(--text-1); letter-spacing: -0.5px; }

.lrc-details {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px 0; border-top: 1px dashed rgba(0,0,0,0.06); border-bottom: 1px dashed rgba(0,0,0,0.06);
}
.lrc-detail-item { display: flex; justify-content: space-between; font-size: 13px; }
.ldi-label { color: var(--text-3); font-weight: 600; }
.ldi-value { color: var(--text-1); font-weight: 700; }

.lrc-footer-cta { display: flex; justify-content: flex-end; margin-top: 5px; }
.lrc-cta-btn {
  font-size: 14px; font-weight: 800; color: var(--green);
  transition: transform 0.3s;
}
.lookup-result-card:hover .lrc-cta-btn { transform: translateX(5px); }
`;

fs.writeFileSync('src/index.css', content + newLrcStyles);
console.log('Updated index.css: Removed grass and redesigned result cards.');
