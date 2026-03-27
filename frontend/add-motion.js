import fs from 'fs';

const css = `
/* ── ADVANCED MOTION EFFECTS ── */

/* Gentle bobbing for all glass cards */
.glass-card {
  animation: floatCard 6s ease-in-out infinite;
}
@keyframes floatCard {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Tab content entrance animation */
.content-area > div {
  animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Sidebar hover improvements */
.tab-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.tab-btn:hover {
  padding-left: 20px;
  background: rgba(34, 197, 94, 0.15);
}
.tab-btn .tab-icon {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tab-btn:hover .tab-icon {
  transform: scale(1.3) rotate(-10deg);
}

/* Active tab pulse border */
.tab-btn.active {
  position: relative;
  overflow: hidden;
}
.tab-btn.active::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid var(--green);
  border-radius: inherit;
  animation: borderPulse 2s infinite;
  pointer-events: none;
}
@keyframes borderPulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.05); opacity: 0; }
}

/* Profile avatar ripple */
.wallet-avatar {
  position: relative;
}
.wallet-avatar::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--green-light);
  animation: ripple 3s linear infinite;
}
@keyframes ripple {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* Smooth list item staggered entrance (for dashboard items) */
.farm-item, .batch-item, .log-item {
  opacity: 0;
  animation: slideInLeft 0.5s ease forwards;
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Apply delays to list items if possible or just generic */
.farms-grid > div:nth-child(1) { animation-delay: 0.1s; }
.farms-grid > div:nth-child(2) { animation-delay: 0.2s; }
.farms-grid > div:nth-child(3) { animation-delay: 0.3s; }
.farms-grid > div:nth-child(4) { animation-delay: 0.4s; }
.farms-grid > div:nth-child(5) { animation-delay: 0.5s; }
`;

fs.appendFileSync('src/index.css', css);
console.log('Appended advanced motion effects.');
