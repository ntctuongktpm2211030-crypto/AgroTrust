import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./config.js";
import FarmDashboard from "./components/FarmDashboard.jsx";
import BatchDashboard from "./components/BatchDashboard.jsx";
import LogDashboard from "./components/LogDashboard.jsx";
import InspectionDashboard from "./components/InspectionDashboard.jsx";
import TraceabilityLookup from "./components/TraceabilityLookup.jsx";
import './index.css';

const TABS = [
  {
    key: 'farm', icon: '🏡', label: 'Nông Trại', desc: 'Đăng ký & quản lý thông tin nông trại',
    color: '#16a34a', glow: 'rgba(22,163,74,.35)',
    grad: 'linear-gradient(135deg,#bbf7d0,#dcfce7)',
    tag: 'Quản lý'
  },
  {
    key: 'batch', icon: '🌾', label: 'Lô Hàng', desc: 'Tạo & theo dõi từng lô sản phẩm',
    color: '#ca8a04', glow: 'rgba(202,138,4,.35)',
    grad: 'linear-gradient(135deg,#fef3c7,#fef9c3)',
    tag: 'Truy xuất'
  },
  {
    key: 'log', icon: '📓', label: 'Nhật Ký Canh Tác', desc: 'Ghi chép lịch sử chăm sóc & thu hoạch',
    color: '#0284c7', glow: 'rgba(2,132,199,.35)',
    grad: 'linear-gradient(135deg,#e0f2fe,#f0f9ff)',
    tag: 'Ghi chép'
  },
  {
    key: 'inspection', icon: '🔬', label: 'Kiểm Định', desc: 'Phiếu kiểm định & chứng nhận chất lượng',
    color: '#7c3aed', glow: 'rgba(124,58,237,.35)',
    grad: 'linear-gradient(135deg,#ede9fe,#f5f3ff)',
    tag: 'Chứng nhận'
  },
  {
    key: 'trace', icon: '🔍', label: 'Tra Cứu Nguồn Gốc', desc: 'Truy xuất toàn bộ hành trình sản phẩm',
    color: '#0f766e', glow: 'rgba(15,118,110,.35)',
    grad: 'linear-gradient(135deg,#ccfbf1,#f0fdfa)',
    tag: 'Blockchain'
  },
];

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [contract, setContract] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'owner' or 'customer'

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

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

      const targetChainId = "0x88bb0"; // 560048 (Ethereum Hoodi)
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

      if (currentChainId !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetChainId,
                chainName: "Ethereum Hoodi",
                rpcUrls: ["https://rpc.hoodi.ethpandaops.io"],
                nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
              }],
            });
          } else { throw switchError; }
        }
      }

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const currentAccount = accounts[0];
      setAccount(currentAccount);

      const bal = await provider.getBalance(currentAccount);
      setBalance(parseFloat(formatEther(bal)).toFixed(4));

      const signer = await provider.getSigner();
      if (CONTRACT_ADDRESS && CONTRACT_ABI) {
        const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contractInstance);
        localStorage.setItem('walletConnected', 'true');
        setErrorMsg("");
      } else {
        setErrorMsg("Thiếu file config.js của Smart Contract");
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
    if (userRole === 'owner') return ['farm', 'batch', 'log', 'inspection'].includes(t.key);
    if (userRole === 'customer') return t.key === 'trace';
    return false;
  });

  const renderTabContent = () => {
    if (!contract || !account) return null;
    switch (activeTab) {
      case 'farm': return <FarmDashboard contract={contract} account={account} />;
      case 'batch': return <BatchDashboard contract={contract} account={account} />;
      case 'log': return <LogDashboard contract={contract} account={account} />;
      case 'inspection': return <InspectionDashboard contract={contract} account={account} />;
      case 'trace': return <TraceabilityLookup contract={contract} />;
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
            <span className="icon">🌱</span>
            <h1>AgroTrust</h1>
          </div>
          <p className="subtitle">Nền tảng Truy xuất Nông sản Blockchain</p>

          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
            alt="MetaMask" className="metamask-logo"
          />

          <div className="network-badge">Ethereum Hoodi Testnet</div>

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
              <span className="icon">🌱</span>
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
                <span className="icon">🌱</span>
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
    </div>
  );
}

export default App;
