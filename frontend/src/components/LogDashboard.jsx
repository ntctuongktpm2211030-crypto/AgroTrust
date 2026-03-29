import { useState, useEffect } from 'react';

import { getIpfsUrl } from '../utils/pinata';

const ACTION_TYPES = ['Tưới nước','Bón phân','Phun thuốc','Làm cỏ','Thu hoạch','Kiểm tra định kỳ','Khác'];

/* ── Đọc ảnh nông sản từ localStorage ── */
const getCropImages = () => {
  try { return JSON.parse(localStorage.getItem('agrotrust_crop_images') || '{}'); }
  catch { return {}; }
};

export default function LogDashboard({ contract, account }) {
  const [logs, setLogs] = useState([]);
  const [batches, setBatches] = useState([]); // [{ id, productName }]
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [cropPreview, setCropPreview] = useState(null); // { image, cropType }
  const [form, setForm] = useState({
    batchId: '', actionType: ACTION_TYPES[0], description: '',
    materialName: '', dosage: '', operatorName: '',
    weatherCondition: '', iotData: '', note: ''
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { loadBatchIds(); }, [account]);

  const loadBatchIds = async () => {
    try {
      const fc = await contract.farmCount();
      const farmIds = [];
      for (let i = 1n; i <= fc; i++) {
        const f = await contract.farms(i);
        if (f.ownerAddress.toLowerCase() === account.toLowerCase()) farmIds.push(i.toString());
      }
      const bc = await contract.batchCount();
      const loadedBatches = [];
      for (let i = 1n; i <= bc; i++) {
        const b = await contract.batches(i);
        if (farmIds.includes(b.farmId.toString())) {
          loadedBatches.push({ id: i.toString(), productName: b.productName });
        }
      }
      setBatches(loadedBatches);
    } catch (e) { console.error(e); }
  };

  const loadLogs = async (bId) => {
    if (!bId) return;
    try {
      const data = await contract.getBatchLogs(BigInt(bId));
      setLogs([...data].reverse());
    } catch (e) { console.error(e); }
  };

  const handleBatchSelect = async v => {
    setSelectedBatch(v);
    setForm(f => ({ ...f, batchId: v }));
    setCropPreview(null);
    if (v) {
      loadLogs(v);
      try {
        const batch = await contract.batches(v);
        const images = getCropImages();

        let farmCropType = '';
        try {
          const farm = await contract.farms(batch.farmId);
          farmCropType = farm.cropType?.trim() || '';
        } catch {}

        const onChainCid = batch.dataHash || null;
        const localCid = farmCropType
          ? images[farmCropType.toLowerCase()] || null
          : null;
        const cid = onChainCid || localCid;
        const imgSrc = cid ? (cid.startsWith('data:') ? cid : getIpfsUrl(cid)) : null;

        const displayCrop =
          batch.plantType?.trim() ||
          farmCropType ||
          `Lô #${batch.batchId?.toString?.() || v}`;

        setCropPreview({ image: imgSrc, cropType: displayCrop });
      } catch (e) {
        console.error("Lỗi khi tải thông tin batch", e);
      }
    } else {
      setLogs([]);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.batchId || !form.description) {
      setMsg('⚠️ Chú ý: Vui lòng chọn lô hàng và nhập nội dung công việc.');
      setTimeout(() => setMsg(''), 5000);
      return;
    }
    try {
      setLoading(true);
      setMsg('⏳ Đang đồng bộ nhật ký lên mạng lưới Blockchain...');
      
      // Chỉ lưu nội dung người dùng nhập
      const finalDesc = form.description;

      const tx = await contract.addCultivationLog(
        BigInt(form.batchId), form.actionType, finalDesc,
        form.materialName, form.dosage, form.operatorName,
        form.weatherCondition, form.iotData, form.note
      );
      await tx.wait();
      setMsg('🎉 Hoàn tất: Nhật ký canh tác đã được ghi nhận an toàn!');
      setTimeout(() => setMsg(''), 5000);
      loadLogs(form.batchId);
      setForm(f => ({ ...f, actionType:'Gieo hạt', description:'', materialName:'', dosage:'', operatorName:'', weatherCondition:'', iotData:'', note:'' }));
    } catch (err) {
      setMsg('❌ Lỗi giao dịch: ' + (err.reason || err.message));
      setTimeout(() => setMsg(''), 5000);
    } finally { setLoading(false); }
  };

  const tsToDate = ts => new Date(Number(ts) * 1000).toLocaleString('vi-VN');

  return (
    <div className="dash-wrap">
      <h2 className="dash-title">📓 Nhật Ký Canh Tác</h2>

      <div className="card-panel glass-card">
        <h3>Ghi nhật ký mới</h3>
        <form className="custom-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Lô hàng đang canh tác <span className="req">*</span></label>
              <select value={form.batchId} onChange={e => handleBatchSelect(e.target.value)}>
                <option value="">-- Chọn lô hàng --</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>Lô #{b.id} — {b.productName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Loại hoạt động</label>
              <select value={form.actionType} onChange={set('actionType')}>
                {ACTION_TYPES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* ── Preview ảnh nông sản của lô đã chọn ─────────── */}
          {form.batchId && cropPreview && (
            <div className="batch-crop-preview" style={{ marginBottom: '16px' }}>
              {cropPreview.image ? (
                <>
                  <img src={cropPreview.image} alt={cropPreview.cropType} className="bcp-img" />
                  <div className="bcp-info">
                    <div className="bcp-label">Đang ghi nhật ký cho</div>
                    <div className="bcp-name">{cropPreview.cropType}</div>
                  </div>
                </>
              ) : (
                <div className="bcp-no-image">
                  🖼 <strong>"{cropPreview.cropType}"</strong> chưa có ảnh.
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Nội dung chi tiết <span className="req">*</span></label>
            <textarea value={form.description} onChange={set('description')} placeholder="Mô tả đầy đủ công việc đã thực hiện..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Vật tư sử dụng</label>
              <input value={form.materialName} onChange={set('materialName')} placeholder="VD: Phân DAP, Thuốc Confidor..." />
            </div>
            <div className="form-group">
              <label>Liều lượng</label>
              <input value={form.dosage} onChange={set('dosage')} placeholder="VD: 5kg/sào, 2 lít/1000m2" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Người thực hiện</label>
              <input value={form.operatorName} onChange={set('operatorName')} placeholder="Tên kỹ sư hoặc công nhân" />
            </div>
            <div className="form-group">
              <label>Thời tiết</label>
              <input value={form.weatherCondition} onChange={set('weatherCondition')} placeholder="Nắng / Mưa / Âm u..." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>📡 Dữ liệu IoT (Nếu có)</label>
              <input value={form.iotData} onChange={set('iotData')} placeholder="VD: Nhiệt độ: 28°C, Độ ẩm: 65%" />
            </div>
            <div className="form-group">
              <label>Ghi chú</label>
              <input value={form.note} onChange={set('note')} placeholder="Vấn đề phát sinh, lưu ý thêm..." />
            </div>
          </div>
          {msg && <p className={`form-msg ${msg.startsWith('✅') ? 'success' : msg.startsWith('❌') ? 'error-msg' : ''}`}>{msg}</p>}
          <button type="submit" className="btn primary-btn" disabled={loading}>
            {loading ? '⏳ Đang xử lý...' : '📝 Ghi Nhật Ký'}
          </button>
        </form>
      </div>

      <div className="card-panel glass-card">
        <h3>Lịch sử Nhật ký {selectedBatch ? `— Lô #${selectedBatch}` : ''} ({logs.length})</h3>
        {logs.length === 0 ? (
          <p className="empty-msg">Chọn một lô hàng và ghi nhật ký để xem lịch sử ở đây.</p>
        ) : (
          <div className="farms-grid">
            {logs.map((l, idx) => (
              <div className="farm-item" key={idx}>
                <div className="farm-id">#{l.logId.toString()} — {tsToDate(l.timestamp)}</div>
                <div className="farm-title">{l.actionType}</div>
                <span>📋 {l.description}</span>
                {l.materialName && <span>🧪 {l.materialName} — {l.dosage}</span>}
                {l.operatorName && <span>👷 {l.operatorName}</span>}
                {l.weatherCondition && <span>🌤️ {l.weatherCondition}</span>}
                {l.iotData && <span>📡 {l.iotData}</span>}
                {l.note && <span>📌 {l.note}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
