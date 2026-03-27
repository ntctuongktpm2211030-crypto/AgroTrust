import fs from 'fs';

const css = `
/* ── MAGIC DUST & FIREFLIES ── */
.magic-dust { position: fixed; inset: 0; pointer-events: none; z-index: -5; overflow: hidden; }

.pollen {
  position: absolute; bottom: -20px;
  width: 4px; height: 4px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.9), rgba(253,224,71,0.4));
  box-shadow: 0 0 10px rgba(253,224,71,0.5);
  animation: pollenFloat 12s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  opacity: 0;
}
.pollen:nth-child(even) { width: 6px; height: 6px; animation-duration: 18s; box-shadow: 0 0 14px rgba(134,239,172,0.6); background: radial-gradient(circle, #fff, rgba(134,239,172,0.4)); }
.pollen:nth-child(3n) { animation-duration: 25s; width: 3px; height: 3px; }

@keyframes pollenFloat {
  0% { transform: translateY(0) translateX(0) scale(0.5) rotate(0); opacity: 0; }
  10% { opacity: 0.8; }
  50% { transform: translateY(-40vh) translateX(40px) scale(1.2) rotate(180deg); opacity: 0.9; }
  80% { opacity: 0.5; }
  100% { transform: translateY(-80vh) translateX(-20px) scale(0.8) rotate(360deg); opacity: 0; }
}

.firefly {
  position: absolute; bottom: 10px;
  width: 6px; height: 6px; background: #bef264; border-radius: 50%;
  box-shadow: 0 0 15px 4px rgba(190,242,100,0.8);
  animation: fireflyDance 9s ease-in-out infinite alternate;
  opacity: 0;
}
.firefly:nth-child(even) { background: #fde047; box-shadow: 0 0 12px 3px rgba(253,224,71,0.8); animation-duration: 12s; }
.firefly:nth-child(3n) { bottom: 40px; animation-duration: 15s; }

@keyframes fireflyDance {
  0% { transform: translateX(0) translateY(0); opacity: 0.3; box-shadow: 0 0 4px 1px rgba(190,242,100,0.3); }
  25% { opacity: 1; transform: translateX(30px) translateY(-50px); box-shadow: 0 0 20px 6px rgba(190,242,100,0.9); }
  50% { opacity: 0.4; transform: translateX(-15px) translateY(-20px); }
  75% { opacity: 1; transform: translateX(45px) translateY(-80px); box-shadow: 0 0 25px 8px rgba(190,242,100,1); }
  100% { transform: translateX(10px) translateY(-10px); opacity: 0; }
}

/* ── LIGHT SWEEP FOCUS EFFCTS ── */
.hero-feature-card::after {
  content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background: linear-gradient(60deg, transparent 20%, rgba(255,255,255,0.4) 50%, transparent 80%);
  transform: translateX(-120%) translateY(-120%) rotate(45deg);
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none; z-index: 5; opacity: 0;
}
.hero-feature-card:hover::after {
  transform: translateX(120%) translateY(120%) rotate(45deg); opacity: 1;
}

.welcome-panel::after {
  content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background: linear-gradient(60deg, transparent 20%, rgba(255,255,255,0.6) 50%, transparent 80%);
  transform: translateX(-150%) translateY(-150%) rotate(45deg);
  animation: lightSweep 8s infinite; pointer-events: none; z-index: 10;
}
@keyframes lightSweep {
  0%, 70% { transform: translateX(-150%) translateY(-150%) rotate(45deg); }
  100% { transform: translateX(150%) translateY(150%) rotate(45deg); }
}

/* Custom primary button shockwave */
.primary-btn { position: relative; overflow: visible; }
.primary-btn::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  box-shadow: 0 0 0 0 rgba(34,197,94,0.6);
  animation: shockPulse 2.5s infinite; z-index: -1; pointer-events: none;
}
@keyframes shockPulse {
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
  70%, 100% { box-shadow: 0 0 0 16px rgba(34,197,94,0); }
}
`;

fs.appendFileSync('src/index.css', css);
console.log('Appended magic effects CSS successfully.');
