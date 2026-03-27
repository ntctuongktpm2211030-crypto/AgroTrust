import fs from 'fs';

const css = `
/* ── PREMIUM TRACEABILITY RESULTS OVERHAUL ── */

.lookup-result-premium-wrap {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto 60px;
  padding-bottom: 40px;
}

/* 1. HERO SECTION */
.product-hero-premium {
  position: relative;
  background: var(--role-grad, linear-gradient(135deg, #16a34a, #059669));
  border-radius: 40px;
  padding: 60px 50px;
  color: #fff;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(22, 163, 74, 0.25);
}
.php-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 70% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
  pointer-events: none;
}
.php-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.php-left { display: flex; gap: 30px; align-items: center; }
.php-fruit-icon {
  width: 110px; height: 110px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 35px;
  display: flex; align-items: center; justify-content: center;
  font-size: 60px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.1);
}
.php-batch-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}
.php-title { font-family: 'Quicksand', sans-serif; font-size: 44px; font-weight: 800; margin: 0; line-height: 1.1; }
.php-farm-line { font-size: 18px; opacity: 0.9; margin-top: 8px; font-weight: 600; }

/* Blockchain Badge */
.blockchain-badge {
  position: relative;
  width: 120px; height: 120px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.bb-ring {
  position: absolute; inset: 0;
  border: 3px dashed rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: rotateClockwise 20s linear infinite;
}
.bb-content {
  background: #facc15; /* gold */
  width: 90px; height: 90px;
  border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: 0 10px 25px rgba(250, 204, 21, 0.4), inset 0 0 10px rgba(0,0,0,0.1);
  color: #854d0e;
}
.bb-check { font-size: 24px; font-weight: 900; margin-bottom: -5px; }
.bb-text { display: flex; flex-direction: column; align-items: center; line-height: 1; }
.bb-top { font-size: 9px; font-weight: 800; text-transform: uppercase; }
.bb-bot { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }

.php-status-pill {
  padding: 10px 24px;
  border-radius: 30px;
  font-weight: 800;
  font-size: 15px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  display: flex; align-items: center; gap: 8px;
}

/* 2. STATS GRID */
.trace-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.ts-item {
  background: #fff;
  padding: 24px;
  border-radius: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1.5px solid rgba(0,0,0,0.02);
  transition: transform 0.3s;
}
.ts-item:hover { transform: translateY(-5px); }
.ts-label { font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--text-3); letter-spacing: 0.5px; }
.ts-value { font-size: 18px; font-weight: 800; color: var(--text-1); }

/* 3. MODERN TIMELINE */
.trace-main-content {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 30px;
  align-items: start;
}
.section-header-premium {
  display: flex; align-items: center; gap: 12px; margin-bottom: 25px;
}
.sh-icon { font-size: 26px; }
.section-header-premium h3 { font-family: 'Quicksand', sans-serif; font-size: 24px; font-weight: 800; margin: 0; }

.premium-timeline {
  position: relative;
  padding-left: 50px;
}
.pt-line {
  position: absolute; left: 19px; top: 0; bottom: 0;
  width: 4px; background: rgba(34, 197, 94, 0.15);
  border-radius: 4px;
}
.pt-item { position: relative; margin-bottom: 30px; }
.pt-dot-wrap {
  position: absolute; left: -42px; top: 20px;
  width: 22px; height: 22px; background: #fff;
  border-radius: 50%; border: 4px solid var(--green);
  z-index: 2; box-shadow: 0 0 15px rgba(34, 197, 94, 0.3);
}
.pt-card { padding: 25px; border-radius: 25px; transition: all 0.3s; }
.pt-card:hover { transform: translateX(10px); border-color: var(--green); }
.pt-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
.pt-time { font-size: 13px; font-weight: 700; color: var(--text-3); }
.pt-type {
  font-size: 12px; font-weight: 800; background: var(--green-light);
  color: var(--green); padding: 3px 12px; border-radius: 20px;
}
.pt-desc { font-size: 16px; color: var(--text-1); line-height: 1.5; margin-bottom: 15px; }
.pt-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.pt-tag {
  font-size: 12px; font-weight: 700; background: rgba(0,0,0,0.04);
  padding: 5px 12px; border-radius: 10px; color: var(--text-2);
}

/* 4. CERTIFICATES */
.certificate-list { display: flex; flex-direction: column; gap: 20px; }
.certificate-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 28px;
  padding: 30px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0,0,0,0.05);
  border-top: 5px solid var(--green);
}
.cc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.cc-stamp {
  position: absolute; right: -20px; top: 10px;
  border: 4px solid rgba(34, 197, 94, 0.2);
  color: rgba(34, 197, 94, 0.2);
  font-size: 30px; font-weight: 900; text-transform: uppercase;
  padding: 5px 30px; transform: rotate(25deg);
  pointer-events: none;
}
.cc-id { font-size: 12px; font-weight: 800; color: var(--text-3); text-transform: uppercase; }
.cc-inspector { font-size: 20px; font-weight: 800; margin: 4px 0; }
.cc-org { font-size: 14px; color: var(--text-2); opacity: 0.8; }
.cc-result-badge {
  padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 14px;
}
.cc-result-badge.success { background: #dcfce7; color: #166534; }
.cc-result-badge.fail { background: #fee2e2; color: #991b1b; }

.cc-body { margin-bottom: 20px; }
.cc-body p { font-style: italic; color: var(--text-1); font-size: 15px; }
.cc-note { margin-top: 10px; font-size: 14px; color: var(--text-2); background: #f9fafb; padding: 12px; border-radius: 12px; }

.cc-footer {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; font-weight: 600; color: var(--text-3);
  padding-top: 15px; border-top: 1.5px dashed rgba(0,0,0,0.1);
}

.empty-state-card {
  background: rgba(255,255,255,0.4);
  padding: 40px; text-align: center; border-radius: 25px;
  border: 1.5px dashed rgba(0,0,0,0.1); color: var(--text-3); font-style: italic;
}

/* Animations */
@keyframes rotateClockwise { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.animate-fade-in { animation: fadeIn 0.8s ease-out; }
.animate-slide-up { opacity: 0; animation: slideUp 0.6s ease-out forwards; }
.animate-scale-in { opacity: 0; animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 900px) {
  .trace-main-content { grid-template-columns: 1fr; }
  .trace-stats-grid { grid-template-columns: 1fr 1fr; }
  .php-content { flex-direction: column; text-align: center; gap: 30px; }
  .php-left { flex-direction: column; }
}
`;

fs.appendFileSync('src/index.css', css);
console.log('Appended premium result overhaul styles.');
