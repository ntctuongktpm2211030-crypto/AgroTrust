import fs from 'fs';

const css = `
/* ── IMPROVED ROLE SELECTION ── */
.role-grid {
  display: flex; gap: 30px; justify-content: center; flex-wrap: wrap; padding: 20px 0;
}
.role-box {
  width: 260px; height: 320px;
  background: rgba(255, 255, 255, 0.75);
  border: 1.5px solid rgba(22, 163, 74, 0.15);
  border-radius: var(--r-xl);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 10px 40px rgba(0,0,0,0.05);
  position: relative; overflow: hidden;
}
.role-box::before {
  content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(34,197,94,0.1), transparent);
  opacity: 0; transition: opacity 0.4s;
}
.role-box:hover::before { opacity: 1; }
.role-box:hover {
  transform: translateY(-12px); border-color: var(--green);
  box-shadow: 0 20px 60px rgba(22,163,74,0.15);
}
.role-box .icon { font-size: 64px; margin-bottom: 20px; transition: transform 0.4s; filter: drop-shadow(0 8px 12px rgba(0,0,0,0.1)); }
.role-box:hover .icon { transform: scale(1.15) rotate(5deg); }
.role-box h3 { font-family: 'Quicksand', sans-serif; font-size: 22px; font-weight: 800; color: var(--text-1); margin-bottom: 8px; }
.role-box p { font-size: 14px; color: var(--text-2); max-width: 180px; line-height: 1.5; }

/* ── FRUIT PICKER GRID ── */
.fruit-picker-grid {
  display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px;
}
.fruit-item {
  padding: 10px 14px; background: rgba(255, 255, 255, 0.6); border: 1.5px solid rgba(34, 197, 94, 0.15);
  border-radius: var(--r-md); cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 8px;
}
.fruit-item:hover { background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.4); transform: translateY(-2px); }
.fruit-item.active {
  background: var(--green); border-color: var(--green); color: #fff;
  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);
}
.fruit-item .fruit-icon { font-size: 20px; }
.fruit-item .fruit-name { font-size: 13.5px; font-weight: 700; }
.fruit-item.active .fruit-name { color: #fff; }
`;

fs.appendFileSync('src/index.css', css);
console.log('Appended fancy role and fruit styles.');
