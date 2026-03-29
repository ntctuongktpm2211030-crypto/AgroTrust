import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import { NETWORK_CONFIG, CONTRACT_ABI } from "./config.js";
import FarmDashboard from "./components/FarmDashboard.jsx";
import BatchDashboard from "./components/BatchDashboard.jsx";
import LogDashboard from "./components/LogDashboard.jsx";
import InspectionDashboard from "./components/InspectionDashboard.jsx";
import TraceabilityLookup from "./components/TraceabilityLookup.jsx";
import AnalyticsDashboard from "./components/AnalyticsDashboard.jsx";
import { Tractor, Wheat, FileText, ShieldCheck, Search, Building2, Package, Sprout, TrendingUp } from 'lucide-react';
import './index.css';

const ColorfulBatchIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 6px rgba(202, 138, 4, 0.2))' }}>
    <path d="M12 2.5L2.5 7.5L12 12.5L21.5 7.5L12 2.5Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M2.5 7.5V16.5L12 21.5V12.5L2.5 7.5Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M21.5 7.5V16.5L12 21.5V12.5L21.5 7.5Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M12 12.5L6.5 9.5" stroke="#CA8A04" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const ColorfulFarmIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 6px rgba(22, 163, 74, 0.2))' }}>
    <circle cx="17" cy="7" r="4" fill="#FDE047" stroke="#CA8A04" strokeWidth="1.5"/>
    <path d="M2 20L12 9L22 20H2Z" fill="#86EFAC" stroke="#16A34A" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M2 20L8 13L16 20H2Z" fill="#4ADE80" stroke="#16A34A" strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);

