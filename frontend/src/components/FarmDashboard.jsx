import { useState, useEffect, useRef } from 'react';
import { uploadBase64ToPinata } from '../utils/pinata';
import { Tractor, Camera, Trash2, PlusCircle, Loader2, CheckCircle2, XCircle, User, Phone, MapPin, Leaf, Maximize, FileText } from 'lucide-react';

/* ── Storage helper (Lưu CID của IPFS thay vì base64) ────────
   Key: "agrotrust_crop_images"
   Value: { [cropType_lowercase]: ipfs_cid_string }
   ──────────────────────────────────────────────────────── */
const STORAGE_KEY = 'agrotrust_crop_images';
const getCropImages = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
};
const saveCropImageCID = (cropType, cid) => {
  if (!cropType?.trim() || !cid) return;
  const map = getCropImages();
  map[cropType.trim().toLowerCase()] = cid;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

/* Tách chuỗi cropType thành danh sách tên riêng */
const parseCropTypes = (str) =>
  str.split(/[,;/]+/).map(s => s.trim()).filter(Boolean);

export default function FarmDashboard({ contract, account, onUserAction }) {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    farmName: '', ownerName: '', phoneNumber: '',
    location: '', gpsCoordinates: '', area: '',
    cropType: '', description: ''
  });
  // cropPicMap: { [cropName_lower]: base64 } — ảnh được quản lý theo từng loại
  const [cropPicMap, setCropPicMap] = useState({});
  const fileRefs = useRef({});   // ref map: { [cropName_lower]: inputElement }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Khi cropType thay đổi → khởi tạo cropPicMap từ localStorage
  useEffect(() => {
    if (!form.cropType.trim()) { setCropPicMap({}); return; }
    const saved = getCropImages();
    const items = parseCropTypes(form.cropType);
    const initial = {};
    items.forEach(name => {
      const k = name.toLowerCase();
      if (saved[k]) initial[k] = saved[k];
    });
    setCropPicMap(initial);
  }, [form.cropType]);

  useEffect(() => { loadMyFarms(); }, [account]);

  const loadMyFarms = async () => {
    try {
      const count = await contract.farmCount();
      const list = [];
      for (let i = 1n; i <= count; i++) {
        const f = await contract.farms(i);
        if (f.ownerAddress.toLowerCase() === account.toLowerCase()) list.push(f);
      }
      setFarms(list);
    } catch (e) { console.error(e); }
  };

  /* Upload ảnh cho từng loại nông sản riêng */
  const handleImageUpload = (cropKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCropPicMap(prev => ({ ...prev, [cropKey]: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const removeImage = (cropKey) => {
    setCropPicMap(prev => { const n = { ...prev }; delete n[cropKey]; return n; });
    if (fileRefs.current[cropKey]) fileRefs.current[cropKey].value = '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.farmName || !form.ownerName || !form.phoneNumber || !form.location) {
      setMsg('⚠️ Vui lòng nhập các trường bắt buộc!'); return;
    }

    try {
      setLoading(true);

      setMsg('⏳ Đang đồng bộ dữ liệu lên mạng lưới Blockchain...');
      const tx = await contract.addFarm(
        form.farmName, 
        form.ownerName, 
        form.phoneNumber, 
        form.location, 
        form.gpsCoordinates, 
        form.area, 
        form.cropType, 
        form.description
      );
      await tx.wait();
      
      // Chờ giao dịch xong mới lấy ID và upload IPFS
      const farmCount = await contract.farmCount();
      
      const storedIPFS = JSON.parse(localStorage.getItem('agrotrust_crop_images') || '{}');
      let imgUploaded = false;

      for (const [cropKey, base64Data] of Object.entries(cropPicMap)) {
        if (base64Data && base64Data.startsWith('data:image')) {
          setMsg(`⏳ Khởi tạo thành công. Đang lưu ảnh ${cropKey} lên Cloud IPFS...`);
          const cid = await uploadBase64ToPinata(base64Data, `farm_${farmCount}_${cropKey}`);
          if (cid) {
            storedIPFS[cropKey] = cid;
            imgUploaded = true;
          }
        }
      }

      if (imgUploaded) {
        localStorage.setItem('agrotrust_crop_images', JSON.stringify(storedIPFS));
      }

      setMsg('🎉 Hoàn tất: Nông trại đã được khởi tạo và xác thực trên chuỗi!');
      onUserAction?.({
        type: 'farm',
        title: 'Tạo nông trại mới',
        detail: `Nông trại "${form.farmName}" đã được ghi nhận trên blockchain`,
      });
      setTimeout(() => setMsg(''), 5000);
      setForm({ farmName:'', location:'', cropType:'', area:'' }); // Resetting only the fields used in the new addFarm call
      setCropPicMap({}); // Clear all crop images
      loadMyFarms();
    } catch (err) {
      setMsg('❌ Lỗi giao dịch: ' + (err.reason || err.message));
      setTimeout(() => setMsg(''), 5000);
    } finally { setLoading(false); }
  };

  const cropImages = getCropImages();

  // Helper function to get IPFS URL (assuming it's defined elsewhere or needs to be added)
  const getIpfsUrl = (cid) => cid ? `https://ipfs.io/ipfs/${cid}` : '';

  return (
    <div className="dash-wrap">
      <h2 className="dash-title"><Tractor size={28} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '8px' }} /> Quản Lý Nông Trại</h2>

      <div className="card-panel glass-card">
        <h3>Đăng ký Nông trại mới</h3>
        <form className="custom-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Tên nông trại <span className="req">*</span></label>
              <input value={form.farmName} onChange={set('farmName')} placeholder="VD: Trang trại Xanh Đà Lạt" />
            </div>
            <div className="form-group">
              <label>Chủ nông trại <span className="req">*</span></label>
              <input value={form.ownerName} onChange={set('ownerName')} placeholder="Họ tên chủ nông trại" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Số điện thoại <span className="req">*</span></label>
              <input value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="0901 234 567" />
            </div>
            <div className="form-group">
              <label>Diện tích canh tác</label>
              <input value={form.area} onChange={set('area')} placeholder="VD: 5 hecta" />
            </div>
          </div>
          <div className="form-group">
            <label>Địa chỉ cụ thể <span className="req">*</span></label>
            <input value={form.location} onChange={set('location')} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tọa độ GPS</label>
              <input value={form.gpsCoordinates} onChange={set('gpsCoordinates')} placeholder="VD: 11.9404, 108.4583" />
            </div>
            <div className="form-group">
              <label>Loại nông sản chính</label>
              <input
                value={form.cropType}
                onChange={set('cropType')}
                placeholder="VD: Cà chua, Dâu tây, Lúa ST25"
              />
            </div>
          </div>

          {/* ── Mỗi loại nông sản → một ô upload ảnh riêng ── */}
          {parseCropTypes(form.cropType).length > 0 && (
            <div className="crop-image-upload-box">
              <div className="ciub-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={18} /> Ảnh đại diện cho từng loại nông sản
                <span className="ciub-hint"> (lưu trên máy, dùng để nhận diện)</span>
              </div>
              <div className="ciub-multi-grid">
                {parseCropTypes(form.cropType).map(name => {
                  const k = name.toLowerCase();
                  const img = cropPicMap[k];
                  return (
                    <div key={k} className="ciub-crop-card">
                      {/* Clickable image square */}
                      <div
                        className={`ciub-preview ${img ? 'has-image' : ''}`}
                        onClick={() => fileRefs.current[k]?.click()}
                        title="Click để chọn ảnh"
                      >
                        {img
                          ? <img src={img} alt={name} />
                          : (
                            <div className="ciub-placeholder">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="3"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <path d="M21 15l-5-5L5 21"/>
                              </svg>
                              <span>Chọn ảnh</span>
                            </div>
                          )
                        }
                        <input
                          ref={el => fileRefs.current[k] = el}
                          type="file" accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => handleImageUpload(k, e)}
                        />
                      </div>
                      {/* Tên loại */}
                      <div className="ciub-crop-name">{name}</div>
                      {/* Nút xoá */}
                      {img && (
                        <button type="button" className="ciub-remove" onClick={() => removeImage(k)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Mô tả &amp; Tiêu chuẩn</label>
            <textarea value={form.description} onChange={set('description')} placeholder="Mô tả ngắn nông trại, tiêu chuẩn đạt được (VietGAP, GlobalGAP, Organic...)" />
          </div>
          {msg && <p className={`form-msg ${msg.startsWith('✅') ? 'success' : msg.startsWith('❌') ? 'error-msg' : ''}`}>{msg}</p>}
          <button type="submit" className="btn primary-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? <><Loader2 size={18} className="tsb-spin" /> Đang xử lý...</> : <><PlusCircle size={18} /> Tạo Nông Trại</>}
          </button>
        </form>
      </div>

      <div className="card-panel glass-card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3>Danh sách Nông trại của tôi ({farms.length})</h3>
          <button className="btn-refresh" onClick={loadMyFarms}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 2.1-5.9L2 9"/>
            </svg>
            Làm mới
          </button>
        </div>
        {farms.length === 0 ? (
          <p className="empty-msg">Bạn chưa có nông trại nào. Hãy tạo mới ở trên!</p>
        ) : (
          <div className="farms-grid">
            {farms.map(f => {
              const cid = cropImages[f.cropType?.trim().toLowerCase()];
              return (
                <div className="farm-item" key={f.farmId.toString()}>
                  {cid && (
                    <div className="farm-crop-img">
                      <img src={getIpfsUrl(cid) || cid} alt={f.cropType} />
                    </div>
                  )}
                  <div className="farm-id">#{f.farmId.toString()}</div>
                  <div className="farm-title">{f.farmName}</div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> {f.ownerName} — <Phone size={14} /> {f.phoneNumber}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {f.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Leaf size={14} /> {f.cropType} — <Maximize size={14} /> {f.area}</span>
                  {f.description && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> {f.description}</span>}
                  <span className={`active-badge ${f.isActive ? '' : 'inactive'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {f.isActive ? <><CheckCircle2 size={14} /> Đang hoạt động</> : <><XCircle size={14} /> Tạm ngưng</>}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
