import { useState, useEffect } from 'react';
import { Contract, JsonRpcProvider } from 'ethers';
import { NETWORK_CONFIG, CONTRACT_ABI } from '../config';
import './TraceabilityLookup.css';

const STATUS_LABELS = [
  { text: 'Đã gieo trồng',   icon: '🌱' },
  { text: 'Đang chăm sóc',   icon: '🌿' },
  { text: 'Đã bón phân',     icon: '🪣' },
  { text: 'Đã phun thuốc',   icon: '💧' },
  { text: 'Đã thu hoạch',    icon: '🌾' },
  { text: 'Đã đóng gói',     icon: '📦' },
  { text: 'Đang vận chuyển', icon: '🚛' },
  { text: 'Đã kiểm định',    icon: '🏅' },
  { text: 'Đã phân phối',    icon: '🏪' },
];

/* ── SVG Icons ─────────────────────────────────────────── */
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IconSpin = () => (
  <svg className="tsb-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

/* ── Animated Card ─────────────────────────────────────── */
function AnimatedCard({ children, className, delay = 0, onClick }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`${className} ${visible ? 'visible' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/* ── Public RPC endpoints for each supported network ─── */
const NETWORK_RPC = {
  "0x88bb0":  "https://rpc.hoodi.ethpandaops.io",        // Hoodi
  "0xaa36a7": "https://rpc.ankr.com/eth_sepolia",        // Sepolia (Ankr allows CORS)
  "0xaef3":   "https://alfajores-forno.celo-testnet.org",// Celo Alfajores
  "0x515":    "https://sepolia.unichain.org"             // Unichain Sepolia
};

// Helper: get image src from a CID or data URL string
const getImgSrc = (cid) => {
  if (!cid) return null;
  if (cid.startsWith('data:')) return cid;
  return `https://ipfs.io/ipfs/${cid}`;
};

// Build read-only contract instances for all configured networks
const buildAllContracts = () => {
  const result = [];
  for (const [chainHex, cfg] of Object.entries(NETWORK_CONFIG)) {
    const rpc = NETWORK_RPC[chainHex];
    if (!rpc || !cfg.address || cfg.address === '0x0000000000000000000000000000000000000000') continue;
    try {
      const provider = new JsonRpcProvider(rpc);
      const c = new Contract(cfg.address, CONTRACT_ABI, provider);
      result.push({ chainHex, networkName: cfg.name, contract: c });
    } catch {}
  }
  return result;
};

export default function TraceabilityLookup({ contract }) {
  const [searchType, setSearchType] = useState('id');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fromTs = ts => ts && ts > 0n
    ? new Date(Number(ts) * 1000).toLocaleDateString('vi-VN')
    : '—';
  const tsToDateTime = ts => new Date(Number(ts) * 1000).toLocaleString('vi-VN');

  // Tra cứu theo ID — dùng tất cả mạng song song
  const lookupById = async (id) => {
    if (!id || isNaN(Number(id)) || Number(id) < 1) {
      setError('Vui lòng nhập mã lô hàng hợp lệ (số nguyên dương)');
      return;
    }
    try {
      setLoading(true); setError(''); setResult(null); setSearchResults([]);
      const bid = BigInt(id);
      const allContracts = buildAllContracts();

      // Thêm contract của mạng hiện tại nếu có
      const sources = contract ? [{ chainHex: 'current', networkName: 'Mạng hiện tại', contract }, ...allContracts] : allContracts;
      
      const promises = sources.map(async ({ chainHex, networkName, contract: c }) => {
        try {
          const batch = await c.batches(bid);
          if (!batch || batch.batchId === 0n) return null;
          const farm = await c.farms(batch.farmId);
          const logs = await c.getBatchLogs(bid);
          const inspections = await c.getBatchInspections(bid);
          const logistics = await c.getBatchLogistics(bid);
          return { batch, farm, logs: [...logs].reverse(), inspections: [...inspections].reverse(), logistics: [...logistics].reverse(), networkName };
        } catch { return null; }
      });

      const results = await Promise.all(promises);
      const found = results.find(r => r !== null);
      if (!found) { setError('Không tìm thấy lô hàng với mã này trên tất cả các mạng.'); return; }
      setResult(found);
    } catch (e) {
      setError('Lỗi khi tra cứu: ' + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  // Tra cứu theo tên — tìm trên tất cả mạng song song
  const searchByName = async () => {
    if (!searchValue?.trim()) { setError('Vui lòng nhập tên nông sản cần tìm'); return; }
    try {
      setLoading(true); setError(''); setResult(null); setSearchResults([]);
      const query = searchValue.toLowerCase().trim();
      const allContracts = buildAllContracts();
      const sources = contract ? [{ chainHex: 'current', networkName: 'Mạng hiện tại', contract }, ...allContracts] : allContracts;

      const allMatches = [];
      await Promise.all(sources.map(async ({ networkName, contract: c }) => {
        try {
          const count = await c.batchCount();
          for (let i = 1n; i <= count; i++) {
            const batch = await c.batches(i);
            if (batch.productName.toLowerCase().includes(query)) {
              const farm = await c.farms(batch.farmId);
              allMatches.push({ batch, farm, networkName });
            }
          }
        } catch {}
      }));

      if (allMatches.length === 0) setError('Không tìm thấy nông sản nào khớp tên này trên tất cả các mạng.');
      else setSearchResults(allMatches);
    } catch (e) {
      setError('Lỗi khi tìm kiếm: ' + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => searchType === 'id' ? lookupById(searchValue) : searchByName();
  const statusInfo = result ? STATUS_LABELS[Number(result.batch.status)] : null;

  return (
    <div className="trace-page-wrap">
      {/* ── Page Header ── */}
      <div className="trace-hero-title">
        <div className="tht-badge">⛓ Blockchain Verified</div>
        <h1>Hành Trình <em>Nông Sản</em></h1>
        <p>Tra cứu nguồn gốc, lịch sử canh tác và chứng nhận an toàn theo thời gian thực từ Blockchain.</p>
      </div>

      {/* ── Search View ── */}
      {!result && (
        <>
          {/* Toggle */}
          <div className="trace-toggle-row">
            <div className="trace-toggle">
              <button
                className={searchType === 'name' ? 'active' : ''}
                onClick={() => { setSearchType('name'); setSearchValue(''); setError(''); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4C7.1 4 4 7.1 4 11s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7z"/>
                  <path d="M11 8v6M8 11h6"/>
                </svg>
                Theo Tên
              </button>
              <button
                className={searchType === 'id' ? 'active' : ''}
                onClick={() => { setSearchType('id'); setSearchValue(''); setError(''); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="3"/>
                  <path d="M9 9h6M9 12h6M9 15h4"/>
                </svg>
                Theo Mã Lô
              </button>
              <div className={`trace-toggle-slider ${searchType === 'id' ? 'right' : ''}`} />
            </div>
          </div>

          {/* Search bar */}
          <div className="trace-searchbar-wrap">
            <div className="trace-searchbar">
              <div className="tsb-search-icon"><IconSearch /></div>
              <input
                type={searchType === 'id' ? 'number' : 'text'}
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={searchType === 'id' ? 'Nhập mã số lô hàng...' : 'Nhập tên nông sản...'}
              />
              <button className="trace-search-btn" onClick={handleSearch} disabled={loading}>
                {loading ? <><IconSpin />Đang tìm...</> : <><IconSearch />Tìm Kiếm</>}
              </button>
            </div>
          </div>

          {error && <div className="trace-error">⚠️ {error}</div>}

          {/* Results grid */}
          {searchResults.length > 0 && (
            <>
              <div className="trace-count-row">
                Tìm thấy <strong>{searchResults.length}</strong> lô hàng phù hợp
              </div>
              <div className="trace-results-grid">
                {searchResults.map((item, idx) => (
                  <AnimatedCard
                    key={idx}
                    className="trace-result-card"
                    delay={idx * 100}
                    onClick={() => lookupById(item.batch.batchId.toString())}
                  >
                    <div className="trc-body">
                      <div className="trc-icon-panel">
                        {item.batch.dataHash
                          ? <img src={item.batch.dataHash.startsWith('data:') ? item.batch.dataHash : `https://ipfs.io/ipfs/${item.batch.dataHash}`} alt={item.batch.productName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                          : <div className="trc-icon-wrap">🌿</div>
                        }
                      </div>
                      <div className="trc-mid">
                        <div className="trc-top-row">
                          <div className="trc-pill">Lô #{item.batch.batchId.toString()}</div>
                          {item.networkName && <div className="trc-pill" style={{ background: 'rgba(14,165,233,0.12)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', fontSize: '10px' }}>⛓ {item.networkName}</div>}
                        </div>
                        <div className="trc-title">{item.batch.productName}</div>
                        <div className="trc-detail-rows">
                          <div className="trc-detail-row">
                            <div className="tdr-icon">🏡</div>
                            <span className="tdr-text"><strong>{item.farm.farmName}</strong></span>
                          </div>
                          <div className="trc-detail-row">
                            <div className="tdr-icon">🌱</div>
                            <span className="tdr-text">{item.batch.plantType}</span>
                          </div>
                        </div>
                      </div>
                      <div className="trc-cta">
                        <span className="trc-cta-label">Xem hành trình</span>
                        <div className="trc-cta-arrow"><IconArrow /></div>
                      </div>
                    </div>
                  </AnimatedCard>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Detailed Result View ── */}
      {result && (
        <div className="trace-detail-wrap">
          <button className="trace-back-btn" onClick={() => { setResult(null); setSearchResults([]); }}>
            ← Quay lại tìm kiếm
          </button>

          {/* Hero */}
          <div className="trace-product-hero">
            <div className="tph-banner">
              <div className="tph-left">
                {/* Product image — from batch.dataHash on blockchain */}
                <div className="tph-icon">
                  {result.batch.dataHash
                    ? <img src={result.batch.dataHash.startsWith('data:') ? result.batch.dataHash : `https://ipfs.io/ipfs/${result.batch.dataHash}`} alt={result.batch.productName} />
                    : <span>🌿</span>
                  }
                </div>
                <div>
                  <div className="tph-tag">📦 LÔ #{result.batch.batchId.toString()}</div>
                  <h2 className="tph-name">{result.batch.productName}</h2>
                  <div className="tph-farm">🏡 {result.farm.farmName} &nbsp;•&nbsp; 📍 {result.farm.location}</div>
                </div>
              </div>
              <div className="tph-badges">
                <div className="tph-verified">
                  <span className="tpv-dot" />
                  Xác Thực Blockchain
                  <IconShield />
                </div>
                {result.networkName && (
                  <div className="tph-status" style={{ background: 'rgba(14,165,233,0.12)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.25)' }}>
                    ⛓ {result.networkName}
                  </div>
                )}
                <div className="tph-status">
                  {statusInfo?.icon} {statusInfo?.text}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="trace-stat-row">
            <div className="trace-stat-cell">
              <span className="tsc-label">Ngày Gieo Hạt</span>
              <span className="tsc-value">{fromTs(result.batch.sowingDate)}</span>
            </div>
            <div className="trace-stat-cell">
              <span className="tsc-label">Giống Cây Trồng</span>
              <span className="tsc-value">{result.batch.plantType}</span>
            </div>
            <div className="trace-stat-cell">
              <span className="tsc-label">Dự Kiến Thu Hoạch</span>
              <span className="tsc-value">{result.batch.expectedQuantity.toString()} {result.batch.quantityUnit}</span>
            </div>
            <div className="trace-stat-cell">
              <span className="tsc-label">Khu Vực Canh Tác</span>
              <span className="tsc-value">{result.batch.cultivationArea}</span>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="trace-section-head">
              <span className="tsh-icon">📓</span>
              Hành Trình Canh Tác
            </div>
            {result.logs.length === 0 ? (
              <div className="trace-empty">🌱 Chưa có nhật ký canh tác nào được ghi nhận.</div>
            ) : (
              <div className="trace-timeline-wrap">
                {result.logs.map((log, i) => (
                  <AnimatedCard key={i} className="trace-tl-item" delay={i * 120}>
                    <div className="trace-tl-dot" />
                    <div className="trace-tl-card">
                      <div className="ttc-header">
                        <span className="ttc-time">{tsToDateTime(log.timestamp)}</span>
                        <span className="ttc-type">{log.actionType}</span>
                      </div>
                      <div className="ttc-desc">{log.description}</div>
                      <div className="ttc-tags">
                        {log.operatorName && <span className="ttc-tag">👷 {log.operatorName}</span>}
                        {log.materialName && <span className="ttc-tag">🧪 {log.materialName} ({log.dosage})</span>}
                        {log.weatherCondition && <span className="ttc-tag">🌤️ {log.weatherCondition}</span>}
                      </div>
                    </div>
                  </AnimatedCard>
                ))}
              </div>
            )}
          </div>

          {/* Logistics Timeline */}
          {result.logistics && result.logistics.length > 0 && (
            <div>
              <div className="trace-section-head" style={{ marginTop: '30px' }}>
                <span className="tsh-icon">🚚</span>
                Chuỗi Cung Ứng & Logistics
              </div>
              <div className="trace-timeline-wrap">
                {result.logistics.map((loc, i) => (
                  <AnimatedCard key={i} className={`trace-tl-item ${loc.anomaly ? 'has-anomaly' : ''}`} delay={i * 120}>
                    <div className="trace-tl-dot" style={{ background: loc.anomaly ? '#ef4444' : '#0ea5e9', boxShadow: loc.anomaly ? '0 0 10px rgba(239,68,68,0.5)' : '' }} />
                    <div className="trace-tl-card" style={loc.anomaly ? { border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' } : {}}>
                      <div className="ttc-header">
                        <span className="ttc-time">{tsToDateTime(loc.timestamp)}</span>
                        <span className="ttc-type" style={loc.anomaly ? { color: '#ef4444' } : {}}>{loc.eventType}</span>
                      </div>
                      <div className="ttc-desc">📍 {loc.location}</div>
                      <div className="ttc-tags">
                        <span className="ttc-tag">🌡 {Number(loc.temperature)}°C</span>
                        <span className="ttc-tag">💧 {Number(loc.humidity)}%</span>
                        {loc.operatorName && <span className="ttc-tag">👷 {loc.operatorName}</span>}
                      </div>
                      {loc.anomaly && (
                         <div style={{ marginTop: '10px', color: '#fca5a5', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <IconX /> <strong>Cảnh Báo:</strong> {loc.anomaly}
                         </div>
                      )}
                    </div>
                  </AnimatedCard>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          <div style={{ marginTop: '30px' }}>
            <div className="trace-section-head">
              <span className="tsh-icon">🔬</span>
              Chứng Nhận &amp; Kiểm Định
            </div>
            {result.inspections.length === 0 ? (
              <div className="trace-empty">🔬 Lô hàng đang chờ đợt kiểm định chính thức.</div>
            ) : (
              <div className="trace-cert-grid">
                {result.inspections.map((ins, i) => {
                  const isPassed = ins.result === 'Đạt';
                  return (
                    <AnimatedCard
                      key={i}
                      className={`trace-cert-card ${isPassed ? 'pass-card' : 'fail-card'}`}
                      delay={i * 130}
                    >
                      {/* Colored top strip */}
                      <div className="tcc-strip" />

                      {/* Faint diagonal watermark — like official inspection stamps */}
                      <div className="tcc-watermark">{isPassed ? 'PASSED' : 'FAILED'}</div>

                      <div className="tcc-inner">
                        <div className="tcc-header">
                          <div className="tcc-meta">
                            <div className="tcc-id">Certificate #{ins.inspectionId.toString()}</div>
                            <div className="tcc-org">{ins.organization}</div>
                            <div className="tcc-by">👤 {ins.inspectorName}</div>
                          </div>
                          {/* Icon-only circle badge — no text */}
                          <div className={`tcc-badge ${isPassed ? 'pass' : 'fail'}`}>
                            {isPassed ? <IconCheck /> : <IconX />}
                          </div>
                        </div>

                        <div className="tcc-divider" />

                        <div className="tcc-content">
                          "{ins.inspectionContent}"
                        </div>

                        <div className="tcc-footer">
                          <span>🗓 {tsToDateTime(ins.timestamp)}</span>
                          <span className="tcc-footer-status">
                            {isPassed ? <IconCheck /> : <IconX />}
                            {ins.approvalStatus}
                          </span>
                        </div>
                      </div>
                    </AnimatedCard>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
