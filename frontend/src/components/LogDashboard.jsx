import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { getIpfsUrl } from '../utils/pinata';
import MultiSelectDropdown, { IOT_OPTIONS } from './MultiSelectDropdown';
import { BookText, Image as ImageIcon, Loader2, PenLine, FileText, Beaker, User, Sun, Radio, Pin, CheckCircle2, AlertTriangle, Droplets, Sprout, FlaskConical, Scissors, Package, ClipboardCheck, ListTodo, X, Clock, Hash } from 'lucide-react';

const ACTION_TYPES = ['Tưới nước','Bón phân','Phun thuốc','Làm cỏ','Thu hoạch','Kiểm tra định kỳ','Khác'];

/* ── Đọc ảnh nông sản từ localStorage ── */
const getCropImages = () => {
  try { return JSON.parse(localStorage.getItem('agrotrust_crop_images') || '{}'); }
  catch { return {}; }
};

export default function LogDashboard({ contract, account, onUserAction }) {
  const [logs, setLogs] = useState([]);
  const [batches, setBatches] = useState([]); // [{ id, productName }]
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [cropPreview, setCropPreview] = useState(null); // { image, cropType }
  const [detailLog, setDetailLog] = useState(null); // popup detail
  const [form, setForm] = useState({
    batchId: '', actionType: ACTION_TYPES[0], description: '',
    materialName: '', dosageNumber: '', dosageUnit: 'kg/ha', operatorName: '',
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
      setLogs([...data].map((l, i) => ({ ...l, batchLogIndex: i + 1 })).reverse());
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
      setMsg('ERROR: Vui lòng chọn lô hàng và nhập nội dung công việc.');
      setTimeout(() => setMsg(''), 5000);
      return;
    }
    try {
      setLoading(true);
      setMsg('⏳ Đang đồng bộ nhật ký lên mạng lưới Blockchain...');
      
      const finalDesc = form.description;
      const finalDosage = form.dosageNumber ? `${form.dosageNumber} ${form.dosageUnit}` : '';

      const tx = await contract.addCultivationLog(
        BigInt(form.batchId), form.actionType, finalDesc,
        form.materialName, finalDosage, form.operatorName,
        form.weatherCondition, form.iotData, form.note
      );
      await tx.wait();
      setMsg('SUCCESS: Hoàn tất: Nhật ký canh tác đã được ghi nhận an toàn!');
      onUserAction?.({
        type: 'cultivation-log',
        title: 'Ghi nhật ký canh tác',
        detail: `Lô #${form.batchId} - hoạt động "${form.actionType}"`,
      });
      setTimeout(() => setMsg(''), 5000);
      loadLogs(form.batchId);
      setForm(f => ({ ...f, actionType: ACTION_TYPES[0], description:'', materialName:'', dosageNumber:'', dosageUnit:'kg/ha', operatorName:'', weatherCondition:'', iotData:'', note:'' }));
    } catch (err) {
      setMsg(`ERROR: Lỗi giao dịch: ${err.reason || err.message}`);
      setTimeout(() => setMsg(''), 5000);
    } finally { setLoading(false); }
  };

  const tsToDate = ts => new Date(Number(ts) * 1000).toLocaleString('vi-VN');

  const getLogIcon = (type) => {
    if (type === 'Tưới nước') return { Icon: Droplets, color: '#0ea5e9' };
    if (type === 'Bón phân') return { Icon: Sprout, color: '#10b981' };
    if (type === 'Phun thuốc') return { Icon: FlaskConical, color: '#ef4444' };
    if (type === 'Làm cỏ') return { Icon: Scissors, color: '#f59e0b' };
    if (type === 'Thu hoạch') return { Icon: Package, color: '#8b5cf6' };
    if (type === 'Kiểm tra định kỳ') return { Icon: ClipboardCheck, color: '#6366f1' };
    return { Icon: ListTodo, color: '#6b7280' };
  };

  return (
    <div className="dash-wrap">
      <h2 className="dash-title"><BookText size={28} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '8px' }} /> Nhật Ký Canh Tác</h2>

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
                <div className="bcp-no-image" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={18} /> <strong>"{cropPreview.cropType}"</strong> chưa có ảnh.
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Nội dung chi tiết <span className="req">*</span></label>
            <textarea value={form.description} onChange={set('description')} placeholder="Mô tả đầy đủ công việc đã thực hiện..." />
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
            <div className="form-group" style={{ flex: '1.3 1 0px', minWidth: '100px' }}>
              <label style={{ whiteSpace: 'nowrap' }}>Vật tư sử dụng</label>
              <input value={form.materialName} onChange={set('materialName')} style={{ width: '100%', minWidth: '0' }} placeholder="VD: Phân DAP..." />
            </div>
            <div className="form-group" style={{ flex: '1 1 0px', minWidth: '120px' }}>
              <label style={{ whiteSpace: 'nowrap' }}>Liều lượng</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input style={{ flex: '1 1 0px', minWidth: '40px', margin: 0, padding: '12px 6px' }} type="number" step="0.01" min="0" value={form.dosageNumber} onChange={set('dosageNumber')} placeholder="Số lượng" />
                <select style={{ width: '75px', flexShrink: 0, margin: 0, padding: '12px 4px' }} value={form.dosageUnit} onChange={set('dosageUnit')}>
                  <option value="kg/ha">kg/ha</option>
                  <option value="Lít/ha">Lít/ha</option>
                  <option value="kg/1000m²">kg/1000m²</option>
                  <option value="Lít/1000m²">Lít/1000m²</option>
                  <option value="ml/bình 16L">ml/bình 16L</option>
                  <option value="ml/bình 25L">ml/bình 25L</option>
                  <option value="g/bình 16L">g/bình 16L</option>
                  <option value="g/bình 25L">g/bình 25L</option>
                  <option value="kg">kg</option>
                  <option value="Lít">Lít</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="bao">bao</option>
                  <option value="gói">gói</option>
                  <option value="chai">chai</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ flex: '1 1 0px', minWidth: '100px' }}>
              <label style={{ whiteSpace: 'nowrap' }}>Thời tiết</label>
              <select value={form.weatherCondition} onChange={set('weatherCondition')} style={{ width: '100%', minWidth: '0' }}>
                <option value="">-- Chọn --</option>
                <option value="Nắng">Nắng</option>
                <option value="Nắng gắt">Nắng gắt</option>
                <option value="Mưa">Mưa</option>
                <option value="Mưa rào">Mưa rào</option>
                <option value="Mưa phùn">Mưa phùn</option>
                <option value="Râm mát">Râm mát</option>
                <option value="Âm u">Âm u</option>
                <option value="Sương mù">Sương mù</option>
                <option value="Trời lạnh">Trời lạnh</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
            <div className="form-group" style={{ flex: '1.2 1 0px', minWidth: '120px' }}>
              <label style={{ whiteSpace: 'nowrap' }}>Người thực hiện</label>
              <input value={form.operatorName} onChange={set('operatorName')} style={{ width: '100%', minWidth: '0' }} placeholder="Tên người thực hiện..." />
            </div>
            <div className="form-group" style={{ flex: '2 1 0px', minWidth: '200px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}><Radio size={16}/> Dữ liệu IoT (Nếu có)</label>
              <MultiSelectDropdown options={IOT_OPTIONS} value={form.iotData} onChange={(val) => setForm(f => ({ ...f, iotData: val }))} />
            </div>
            <div className="form-group" style={{ flex: '1 1 0px', minWidth: '100px' }}>
              <label style={{ whiteSpace: 'nowrap' }}>Ghi chú</label>
              <input value={form.note} onChange={set('note')} style={{ width: '100%', minWidth: '0' }} placeholder="Lưu ý thêm..." />
            </div>
          </div>
          {msg && createPortal(
            <div style={{ zIndex: 9999999 }} className={`form-msg ${msg.startsWith('SUCCESS:') ? 'success' : msg.startsWith('ERROR:') ? 'error-msg' : ''}`}>
              {msg.startsWith('SUCCESS:') && <CheckCircle2 size={22} className="toast-anim-success" />}
              {msg.startsWith('ERROR:') && <AlertTriangle size={22} className="toast-anim-error" />}
              {msg.startsWith('⏳') && <Loader2 size={22} className="toast-anim-loading" />}
              <span>{msg.replace(/^(SUCCESS|ERROR|⏳)[:\s]*/, '')}</span>
            </div>,
            document.body
          )}
          <button type="submit" className="btn primary-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? <><Loader2 size={18} className="tsb-spin" /> Đang xử lý...</> : <><PenLine size={18} /> Ghi Nhật Ký</>}
          </button>
        </form>
      </div>

      <div className="card-panel glass-card">
        <h3>Lịch sử Nhật ký {selectedBatch ? `— Lô #${selectedBatch}` : ''} ({logs.length})</h3>
        {logs.length === 0 ? (
          <p className="empty-msg">Chọn một lô hàng và ghi nhật ký để xem lịch sử ở đây.</p>
        ) : (
          <div className="batch-cards-grid">
            {logs.map((l, idx) => {
              let ActionIcon = ListTodo;
              let iconColor = "#6b7280";
              const type = l.actionType;
              if (type === 'Tưới nước') { ActionIcon = Droplets; iconColor = "#0ea5e9"; }
              else if (type === 'Bón phân') { ActionIcon = Sprout; iconColor = "#10b981"; }
              else if (type === 'Phun thuốc') { ActionIcon = FlaskConical; iconColor = "#ef4444"; }
              else if (type === 'Làm cỏ') { ActionIcon = Scissors; iconColor = "#f59e0b"; }
              else if (type === 'Thu hoạch') { ActionIcon = Package; iconColor = "#8b5cf6"; }
              else if (type === 'Kiểm tra định kỳ') { ActionIcon = ClipboardCheck; iconColor = "#6366f1"; }

              return (
                <div className="farm-item" key={idx} onClick={() => setDetailLog({ ...l, _iconColor: iconColor, _type: type })} style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                      <ActionIcon size={24} color={iconColor} />
                    </div>
                    <div style={{ textAlign: 'right', flex: 1 }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-3)', background: 'rgba(0,0,0,0.04)', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '6px' }}>
                         Lần #{l.batchLogIndex}
                       </span>
                       <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>{tsToDate(l.timestamp)}</div>
                    </div>
                  </div>

                  <div className="farm-title" style={{ fontSize: '17px', color: iconColor }}>{type}</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-1)', lineHeight: 1.5, fontWeight: 500, paddingBottom: '4px' }}>
                      <FileText size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--text-3)' }}/> {l.description}
                    </span>
                    
                    {l.materialName && (
                      <div style={{ background: 'rgba(239,68,68,0.05)', padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(239,68,68,0.2)' }}>
                        <Beaker size={16} color="#ef4444" style={{ flexShrink: 0 }}/>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>{l.materialName}</span>
                        <span className="mx-2" style={{ color: 'rgba(239,68,68,0.3)' }}>|</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{l.dosage}</span>
                      </div>
                    )}

                    {(l.operatorName || l.weatherCondition || l.iotData || l.note) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', background: 'rgba(255,255,255,0.4)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.04)' }}>
                        {l.operatorName && <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 500 }}><User size={15} color="#6366f1"/> {l.operatorName}</span>}
                        {l.weatherCondition && <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 500 }}><Sun size={15} color="#f59e0b"/> {l.weatherCondition}</span>}
                        {l.iotData && <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 500 }}><Radio size={15} color="#0ea5e9"/> {l.iotData}</span>}
                        {l.note && <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', lineHeight: 1.4, color: 'var(--text-secondary)' }}><Pin size={15} color="#8b5cf6" style={{ flexShrink: 0, marginTop: '2px' }}/> {l.note}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DETAIL POPUP ── */}
      {detailLog && createPortal(
        <div onClick={() => setDetailLog(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn .2s ease' }}>
          <div onClick={e => e.stopPropagation()} className="fade-in" style={{ background: '#fff', width: '100%', maxWidth: '560px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 20px 60px -12px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            {/* Header */}
            {(() => { const { Icon, color } = getLogIcon(detailLog.actionType); return (
              <div style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)`, padding: '24px 28px', borderBottom: `3px solid ${color}30`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${color}25`, border: `1.5px solid ${color}20`, flexShrink: 0 }}>
                  <Icon size={28} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: color }}>{detailLog.actionType}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Hash size={13}/> Lần #{detailLog.batchLogIndex} — Lô #{selectedBatch}
                  </div>
                </div>
                <button onClick={() => setDetailLog(null)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '12px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}>
                  <X size={18} color="#64748b" />
                </button>
              </div>
            ); })()}

            {/* Body */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '55vh', overflowY: 'auto' }}>
              {/* Timestamp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.03)', padding: '10px 14px', borderRadius: '10px' }}>
                <Clock size={15} color="#64748b" /> {tsToDate(detailLog.timestamp)}
              </div>

              {/* Mô tả */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: '8px' }}>Nội dung công việc</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--text-1)', lineHeight: 1.65, fontWeight: 500, fontSize: '14.5px', background: 'rgba(0,0,0,0.02)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <FileText size={17} style={{ flexShrink: 0, marginTop: '2px', color: '#94a3b8' }}/>
                  {detailLog.description || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Không có mô tả</span>}
                </div>
              </div>

              {/* Vật tư + Liều lượng */}
              {(detailLog.materialName || detailLog.dosage) && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: '8px' }}>Vật tư & Liều lượng</div>
                  <div style={{ background: 'rgba(239,68,68,0.04)', padding: '14px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px dashed rgba(239,68,68,0.2)' }}>
                    <Beaker size={18} color="#ef4444" style={{ flexShrink: 0 }}/>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>{detailLog.materialName || '—'}</span>
                    <span style={{ color: 'rgba(239,68,68,0.3)', fontSize: '16px' }}>|</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>{detailLog.dosage || '—'}</span>
                  </div>
                </div>
              )}

              {/* Info Grid */}
              {(detailLog.operatorName || detailLog.weatherCondition || detailLog.iotData || detailLog.note) && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: '8px' }}>Thông tin bổ sung</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
                    {detailLog.operatorName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={16} color="#6366f1" />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Người thực hiện</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>{detailLog.operatorName}</div>
                        </div>
                      </div>
                    )}
                    {detailLog.weatherCondition && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Sun size={16} color="#f59e0b" />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Thời tiết</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>{detailLog.weatherCondition}</div>
                        </div>
                      </div>
                    )}
                    {detailLog.iotData && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Radio size={16} color="#0ea5e9" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Dữ liệu IoT</div>
                          <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.5, marginTop: '2px' }}>{detailLog.iotData}</div>
                        </div>
                      </div>
                    )}
                    {detailLog.note && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Pin size={16} color="#8b5cf6" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Ghi chú</div>
                          <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '2px' }}>{detailLog.note}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setDetailLog(null)} style={{ background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, padding: '10px 24px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0, #cbd5e1)'} onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9, #e2e8f0)'}>
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
