import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getIpfsUrl } from '../utils/pinata';
import { Wheat, Image as ImageIcon, PlusCircle, Loader2, Home, Leaf, MapPin, Sprout, Calendar, Package, Link, Truck, Thermometer, Droplets, AlertTriangle, User, CheckCircle2 } from 'lucide-react';

const STATUS_LABELS = ['Đã gieo trồng','Đang chăm sóc','Đã bón phân','Đã phun thuốc','Đã thu hoạch','Đã đóng gói','Đang vận chuyển','Đã kiểm định','Đã phân phối'];

/* ── Đọc ảnh nông sản từ localStorage (lưu bởi FarmDashboard) ── */
const getCropImages = () => {
  try { return JSON.parse(localStorage.getItem('agrotrust_crop_images') || '{}'); }
  catch { return {}; }
};

export default function BatchDashboard({ contract, account, onUserAction }) {
  const [batches, setBatches] = useState([]);
  // farmList lưu đủ thông tin farm (id + cropType) để chọn ảnh
  const [farmList, setFarmList] = useState([]);   // [{ id, name, cropType }]
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    farmId: '', productName: '', plantType: '', cultivationArea: '',
    sowingDate: '', expectedHarvestDate: '', expectedQuantity: '', quantityUnit: 'kg', dataHash: ''
  });
  const [logisticsForm, setLogisticsForm] = useState(null);

  // Ảnh nông sản của farm đang chọn (đọc từ localStorage)
  const [cropPreview, setCropPreview] = useState(null);  // { image, cropType }
  // Lưu danh sách nông sản con đã tách của farm để user chọn nếu farm trồng nhiều loại
  const [availableCrops, setAvailableCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [showAllBatchesPage, setShowAllBatchesPage] = useState(false);

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

  // Khi selectedCrop thay đổi → load preview ảnh tương ứng + tự điền dataHash
  useEffect(() => {
    if (!selectedCrop) {
      setCropPreview(null); return;
    }
    const images = getCropImages();
    const key = selectedCrop.toLowerCase();
    const cid = images[key] || null;
    // cid có thể là IPFS CID string hoặc base64 data URL
    setCropPreview({ image: cid, cropType: selectedCrop });
    
    // Tự điền plantType theo crop hiện tại nếu chưa có
    setForm(f => ({ ...f, plantType: selectedCrop, dataHash: cid || f.dataHash }));
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
    if (form.expectedHarvestDate && form.sowingDate) {
      const sow = new Date(form.sowingDate);
      const har = new Date(form.expectedHarvestDate);
      if (!Number.isNaN(sow.getTime()) && !Number.isNaN(har.getTime()) && har < sow) {
        setMsg('⚠️ Ngày thu hoạch dự kiến không được xảy ra trước ngày gieo trồng.');
        setTimeout(() => setMsg(''), 5000);
        return;
      }
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
      setMsg('✅ Hoàn tất: Lô hàng mới đã được khởi tạo thành công!');
      onUserAction?.({
        type: 'batch',
        title: 'Tạo lô hàng mới',
        detail: `Lô "${form.productName}" thuộc nông trại #${form.farmId} đã được tạo`,
      });
      setTimeout(() => setMsg(''), 5000);
      setForm({ farmId:'', productName:'', plantType:'', cultivationArea:'', sowingDate:'', expectedHarvestDate:'', expectedQuantity:'', quantityUnit:'kg', dataHash:'' });
      setCropPreview(null);
      loadData();
    } catch (err) {
      setMsg('❌ Lỗi giao dịch: ' + (err.reason || err.message));
      setTimeout(() => setMsg(''), 5000);
    } finally { setLoading(false); }
  };

  const handleLogisticsSubmit = async e => {
    e.preventDefault();
    try {
      setLoading(true);
      setMsg('⏳ Đang ghi nhận sự kiện Logistics...');
      
      let finalAnomaly = logisticsForm.anomaly;
      const t = parseFloat(logisticsForm.temperature || 0);
      if (!finalAnomaly) {
         if (t > 30 || t < 2) finalAnomaly = "🔴 Nhiệt độ cảnh báo mức Cao";
         else if (t > 25 || t < 8) finalAnomaly = "🟠 Nhiệt độ cảnh báo mức Vừa";
      }

      const tx = await contract.addLogisticsEvent(
        BigInt(logisticsForm.batchId),
        logisticsForm.eventType,
        logisticsForm.location,
        BigInt(logisticsForm.temperature),
        BigInt(logisticsForm.humidity),
        finalAnomaly,
        logisticsForm.operatorName
      );
      await tx.wait();
      setMsg('🎉 Cập nhật chuỗi Logistics thành công!');
      onUserAction?.({
        type: 'logistics',
        title: 'Cập nhật logistics lô hàng',
        detail: `Lô #${logisticsForm.batchId} - sự kiện "${logisticsForm.eventType}"`,
      });
      setTimeout(() => setMsg(''), 5000);
      setLogisticsForm(null);
      loadData();
    } catch (err) {
      setMsg('❌ Lỗi giao dịch: ' + (err.reason || err.message));
      setTimeout(() => setMsg(''), 5000);
    } finally { setLoading(false); }
  };

  const cropImages = getCropImages();
  const PREVIEW_BATCH_LIMIT = 3;
  const sortedBatches = [...batches].sort((a, b) => Number(b.batchId) - Number(a.batchId));
  const hasMoreBatches = sortedBatches.length > PREVIEW_BATCH_LIMIT;
  const visibleBatches = showAllBatchesPage ? sortedBatches : sortedBatches.slice(0, PREVIEW_BATCH_LIMIT);

  return (
    <div className="dash-wrap">
      <h2 className="dash-title"><Wheat size={28} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '8px' }} /> Quản Lý Lô Hàng</h2>

      {!showAllBatchesPage && (
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
                <div className="bcp-no-image" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={18} /> Nông sản <strong>"{cropPreview.cropType}"</strong> chưa có ảnh —
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
              <input 
                type="date" 
                max={form.expectedHarvestDate || undefined}
                value={form.sowingDate} 
                onChange={set('sowingDate')} 
              />
            </div>
            <div className="form-group">
              <label>Ngày thu hoạch dự kiến</label>
              <input
                type="date"
                min={form.sowingDate || undefined}
                value={form.expectedHarvestDate}
                onChange={set('expectedHarvestDate')}
              />
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
                {['kg', 'tấn', 'thùng', 'giỏ', 'bao', 'Lít'].map(u => <option value={u} key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          {msg && createPortal(
            <div style={{ zIndex: 9999999 }} className={`form-msg ${msg.match(/^[✅🎉✨]/) ? 'success' : msg.match(/^[❌⚠️]/) ? 'error-msg' : ''}`}>
              {msg.match(/^[✅🎉✨]/) && <CheckCircle2 size={22} className="toast-anim-success" />}
              {msg.match(/^[❌⚠️]/) && <AlertTriangle size={22} className="toast-anim-error" />}
              {msg.match(/^[⏳⛓]/) && <Loader2 size={22} className="toast-anim-loading" />}
              <span>{msg.replace(/^[✅🎉✨❌⚠️⏳⛓]\s*/, '')}</span>
            </div>,
            document.body
          )}
          <button type="submit" className="btn primary-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? <><Loader2 size={18} className="tsb-spin"/> Đang xử lý...</> : <><PlusCircle size={18}/> Tạo Lô Hàng</>}
          </button>
        </form>
      </div>
      )}

      <div className="card-panel glass-card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3>{showAllBatchesPage ? `Trang Tất Cả Lô Hàng (${sortedBatches.length})` : `Danh sách Lô Hàng (${sortedBatches.length})`}</h3>
          <div className="batch-list-toolbar">
            {!showAllBatchesPage && hasMoreBatches && (
              <button className="btn-secondary-action" onClick={() => setShowAllBatchesPage(true)}>
                Tất cả
              </button>
            )}
            {!showAllBatchesPage && hasMoreBatches && (
              <button className="btn-secondary-action" onClick={() => setShowAllBatchesPage(true)}>
                Xem tất cả
              </button>
            )}
            {showAllBatchesPage && (
              <button className="btn-secondary-action" onClick={() => setShowAllBatchesPage(false)}>
                Thu gọn
              </button>
            )}
            <button className="btn-refresh" onClick={loadData}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 2.1-5.9L2 9"/>
              </svg>
              Làm mới
            </button>
          </div>
        </div>
        {batches.length === 0 ? (
          <p className="empty-msg">Chưa có lô hàng nào. Hãy tạo mới ở trên!</p>
        ) : (
          <>
            {!showAllBatchesPage && hasMoreBatches && (
              <p className="batch-list-hint">
                Đang hiển thị {PREVIEW_BATCH_LIMIT} lô gần nhất. Nhấn <strong>Xem tất cả</strong> để chuyển qua trang toàn bộ các lô.
              </p>
            )}
            <div className="batch-cards-grid">
            {visibleBatches.map(b => {
              // Ưu tiên ảnh từ blockchain (dataHash), fallback về localStorage
              const farm = farmList.find(f => f.id === b.farmId.toString());
              const onChainCid = b.dataHash || null;
              const localCid = farm?.cropType ? cropImages[farm.cropType.trim().toLowerCase()] : null;
              const cid = onChainCid || localCid;
              const imgSrc = cid ? (cid.startsWith('data:') ? cid : `https://ipfs.io/ipfs/${cid}`) : null;
              return (
                <div className="farm-item" key={b.batchId.toString()}>
                  {imgSrc && (
                    <div className="farm-crop-img">
                      <img src={imgSrc} alt={b.plantType} />
                    </div>
                  )}
                  <div className="farm-id">Lô #{b.batchId.toString()}</div>
                  <div className="farm-title">{b.productName}</div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Home size={14}/> Nông trại #{b.farmId.toString()} <span className="mx-2">—</span> <Leaf size={14}/> {b.plantType}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14}/> {b.cultivationArea}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sprout size={14}/> Gieo: {fromTs(b.sowingDate)} <span className="mx-2">—</span> <Calendar size={14}/> Thu hoạch: {fromTs(b.expectedHarvestDate)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Package size={14}/> Dự kiến: {b.expectedQuantity.toString()} {b.quantityUnit}</span>
                  <span className="active-badge">{STATUS_LABELS[Number(b.status)]}</span>
                  
                  <div className="batch-card-bottom">
                    {/* QR Code Section - Redesigned */}
                    <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ background: '#fff', padding: '6px', borderRadius: '8px', display: 'flex', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                         <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '?batchId=' + b.batchId.toString())}&margin=0`} alt="QR Code" style={{ width: '80px', height: '80px', borderRadius: '4px' }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Quét truy xuất nhanh</div>
                        <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '?batchId=' + b.batchId.toString()); setMsg('✅ Đã copy link Lô ' + b.batchId); }} style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(14,165,233,0.1)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content', transition: 'all 0.2s', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <Link size={12}/> Copy link
                        </button>
                      </div>
                    </div>

                    <button onClick={() => setLogisticsForm({ batchId: b.batchId.toString(), eventType: 'Đóng gói', location: '', temperature: '', humidity: '', anomaly: '', operatorName: '' })} className="btn primary-btn" style={{marginTop: '12px', fontSize: '14px', padding: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#ffffff', border: '1px solid rgba(16,185,129,0.4)', color: '#059669', fontWeight: 700, borderRadius: '12px', boxShadow: '0 4px 12px rgba(16,185,129,0.15)'}}>
                      <Truck size={18}/> Cập nhật Logistics
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </>
        )}
      </div>

      {/* MODAL LOGISTICS - REDESIGNED */}
      {logisticsForm && createPortal(
        <div className="modal-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(255,255,255,0.6)', backdropFilter:'blur(12px)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', padding: '20px'}}>
          <div className="modal-content fade-in" style={{
            background: '#ffffff', 
            padding:'32px', width:'100%', maxWidth:'460px', 
            borderRadius:'24px', border:'1px solid rgba(0,0,0,0.08)', 
            borderTop: '6px solid #10b981',
            boxShadow:'0 20px 40px -10px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}><Truck size={20}/></span>
                Cập Nhật Logistics
              </h3>
              <div style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                Lô #{logisticsForm.batchId}
              </div>
            </div>

            <form onSubmit={handleLogisticsSubmit} className="custom-form" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
               <div className="form-group">
                 <label style={{ fontSize: '13px', color: '#64748b' }}>Sự kiện <span className="req">*</span></label>
                 <select value={logisticsForm.eventType} onChange={e => setLogisticsForm({...logisticsForm, eventType: e.target.value})} style={{ background: '#f8fafc', color: '#1e293b', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                   <option>Đóng gói</option>
                   <option>Vận chuyển</option>
                   <option>Nhận hàng</option>
                   <option>Lưu kho</option>
                   <option>Giao hàng</option>
                 </select>
               </div>
               
               <div className="form-group">
                 <label style={{ fontSize: '13px', color: '#64748b' }}>Địa điểm / Tọa độ <span className="req">*</span></label>
                 <div style={{ position: 'relative' }}>
                   <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.8, color: '#64748b' }}><MapPin size={16}/></span>
                   <input required value={logisticsForm.location} onChange={e => setLogisticsForm({...logisticsForm, location: e.target.value})} placeholder="Kho trung chuyển A..." style={{ background: '#f8fafc', color: '#1e293b', borderRadius: '12px', paddingLeft: '40px', border: '1px solid #e2e8f0' }} />
                 </div>
               </div>

               <div style={{display:'flex', gap:'16px'}}>
                 <div className="form-group" style={{flex:1}}>
                   <label style={{ fontSize: '13px', color: '#64748b' }}>Nhiệt độ (°C)</label>
                   <div style={{ position: 'relative' }}>
                     <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 1, color: '#ef4444' }}><Thermometer size={16}/></span>
                     <input required type="number" step="0.1" value={logisticsForm.temperature} onChange={e => setLogisticsForm({...logisticsForm, temperature: e.target.value})} placeholder="Ví dụ: 25" style={{ background: '#f8fafc', color: '#1e293b', borderRadius: '12px', paddingLeft: '40px', border: '1px solid #e2e8f0' }} />
                   </div>
                 </div>
                 <div className="form-group" style={{flex:1}}>
                   <label style={{ fontSize: '13px', color: '#64748b' }}>Độ ẩm (%)</label>
                   <div style={{ position: 'relative' }}>
                     <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 1, color: '#0ea5e9' }}><Droplets size={16}/></span>
                     <input required type="number" step="0.1" value={logisticsForm.humidity} onChange={e => setLogisticsForm({...logisticsForm, humidity: e.target.value})} placeholder="Ví dụ: 60" style={{ background: '#f8fafc', color: '#1e293b', borderRadius: '12px', paddingLeft: '40px', border: '1px solid #e2e8f0' }} />
                   </div>
                 </div>
               </div>

               <div className="form-group">
                 <label style={{ fontSize: '13px', color: '#64748b' }}>Ghi chú Cảnh báo (Tuỳ chọn)</label>
                 <div style={{ position: 'relative' }}>
                   <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.8, color: '#ef4444' }}><AlertTriangle size={16}/></span>
                   <input value={logisticsForm.anomaly} onChange={e => setLogisticsForm({...logisticsForm, anomaly: e.target.value})} placeholder="Ghi chú khẩn cấp nếu có..." style={{ background: '#f8fafc', color: '#1e293b', borderRadius: '12px', paddingLeft: '40px', border: logisticsForm.anomaly ? '1px solid #ef4444' : '1px solid #e2e8f0' }} />
                 </div>
               </div>

               <div className="form-group">
                 <label style={{ fontSize: '13px', color: '#64748b' }}>Người phụ trách <span className="req">*</span></label>
                 <div style={{ position: 'relative' }}>
                   <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.8, color: '#64748b' }}><User size={16}/></span>
                   <input required value={logisticsForm.operatorName} onChange={e => setLogisticsForm({...logisticsForm, operatorName: e.target.value})} placeholder="Họ và tên nhân viên..." style={{ background: '#f8fafc', color: '#1e293b', borderRadius: '12px', paddingLeft: '40px', border: '1px solid #e2e8f0' }} />
                 </div>
               </div>

               <div style={{display:'flex', gap:'12px', marginTop:'16px'}}>
                 <button type="button" className="btn" onClick={() => setLogisticsForm(null)} disabled={loading} style={{flex:1, background:'#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '12px', padding: '12px', fontSize: '15px', cursor: 'pointer', fontWeight: 600}}>Hủy bỏ</button>
                 <button type="submit" className="btn" disabled={loading} style={{flex:1, background:'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#fff', borderRadius: '12px', padding: '12px', fontSize: '15px', fontWeight: 600, boxShadow: '0 8px 16px rgba(16,185,129,0.2)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                   {loading ? <><Loader2 size={18} className="tsb-spin" /> Đang lưu...</> : 'Lưu Sự Kiện'}
                 </button>
               </div>
               
               {msg && <div style={{ fontSize:'13px', padding: '12px', background: msg.startsWith('❌') ? '#fef2f2' : '#ecfdf5', color: msg.startsWith('❌') ? '#ef4444' : '#10b981', borderRadius: '10px', marginTop: '4px', textAlign: 'center', border: `1px solid ${msg.startsWith('❌') ? '#fca5a5' : '#6ee7b7'}`, fontWeight: 500 }}>
                 {msg}
               </div>}
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
