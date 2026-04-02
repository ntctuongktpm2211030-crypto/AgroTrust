import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import MultiSelectDropdown, { IOT_OPTIONS } from './MultiSelectDropdown';
import { Building2, Package, FileText, CheckCircle2, AlertTriangle, Loader2, Edit3, EyeOff, Eye, MapPin, ChevronRight, Hash, Radio } from 'lucide-react';

export default function SystemManagerDashboard({ contract, account, onUserAction }) {
  const [farms, setFarms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [logs, setLogs] = useState([]);

  const [selectedFarm, setSelectedFarm] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [editLogForm, setEditLogForm] = useState(null);
  const [processingLog, setProcessingLog] = useState(false);

  useEffect(() => { loadFarms(); }, [account, contract]);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 5000); }

  const loadFarms = async () => {
     try {
       setLoading(true);
       const fc = await contract.farmCount();
       const fList = [];
       for (let i = 1n; i <= fc; i++) {
         const f = await contract.farms(i);
         fList.push({ id: i.toString(), name: f.farmName, cropType: f.cropType, owner: f.ownerAddress });
       }
       setFarms(fList.reverse()); // Newest first
     } catch (e) {
       console.error(e);
     } finally { setLoading(false); }
  };

  const selectFarm = async (f) => {
     setSelectedFarm(f);
     setSelectedBatch(null);
     setLogs([]);
     try {
       setLoading(true);
       const bc = await contract.batchCount();
       const bList = [];
       for (let i = 1n; i <= bc; i++) {
         const b = await contract.batches(i);
         if (b.farmId.toString() === f.id) {
           bList.push(b);
         }
       }
       setBatches(bList.reverse());
     } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const selectBatch = async (b) => {
     setSelectedBatch(b);
     loadLogs(b.batchId);
  };

  const loadLogs = async (bId) => {
     try {
       setLoading(true);
       const data = await contract.getBatchLogs(bId);
       setLogs([...data].map((l, i) => ({...l, localIndex: i})).reverse()); 
     } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const handleToggleLog = async (batchId, logId) => {
     try {
       const tx = await contract.toggleLogStatus(BigInt(batchId), BigInt(logId));
       showMsg('⏳ Đang gửi giao dịch Bật/Tắt...');
       await tx.wait();
       showMsg('✅ Trạng thái thẻ đã được thay đổi!');
       loadLogs(batchId);
       onUserAction?.({ type: 'system-log-toggle', title: 'Ẩn/Hiện Nhật ký', detail: `Lô #${batchId}`});
     } catch(err) {
       showMsg('❌ Lỗi: ' + (err.reason || err.message));
     }
  };

  const handleUpdateLog = async (e) => {
     e.preventDefault();
     setProcessingLog(true);
     try {
       const tx = await contract.updateCultivationLog(
         BigInt(editLogForm.batchId),
         BigInt(editLogForm.logId),
         editLogForm.actionType,
         editLogForm.description,
         editLogForm.materialName,
         editLogForm.dosage,
         editLogForm.operatorName,
         editLogForm.weatherCondition,
         editLogForm.iotData,
         editLogForm.note
       );
       showMsg('⏳ Đang cập nhật nội dung nhật ký...');
       await tx.wait();
       showMsg('🎉 Cập nhật thành công!');
       setEditLogForm(null);
       loadLogs(editLogForm.batchId);
       onUserAction?.({ type: 'system-log-edit', title: 'Sửa Nhật ký', detail: `Lô #${editLogForm.batchId}`});
     } catch(err) {
       showMsg('❌ Lỗi: ' + (err.reason || err.message));
     } finally { setProcessingLog(false); }
  };

  const ActionBtn = ({ l, type }) => {
     if (selectedFarm.owner.toLowerCase() !== account.toLowerCase()) return null; // Only farm owner can edit
     if (type === 'edit') {
       return <button className="btn-secondary-action" onClick={() => setEditLogForm(l)}><Edit3 size={14}/> Sửa</button>
     }
     if (type === 'toggle') {
       return <button className="btn-secondary-action" style={{ color: l.isActive ? '#ef4444' : '#10b981', borderColor: l.isActive ? 'rgba(239,68,68,.3)' : 'rgba(16,185,129,.3)'}} onClick={() => handleToggleLog(selectedBatch.batchId, l.logId)}>
         {l.isActive ? <><EyeOff size={14}/> Ẩn Khởi KH</> : <><Eye size={14}/> Hiện Lại</>}
       </button>
     }
  };

  const tsToDate = ts => ts > 0n ? new Date(Number(ts) * 1000).toLocaleString('vi-VN') : '—';

  return (
     <div className="dash-wrap" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
       {/* HEADER */}
       <div className="dash-header" style={{ flexShrink: 0 }}>
         <div className="dash-icon" style={{ background: 'linear-gradient(135deg, #f1f5f9, #cbd5e1)' }}><Building2 size={36} color="#334155"/></div>
         <div>
           <div className="dash-title">Quản Lý Hệ Thống & Nông Trại</div>
           <div className="dash-subtitle">Truy xuất danh sách mọi nông trại, quản lý Lô hàng và Phân quyền thao tác Nhật ký canh tác (Chủ nông trại)</div>
         </div>
       </div>

       {/* CONTENT - SPLIT VIEW */}
       <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1.2fr) minmax(250px, 1.5fr) minmax(300px, 2fr)', gap: '16px', flex: 1, minHeight: 0 }}>
         
         {/* COL 1: FARMS */}
         <div className="card-panel glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflow: 'hidden' }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>🏢 Toàn hệ thống ({farms.length})</h3>
            <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
               {farms.map(f => (
                  <div key={f.id} onClick={() => selectFarm(f)} style={{
                     padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                     background: selectedFarm?.id === f.id ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.03)',
                     border: `1px solid ${selectedFarm?.id === f.id ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.08)'}`
                  }}>
                     <div style={{ fontWeight: 700, color: selectedFarm?.id === f.id ? '#0284c7' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       #{f.id} - {f.name} {selectedFarm?.id === f.id && <ChevronRight size={16} style={{ marginLeft: 'auto' }}/>}
                     </div>
                     <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                       <MapPin size={12}/> Chủ: {f.owner.substring(0,6)}...{f.owner.slice(-4)}
                     </div>
                  </div>
               ))}
               {farms.length === 0 && !loading && <p className="empty-msg">Chưa có nông trại nào</p>}
            </div>
         </div>

         {/* COL 2: CROPS / BATCHES */}
         <div className="card-panel glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflow: 'hidden' }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>📦 Lô Thuộc Nông Trại {selectedFarm ? `#${selectedFarm.id}` : ''}</h3>
            <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
               {!selectedFarm && <p className="empty-msg" style={{ marginTop: '20px' }}>&larr; Chọn nông trại bên trái để xem lô</p>}
               {selectedFarm && batches.length === 0 && <p className="empty-msg" style={{ marginTop: '20px' }}>Nông trại này chưa có lô hàng nào.</p>}
               {batches.map(b => (
                  <div key={b.batchId.toString()} onClick={() => selectBatch(b)} style={{
                     padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                     background: selectedBatch?.batchId === b.batchId ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                     border: `1px solid ${selectedBatch?.batchId === b.batchId ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`
                  }}>
                     <div style={{ fontWeight: 700, color: selectedBatch?.batchId === b.batchId ? '#059669' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <Package size={16}/> Lô #{b.batchId.toString()}
                       {selectedBatch?.batchId === b.batchId && <ChevronRight size={16} style={{ marginLeft: 'auto' }}/>}
                     </div>
                     <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        Tên: <b>{b.productName}</b><br/>
                        Loại: {b.plantType} | SL: {b.expectedQuantity.toString()} {b.quantityUnit}
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* COL 3: LOGS */}
         <div className="card-panel glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflow: 'hidden' }}>
            <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span><FileText size={18} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Nhật Ký Của Lô {selectedBatch ? `#${selectedBatch.batchId}` : ''}</span>
               {selectedBatch && <span className="active-badge" style={{ fontSize: '11px' }}>{logs.length} bản ghi</span>}
            </h3>
            <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
               {!selectedBatch && <p className="empty-msg" style={{ marginTop: '20px' }}>&larr; Chọn Lô hàng bên trái để thao tác</p>}
               {selectedBatch && logs.length === 0 && <p className="empty-msg" style={{ marginTop: '20px' }}>Lô này chưa ghi sự kiện nào.</p>}
               
               {logs.map(l => (
                  <div key={l.logId.toString()} style={{
                     padding: '14px', borderRadius: '12px', 
                     background: l.isActive ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.04)',
                     border: `1px solid ${l.isActive ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.2)'}`,
                     opacity: l.isActive ? 1 : 0.65
                  }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                           <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Hash size={14} color="var(--text-secondary)"/> Index {l.localIndex}: {l.actionType}
                           </div>
                           <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                              {tsToDate(l.timestamp)} · Kỹ sư: {l.operatorName}
                           </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                           <ActionBtn l={l} type="edit" />
                           <ActionBtn l={l} type="toggle" />
                        </div>
                     </div>
                     {!l.isActive && <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>⚠️ NHẬT KÝ ĐANG TẮT (KHÔNG HIỂN THỊ VỚI KHÁCH HÀNG)</div>}
                     <div className="divider" style={{ margin: '10px 0' }}></div>
                     <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        <b>Nội dung:</b> {l.description} <br/>
                        <b>Vật tư định lượng:</b> {l.materialName} ({l.dosage})
                     </div>
                  </div>
               ))}
            </div>
         </div>

       </div>

       {/* EDIT MODAL */}
       {editLogForm && createPortal(
        <div className="modal-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(255,255,255,0.6)', backdropFilter:'blur(12px)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', padding: '20px'}}>
          <div className="modal-content fade-in" style={{
            background: '#ffffff', padding:'32px', width:'100%', maxWidth:'600px', 
            borderRadius:'24px', border:'1px solid rgba(0,0,0,0.08)', borderTop: '6px solid #0284c7', boxShadow:'0 20px 40px -10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
              <Edit3 size={24} color="#0284c7"/>
              Chỉnh Sửa Nhật Ký Lô #{editLogForm.batchId} (IDX: {editLogForm.localIndex})
            </h3>
            
            <form onSubmit={handleUpdateLog} className="custom-form" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
               <div className="form-row">
                 <div className="form-group" style={{ flex: 1.5 }}>
                   <label>Loại tác vụ <span className="req">*</span></label>
                   <input required value={editLogForm.actionType} onChange={e => setEditLogForm({...editLogForm, actionType: e.target.value})} style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', padding: '12px', borderRadius: '8px' }} />
                 </div>
                 <div className="form-group" style={{ flex: 1 }}>
                   <label>Người thực hiện <span className="req">*</span></label>
                   <input required value={editLogForm.operatorName} onChange={e => setEditLogForm({...editLogForm, operatorName: e.target.value})} style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', padding: '12px', borderRadius: '8px' }} />
                 </div>
               </div>
               <div className="form-group" style={{ marginBottom: '4px' }}>
                 <label>Nội dung công việc / Mô tả chi tiết <span className="req">*</span></label>
                 <textarea required value={editLogForm.description} onChange={e => setEditLogForm({...editLogForm, description: e.target.value})} style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px' }} />
               </div>
               <div className="form-row" style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
                 <div className="form-group" style={{ flex: '1.3 1 0px', minWidth: '100px' }}>
                   <label style={{ whiteSpace: 'nowrap' }}>Vật tư sử dụng</label>
                   <input value={editLogForm.materialName} onChange={e => setEditLogForm({...editLogForm, materialName: e.target.value})} style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', minWidth: '0', padding: '12px', borderRadius: '8px' }} placeholder="Phân DAP..." />
                 </div>
                 <div className="form-group" style={{ flex: '1 1 0px', minWidth: '100px' }}>
                   <label style={{ whiteSpace: 'nowrap' }}>Liều lượng</label>
                   <input value={editLogForm.dosage} onChange={e => setEditLogForm({...editLogForm, dosage: e.target.value})} style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', minWidth: '0', padding: '12px', borderRadius: '8px' }} placeholder="10 kg/ha" />
                 </div>
                 <div className="form-group" style={{ flex: '1.2 1 0px', minWidth: '100px' }}>
                   <label style={{ whiteSpace: 'nowrap' }}>Thời tiết</label>
                   <select value={editLogForm.weatherCondition || ''} onChange={e => setEditLogForm({...editLogForm, weatherCondition: e.target.value})} style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', minWidth: '0', height: '42.5px', padding: '0 12px', borderRadius: '8px' }}>
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
                 <div className="form-group" style={{ flex: '2 1 0px', minWidth: '200px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}><Radio size={16}/> Dữ liệu IoT (Nếu có)</label>
                   <MultiSelectDropdown options={IOT_OPTIONS} value={editLogForm.iotData} onChange={(val) => setEditLogForm({...editLogForm, iotData: val})} />
                 </div>
                 <div className="form-group" style={{ flex: '1 1 0px', minWidth: '120px' }}>
                   <label style={{ whiteSpace: 'nowrap' }}>Ghi chú khác</label>
                   <input value={editLogForm.note} onChange={e => setEditLogForm({...editLogForm, note: e.target.value})} style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', minWidth: '0', padding: '12px', borderRadius: '8px' }} />
                 </div>
               </div>

               <div style={{display:'flex', gap:'12px', marginTop:'16px'}}>
                 <button type="button" className="btn" onClick={() => setEditLogForm(null)} style={{flex:1, background:'#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 600}}>Hủy sửa</button>
                 <button type="submit" className="btn primary-btn" disabled={processingLog} style={{flex:1, background:'linear-gradient(135deg, #0284c7, #0369a1)', border: 'none', color: '#fff', fontWeight: 600 }}>
                   {processingLog ? <><Loader2 size={18} className="tsb-spin" style={{marginRight: '6px'}}/> Đang cập nhật...</> : 'Lưu Thay Đổi Bản Ghi'}
                 </button>
               </div>
            </form>
          </div>
        </div>, document.body
       )}

       {/* GLOBAL MESSAGES */}
       {msg && createPortal(
         <div style={{ zIndex: 9999999 }} className={`form-msg ${msg.match(/^[✅🎉✨]/) ? 'success' : msg.match(/^[❌⚠️]/) ? 'error-msg' : ''}`}>
           {msg.match(/^[✅🎉✨]/) && <CheckCircle2 size={22} className="toast-anim-success" />}
           {msg.match(/^[❌⚠️]/) && <AlertTriangle size={22} className="toast-anim-error" />}
           {msg.match(/^[⏳⛓]/) && <Loader2 size={22} className="toast-anim-loading" />}
           <span>{msg.replace(/^[✅🎉✨❌⚠️⏳⛓]\s*/, '')}</span>
         </div>,
         document.body
       )}

     </div>
  );
}
