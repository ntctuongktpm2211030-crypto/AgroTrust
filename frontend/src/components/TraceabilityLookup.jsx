import { useState, useEffect } from 'react';
import { Contract, JsonRpcProvider, keccak256, toUtf8Bytes } from 'ethers';
import { NETWORK_CONFIG, CONTRACT_ABI } from '../config';
import { Sprout, Leaf, Citrus, Droplet, Wheat, Package, Truck, Medal, Store, Home, MapPin, Search, BookText, ShieldCheck, Thermometer, Droplets, User, Beaker, Sun, FileText, AlertTriangle } from 'lucide-react';
import './TraceabilityLookup.css';

const STATUS_LABELS = [
  { text: 'Đã gieo trồng', icon: <Sprout size={18} color="#16a34a" strokeWidth={2.5}/> },
  { text: 'Đang chăm sóc', icon: <Leaf size={18} color="#059669" strokeWidth={2.5}/> },
  { text: 'Đã bón phân', icon: <Citrus size={18} color="#d97706" strokeWidth={2.5}/> },
  { text: 'Đã phun thuốc', icon: <Droplet size={18} color="#0ea5e9" strokeWidth={2.5}/> },
  { text: 'Đã thu hoạch', icon: <Wheat size={18} color="#ca8a04" strokeWidth={2.5}/> },
  { text: 'Đã đóng gói', icon: <Package size={18} color="#8b5cf6" strokeWidth={2.5}/> },
  { text: 'Đang vận chuyển', icon: <Truck size={18} color="#3b82f6" strokeWidth={2.5}/> },
  { text: 'Đã kiểm định', icon: <Medal size={18} color="#7c3aed" strokeWidth={2.5}/> },
  { text: 'Đã phân phối', icon: <Store size={18} color="#db2777" strokeWidth={2.5}/> },
];

/* ── SVG Icons ─────────────────────────────────────────── */
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const IconSpin = () => (
  <svg className="tsb-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
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
  "0x88bb0": "https://rpc.hoodi.ethpandaops.io",        // Hoodi
  "0xaa36a7": "https://rpc.ankr.com/eth_sepolia",        // Sepolia (Ankr allows CORS)
  "0x515": "https://sepolia.unichain.org"             // Unichain Sepolia
};

// Helper: get image src from a CID or data URL string
const getImgSrc = (cid) => {
  if (!cid) return null;
  if (cid.startsWith('data:')) return cid;
  return `https://ipfs.io/ipfs/${cid}`;
};

/** Gọi getter ẩn/hiện khách — retry khi RPC lỗi, mặc định ẩn nếu không đọc được */
const safeCustomerHidden = async (c, method, id) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await c[method](id);
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      // Contract cũ chưa có hàm → không ẩn
      if (msg.includes('call revert') || msg.includes('missing revert') ||
          msg.includes('function selector') || msg.includes('no matching function') ||
          msg.includes('could not decode')) {
        return false;
      }
      // RPC lỗi tạm → thử lại
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      console.warn(`[AgroTrust] ${method}(${id}) failed after 3 attempts, default → hidden`, err);
      return true; // An toàn: mặc định ẩn khi không đọc được
    }
  }
  return true;
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
    } catch { }
  }
  return result;
};

