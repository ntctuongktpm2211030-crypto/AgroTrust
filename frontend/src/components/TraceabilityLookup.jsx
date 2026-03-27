import { useState, useEffect, useRef } from 'react';
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

/* ── Main Component ────────────────────────────────────── */
export default function TraceabilityLookup({ contract }) {
  const [searchType, setSearchType] = useState('id');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Product image (base64 or URL string)
  const [productImage, setProductImage] = useState(null);
  const fileInputRef = useRef(null);

  const fromTs = ts => ts && ts > 0n
    ? new Date(Number(ts) * 1000).toLocaleDateString('vi-VN')
    : '—';
  const tsToDateTime = ts => new Date(Number(ts) * 1000).toLocaleString('vi-VN');

  const lookupById = async (id) => {
    if (!id || isNaN(Number(id)) || Number(id) < 1) {
      setError('Vui lòng nhập mã lô hàng hợp lệ (số nguyên dương)');
      return;
    }
    try {
      setLoading(true); setError(''); setResult(null); setSearchResults([]);
      const bid = BigInt(id);
      const batch = await contract.batches(bid);
      if (!batch || batch.batchId === 0n) { setError('Không tìm thấy lô hàng với mã này.'); return; }
      const farm = await contract.farms(batch.farmId);
      const logs = await contract.getBatchLogs(bid);
      const inspections = await contract.getBatchInspections(bid);
      setResult({ batch, farm, logs: [...logs].reverse(), inspections: [...inspections].reverse() });
    } catch (e) {
      setError('Lỗi khi tra cứu: ' + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  const searchByName = async () => {
    if (!searchValue?.trim()) { setError('Vui lòng nhập tên nông sản cần tìm'); return; }
    try {
      setLoading(true); setError(''); setResult(null); setSearchResults([]);
      const count = await contract.batchCount();
      const matches = [];
      const query = searchValue.toLowerCase().trim();
      for (let i = 1n; i <= count; i++) {
        const batch = await contract.batches(i);
        if (batch.productName.toLowerCase().includes(query)) {
          const farm = await contract.farms(batch.farmId);
          matches.push({ batch, farm });
        }
      }
      if (matches.length === 0) setError('Không tìm thấy nông sản nào khớp tên này.');
      else setSearchResults(matches);
    } catch (e) {
      setError('Lỗi khi tìm kiếm: ' + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => searchType === 'id' ? lookupById(searchValue) : searchByName();
  const statusInfo = result ? STATUS_LABELS[Number(result.batch.status)] : null;

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProductImage(ev.target.result);
    reader.readAsDataURL(file);
  };

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
                        <div className="trc-icon-wrap">🌿</div>
                      </div>
                      <div className="trc-mid">
                        <div className="trc-top-row">
                          <div className="trc-pill">Lô #{item.batch.batchId.toString()}</div>
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
          <button className="trace-back-btn" onClick={() => { setResult(null); setSearchResults([]); setProductImage(null); }}>
            ← Quay lại tìm kiếm
          </button>

          {/* Hero */}
          <div className="trace-product-hero">
            <div className="tph-banner">
              <div className="tph-left">
                {/* Product image — click to upload your own photo */}
                <div className="tph-icon" title="Click để thay ảnh sản phẩm">
                  {productImage
                    ? <img src={productImage} alt="Sản phẩm" />
                    : <span>🌿</span>
                  }
                  <div className="tph-icon-overlay">
                    <IconUpload />
                    <span>Đổi ảnh</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
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

          {/* Certifications */}
          <div>
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
