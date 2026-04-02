import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { uploadBase64ToPinata } from '../utils/pinata';
import { ShieldCheck, Key, Loader2, FileSignature, FolderOpen, FileText, MessageSquare, Paperclip, CheckCircle2, AlertTriangle } from 'lucide-react';

const OPEN_INSPECTION_FOR_ALL = true;

export default function InspectionDashboard({ contract, account, onUserAction }) {
  const [isInspector, setIsInspector] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');
  const [grantingRole, setGrantingRole] = useState(false);
  const [inspectorAddress, setInspectorAddress] = useState('');
  const [inspections, setInspections] = useState([]);
  const [batches, setBatches] = useState([]); // [{ id, productName }]
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [form, setForm] = useState({
    batchId: '', inspectorName: '', organization: '',
    inspectionContent: '', result: 'Đạt',
    note: '', approvalStatus: 'Đã duyệt', inspectionHash: ''
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    checkInspectorRole();
    checkAdminRole();
  }, [account, contract]);

  const checkAdminRole = async () => {
    try {
      const adminAddr = await contract.admin();
      setIsAdmin(adminAddr?.toLowerCase() === account?.toLowerCase());
    } catch (e) {
      console.error(e);
      setIsAdmin(false);
    }
  };

  const checkInspectorRole = async () => {
    if (OPEN_INSPECTION_FOR_ALL) {
      setIsInspector(true);
      loadAllBatches();
      return;
    }
    try {
      const result = await contract.inspectors(account);
      setIsInspector(result);
      if (result) loadAllBatches();
      else setBatches([]);
    } catch (e) { console.error(e); }
  };

  const grantInspector = async () => {
    if (OPEN_INSPECTION_FOR_ALL) {
      setAdminMsg('✅ Chế độ mở: mọi tài khoản đều có quyền kiểm định trên giao diện.');
      return;
    }
    if (!isAdmin) {
      setAdminMsg('⚠️ Chỉ tài khoản Admin mới có thể cấp quyền Inspector.');
      return;
    }
    const addr = inspectorAddress.trim() || account;
    try {
      setGrantingRole(true);
      setAdminMsg('⏳ Đang gửi giao dịch cấp quyền...');
      const tx = await contract.addInspector(addr);
      setAdminMsg(`⛓ Giao dịch đã gửi: ${tx.hash.slice(0, 10)}... Đang chờ xác nhận...`);
      await tx.wait();
      setIsInspector(true);
      await loadAllBatches();
      setAdminMsg('✅ Đã cấp quyền Kiểm định viên thành công!');
      onUserAction?.({
        type: 'inspection-role',
        title: 'Cấp quyền kiểm định viên',
        detail: `Đã cấp quyền cho ví ${addr.slice(0, 6)}...${addr.slice(-4)}`,
      });
    } catch (err) {
      setAdminMsg('❌ Lỗi: ' + (err.reason || err.message));
    } finally { setGrantingRole(false); }
  };

  const loadAllBatches = async () => {
    try {
      setBatchesLoading(true);
      const bc = await contract.batchCount();
      const ids = Array.from({ length: Number(bc) }, (_, idx) => BigInt(idx + 1));
      const rawBatches = await Promise.all(ids.map(id => contract.batches(id)));
      const loadedBatches = rawBatches.map((b, idx) => ({
        id: String(idx + 1),
        productName: b.productName
      }));
      setBatches(loadedBatches);
    } catch (e) { console.error(e); }
    finally { setBatchesLoading(false); }
  };

  const loadInspections = async (bId) => {
    if (!bId) return;
    try {
      const data = await contract.getBatchInspections(BigInt(bId));
      setInspections([...data].reverse());
    } catch (e) { console.error(e); }
  };

  const handleBatchSelect = v => {
    setSelectedBatch(v);
    setForm(f => ({ ...f, batchId: v }));
    loadInspections(v);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingPdf(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          setMsg('⏳ Đang upload file PDF/Ảnh lên mạng lưới IPFS...');
          const cid = await uploadBase64ToPinata(base64Data, file.name);
          setForm(f => ({ ...f, inspectionHash: cid }));
          setMsg('✅ Tải lên IPFS thành công! Mã Hash đã tự động điền.');
        } catch (err) {
          setMsg('❌ Lỗi tải lên: ' + err.message);
        } finally { setUploadingPdf(false); }
      };
    } catch (err) {
      setMsg('❌ Lỗi đọc file.');
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.batchId || !form.inspectorName || !form.inspectionContent) {
      setMsg('⚠️ Chú ý: Vui lòng điền đầy đủ các thông tin bắt buộc.');
      setTimeout(() => setMsg(''), 5000);
      return;
    }
    try {
      setLoading(true);
      // Dù UI cho phép tất cả tài khoản, giao dịch on-chain vẫn cần quyền inspector.
      const hasOnChainInspectorRole = await contract.inspectors(account);
      if (!hasOnChainInspectorRole) {
        if (isAdmin) {
          setMsg('⏳ Bạn là Admin: đang tự cấp quyền Inspector cho ví hiện tại...');
          const grantTx = await contract.addInspector(account);
          await grantTx.wait();
          setMsg('✅ Đã cấp quyền Inspector. Đang tiếp tục ghi phiếu kiểm định...');
        } else {
          setMsg('❌ Ví này chưa có quyền Inspector trên blockchain, nên không thể post. Hãy nhờ Admin cấp quyền cho ví của bạn.');
          setTimeout(() => setMsg(''), 7000);
          return;
        }
      }
      setMsg('⏳ Đang đồng bộ phiếu kiểm định lên Blockchain...');
      const tx = await contract.inspectBatch(
        BigInt(form.batchId), form.inspectorName, form.organization,
        form.inspectionContent, form.result, form.note,
        form.approvalStatus, form.inspectionHash
      );
      await tx.wait();
      setMsg('✅ Hoàn tất: Phiếu kiểm định đã được cấp phát thành công!');
      onUserAction?.({
        type: 'inspection',
        title: 'Ghi phiếu kiểm định',
        detail: `Lô #${form.batchId} - kết quả "${form.result}"`,
      });
      setTimeout(() => setMsg(''), 5000);
      setForm(f => ({ ...f, inspectorName:'', organization:'', inspectionContent:'', note:'', inspectionHash:'' }));
      loadInspections(form.batchId);
    } catch (err) {
      const raw = (err?.reason || err?.message || '').toString();
      if (raw.toLowerCase().includes('caller is not the admin') || raw.toLowerCase().includes('inspector')) {
        setMsg('❌ Không thể post vì ví hiện tại chưa có quyền Inspector trên blockchain.');
      } else {
        setMsg('❌ Lỗi giao dịch: ' + raw);
      }
      setTimeout(() => setMsg(''), 5000);
    } finally { setLoading(false); }
  };

  const tsToDate = ts => new Date(Number(ts) * 1000).toLocaleString('vi-VN');

  const resultColor = r => {
    if (r === 'Đạt') return { border: 'rgba(16,185,129,.3)', badge: '' };
    if (r === 'Không đạt') return { border: 'rgba(244,63,94,.3)', badge: 'inactive' };
    return { border: 'rgba(245,158,11,.3)', badge: 'badge-amber' };
  };

  return (
    <div className="dash-wrap">
      {/* Header */}
      <div className="dash-header">
        <div className="dash-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={36}/></div>
        <div>
          <div className="dash-title">Kiểm Định Lô Hàng</div>
          <div className="dash-subtitle">Ghi nhận và tra cứu phiếu kiểm định chất lượng nông sản</div>
        </div>
      </div>

      {/* Role Status Card */}
      <div className={`card-panel glass-card ${isInspector ? 'role-card-verified' : 'role-card-warning'}`} 
           style={isInspector ? { background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.08))', border: '1.5px solid rgba(16,185,129,0.25)', boxShadow: '0 8px 32px rgba(16,185,129,0.05)' } : {}}>
        
        <div className="role-title" style={{ 
          display: 'flex', alignItems: 'center', gap: '10px',
          color: isInspector ? '#059669' : '#fbbf24', 
          fontSize: '18px', fontWeight: '800', marginBottom: isInspector ? '8px' : '12px' 
        }}>
          {isInspector ? (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981', filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Sẵn sàng — Kiểm định viên hợp lệ
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Chưa có quyền ủy quyền Kiểm định
            </>
          )}
        </div>

        {!isInspector && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '16px', lineHeight: '1.6' }}>
              Ví của bạn chưa được cấp quyền <b style={{ color: '#fbbf24' }}>Inspector</b>.
              {isAdmin
                ? ' Bạn là Admin, có thể cấp quyền bên dưới.'
                : ' Tài khoản hiện tại không phải Admin nên không thể cấp quyền Inspector.'}
            </p>
            {isAdmin && (
              <div className="form-row" style={{ maxWidth: '640px' }}>
                <div className="form-group">
                  <label>Địa chỉ ví (bỏ trống = dùng ví hiện tại)</label>
                  <input
                    className="custom-form"
                    style={{ background: 'var(--input-bg)', border: '1px solid rgba(255,255,255,.09)', padding: '11px 14px', borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', font: '14px Inter,sans-serif', outline: 'none', width: '100%' }}
                    value={inspectorAddress}
                    onChange={e => setInspectorAddress(e.target.value)}
                    placeholder={account}
                  />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <button
                    className="btn amber-btn"
                    onClick={grantInspector}
                    disabled={grantingRole}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {grantingRole ? <><Loader2 size={16} className="tsb-spin" /> Đang cấp...</> : <><Key size={16} /> Cấp Quyền Inspector</>}
                  </button>
                </div>
              </div>
            )}
            {!isAdmin && (
              <div style={{
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.25)',
                color: '#b91c1c',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700
              }}>
                Tài khoản hiện tại: {account?.substring(0, 6)}...{account?.substring(account.length - 4)} không có quyền Admin.
              </div>
            )}
            {adminMsg && createPortal(
              <div style={{ zIndex: 9999999 }} className={`form-msg ${adminMsg.match(/^[✅🎉✨]/) ? 'success' : adminMsg.match(/^[❌⚠️]/) ? 'error-msg' : ''}`}>
                {adminMsg.match(/^[✅🎉✨]/) && <CheckCircle2 size={22} className="toast-anim-success" />}
                {adminMsg.match(/^[❌⚠️]/) && <AlertTriangle size={22} className="toast-anim-error" />}
                {adminMsg.match(/^[⏳⛓]/) && <Loader2 size={22} className="toast-anim-loading" />}
                <span>{adminMsg.replace(/^[✅🎉✨❌⚠️⏳⛓]\s*/, '')}</span>
              </div>,
              document.body
            )}
          </>
        )}

        {isInspector && (
          <p style={{ color: '#475569', fontSize: '14.5px', lineHeight: '1.6', margin: 0 }}>
            Hệ thống Blockchain đã xác nhận địa chỉ ví <code style={{ color: '#047857', background: 'rgba(16,185,129,.15)', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
              {account.substring(0,6)}...{account.substring(account.length-4)}
            </code> của bạn là tổ chức kiểm định chính thức. Bạn có toàn quyền cấp phát chứng nhận chất lượng cho các lô hàng.
          </p>
        )}
      </div>

      {/* Form Card */}
      <div className="card-panel glass-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileSignature size={24} /> Ghi Phiếu Kiểm Định</h3>
        <form className="custom-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Lô hàng kiểm định <span className="req">*</span></label>
              <select value={form.batchId} onChange={e => handleBatchSelect(e.target.value)}>
                <option value="">{batchesLoading ? '-- Đang tải danh sách lô --' : '-- Chọn lô hàng cần kiểm định --'}</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>Lô #{b.id} — {b.productName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tên Kiểm định viên <span className="req">*</span></label>
              <input value={form.inspectorName} onChange={set('inspectorName')} placeholder="Họ và tên kiểm định viên" />
            </div>
          </div>

          <div className="form-group">
            <label>Đơn vị / Tổ chức kiểm định</label>
            <input value={form.organization} onChange={set('organization')} placeholder="VD: Chi cục BVTV tỉnh Lâm Đồng" />
          </div>

          <div className="form-group">
            <label>Nội dung kiểm tra <span className="req">*</span></label>
            <textarea value={form.inspectionContent} onChange={set('inspectionContent')} placeholder="Mô tả chi tiết nội dung và phương pháp kiểm tra..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kết quả kiểm định</label>
              <select value={form.result} onChange={set('result')}>
                {['Đạt', 'Không đạt', 'Cần bổ sung'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Trạng thái phê duyệt</label>
              <select value={form.approvalStatus} onChange={set('approvalStatus')}>
                {['Đã duyệt', 'Từ chối', 'Chờ duyệt'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nhận xét & Đề xuất xử lý</label>
              <input value={form.note} onChange={set('note')} placeholder="Nhận xét tổng quát, đề xuất..." />
            </div>
            <div className="form-group">
              <label>Hash tài liệu (IPFS/PDF)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ flex: 1 }} value={form.inspectionHash} onChange={set('inspectionHash')} placeholder="QmXoypiz... (tùy chọn)" />
                <label className="btn-outline" style={{ cursor: 'pointer', padding: '10px', fontSize: '13px', minWidth: '135px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {uploadingPdf ? <><Loader2 size={16} className="tsb-spin" /> Đang tải...</> : <><Paperclip size={16}/> Upload PDF/Ảnh</>}
                  <input type="file" accept="application/pdf,image/*" style={{ display: 'none' }} onChange={handlePdfUpload} disabled={uploadingPdf} />
                </label>
              </div>
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
            {loading ? <><Loader2 size={18} className="tsb-spin" /> Đang xử lý...</> : <><ShieldCheck size={18} /> Ghi Phiếu Kiểm Định</>}
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="card-panel glass-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderOpen size={24} /> Hồ Sơ Kiểm Định
          {selectedBatch && <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '14px' }}>— Lô #{selectedBatch}</span>}
          <span style={{ marginLeft: 'auto', background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.2)', color: 'var(--emerald-light)', padding: '2px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
            {inspections.length} phiếu
          </span>
        </h3>

        {inspections.length === 0 ? (
          <div className="empty-msg">
            Chọn một lô hàng để xem lịch sử kiểm định tại đây.
          </div>
        ) : (
          <div className="farms-grid">
            {inspections.map((ins, idx) => {
              const rc = resultColor(ins.result);
              return (
                <div className="farm-item" key={idx} style={{ borderColor: rc.border }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div className="farm-id">Phiếu #{ins.inspectionId.toString()}</div>
                      <div className="farm-title">{ins.inspectorName}</div>
                      {ins.organization && <span>{ins.organization}</span>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className={`active-badge ${rc.badge}`}>{ins.result}</span>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{tsToDate(ins.timestamp)}</div>
                    </div>
                  </div>
                  <div className="divider" style={{ margin: '10px 0' }}></div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14}/> {ins.inspectionContent}</span>
                  {ins.note && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}><MessageSquare size={14}/> Nhận xét: {ins.note}</span>}
                  <div style={{ marginTop: '4px' }}>
                    <span className={`active-badge ${ins.approvalStatus === 'Đã duyệt' ? '' : ins.approvalStatus === 'Chờ duyệt' ? 'badge-amber' : 'inactive'}`}>
                      {ins.approvalStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
