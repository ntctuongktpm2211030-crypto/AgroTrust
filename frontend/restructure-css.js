import fs from 'fs';

let content = fs.readFileSync('src/index.css', 'utf8');

// 1. Remove PARALLAX LUSH GRASS section
const grassRegex = /\/\* ── PARALLAX LUSH GRASS ── \*\/[\s\S]*?@keyframes grassMarquee \{[\s\S]*?\}\s*\}?/g;
content = content.replace(grassRegex, '');

// 2. Remove any previous lookup-result-card blocks
const oldLrcRegex = /\.lookup-result-card \{[\s\S]*?\}(?!\n\.\w)/g; 
// This is risky, I'll just look for specific blocks I added
content = content.replace(/\.lookup-result-card \{[\s\S]*?\.lrc-arrow \{[\s\S]*?\}/g, '');
content = content.replace(/\/\* ── NEW PREMIUM RESULT CARD ── \*\/[\s\S]*?\.lookup-result-card:hover \.lrc-cta-btn \{[\s\S]*?\}/g, '');

// 3. Add the even MORE premium styles
const ultraPremiumLrc = `
/* ── ULTRA PREMIUM LOOKUP CARDS ── */
.lookup-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 30px;
  width: 100%;
  margin-top: 30px;
}

.lookup-result-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 35px;
  padding: 30px;
  display: flex;
  gap: 25px;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 40px rgba(0,0,0,0.04);
  position: relative;
  overflow: hidden;
  border-left: 8px solid var(--green);
}

.lookup-result-card:hover {
  transform: translateY(-15px) rotateX(4deg);
  box-shadow: 0 30px 70px rgba(34, 197, 94, 0.18);
  border-left-width: 12px;
}

.lrc-icon {
  width: 80px; height: 80px;
  background: #f0fdf4;
  border-radius: 24px;
  display: flex; align-items: center; justify-content: center;
  font-size: 44px;
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.1);
}

.lrc-content { flex: 1; display: flex; flex-direction: column; gap: 15px; }

.lrc-header { display: flex; flex-direction: column; gap: 6px; }
.lrc-batch-pill {
  font-size: 11px; font-weight: 800; text-transform: uppercase;
  background: rgba(34, 197, 94, 0.1); color: var(--green);
  padding: 4px 12px; border-radius: 30px; align-self: flex-start;
  letter-spacing: 0.5px;
}
.lrc-title { 
  font-family: 'Quicksand', sans-serif;
  font-size: 26px; font-weight: 800; color: var(--text-1); 
  letter-spacing: -0.5px;
}

.lrc-details {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px; padding: 15px 0;
  border-top: 1.5px dashed rgba(0,0,0,0.06);
}
.lrc-detail-item { display: flex; flex-direction: column; gap: 2px; }
.ldi-label { color: var(--text-3); font-size: 11px; font-weight: 700; text-transform: uppercase; }
.ldi-value { color: var(--text-1); font-size: 14px; font-weight: 700; }

.lrc-footer-cta {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 5px; border-top: 1px solid rgba(0,0,0,0.03); padding-top: 15px;
}
.lrc-cta-btn {
  font-size: 15px; font-weight: 800; color: var(--green);
  display: flex; align-items: center; gap: 8px;
  transition: transform 0.3s;
}
.lookup-result-card:hover .lrc-cta-btn { color: #059669; }
.lrc-cta-arrow { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.lookup-result-card:hover .lrc-cta-arrow { transform: translateX(8px) scale(1.2); }
`;

fs.writeFileSync('src/index.css', content + ultraPremiumLrc);
console.log('Restructured index.css: Premium result cards and cleaned footer.');
