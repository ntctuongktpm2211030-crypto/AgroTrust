import fs from 'fs';

let css = fs.readFileSync('src/index.css', 'utf8');

// 1. Fonts setup
css = css.replace(
  /@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:.*?display=swap'\);/,
  "@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Quicksand:wght@500;600;700;800&display=swap');"
);

css = css.replace(/'Inter'/g, "'Nunito'");
css = css.replace(/'Space Grotesk'/g, "'Quicksand'");

// 2. Background update
const oldBg = `      #dff6ff 0%,      /* soft sky blue top */
      #c8f0d4 30%,     /* morning mint mid */
      #e8f5e9 60%,     /* fresh green */
      #f0fdf4 100%);   /* pale field bottom */`;

const newBg = `      #bae6fd 0%,      /* vibrant sky blue top */
      #bef264 40%,     /* lime-green mid */
      #86efac 70%,     /* fresh green */
      #dcfce7 100%);   /* pale field bottom */`;
css = css.replace(oldBg, newBg);

css = css.replace(`animation: skyBreath 14s ease-in-out infinite alternate;`, `animation: skyBreath 16s ease-in-out infinite alternate;`);

// 3. Media queries update
const finalMediaIndex = css.lastIndexOf('@media (max-width:900px)');
if (finalMediaIndex !== -1) {
  css = css.substring(0, finalMediaIndex);
}

// Append new robust media queries
const newMedia = `
@media (max-width:900px) { :root { --sidebar-w:220px; } .content-area { padding:24px 20px; } }
@media (max-width:768px) {
  .main-layout { display: flex; flex-direction: column; }
  .sidebar {
    height: auto; position: sticky; top: 0; z-index: 50;
    flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: space-between;
    padding: 12px 16px; border-right: none; border-bottom: 1.5px solid rgba(34,197,94,.2);
  }
  .sidebar-logo-section { border-bottom: none; padding: 0; margin: 0; }
  .logo .icon { width: 36px; height: 36px; font-size: 20px; border-radius: 10px; }
  .logo h1 { font-size: 20px; }
  .sidebar > div:last-child { display: none; } /* hide disconnect button from normal sidebar flow to save space, or put it elsewhere */
  .wallet-pill { padding: 6px 12px; margin: 0; display: flex; align-items: center; gap: 8px; }
  .wallet-avatar { width: 28px; height: 28px; font-size: 13px; }
  .wallet-bal { display: none; }
  .nav-section-label { display: none; }
  .tab-nav { flex-direction: row; width: 100%; overflow-x: auto; gap: 10px; padding-bottom: 4px; padding-top: 8px; margin-top: 8px; }
  .tab-btn { padding: 8px 12px; white-space: nowrap; flex: 1; align-items: center; justify-content: center; }
  .tab-btn .tab-icon { width: auto; font-size: 16px; margin: 0; }
  .tab-btn span:not(.tab-icon) { font-size: 13px; }
  .content-area { padding: 20px 16px; min-height: unset; }
  .form-row { grid-template-columns: 1fr; }
  .feature-grid { grid-template-columns: 1fr; }
  .trace-grid { grid-template-columns: 1fr; }
  .welcome-panel { padding: 32px 20px; }
  .hero-feature-card { width: 100%; max-width: none; }
  .login-card { max-width: 90%; padding: 40px 24px; }
  .stats-bar { flex-direction: column; border-radius: var(--r-md); }
  .stat-item:not(:last-child)::after { right: 20%; top: auto; bottom: 0; width: 60%; height: 1.5px; }
}
@media (max-width:480px) {
  .logo h1 { display: none; }
  .search-row { flex-direction: column; }
  .search-btn { width: 100% !important; }
  .tab-btn span:not(.tab-icon) { display: none; }
  .tab-btn { padding: 10px; }
  .dash-header { flex-direction: column; align-items: flex-start; gap: 8px; }
}
`;

css += newMedia;

fs.writeFileSync('src/index.css', css);
console.log("Updated index.css successfully.");
