import { useState, useEffect } from 'react';
import { getIpfsUrl } from '../utils/pinata';

const STATUS_LABELS = ['Đã gieo trồng','Đang chăm sóc','Đã bón phân','Đã phun thuốc','Đã thu hoạch','Đã đóng gói','Đang vận chuyển','Đã kiểm định','Đã phân phối'];

/* ── Đọc ảnh nông sản từ localStorage (lưu bởi FarmDashboard) ── */
const getCropImages = () => {
  try { return JSON.parse(localStorage.getItem('agrotrust_crop_images') || '{}'); }
  catch { return {}; }
};

export default function BatchDashboard({ contract, account }) {
  const [batches, setBatches] = useState([]);
  // farmList lưu đủ thông tin farm (id + cropType) để chọn ảnh
  const [farmList, setFarmList] = useState([]);   // [{ id, name, cropType }]
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    farmId: '', productName: '', plantType: '', cultivationArea: '',
    sowingDate: '', expectedHarvestDate: '', expectedQuantity: '', quantityUnit: 'kg', dataHash: ''
  });

  // Ảnh nông sản của farm đang chọn (đọc từ localStorage)
  const [cropPreview, setCropPreview] = useState(null);  // { image, cropType }
  // Lưu danh sách nông sản con đã tách của farm để user chọn nếu farm trồng nhiều loại
  const [availableCrops, setAvailableCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { loadData(); }, [account]);

  // Khi farmId thay đổi → parse danh sách cropType và auto-chọn cái đầu tiên
  useEffect(() => {
    if (!form.farmId) { 
      setAvailableCrops([]); setSelectedCrop(''); setCropPreview(null); return; 
    }
    const farm = farmList.find(f => f.id === form.farmId);
    if (!farm || !farm.cropType) { 
      setAvailableCrops([]); setSelectedCrop(''); setCropPreview(null); return; 
    }
    const crops = farm.cropType.split(/[,;/]+/).map(s => s.trim()).filter(Boolean);
    setAvailableCrops(crops);
    if (crops.length > 0) setSelectedCrop(crops[0]);
  }, [form.farmId, farmList]);

  // Khi selectedCrop thay đổi → load preview ảnh tương ứng
  useEffect(() => {
    if (!selectedCrop) {
      setCropPreview(null); return;
    }
    const images = getCropImages();
    const key = selectedCrop.toLowerCase();
    const img = images[key] || null;
    setCropPreview({ image: img, cropType: selectedCrop });
    
    // Tự điền plantType theo crop hiện tại nếu chưa có
    setForm(f => ({ ...f, plantType: selectedCrop }));
  }, [selectedCrop]);

  const loadData = async () => {
    try {
      const fc = await contract.farmCount();
      const list = [];
      for (let i = 1n; i <= fc; i++) {
        const f = await contract.farms(i);
        if (f.ownerAddress.toLowerCase() === account.toLowerCase()) {
          list.push({ id: i.toString(), name: f.farmName, cropType: f.cropType });
        }
      }
      setFarmList(list);

      const bc = await contract.batchCount();
      const ids = list.map(f => f.id);
      const bList = [];
      for (let i = 1n; i <= bc; i++) {
        const b = await contract.batches(i);
        if (ids.includes(b.farmId.toString())) bList.push(b);
      }
      setBatches(bList);
    } catch (e) { console.error(e); }
  };

  const toTimestamp = s => s ? Math.floor(new Date(s).getTime() / 1000) : 0;
  const fromTs = ts => ts > 0n ? new Date(Number(ts) * 1000).toLocaleDateString('vi-VN') : '—';

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.farmId || !form.productName || !form.sowingDate) {
      setMsg('⚠️ Chú ý: Vui lòng điền đầy đủ các thông tin bắt buộc.');
      setTimeout(() => setMsg(''), 5000);
      return;
    }
    try {
      setLoading(true);
      setMsg('⏳ Đang đồng bộ dữ liệu lô hàng lên hệ thống Blockchain...');
      const tx = await contract.addBatch(
        BigInt(form.farmId),
        form.productName,
        form.plantType,
        form.cultivationArea,
        BigInt(toTimestamp(form.sowingDate)),
        BigInt(toTimestamp(form.expectedHarvestDate)),
        BigInt(form.expectedQuantity || 0),
        form.quantityUnit,
        form.dataHash
      );
      await tx.wait();
      setMsg('🎉 Hoàn tất: Lô hàng mới đã được khởi tạo thành công!');
      setTimeout(() => setMsg(''), 5000);
      setForm({ farmId:'', productName:'', plantType:'', cultivationArea:'', sowingDate:'', expectedHarvestDate:'', expectedQuantity:'', quantityUnit:'kg', dataHash:'' });
      setCropPreview(null);
      loadData();
    } catch (err) {
      setMsg('❌ Lỗi giao dịch: ' + (err.reason || err.message));
      setTimeout(() => setMsg(''), 5000);
    } finally { setLoading(false); }
  };

  const cropImages = getCropImages();

  return (
    <div className="dash-wrap">
      <h2 className="dash-title">🌾 Quản Lý Lô Hàng</h2>

      <div className="card-panel glass-card">
        <h3>Tạo Lô Hàng mới</h3>
        <form className="custom-form" onSubmit={handleSubmit}>

          <div className="form-row">
            <div className="form-group">
              <label>Nông trại <span className="req">*</span></label>
              <select value={form.farmId} onChange={set('farmId')}>
                <option value="">-- Chọn nông trại --</option>
                {farmList.map(f => (
                  <option key={f.id} value={f.id}>
                    #{f.id} — {f.name}{f.cropType ? ` (${f.cropType})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tên lô hàng <span className="req">*</span></label>
              <input value={form.productName} onChange={set('productName')} placeholder="VD: Sầu riêng vụ hạ" />
            </div>
          </div>

          {/* ── Nếu farm có nhiều loại nông sản, cho phép user chọn ─────────── */}
          {form.farmId && availableCrops.length > 1 && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Chọn nông sản cho lô hàng này <span className="req">*</span></label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                {availableCrops.map(crop => (
                  <label key={crop} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '8px 16px', background: selectedCrop === crop ? 'rgba(13,148,136,0.1)' : '#f8fafc',
                    border: `1.5px solid ${selectedCrop === crop ? '#0d9488' : '#e2e8f0'}`,
                    borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700',
                    color: selectedCrop === crop ? '#065f46' : '#475569',
                    transition: 'all 0.2s',
                    userSelect: 'none'
                  }}>
                    <input 
                      type="radio" name="selectedCrop" value={crop}
                      checked={selectedCrop === crop}
                      onChange={e => setSelectedCrop(e.target.value)}
                      style={{ display: 'none' }}
                    />
                    {crop}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Preview ảnh nông sản đã chọn ─────────── */}
          {form.farmId && selectedCrop && cropPreview && (
            <div className="batch-crop-preview" style={{ marginBottom: '16px' }}>
              {cropPreview.image ? (
                <>
                  <img src={getIpfsUrl(cropPreview.image) || cropPreview.image} alt={cropPreview.cropType} className="bcp-img" />
                  <div className="bcp-info">
                    <div className="bcp-label">Nông sản</div>
                    <div className="bcp-name">{cropPreview.cropType}</div>
                    <div className="bcp-hint">Ảnh từ Cloud (IPFS) · Dùng cho lô hàng này</div>
                  </div>
                </>
              ) : (
                <div className="bcp-no-image">
                  🖼 Nông sản <strong>"{cropPreview.cropType}"</strong> chưa có ảnh —
                  <span> vào <em>Quản Lý Nông Trại</em> upload để người tra cứu dễ nhận diện.</span>
                </div>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Giống / Loại cây trồng</label>
              <input value={form.plantType} onChange={set('plantType')} placeholder="VD: Giống F1, ST25, New Zealand" />
            </div>
            <div className="form-group">
              <label>Khu vực canh tác</label>
              <input value={form.cultivationArea} onChange={set('cultivationArea')} placeholder="VD: Khu A, Nhà màng số 3" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Ngày gieo trồng <span className="req">*</span></label>
              <input type="date" value={form.sowingDate} onChange={set('sowingDate')} />
            </div>
            <div className="form-group">
              <label>Ngày thu hoạch dự kiến</label>
              <input type="date" value={form.expectedHarvestDate} onChange={set('expectedHarvestDate')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Sản lượng dự kiến</label>
              <input type="number" value={form.expectedQuantity} onChange={set('expectedQuantity')} placeholder="VD: 500" />
            </div>
            <div className="form-group">
              <label>Đơn vị tính</label>
              <select value={form.quantityUnit} onChange={set('quantityUnit')}>
                {['kg','tấn','thùng','giỏ','bao'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          {msg && <p className={`form-msg ${msg.startsWith('✅') ? 'success' : msg.startsWith('❌') ? 'error-msg' : ''}`}>{msg}</p>}
          <button type="submit" className="btn primary-btn" disabled={loading}>
            {loading ? '⏳ Đang xử lý...' : '🚀 Tạo Lô Hàng'}
          </button>
        </form>
      </div>

      <div className="card-panel glass-card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3>Danh sách Lô Hàng ({batches.length})</h3>
          <button className="btn-refresh" onClick={loadData}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 2.1-5.9L2 9"/>
            </svg>
            Làm mới
          </button>
        </div>
        {batches.length === 0 ? (
          <p className="empty-msg">Chưa có lô hàng nào. Hãy tạo mới ở trên!</p>
        ) : (
          <div className="farms-grid">
            {batches.map(b => {
              // Tìm cropType của farm tương ứng để lấy ảnh
              const farm = farmList.find(f => f.id === b.farmId.toString());
              const cid = farm?.cropType ? cropImages[farm.cropType.trim().toLowerCase()] : null;
              return (
                <div className="farm-item" key={b.batchId.toString()}>
                  {cid && (
                    <div className="farm-crop-img">
                      <img src={getIpfsUrl(cid) || cid} alt={farm.cropType} />
                    </div>
                  )}
                  <div className="farm-id">Lô #{b.batchId.toString()}</div>
                  <div className="farm-title">{b.productName}</div>
                  <span>🏡 Nông trại #{b.farmId.toString()} — 🌿 {b.plantType}</span>
                  <span>📍 {b.cultivationArea}</span>
                  <span>🌱 Gieo: {fromTs(b.sowingDate)} — 🗓️ Thu hoạch: {fromTs(b.expectedHarvestDate)}</span>
                  <span>📦 Dự kiến: {b.expectedQuantity.toString()} {b.quantityUnit}</span>
                  <span className="active-badge">{STATUS_LABELS[Number(b.status)]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
