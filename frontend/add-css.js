import fs from 'fs';

const css = `
/* ── DYNAMIC SUN & CLOUDS ── */
.sun-glow {
  position: fixed; top: -120px; right: -80px; width: 450px; height: 450px;
  background: radial-gradient(circle, rgba(253,224,71,0.6) 0%, rgba(253,224,71,0.2) 40%, transparent 70%);
  border-radius: 50%; z-index: -9; filter: blur(30px);
  animation: sunPulse 8s ease-in-out infinite alternate; pointer-events: none;
}
@keyframes sunPulse { 0% { opacity: 0.7; transform: scale(1); } 100% { opacity: 1; transform: scale(1.1); } }

.clouds-layer { position: fixed; inset: 0; z-index: -8; pointer-events: none; overflow: hidden; }
.cloud-blob { position: absolute; background: rgba(255,255,255,0.6); border-radius: 50%; filter: blur(40px); animation: cloudFloat linear infinite alternate; }
.cb1 { width: 600px; height: 180px; top: -50px; left: -100px; animation-duration: 25s; }
.cb2 { width: 500px; height: 150px; top: 10%; right: -50px; animation-duration: 30s; animation-delay: -10s; }
.cb3 { width: 700px; height: 200px; top: 25%; left: 30%; animation-duration: 35s; animation-delay: -5s; opacity: 0.4; }
.cb4 { width: 400px; height: 120px; top: 5%; left: 60%; animation-duration: 20s; animation-delay: -15s; opacity: 0.5; }
@keyframes cloudFloat { 0% { transform: translateX(-40px) scale(0.9); } 100% { transform: translateX(60px) scale(1.1); } }

/* ── PARALLAX LUSH GRASS ── */
.grass-wrap {
  position: fixed; bottom: -10px; left: 0; right: 0; height: 140px; z-index: -4;
  pointer-events: none; overflow: hidden;
  mask-image: linear-gradient(to top, black 0%, black 50%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, black 0%, black 50%, transparent 100%);
}
.grass-layer {
  position: absolute; bottom: 0; left: 0; display: flex; white-space: nowrap;
  font-size: 38px; line-height: 1; letter-spacing: -4px;
  animation: grassMarquee linear infinite;
  transform-origin: bottom center;
}
.grass-back {
  font-size: 28px; filter: blur(1.5px) brightness(0.85);
  animation-duration: 60s; opacity: 0.6; z-index: 1; bottom: 30px;
}
.grass-mid {
  font-size: 34px; filter: blur(0.5px) brightness(0.95);
  animation-duration: 50s; opacity: 0.8; z-index: 2; bottom: 15px; animation-direction: reverse;
}
.grass-front {
  font-size: 44px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
  animation-duration: 40s; z-index: 3; bottom: -5px;
}

@keyframes grassMarquee {
  0% { transform: translateX(0) skewX(-4deg); }
  50% { transform: translateX(-30%) skewX(4deg); }
  100% { transform: translateX(-50%) skewX(-4deg); }
}

@media (max-width: 768px) {
  .grass-wrap { height: 100px; }
  .grass-back { font-size: 24px; bottom: 20px; animation-duration: 40s; }
  .grass-mid { font-size: 28px; bottom: 10px; animation-duration: 35s; }
  .grass-front { font-size: 34px; bottom: -5px; animation-duration: 25s; }
  .sun-glow { width: 250px; height: 250px; top: -50px; right: -50px; }
}
`;

fs.appendFileSync('src/index.css', css);
console.log('Appended CSS successfully.');