const TABS = [
  {
    key: 'farm', icon: <ColorfulFarmIcon />, label: 'Nông Trại', desc: 'Đăng ký & quản lý thông tin nông trại',
    color: '#16a34a', glow: 'rgba(22,163,74,.35)',
    grad: 'linear-gradient(135deg,#bbf7d0,#dcfce7)',
    tag: 'Quản lý'
  },
  {
    key: 'batch', icon: <ColorfulBatchIcon />, label: 'Lô Hàng', desc: 'Tạo & theo dõi từng lô sản phẩm',
    color: '#ca8a04', glow: 'rgba(202,138,4,.45)',
    grad: 'linear-gradient(135deg,#fef3c7,#fef9c3)',
    tag: 'Truy xuất'
  },
  {
    key: 'log', icon: <FileText size={32} color="#0284c7" strokeWidth={2.2} />, label: 'Nhật Ký Canh Tác', desc: 'Ghi chép lịch sử chăm sóc & thu hoạch',
    color: '#0284c7', glow: 'rgba(2,132,199,.35)',
    grad: 'linear-gradient(135deg,#e0f2fe,#f0f9ff)',
    tag: 'Ghi chép'
  },
  {
    key: 'inspection', icon: <ShieldCheck size={32} color="#7c3aed" strokeWidth={2.2} />, label: 'Kiểm Định', desc: 'Phiếu kiểm định & chứng nhận chất lượng',
    color: '#7c3aed', glow: 'rgba(124,58,237,.35)',
    grad: 'linear-gradient(135deg,#ede9fe,#f5f3ff)',
    tag: 'Chứng nhận'
  },
  {
    key: 'trace', icon: <Search size={32} color="#0f766e" strokeWidth={2.2} />, label: 'Tra Cứu Nguồn Gốc', desc: 'Truy xuất toàn bộ hành trình sản phẩm',
    color: '#0f766e', glow: 'rgba(15,118,110,.35)',
    grad: 'linear-gradient(135deg,#ccfbf1,#f0fdfa)',
    tag: 'Blockchain'
  },
  {
    key: 'customerFarms', icon: <Building2 size={32} color="#16a34a" strokeWidth={2.2} />, label: 'DS Nông Trại', desc: 'Danh sách công khai các nông trại',
    color: '#16a34a', glow: 'rgba(22,163,74,.35)',
    grad: 'linear-gradient(135deg,#dcfce7,#f0fdf4)',
    tag: 'Công khai'
  },
  {
    key: 'customerBatches', icon: <Package size={32} color="#ca8a04" strokeWidth={2.2} />, label: 'DS Lô Hàng', desc: 'Danh sách công khai các lô hàng',
    color: '#ca8a04', glow: 'rgba(202,138,4,.35)',
    grad: 'linear-gradient(135deg,#fef9c3,#fffbeb)',
    tag: 'Công khai'
  },
  {
    key: 'customerCrops', icon: <Sprout size={32} color="#0d9488" strokeWidth={2.2} />, label: 'DS Nông Sản', desc: 'Phân loại nông sản công khai',
    color: '#0d9488', glow: 'rgba(13,148,136,.35)',
    grad: 'linear-gradient(135deg,#ccfbf1,#f0fdfa)',
    tag: 'Phân loại'
  },
  {
    key: 'analytics', icon: <TrendingUp size={32} color="#f43f5e" strokeWidth={2.2} />, label: 'Thống Kê Logistics', desc: 'Dashboard phân tích và cảnh báo chuỗi sự kiện',
    color: '#f43f5e', glow: 'rgba(244,63,94,.35)',
    grad: 'linear-gradient(135deg,#ffe4e6,#fff1f2)',
    tag: 'Phân tích'
  },
];

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [contract, setContract] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'owner' or 'customer'
  const [currentNetworkName, setCurrentNetworkName] = useState("");
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Tắt tính năng tự động ghi nhớ đăng nhập theo yêu cầu của user
    // checkConnection();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  useEffect(() => {
    if (!contract) return;
    const onLogistics = (batchId, eventType, anomaly) => {
      addToast(`Lô #${batchId} cập nhật: ${eventType}`, anomaly ? 'error' : 'info');
    };
    const onAnomaly = (batchId, anomalyType, details) => {
      addToast(`🚨 Cảnh báo Lô #${batchId}: ${details}`, 'error');
    };
    contract.on("LogisticsEventAdded", onLogistics);
    contract.on("AnomalyAlert", onAnomaly);
    return () => {
      contract.off("LogisticsEventAdded", onLogistics);
      contract.off("AnomalyAlert", onAnomaly);
    };
  }, [contract]);

  const addToast = (msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) disconnectWallet();
    else await connectWallet();
  };

  const checkConnection = async () => {
    if (window.ethereum && localStorage.getItem('walletConnected') === 'true') {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length > 0) await connectWallet();
      } catch (err) {
        console.error("Auto-connect Error:", err);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setErrorMsg("Vui lòng cài đặt MetaMask.");
      return;
    }
    try {
      setErrorMsg("⏳ Đang kết nối MetaMask...");

      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainHex = currentChainId.toLowerCase();
      
      const networkData = NETWORK_CONFIG[currentChainHex];
      
      if (!networkData) {
        setErrorMsg(`Mạng không hỗ trợ (Mã của bạn đang là: ${currentChainHex})! Vui lòng chọn Hoodi, Sepolia, Celo Alfajores hoặc Unichain.`);
        return;
      }

      setCurrentNetworkName(networkData.name);

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const currentAccount = accounts[0];
      setAccount(currentAccount);

      const bal = await provider.getBalance(currentAccount);
      setBalance(parseFloat(formatEther(bal)).toFixed(4));

      const signer = await provider.getSigner();
      if (networkData.address && networkData.address !== "0x0000000000000000000000000000000000000000" && CONTRACT_ABI) {
        const contractInstance = new Contract(networkData.address, CONTRACT_ABI, signer);
        setContract(contractInstance);
        localStorage.setItem('walletConnected', 'true');
        setErrorMsg("");
      } else {
        setContract(null);
        setErrorMsg(`Chưa gắn Hợp Đồng (Contract) lên mạng ${networkData.name}. Giờ hãy chuyển lại Hoodi nhé!`);
      }
    } catch (error) {
      if (error.code === 4001) setErrorMsg("Bạn đã từ chối kết nối.");
      else if (error.code === -32002) setErrorMsg("Có yêu cầu đang chờ — hãy mở MetaMask để xác nhận.");
      else setErrorMsg("Lỗi khi kết nối MetaMask.");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
    setActiveTab(null);
    setUserRole(null);
    localStorage.removeItem('walletConnected');
  };

  const filteredTabs = TABS.filter(t => {
    if (!userRole) return false;
    if (userRole === 'owner') return ['farm', 'batch', 'log', 'inspection', 'analytics'].includes(t.key);
    if (userRole === 'customer') return ['trace', 'customerFarms', 'customerBatches', 'customerCrops'].includes(t.key);
    return false;
  });

  const renderTabContent = () => {
    if (!contract || !account) return null;
    switch (activeTab) {
      case 'farm': return <FarmDashboard contract={contract} account={account} />;
      case 'batch': return <BatchDashboard contract={contract} account={account} />;
      case 'log': return <LogDashboard contract={contract} account={account} />;
      case 'inspection': return <InspectionDashboard contract={contract} account={account} />;
      case 'trace': return <TraceabilityLookup contract={contract} forcedPage="search" />;
      case 'customerFarms': return <TraceabilityLookup contract={contract} forcedPage="farms" />;
      case 'customerBatches': return <TraceabilityLookup contract={contract} forcedPage="batches" />;
      case 'customerCrops': return <TraceabilityLookup contract={contract} forcedPage="crops" />;
      case 'analytics': return <AnalyticsDashboard contract={contract} account={account} />;
      default: return null;
    }
  };

  const activeTabData = TABS.find(t => t.key === activeTab);

  return (
    <div className="app-root">

      {/* ── DYNAMIC SUN & CLOUDS ── */}
      <div className="sun-glow"></div>

      {/* ── FIREFLIES & POLLEN ── */}
      <div className="magic-dust">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={`p-${i}`} className="pollen" style={{ animationDelay: `${-(i * 1.7)}s`, left: `${(i * 7)}%` }}></div>
        ))}
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={`f-${i}`} className="firefly" style={{ animationDelay: `${-(i * 1.1)}s`, left: `${(i * 5.5)}%` }}></div>
        ))}
      </div>
      <div className="clouds-layer">
        <div className="cloud-blob cb1"></div>
        <div className="cloud-blob cb2"></div>
        <div className="cloud-blob cb3"></div>
        <div className="cloud-blob cb4"></div>
      </div>

      {/* ── PARALLAX LUSH GRASS ── (REMOVED) */}

      {!account ? (
        /* ── LOGIN SCREEN ── */
        <div className="login-card glass-card">
          <div className="logo">
            <img src="/Logo.png" alt="AgroTrust Logo" className="icon" style={{ height: '36px', width: 'auto' }} />
            <h1>AgroTrust</h1>
          </div>
          <p className="subtitle">Nền tảng Truy xuất Nông sản Blockchain</p>

          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
            alt="MetaMask" className="metamask-logo"
          />

          <div className="network-badge" style={{ padding: '8px 16px' }}>Hỗ trợ: Hoodi | Sepolia | Celo | Unichain</div>

          <h2>Kết nối Ví Web3</h2>
          <p>Kết nối ví MetaMask để quản lý và truy xuất nông sản trên Blockchain một cách minh bạch.</p>

          <button onClick={connectWallet} className="btn primary-btn" style={{ marginTop: '4px' }}>
            🦊 Kết nối MetaMask
          </button>

          {errorMsg && <p className="error-msg">{errorMsg}</p>}
        </div>

      ) : !userRole ? (
        /* ── PREMIUM ROLE SELECTION SCREEN ── */
        <div className="role-selection-wrapper">
          <div className="role-selection-header">
            <div className="logo" style={{ justifyContent: 'center', marginBottom: '15px' }}>
              <img src="/Logo.png" alt="AgroTrust Logo" className="icon" style={{ height: '36px', width: 'auto' }} />
              <h1>AgroTrust</h1>
            </div>
            <h2>Chào mừng bạn trở lại!</h2>
            <p>Vui lòng xác nhận vai trò của bạn để trải nghiệm hệ thống</p>
          </div>

          <div className="role-selection-grid">
            <div
              className="role-card-premium"
              style={{ '--role-color': '#16a34a', '--role-glow': 'rgba(22,163,74,0.3)', '--role-grad': 'linear-gradient(135deg, rgba(22,163,74,0.15), transparent)' }}
              onClick={() => { setUserRole('owner'); setActiveTab(null); }}
            >
              <div className="role-icon-wrap">🏡</div>
              <h3>Chủ Nông Trại</h3>
              <p>Dành cho nhà sản xuất. Quản lý trang trại, theo dõi lộ trình cây trồng và ghi chép nhật ký.</p>
              <div className="role-arrow">→</div>
            </div>

            <div
              className="role-card-premium"
              style={{ '--role-color': '#0284c7', '--role-glow': 'rgba(2,132,199,0.3)', '--role-grad': 'linear-gradient(135deg, rgba(2,132,199,0.15), transparent)' }}
              onClick={() => { setUserRole('customer'); setActiveTab('trace'); }}
            >
              <div className="role-icon-wrap">🛒</div>
              <h3>Khách Hàng</h3>
              <p>Dành cho người tiêu dùng. Tra cứu nhanh nguồn gốc, kiểm tra chất lượng & chứng nhận sản phẩm.</p>
              <div className="role-arrow">→</div>
            </div>
          </div>

          <button onClick={disconnectWallet} className="btn secondary-btn" style={{ maxWidth: '220px', background: 'transparent', border: '1.5px dashed rgba(220,38,38,0.4)' }}>
            🔌 Ngắt kết nối ví
          </button>
        </div>
      ) : (
        /* ── MAIN DASHBOARD ── */
        <div className="main-layout" style={{ width: '100%' }}>

          {/* Sidebar */}
          <aside className="sidebar glass-card">
            {/* Logo */}
            <div className="sidebar-logo-section">
              <div className="logo">
                <img src="/Logo.png" alt="AgroTrust Logo" className="icon" style={{ height: '32px', width: 'auto' }} />
                <h1 style={{ cursor: 'pointer' }} onClick={() => setUserRole(null)}>AgroTrust</h1>
              </div>
            </div>

            {/* Wallet */}
            <div className="wallet-pill">
              <div className="wallet-avatar">👤</div>
              <div className="wallet-info">
                <div className="wallet-addr">{account.substring(0, 6)}...{account.substring(account.length - 4)}</div>
                <div className="wallet-bal">{balance} ETH</div>
              </div>
              <div className="online-dot"></div>
            </div>

            <div className="network-badge" style={{ fontSize: '11px', margin: '0 0 16px 0', alignSelf: 'center', background: 'rgba(255,255,255,0.1)', color: 'var(--emerald-light)' }}>
              🌐 {currentNetworkName}
            </div>

            {/* Nav */}
            <div className="nav-section-label">Chức năng {userRole === 'owner' ? '(Chủ)' : '(Khách)'}</div>
            <nav className="tab-nav">
              {filteredTabs.map(t => (
                <button
                  key={t.key}
                  className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(activeTab === t.key ? null : t.key)}
                  title={t.desc}
                  style={activeTab === t.key ? {
                    background: t.grad,
                    borderColor: t.color + '66',
                    color: t.color,
                    boxShadow: `0 4px 18px ${t.glow}`,
                  } : {}}
                >
                  <span className="tab-icon" style={activeTab === t.key ? { filter: 'drop-shadow(0 0 6px ' + t.glow + ')' } : {}}>{t.icon}</span>
                  <span style={{ flex: 1 }}>{t.label}</span>
                  {activeTab === t.key && (
                    <span style={{
                      fontSize: '9px', fontWeight: 800, padding: '2px 7px',
                      background: t.color, color: '#fff', borderRadius: '20px',
                      letterSpacing: '.5px', textTransform: 'uppercase',
                    }}>{t.tag}</span>
                  )}
                </button>
              ))}
            </nav>

            {/* Footer */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => setUserRole(null)} className="btn-sub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                Thay đổi vai trò
              </button>
              <div className="divider" style={{ marginBottom: '4px' }}></div>
              <button onClick={disconnectWallet} className="btn-outline">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Ngắt Kết Nối
              </button>
            </div>
          </aside>

          {/* Content */}
          <main className="content-area">
            {activeTab ? (
              <div>
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>AgroTrust</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>›</span>
                  <span style={{ fontSize: '13px', color: 'var(--emerald-light)', fontWeight: 600 }}>
                    {activeTabData?.icon} {activeTabData?.label}
                  </span>
                </div>
                {renderTabContent()}
              </div>
            ) : (
              /* Welcome */
              <div className="welcome-panel glass-card">
                <div className="welcome-greeting">
                  <div>
                    <h2>Xin chào, {userRole === 'owner' ? 'Chủ nông trại!' : 'Quý khách!'}</h2>
                    <p>Chọn một chức năng để bắt đầu quản lý nông sản trên Blockchain</p>
                  </div>
                </div>

                <div className="stats-bar">
                  <div className="stat-item">
                    <span className="stat-number">100%</span>
                    <span className="stat-label">Minh bạch</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">On-chain</span>
                    <span className="stat-label">Dữ liệu</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">One H</span>
                    <span className="stat-label">3 Testnet</span>
                  </div>
                </div>

                <div className="hero-feature-grid">
                  {filteredTabs.map((t, i) => (
                    <button
                      key={t.key}
                      className="hero-feature-card"
                      onClick={() => setActiveTab(t.key)}
                      style={{
                        '--card-color': t.color,
                        '--card-glow': t.glow,
                        '--card-grad': t.grad,
                        animationDelay: `${i * 0.08}s`,
                      }}
                    >
                      {/* Glow backdrop */}
                      <div className="hfc-glow"></div>
                      {/* Icon ring */}
                      <div className="hfc-icon-ring">
                        <span className="hfc-icon">{t.icon}</span>
                      </div>
                      {/* Text */}
                      <div className="hfc-body">
                        <div className="hfc-label">{t.label}</div>
                        <div className="hfc-desc">{t.desc}</div>
                      </div>
                      {/* Tag badge */}
                      <div className="hfc-tag">{t.tag}</div>
                      {/* Arrow */}
                      <div className="hfc-arrow">→</div>
                      {/* Bottom accent bar */}
                      <div className="hfc-bar"></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="toast-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: t.type === 'error' ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.05))' : 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.05))',
            color: t.type === 'error' ? '#fca5a5' : '#a7f3d0',
            padding: '14px 20px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${t.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            fontSize: '14px',
            fontWeight: 500,
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            pointerEvents: 'auto',
            minWidth: '280px',
            maxWidth: '380px'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: t.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontSize: '16px'
            }}>
              {t.type === 'error' ? '🚨' : '✨'}
            </div>
            <div style={{ lineHeight: '1.5', flex: 1, wordBreak: 'break-word', color: '#fff' }}>
              {t.msg}
            </div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '-4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;
