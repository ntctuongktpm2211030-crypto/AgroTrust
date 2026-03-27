import fs from 'fs';

const css = `
/* ── PREMIUM TRACEABILITY LOOKUP ── */
.lookup-search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  width: 100%;
  max-width: 800px;
  margin: 40px auto;
  animation: fadeInUp 0.8s ease-out;
}

.search-header-premium {
  text-align: center;
  margin-bottom: 10px;
}
.search-header-premium h2 {
  font-family: 'Quicksand', sans-serif;
  font-size: 32px;
  font-weight: 800;
  color: var(--text-1);
  margin-bottom: 8px;
}
.search-header-premium p {
  font-size: 16px;
  color: var(--text-2);
}

/* Segmented Control */
.search-mode-toggle {
  position: relative;
  display: flex;
  background: rgba(255, 255, 255, 0.4);
  border: 1.5px solid rgba(34, 197, 94, 0.15);
  padding: 6px;
  border-radius: 20px;
  width: 380px;
  z-index: 1;
}
.mode-btn {
  flex: 1;
  border: none;
  background: none;
  padding: 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-2);
  cursor: pointer;
  z-index: 2;
  transition: color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.mode-btn.active {
  color: #fff;
}
.mode-slider {
  position: absolute;
  top: 6px;
  bottom: 6px;
  width: calc(50% - 6px);
  background: var(--green);
  border-radius: 16px;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}
.mode-slider.left { transform: translateX(0); }
.mode-slider.right { transform: translateX(100%); }

/* Pill Search Bar */
.search-bar-premium {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  background: #fff;
  border: 2.5px solid transparent;
  padding: 8px 8px 8px 24px;
  border-radius: 40px;
  box-shadow: 0 15px 45px rgba(0,0,0,0.06);
  transition: all 0.3s;
}
.search-bar-premium:focus-within {
  border-color: var(--green);
  box-shadow: 0 15px 50px rgba(34, 197, 94, 0.15);
  transform: translateY(-2px);
}
.search-icon-inside {
  font-size: 20px;
  margin-right: 15px;
  color: var(--text-3);
}
.search-bar-premium input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-1);
}
.search-submit-btn {
  background: var(--green);
  color: #fff;
  border: none;
  padding: 14px 30px;
  border-radius: 32px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
}
.search-submit-btn:hover {
  filter: brightness(1.1);
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
}

.lookup-error-pouch {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
}

/* Result Cards Grid */
.lookup-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
  margin-top: 20px;
}
.lookup-result-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1.5px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  gap: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 25px rgba(0,0,0,0.04);
}
.lookup-result-card:hover {
  background: #fff;
  border-color: var(--green);
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 45px rgba(34, 197, 94, 0.12);
}
.lrc-icon {
  font-size: 40px;
  background: var(--surface-bg);
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.05);
}
.lrc-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.lrc-title { font-size: 20px; font-weight: 800; color: var(--text-1); }
.lrc-farm { font-size: 14px; color: var(--text-2); }
.lrc-bottom {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.lrc-batch-id {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-3);
  background: rgba(0,0,0,0.05);
  padding: 4px 10px;
  border-radius: 8px;
}
.lrc-arrow { font-size: 13px; font-weight: 800; color: var(--green); }

.results-count-badge {
  text-align: left;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-3);
  letter-spacing: 1px;
  margin-bottom: 5px;
}

/* Result Reveal Animation */
.search-results-reveal {
  width: 100%;
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.btn-back-to-search {
  background: var(--surface-1);
  border: 1.5px solid rgba(0,0,0,0.1);
  padding: 10px 20px;
  border-radius: 40px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-back-to-search:hover {
  background: #fff;
  border-color: var(--green);
  color: var(--green);
  transform: translateX(-5px);
}
`;

fs.appendFileSync('src/index.css', css);
console.log('Appended premium lookup styles.');
