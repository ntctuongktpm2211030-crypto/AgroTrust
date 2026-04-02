import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Package,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const readBool = async (fn) => {
  try {
    return await fn();
  } catch {
    return false;
  }
};

export default function FarmListingSettings({ contract, account, onUserAction }) {
  const [farms, setFarms] = useState([]);
  const [farmHidden, setFarmHidden] = useState({});
  const [batchHidden, setBatchHidden] = useState({});
  const [batchesByFarm, setBatchesByFarm] = useState({});
  const [expandedFarmId, setExpandedFarmId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [msg, setMsg] = useState('');
  const [editFarm, setEditFarm] = useState(null);
  const [savingFarm, setSavingFarm] = useState(false);

  const showMsg = (m) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 5000);
  };

  const load = async () => {
    try {
      setLoading(true);
      const fc = await contract.farmCount();
      const list = [];
      const hiddenFarm = {};
      const hiddenBatch = {};
      const batchesMap = {};

      for (let i = 1n; i <= fc; i++) {
        const f = await contract.farms(i);
        if (f.ownerAddress.toLowerCase() !== account.toLowerCase()) continue;
        list.push(f);
        hiddenFarm[i.toString()] = await readBool(() => contract.farmHiddenFromCustomer(i));
      }

      const bc = await contract.batchCount();
      for (let j = 1n; j <= bc; j++) {
        const b = await contract.batches(j);
        const farmIdStr = b.farmId.toString();
        if (!list.some((x) => x.farmId.toString() === farmIdStr)) continue;
        hiddenBatch[j.toString()] = await readBool(() => contract.batchHiddenFromCustomer(j));
        if (!batchesMap[farmIdStr]) batchesMap[farmIdStr] = [];
        batchesMap[farmIdStr].push(b);
      }

      setFarms(list);
      setFarmHidden(hiddenFarm);
      setBatchHidden(hiddenBatch);
      setBatchesByFarm(batchesMap);
    } catch (e) {
      console.error(e);
      showMsg('❌ Không tải được dữ liệu: ' + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [account, contract]);

  const setKeyBusy = (key, v) => setBusy((prev) => ({ ...prev, [key]: v }));

  const toggleFarmHidden = async (farmId) => {
    const id = BigInt(farmId);
    const next = !farmHidden[farmId.toString()];
    const key = `farm-${farmId}`;
    setKeyBusy(key, true);
    try {
      const tx = await contract.setFarmHiddenFromCustomer(id, next);
      showMsg('⏳ Đang gửi giao dịch...');
      await tx.wait();
      setFarmHidden((h) => ({ ...h, [farmId.toString()]: next }));
      showMsg(next ? '✅ Đã ẩn nông trại khỏi tra cứu khách.' : '✅ Khách hàng có thể thấy nông trại trở lại.');
      onUserAction?.({
        type: 'farm-visibility',
        title: next ? 'Ẩn nông trại (khách)' : 'Hiện nông trại (khách)',
        detail: `Farm #${farmId}`,
      });
    } catch (e) {
      showMsg('❌ ' + (e.reason || e.message));
    } finally {
      setKeyBusy(key, false);
    }
  };

  const toggleBatchHidden = async (batchId) => {
    const id = BigInt(batchId);
    const next = !batchHidden[batchId.toString()];
    const key = `batch-${batchId}`;
    setKeyBusy(key, true);
    try {
      const tx = await contract.setBatchHiddenFromCustomer(id, next);
      showMsg('⏳ Đang gửi giao dịch...');
      await tx.wait();
      setBatchHidden((h) => ({ ...h, [batchId.toString()]: next }));
      showMsg(next ? '✅ Đã ẩn lô khỏi tra cứu khách.' : '✅ Lô hiển thị lại với khách.');
      onUserAction?.({
        type: 'batch-visibility',
        title: next ? 'Ẩn lô (khách)' : 'Hiện lô (khách)',
        detail: `Lô #${batchId}`,
      });
    } catch (e) {
      showMsg('❌ ' + (e.reason || e.message));
    } finally {
      setKeyBusy(key, false);
    }
  };

  const openEdit = (f) => {
    setEditFarm({
      farmId: f.farmId.toString(),
      farmName: f.farmName,
      ownerName: f.ownerName,
      phoneNumber: f.phoneNumber,
      location: f.location,
      gpsCoordinates: f.gpsCoordinates,
      area: f.area,
      cropType: f.cropType,
      description: f.description,
      isActive: f.isActive,
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editFarm) return;
    setSavingFarm(true);
    try {
      const tx = await contract.updateFarm(
        BigInt(editFarm.farmId),
        editFarm.farmName,
        editFarm.ownerName,
        editFarm.phoneNumber,
        editFarm.location,
        editFarm.gpsCoordinates,
        editFarm.area,
        editFarm.cropType,
        editFarm.description,
        editFarm.isActive
      );
      showMsg('⏳ Đang cập nhật hồ sơ nông trại...');
      await tx.wait();
      showMsg('✅ Đã lưu thông tin.');
      setEditFarm(null);
      load();
      onUserAction?.({
        type: 'farm-edit',
        title: 'Cập nhật nông trại',
        detail: `Farm #${editFarm.farmId}`,
      });
    } catch (err) {
      showMsg('❌ ' + (err.reason || err.message));
    } finally {
      setSavingFarm(false);
    }
  };

  return (
    <div className="dash-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div className="dash-header" style={{ flexShrink: 0 }}>
        <div className="dash-icon" style={{ background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)' }}>
          <Eye size={36} color="#0369a1" />
        </div>
        <div>
          <div className="dash-title">Hiển thị công khai &amp; Hồ sơ nông trại</div>
          <div className="dash-subtitle">
            Chủ nông trại: ẩn nông trại hoặc từng lô khỏi tra cứu / danh sách khách hàng; chỉnh sửa nội dung hiển thị (tên, địa chỉ, mô tả…).
          </div>
        </div>
      </div>

      <div className="card-panel glass-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
            <Loader2 className="tsb-spin" size={22} /> Đang tải…
          </div>
        ) : farms.length === 0 ? (
          <p className="empty-msg">Bạn chưa có nông trại nào. Hãy tạo tại mục &quot;Nông Trại&quot; trước.</p>
        ) : (
          <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {farms.map((f) => {
              const fid = f.farmId.toString();
              const expanded = expandedFarmId === fid;
              const batches = batchesByFarm[fid] || [];
              return (
                <div
                  key={fid}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.02)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFarmId(expanded ? null : fid)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 700,
                      }}
                    >
                      {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <Building2 size={18} color="#0ea5e9" />
                      #{fid} — {f.farmName}
                    </button>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <div 
                        title="Bật/tắt chế độ hiển thị công khai cho khách hàng"
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '10px', 
                          cursor: busy[`farm-${fid}`] ? 'not-allowed' : 'pointer', 
                          opacity: busy[`farm-${fid}`] ? 0.6 : 1, 
                          background: 'rgba(255,255,255,0.7)', 
                          padding: '6px 14px', borderRadius: '30px', 
                          border: '1.5px solid rgba(0,0,0,0.06)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}
                        onClick={() => !busy[`farm-${fid}`] && toggleFarmHidden(fid)}
                      >
                        {busy[`farm-${fid}`] ? (
                          <Loader2 size={16} className="tsb-spin" color="#10b981" />
                        ) : (
                          <>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: !farmHidden[fid] ? '#10b981' : '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                               {!farmHidden[fid] ? <Eye size={16} /> : <EyeOff size={16} />}
                               {!farmHidden[fid] ? 'Công khai' : 'Đã ẩn'}
                            </span>
                            <div style={{ width: '38px', height: '22px', background: !farmHidden[fid] ? '#10b981' : '#d1d5db', borderRadius: '20px', position: 'relative', transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                               <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: !farmHidden[fid] ? '18px' : '2px', transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }} />
                            </div>
                          </>
                        )}
                      </div>
                      <button type="button" className="btn-secondary-action" onClick={() => openEdit(f)}>
                        <Edit3 size={14} /> Sửa hồ sơ
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '0 16px 12px 44px' }}>
                    {farmHidden[fid]
                      ? 'Khách không thấy nông trại này trong danh sách và không tra cứu được các lô (kể cả lô chưa bị ẩn riêng).'
                      : 'Khách thấy nông trại trong danh sách công khai (từng lô vẫn có thể ẩn riêng bên dưới).'}
                    {!f.isActive && (
                      <span style={{ display: 'block', marginTop: '6px', color: '#f59e0b' }}>
                        Cảnh báo: nông trại đang &quot;tạm ngưng&quot; (isActive = false) — không tạo lô mới được.
                      </span>
                    )}
                  </div>
                  {expanded && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>
                        <Package size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Lô hàng ({batches.length})
                      </div>
                      {batches.length === 0 ? (
                        <p className="empty-msg" style={{ margin: 0 }}>Chưa có lô nào.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {batches.map((b) => {
                            const bid = b.batchId.toString();
                            const hid = batchHidden[bid];
                            return (
                              <div
                                key={bid}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '10px',
                                  flexWrap: 'wrap',
                                  padding: '10px 12px',
                                  borderRadius: '10px',
                                  background: 'rgba(0,0,0,0.15)',
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 600 }}>Lô #{bid}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.productName}</div>
                                </div>
                                <div 
                                  title={farmHidden[fid] ? 'Đã ẩn cả nông trại — khách không tra cứu được lô.' : 'Tắt/Bật công khai'}
                                  style={{ 
                                    display: 'flex', alignItems: 'center', gap: '8px', 
                                    cursor: busy[`batch-${bid}`] || farmHidden[fid] ? 'not-allowed' : 'pointer', 
                                    opacity: busy[`batch-${bid}`] || farmHidden[fid] ? 0.5 : 1, 
                                    background: 'rgba(255,255,255,0.8)', 
                                    padding: '4px 12px', borderRadius: '30px', 
                                    border: '1.5px solid rgba(0,0,0,0.06)'
                                  }}
                                  onClick={() => !busy[`batch-${bid}`] && !farmHidden[fid] && toggleBatchHidden(bid)}
                                >
                                  {busy[`batch-${bid}`] ? (
                                    <Loader2 size={14} className="tsb-spin" color="#10b981" />
                                  ) : (
                                    <>
                                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: !hid ? '#10b981' : '#888', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                         {!hid ? <Eye size={14} /> : <EyeOff size={14} />}
                                         {!hid ? 'Khách thấy' : 'Ẩn lô'}
                                      </span>
                                      <div style={{ width: '32px', height: '18px', background: !hid ? '#10b981' : '#d1d5db', borderRadius: '20px', position: 'relative', transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                         <div style={{ width: '14px', height: '14px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: !hid ? '16px' : '2px', transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editFarm &&
        createPortal(
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(12px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              className="modal-content fade-in"
              style={{
                background: '#ffffff',
                padding: '28px',
                width: '100%',
                maxWidth: '560px',
                borderRadius: '20px',
                border: '1px solid rgba(0,0,0,0.08)',
                borderTop: '6px solid #0284c7',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Sửa hồ sơ nông trại #{editFarm.farmId}</h3>
              <form onSubmit={saveEdit} className="custom-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Tên nông trại</label>
                  <input
                    required
                    value={editFarm.farmName}
                    onChange={(e) => setEditFarm({ ...editFarm, farmName: e.target.value })}
                    style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', padding: '10px', borderRadius: '8px' }}
                  />
                </div>
                <div className="form-group">
                  <label>Chủ nông trại</label>
                  <input
                    required
                    value={editFarm.ownerName}
                    onChange={(e) => setEditFarm({ ...editFarm, ownerName: e.target.value })}
                    style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', padding: '10px', borderRadius: '8px' }}
                  />
                </div>
                <div className="form-group">
                  <label>Điện thoại</label>
                  <input
                    required
                    value={editFarm.phoneNumber}
                    onChange={(e) => setEditFarm({ ...editFarm, phoneNumber: e.target.value })}
                    style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', padding: '10px', borderRadius: '8px' }}
                  />
                </div>
                <div className="form-group">
                  <label>Địa chỉ</label>
                  <textarea
                    required
                    value={editFarm.location}
                    onChange={(e) => setEditFarm({ ...editFarm, location: e.target.value })}
                    style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', minHeight: '64px', padding: '10px', borderRadius: '8px' }}
                  />
                </div>
                <div className="form-group">
                  <label>GPS</label>
                  <input
                    value={editFarm.gpsCoordinates}
                    onChange={(e) => setEditFarm({ ...editFarm, gpsCoordinates: e.target.value })}
                    style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', padding: '10px', borderRadius: '8px' }}
                  />
                </div>
                <div className="form-group">
                  <label>Diện tích</label>
                  <input
                    value={editFarm.area}
                    onChange={(e) => setEditFarm({ ...editFarm, area: e.target.value })}
                    style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', padding: '10px', borderRadius: '8px' }}
                  />
                </div>
                <div className="form-group">
                  <label>Loại nông sản chính</label>
                  <input
                    value={editFarm.cropType}
                    onChange={(e) => setEditFarm({ ...editFarm, cropType: e.target.value })}
                    style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', padding: '10px', borderRadius: '8px' }}
                  />
                </div>
                <div className="form-group">
                  <label>Mô tả / chứng nhận</label>
                  <textarea
                    value={editFarm.description}
                    onChange={(e) => setEditFarm({ ...editFarm, description: e.target.value })}
                    style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', minHeight: '72px', padding: '10px', borderRadius: '8px' }}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={editFarm.isActive}
                    onChange={(e) => setEditFarm({ ...editFarm, isActive: e.target.checked })}
                  />
                  Nông trại đang hoạt động (tạo lô mới cần bật)
                </label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn" onClick={() => setEditFarm(null)} style={{ flex: 1, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}>
                    Hủy
                  </button>
                  <button type="submit" className="btn primary-btn" disabled={savingFarm} style={{ flex: 1 }}>
                    {savingFarm ? <Loader2 size={18} className="tsb-spin" /> : 'Lưu'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {msg &&
        createPortal(
          <div style={{ zIndex: 9999999 }} className={`form-msg ${msg.match(/^[✅]/) ? 'success' : msg.match(/^[❌]/) ? 'error-msg' : ''}`}>
            {msg.match(/^[✅]/) && <CheckCircle2 size={22} className="toast-anim-success" />}
            {msg.match(/^[❌]/) && <AlertTriangle size={22} className="toast-anim-error" />}
            {msg.match(/^[⏳]/) && <Loader2 size={22} className="toast-anim-loading" />}
            <span>{msg.replace(/^[✅❌⏳]\s*/, '')}</span>
          </div>,
          document.body
        )}
    </div>
  );
}
