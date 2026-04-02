import { useMemo, useState } from "react";
import { History, Layers } from "lucide-react";
import { getUserActivity } from "../utils/userActivity";

const formatTime = (isoString) => {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
};

export default function UserActivityDashboard() {
  const [filter, setFilter] = useState("Tất cả");
  const [refreshKey, setRefreshKey] = useState(0);

  const { items, categories, counts } = useMemo(() => {
    const data = getUserActivity();
    
    const stats = { "Tất cả": data.length };
    data.forEach(x => {
        const t = x.type || "other";
        stats[t] = (stats[t] || 0) + 1;
    });

    const cats = ["Tất cả", ...Object.keys(stats).filter(k => k !== "Tất cả").sort()];
    
    let filteredData = data;
    if (filter !== "Tất cả") {
        filteredData = data.filter(x => (x.type || "other") === filter);
    }

    return { items: filteredData, categories: cats, counts: stats };
  }, [filter, refreshKey]);



  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px', fontFamily: 'inherit' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', margin: '0 0 24px 0', color: '#064e3b' }}>
        <div style={{ padding: '8px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '50%', color: '#0d9488', display: 'flex' }}>
            <History size={28} />
        </div>
        Lịch Sử Thao Tác
      </h2>

      {/* Filter Card */}
      <div style={{ 
          background: '#fff', 
          borderRadius: '16px', 
          padding: '24px', 
          marginBottom: '24px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid #f0fdf4'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Layers size={18} color="#0d9488" />
            Phân Loại Thao Tác
          </div>

        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: 600,
                border: filter === cat ? '1px solid #34d399' : '1px solid #e5e7eb',
                background: filter === cat ? '#a7f3d0' : '#fff',
                color: filter === cat ? '#064e3b' : '#374151',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {cat}
              <span style={{ 
                  background: filter === cat ? '#34d399' : '#f3f4f6', 
                  color: filter === cat ? '#064e3b' : '#6b7280', 
                  padding: '2px 8px', borderRadius: '12px', fontSize: '12px' 
              }}>
                  {counts[cat]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List Container */}
      <div style={{ 
          background: 'rgba(255,255,255,0.4)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '24px', 
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.6)'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#166534', marginBottom: '20px', paddingLeft: '4px' }}>
            Danh sách thao tác ({counts[filter] || 0})
        </div>

        {items.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0', fontSize: '15px' }}>
              Chưa có thao tác nào trong mục này.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item) => (
              <div key={item.id} style={{
                background: '#fff', borderRadius: '16px', padding: '24px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid rgba(240, 253, 244, 0.5)',
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ fontSize: '13px', color: '#059669', fontWeight: 600, marginBottom: '8px' }}>
                  {formatTime(item.timestamp)}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#064e3b', marginBottom: '6px' }}>
                  {item.title}
                </div>
                {item.detail && (
                  <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px', lineHeight: '1.5' }}>
                    {item.detail}
                  </div>
                )}
                <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {item.account ? `Ví: ${item.account.slice(0, 6)}...${item.account.slice(-4)}` : "Ví: —"}
                  <span style={{ color: '#d1d5db', margin: '0 4px' }}>|</span> 
                  Vai trò: {item.role || "—"}
                </div>
                
                {/* Badge layout based on mockup shows tag on bottom left under text or right */}
                <span style={{ 
                    display: 'inline-block',
                    marginTop: '16px',
                    background: '#d1fae5', color: '#059669', 
                    padding: '6px 14px', borderRadius: '20px', 
                    fontSize: '12px', fontWeight: 600, border: '1px solid #a7f3d0' 
                }}>
                  {item.type || "general"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