export default function TraceabilityLookup({ contract, forcedPage = null }) {
  const CUSTOMER_PAGES = {
    SEARCH: 'search',
    FARMS: 'farms',
    BATCHES: 'batches',
    CROPS: 'crops',
  };
  const [searchType, setSearchType] = useState('id');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [result, setResult] = useState(null);
  const [customerPage, setCustomerPage] = useState(CUSTOMER_PAGES.SEARCH);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [allFarms, setAllFarms] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [cropFilter, setCropFilter] = useState('all');
  const [farmSearch, setFarmSearch] = useState('');
  const [batchSearch, setBatchSearch] = useState('');
  const [cropSearch, setCropSearch] = useState('');
  const [farmFilter, setFarmFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [copiedText, setCopiedText] = useState('');

  // Auto load batchId from URL
  const effectivePage = forcedPage || customerPage;

  useEffect(() => {
    if (!contract || effectivePage !== CUSTOMER_PAGES.SEARCH) return;
    const bid = new URLSearchParams(window.location.search).get('batchId');
    if (bid) {
      setSearchType('id');
      setSearchValue(bid);
      lookupById(bid);
    }
  }, [contract, effectivePage]);

  useEffect(() => {
    loadPublicCatalog();
  }, [contract]);

  const fromTs = ts => ts && ts > 0n
    ? new Date(Number(ts) * 1000).toLocaleDateString('vi-VN')
    : '—';
  const tsToDateTime = ts => new Date(Number(ts) * 1000).toLocaleString('vi-VN');
  const toShortHash = (text) => {
    if (!text) return '—';
    const full = keccak256(toUtf8Bytes(text));
    return `${full.slice(0, 12)}...${full.slice(-8)}`;
  };
  const makeQrUrl = (value) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(value)}`;
  const copyToClipboard = async (value, label = 'mã hash') => {
    if (!value || value === '—') return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedText(`Đã sao chép ${label}`);
      setTimeout(() => setCopiedText(''), 1800);
    } catch {
      setCopiedText('Không thể sao chép');
      setTimeout(() => setCopiedText(''), 1800);
    }
  };

  const loadPublicCatalog = async () => {
    try {
      setCatalogLoading(true);
      const sources = buildAllContracts();
      
      let localImages = {};
      try { localImages = JSON.parse(localStorage.getItem('agrotrust_crop_images') || '{}'); } catch {}

      const farms = [];
      const batches = [];
      const farmMap = new Map();
      const seenFarm = new Set();
      const seenBatch = new Set();

      await Promise.all(
        sources.map(async ({ networkName, contract: c }) => {
          try {
            const fc = await c.farmCount();
            for (let i = 1n; i <= fc; i++) {
              const f = await c.farms(i);
              if (!f || f.farmId === 0n) continue;
              if (!f.isActive) continue;
              const farmHidden = await safeCustomerHidden(c, 'farmHiddenFromCustomer', i);
              if (farmHidden) continue;
              const farmId = f.farmId.toString();
              const farmKey = `${networkName}|${farmId}`;
              if (seenFarm.has(farmKey)) continue;
              seenFarm.add(farmKey);
              const farmHashSource = [
                networkName,
                farmId,
                f.farmName,
                f.ownerName,
                f.location,
                f.cropType
              ].join('|');
              const farmHash = keccak256(toUtf8Bytes(farmHashSource));
              const localFarmCid = localImages[(f.cropType || '').trim().toLowerCase()] || null;
              const farmItem = {
                networkName,
                farmId,
                farmName: f.farmName,
                ownerName: f.ownerName,
                location: f.location,
                cropType: f.cropType,
                localCid: localFarmCid,
                hash: farmHash,
                qrData: `${window.location.origin}?farmId=${farmId}&network=${encodeURIComponent(networkName)}`
              };
              farms.push(farmItem);
              farmMap.set(farmKey, farmItem);
            }
          } catch { }

          try {
            const bc = await c.batchCount();
            for (let i = 1n; i <= bc; i++) {
              const b = await c.batches(i);
              if (!b || b.batchId === 0n) continue;
              const farmForBatch = await c.farms(b.farmId);
              if (!farmForBatch.isActive) continue;
              const farmH = await safeCustomerHidden(c, 'farmHiddenFromCustomer', b.farmId);
              if (farmH) continue;
              const batchH = await safeCustomerHidden(c, 'batchHiddenFromCustomer', b.batchId);
              if (batchH) continue;
              const batchId = b.batchId.toString();
              const farmId = b.farmId.toString();
              const batchKey = `${networkName}|${batchId}`;
              if (seenBatch.has(batchKey)) continue;
              seenBatch.add(batchKey);
              const relatedFarm = farmMap.get(`${networkName}|${farmId}`);
              const batchHashSource = [
                networkName,
                batchId,
                farmId,
                b.productName,
                b.plantType,
                b.dataHash || ''
              ].join('|');
              const recordHash = keccak256(toUtf8Bytes(batchHashSource));
              const localBatchCid = localImages[(b.plantType || '').trim().toLowerCase()] || null;
              batches.push({
                networkName,
                batchId,
                farmId,
                productName: b.productName,
                plantType: b.plantType,
                dataHash: b.dataHash || localBatchCid || '',
                recordHash,
                farmName: relatedFarm?.farmName || `Nông trại #${farmId}`,
                qrData: `${window.location.origin}?batchId=${batchId}`
              });
            }
          } catch { }
        })
      );

      farms.sort((a, b) => Number(b.farmId) - Number(a.farmId));
      batches.sort((a, b) => Number(b.batchId) - Number(a.batchId));
      setAllFarms(farms);
      setAllBatches(batches);
    } finally {
      setCatalogLoading(false);
    }
  };

  // Tra cứu theo ID — dùng tất cả mạng song song
  const lookupById = async (id) => {
    if (!id || isNaN(Number(id)) || Number(id) < 1) {
      setError('Vui lòng nhập mã lô hàng hợp lệ (số nguyên dương)');
      return;
    }
    try {
      setLoading(true); setError(''); setResult(null); setSearchResults([]);
      const bid = BigInt(id);
      const sources = buildAllContracts();

      const promises = sources.map(async ({ networkName, contract: c }) => {
        try {
          const batch = await c.batches(bid);
          if (!batch || batch.batchId === 0n) return { kind: 'absent' };
          const farm = await c.farms(batch.farmId);
          const farmHidden = await safeCustomerHidden(c, 'farmHiddenFromCustomer', batch.farmId);
          const batchHidden = await safeCustomerHidden(c, 'batchHiddenFromCustomer', bid);
          if (!farm.isActive || farmHidden || batchHidden) return { kind: 'blocked' };
          const logs = await c.getBatchLogs(bid);
          const inspections = await c.getBatchInspections(bid);
          const logistics = await c.getBatchLogistics(bid);
          return {
            kind: 'ok',
            data: {
              batch,
              farm,
              logs: [...logs].reverse(),
              inspections: [...inspections].reverse(),
              logistics: [...logistics].reverse(),
              networkName,
            },
          };
        } catch {
          return { kind: 'absent' };
        }
      });

      const results = await Promise.all(promises);
      const ok = results.find((r) => r.kind === 'ok');
      if (ok) {
        setResult(ok.data);
        return;
      }
      if (results.some((r) => r.kind === 'blocked')) {
        setError('Lô hoặc nông trại không hiển thị công khai (đã ẩn hoặc tạm ngưng).');
        return;
      }
      setError('Không tìm thấy lô hàng với mã này trên tất cả các mạng.');
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
      const sources = buildAllContracts();

      const allMatches = [];
      await Promise.all(sources.map(async ({ networkName, contract: c }) => {
        try {
          const count = await c.batchCount();
          for (let i = 1n; i <= count; i++) {
            const batch = await c.batches(i);
            if (!batch.productName.toLowerCase().includes(query)) continue;
            const farm = await c.farms(batch.farmId);
            if (!farm.isActive) continue;
            const farmHidden = await safeCustomerHidden(c, 'farmHiddenFromCustomer', batch.farmId);
            if (farmHidden) continue;
            const batchHidden = await safeCustomerHidden(c, 'batchHiddenFromCustomer', batch.batchId);
            if (batchHidden) continue;
            allMatches.push({ batch, farm, networkName });
          }
        } catch { }
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
  const uniqueCropTypes = Array.from(
    new Set(
      allBatches
        .flatMap(b => (b.plantType || '').split(/[,;/]+/).map(x => x.trim()))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'vi'));
  const uniqueFarmNetworks = Array.from(new Set(allFarms.map(f => f.networkName))).filter(Boolean);
  const uniqueBatchNetworks = Array.from(new Set(allBatches.map(b => b.networkName))).filter(Boolean);
  const filteredCropBatches = cropFilter === 'all'
    ? allBatches
    : allBatches.filter(b =>
      (b.plantType || '')
        .toLowerCase()
        .split(/[,;/]+/)
        .map(x => x.trim())
        .includes(cropFilter.toLowerCase())
    );
  const normalizedFarmSearch = farmSearch.trim().toLowerCase();
  const normalizedBatchSearch = batchSearch.trim().toLowerCase();
  const normalizedCropSearch = cropSearch.trim().toLowerCase();
  const farmsByFilter = farmFilter === 'all'
    ? allFarms
    : allFarms.filter(f => f.networkName === farmFilter);
  const visibleFarms = normalizedFarmSearch
    ? farmsByFilter.filter(f =>
      [f.farmId, f.farmName, f.ownerName, f.location, f.cropType, f.networkName]
        .join(' ')
        .toLowerCase()
        .includes(normalizedFarmSearch)
    )
    : farmsByFilter;
  const batchesByFilter = batchFilter === 'all'
    ? allBatches
    : allBatches.filter(b => b.networkName === batchFilter);
  const visibleBatches = normalizedBatchSearch
    ? batchesByFilter.filter(b =>
      [b.batchId, b.productName, b.farmName, b.plantType, b.networkName]
        .join(' ')
        .toLowerCase()
        .includes(normalizedBatchSearch)
    )
    : batchesByFilter;
  const visibleCropBatches = normalizedCropSearch
    ? filteredCropBatches.filter(b =>
      [b.batchId, b.productName, b.plantType, b.farmName]
        .join(' ')
        .toLowerCase()
        .includes(normalizedCropSearch)
    )
    : filteredCropBatches;

  return (
    <div className="trace-page-wrap">
      {/* ── Page Header ── */}
      <div className="trace-hero-title">
        <div className="tht-badge">⛓ Blockchain Verified</div>
        <h1>Hành Trình <em>Nông Sản</em></h1>
        <p>Tra cứu nguồn gốc, lịch sử canh tác và chứng nhận an toàn theo thời gian thực từ Blockchain.</p>
      </div>
      {copiedText && <div className="trace-copy-toast">{copiedText}</div>}

      {!result && !forcedPage && (
        <div className="trace-page-switcher">
          <button
            className={customerPage === CUSTOMER_PAGES.SEARCH ? 'active' : ''}
            onClick={() => setCustomerPage(CUSTOMER_PAGES.SEARCH)}
          >
            Trang tra cứu
          </button>
          <button
            className={customerPage === CUSTOMER_PAGES.FARMS ? 'active' : ''}
            onClick={() => setCustomerPage(CUSTOMER_PAGES.FARMS)}
          >
            Trang nông trại
          </button>
          <button
            className={customerPage === CUSTOMER_PAGES.BATCHES ? 'active' : ''}
            onClick={() => setCustomerPage(CUSTOMER_PAGES.BATCHES)}
          >
            Trang lô hàng
          </button>
          <button
            className={customerPage === CUSTOMER_PAGES.CROPS ? 'active' : ''}
            onClick={() => setCustomerPage(CUSTOMER_PAGES.CROPS)}
          >
            Trang nông sản
          </button>
        </div>
      )}

      {/* ── Search View ── */}
      {!result && effectivePage === CUSTOMER_PAGES.SEARCH && (
        <>
          {/* Toggle */}
          <div className="trace-toggle-row">
            <div className="trace-toggle">
              <button
                className={searchType === 'name' ? 'active' : ''}
                onClick={() => { setSearchType('name'); setSearchValue(''); setError(''); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4C7.1 4 4 7.1 4 11s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7z" />
                  <path d="M11 8v6M8 11h6" />
                </svg>
                Theo Tên
              </button>
              <button
                className={searchType === 'id' ? 'active' : ''}
                onClick={() => { setSearchType('id'); setSearchValue(''); setError(''); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <path d="M9 9h6M9 12h6M9 15h4" />
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

          {error && <div className="trace-error" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={18}/> {error}</div>}

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
                          : <div className="trc-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}><Leaf size={24} color="#059669"/></div>
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
                            <div className="tdr-icon" style={{ display: 'flex', alignItems: 'center' }}><Home size={14} color="#16a34a" /></div>
                            <span className="tdr-text"><strong>{item.farm.farmName}</strong></span>
                          </div>
                          <div className="trc-detail-row">
                            <div className="tdr-icon" style={{ display: 'flex', alignItems: 'center' }}><Sprout size={14} color="#059669" /></div>
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

      {!result && effectivePage === CUSTOMER_PAGES.FARMS && (
        <div className="trace-public-wrap">
          <div className="trace-section-head">
            <span className="tsh-icon" style={{ display: 'flex' }}><Home size={20}/></span>
            Danh sách tất cả nông trại
          </div>
          <div className="trace-tools-row">
            <div className="trace-mini-search">
              <div className="trace-mini-search-inner">
                <span className="tms-icon" style={{ display: 'flex' }}><Search size={16}/></span>
                <input
                  value={farmSearch}
                  onChange={(e) => setFarmSearch(e.target.value)}
                  placeholder="Tìm tên, chủ trại, địa chỉ, mã..."
                />
                {farmSearch && (
                  <button className="tms-clear" onClick={() => setFarmSearch('')} aria-label="Xóa tìm kiếm nông trại">✕</button>
                )}
              </div>
            </div>
            <div className="trace-filter-box">
              <select value={farmFilter} onChange={(e) => setFarmFilter(e.target.value)}>
                <option value="all">Tất cả mạng</option>
                {uniqueFarmNetworks.map(net => <option key={net} value={net}>{net}</option>)}
              </select>
            </div>
          </div>
          {catalogLoading ? (
            <div className="trace-empty">Đang tải dữ liệu công khai...</div>
          ) : visibleFarms.length === 0 ? (
            <div className="trace-empty">Chưa có dữ liệu nông trại.</div>
          ) : (
            <div className="trace-public-grid">
              {visibleFarms.map((farm, idx) => (
                <AnimatedCard key={`${farm.networkName}-${farm.farmId}`} className="trace-public-card" delay={idx * 40}>
                  {farm.localCid && (
                    <div style={{ width: '100%', height: '160px', marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <img src={getImgSrc(farm.localCid)} alt={farm.cropType} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className="tpc-head">
                    <span className="tpc-title">#{farm.farmId} · {farm.farmName}</span>
                    <span className="tpc-net">{farm.networkName}</span>
                  </div>
                  <div className="tpc-line" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Leaf size={14} color="#ca8a04"/> {farm.cropType || 'Chưa khai báo nông sản'}</div>
                  <div className="tpc-line" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} color="#ef4444"/> {farm.location || 'Chưa có địa chỉ'}</div>
                  <div className="tpc-hash-row">
                    <div className="tpc-hash">Hash: {toShortHash(farm.hash)}</div>
                    <button className="tpc-copy-btn" onClick={() => copyToClipboard(farm.hash, 'hash nông trại')}>Copy</button>
                  </div>
                  <div className="tpc-qr">
                    <img src={makeQrUrl(farm.qrData)} alt={`QR farm ${farm.farmId}`} />
                  </div>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>
      )}

      {!result && effectivePage === CUSTOMER_PAGES.BATCHES && (
        <div className="trace-public-wrap">
          <div className="trace-section-head">
            <span className="tsh-icon" style={{ display: 'flex' }}><Package size={20}/></span>
            Tất cả lô hàng
          </div>
          <div className="trace-tools-row">
            <div className="trace-mini-search">
              <div className="trace-mini-search-inner">
                <span className="tms-icon" style={{ display: 'flex' }}><Search size={16}/></span>
                <input
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  placeholder="Tìm tên lô, nông trại, loại cây, mã..."
                />
                {batchSearch && (
                  <button className="tms-clear" onClick={() => setBatchSearch('')} aria-label="Xóa tìm kiếm lô hàng">✕</button>
                )}
              </div>
            </div>
            <div className="trace-filter-box">
              <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
                <option value="all">Tất cả mạng</option>
                {uniqueBatchNetworks.map(net => <option key={net} value={net}>{net}</option>)}
              </select>
            </div>
          </div>
          {!catalogLoading && visibleBatches.length === 0 ? (
            <div className="trace-empty">Chưa có dữ liệu lô hàng.</div>
          ) : (
            <div className="trace-public-grid">
              {visibleBatches.map((batch, idx) => (
                <AnimatedCard key={`${batch.networkName}-${batch.batchId}`} className="trace-public-card" delay={idx * 40}>
                  {batch.dataHash && (
                    <div style={{ width: '100%', height: '160px', marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <img src={getImgSrc(batch.dataHash)} alt={batch.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className="tpc-head">
                    <span className="tpc-title">Lô #{batch.batchId} · {batch.productName}</span>
                    <span className="tpc-net">{batch.networkName}</span>
                  </div>
                  <div className="tpc-line" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Home size={14} color="#16a34a"/> {batch.farmName}</div>
                  <div className="tpc-line" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sprout size={14} color="#059669"/> {batch.plantType || 'Chưa có phân loại'}</div>
                  <div className="tpc-hash-row">
                    <div className="tpc-hash">Hash bản ghi: {toShortHash(batch.recordHash)}</div>
                    <button className="tpc-copy-btn" onClick={() => copyToClipboard(batch.recordHash, 'hash bản ghi')}>Copy</button>
                  </div>
                  <div className="tpc-hash-row">
                    <div className="tpc-hash">DataHash: {batch.dataHash ? toShortHash(batch.dataHash) : '—'}</div>
                    <button className="tpc-copy-btn" onClick={() => copyToClipboard(batch.dataHash, 'data hash')}>Copy</button>
                  </div>
                  <div className="tpc-qr">
                    <img src={makeQrUrl(batch.qrData)} alt={`QR batch ${batch.batchId}`} />
                  </div>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>
      )}

      {!result && effectivePage === CUSTOMER_PAGES.CROPS && (
        <div className="trace-public-wrap">
          <div className="trace-section-head">
            <span className="tsh-icon" style={{ display: 'flex' }}><Sprout size={20}/></span>
            Nông sản phân loại
          </div>
          <div className="trace-tools-row">
            <div className="trace-mini-search">
              <div className="trace-mini-search-inner">
                <span className="tms-icon" style={{ display: 'flex' }}><Search size={16}/></span>
                <input
                  value={cropSearch}
                  onChange={(e) => setCropSearch(e.target.value)}
                  placeholder="Tìm tên nông sản, loại cây, mã lô..."
                />
                {cropSearch && (
                  <button className="tms-clear" onClick={() => setCropSearch('')} aria-label="Xóa tìm kiếm nông sản">✕</button>
                )}
              </div>
            </div>
            <div className="trace-filter-box">
              <select
                id="cropFilter"
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value)}
              >
                <option value="all">Tất cả nông sản</option>
                {uniqueCropTypes.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>
          </div>
          {!catalogLoading && visibleCropBatches.length === 0 ? (
            <div className="trace-empty">Không có dữ liệu cho loại nông sản đã chọn.</div>
          ) : (
            <div className="trace-public-grid">
              {visibleCropBatches.map((batch, idx) => (
                <AnimatedCard key={`crop-${batch.networkName}-${batch.batchId}`} className="trace-public-card" delay={idx * 40}>
                  {batch.dataHash && (
                    <div style={{ width: '100%', height: '160px', marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <img src={getImgSrc(batch.dataHash)} alt={batch.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className="tpc-head">
                    <span className="tpc-title">{batch.productName}</span>
                    <span className="tpc-net">Lô #{batch.batchId}</span>
                  </div>
                  <div className="tpc-line" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sprout size={14}/> {batch.plantType || 'Chưa có phân loại'}</div>
                  <div className="tpc-hash-row">
                    <div className="tpc-hash">Hash: {toShortHash(batch.recordHash)}</div>
                    <button className="tpc-copy-btn" onClick={() => copyToClipboard(batch.recordHash, 'hash nông sản')}>Copy</button>
                  </div>
                  <div className="tpc-qr">
                    <img src={makeQrUrl(batch.qrData)} alt={`QR crop batch ${batch.batchId}`} />
                  </div>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>
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
                <div className="tph-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {result.batch.dataHash
                    ? <img src={result.batch.dataHash.startsWith('data:') ? result.batch.dataHash : `https://ipfs.io/ipfs/${result.batch.dataHash}`} alt={result.batch.productName} />
                    : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Leaf size={52} color="#10b981"/></span>
                  }
                </div>
                <div>
                  <div className="tph-tag" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Package size={14} color="#ca8a04"/> LÔ #{result.batch.batchId.toString()}</div>
                  <h2 className="tph-name">{result.batch.productName}</h2>
                  <div className="tph-farm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Home size={16} color="#16a34a"/> {result.farm.farmName} <span style={{opacity:0.5}}>|</span> <MapPin size={16} color="#ef4444"/> {result.farm.location}</div>
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
              <span className="tsh-icon" style={{ display: 'flex' }}><BookText size={20}/></span>
              Hành Trình Canh Tác
            </div>
            {(() => {
              const activeLogs = result.logs.filter((log) => log.isActive);
              return activeLogs.length === 0 ? (
                <div className="trace-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Sprout size={18}/> Chưa có nhật ký canh tác nào được ghi nhận.</div>
              ) : (
                <div className="trace-timeline-wrap">
                  {activeLogs.map((log, i) => (
                    <AnimatedCard key={i} className="trace-tl-item" delay={i * 120}>
                      <div className="trace-tl-dot" />
                      <div className="trace-tl-card">
                        <div className="ttc-header">
                          <span className="ttc-time">{tsToDateTime(log.timestamp)}</span>
                          <span className="ttc-type">{log.actionType}</span>
                        </div>
                        <div className="ttc-desc">{log.description}</div>
                        <div className="ttc-tags">
                          {log.operatorName && <span className="ttc-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} color="#0f766e"/> {log.operatorName}</span>}
                          {log.materialName && <span className="ttc-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Beaker size={12} color="#8b5cf6"/> {log.materialName} ({log.dosage})</span>}
                          {log.weatherCondition && <span className="ttc-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Sun size={12} color="#f59e0b"/> {log.weatherCondition}</span>}
                        </div>
                      </div>
                    </AnimatedCard>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Logistics Timeline */}
          {result.logistics && result.logistics.length > 0 && (
            <div>
              <div className="trace-section-head" style={{ marginTop: '30px' }}>
                <span className="tsh-icon" style={{ display: 'flex' }}><Truck size={20}/></span>
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
                      <div className="ttc-desc" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} color="#ef4444"/> {loc.location}</div>
                      <div className="ttc-tags">
                        <span className="ttc-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Thermometer size={12} color="#ef4444"/> {Number(loc.temperature)}°C</span>
                        <span className="ttc-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Droplets size={12} color="#0ea5e9"/> {Number(loc.humidity)}%</span>
                        {loc.operatorName && <span className="ttc-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} color="#3b82f6"/> {loc.operatorName}</span>}
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
              <span className="tsh-icon" style={{ display: 'flex' }}><ShieldCheck size={20}/></span>
              Chứng Nhận &amp; Kiểm Định
            </div>
            {result.inspections.length === 0 ? (
              <div className="trace-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><ShieldCheck size={18}/> Lô hàng đang chờ đợt kiểm định chính thức.</div>
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
                            <div className="tcc-by" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} color="#7c3aed"/> {ins.inspectorName}</div>
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
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} color="#64748b"/> {tsToDateTime(ins.timestamp)}</span>
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
