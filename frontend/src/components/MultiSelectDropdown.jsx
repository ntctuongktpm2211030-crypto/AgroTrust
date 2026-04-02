import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export const IOT_OPTIONS = [
  {
    label: "✅ Trạng thái chung", items: [
      { label: "Hệ thống IoT hoạt động ổn định", value: "Hệ thống IoT hoạt động ổn định toàn diện" }
    ]
  },
  {
    label: "🌡️ Không khí & Nhiệt độ", items: [
      { label: "Không khí tối ưu (T: 24-28°C)", value: "Không khí tối ưu (T: 24-28°C, H: 60-75%)" },
      { label: "Nóng, khô (T: > 32°C)", value: "Không khí nóng, khô (T: > 32°C, H: < 50%)" },
      { label: "Lạnh, ẩm ướt (T: < 22°C)", value: "Không khí lạnh, ẩm (T: < 22°C, H: > 80%)" }
    ]
  },
  {
    label: "🌱 Đất & Dinh dưỡng", items: [
      { label: "Đất: Độ ẩm lý tưởng", value: "Đất: Độ ẩm xốp, lý tưởng (60-75%)" },
      { label: "Đất: Khô cằn (Cần tưới ngay)", value: "Đất: Khô cằn, thiếu nước (< 40%)" },
      { label: "Đất: Ngập úng mặn", value: "Đất: Ngập úng, bão hòa nước (> 90%)" },
      { label: "Đất: pH ổn định (5.5 - 6.5)", value: "Đất: Độ pH ổn định (5.5 - 6.5)" },
      { label: "Dinh dưỡng (EC/TDS) tiêu chuẩn", value: "Nước: Nồng độ EC/TDS đạt tiêu chuẩn" }
    ]
  },
  {
    label: "⚙️ Thiết bị tự động hóa", items: [
      { label: "Hệ thống tưới (BẬT)", value: "Trạng thái: Bơm tưới tự động (Đang Bật)" },
      { label: "Quạt thông gió (BẬT)", value: "Trạng thái: Quạt thông gió (Đang Bật)" },
      { label: "Đèn chiếu sáng (BẬT)", value: "Trạng thái: Đèn quang hợp (Đang Bật)" }
    ]
  },
  {
    label: "⚠️ Sự cố & Cảnh báo", items: [
      { label: "Môi trường vượt ngưỡng an toàn", value: "Cảnh báo: Chỉ số môi trường vượt ngưỡng an toàn" },
      { label: "Mất kết nối mô-đun cảm biến", value: "Lỗi: Mất kết nối cảm biến khu vực" },
      { label: "Mất điện định tuyến / Sập nguồn IoT", value: "Lỗi: Trạm IoT khu vực mất nguồn điện" }
    ]
  }
];

export default function MultiSelectDropdown({ options, value, onChange, placeholder = "-- Trống --" }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);

  const selected = value ? value.split(' ; ').filter(Boolean) : [];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        // Also check if click is inside the portal dropdown
        const portalEl = document.getElementById('iot-dropdown-portal');
        if (portalEl && portalEl.contains(e.target)) return;
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropH = 300;
      const goUp = spaceBelow < dropH + 12 && rect.top > dropH;

      setDropdownStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 2147483647,
        ...(goUp
          ? { bottom: window.innerHeight - rect.top + 4, top: 'auto' }
          : { top: rect.bottom + 4, bottom: 'auto' }),
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const toggleOption = (optValue) => {
    let next;
    if (selected.includes(optValue)) next = selected.filter(x => x !== optValue);
    else next = [...selected, optValue];
    onChange(next.join(' ; '));
  };

  const displayLabels = selected.map(val => {
    for (let g of options) {
      const item = g.items.find(i => i.value === val);
      if (item) return item.label;
    }
    return val;
  }).join(', ');

  const dropdownMenu = open && createPortal(
    <div
      id="iot-dropdown-portal"
      style={{
        ...dropdownStyle,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 10px 40px -8px rgba(0,0,0,0.18)',
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      {options.map((group, i) => (
        <div key={i} style={{ marginBottom: '8px' }}>
          {group.label && (
            <div style={{
              fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.5px', color: '#94a3b8', padding: '6px 8px 4px'
            }}>
              {group.label}
            </div>
          )}
          {group.items.map(item => {
            const isSelected = selected.includes(item.value);
            return (
              <div
                key={item.value}
                onMouseDown={(e) => { e.preventDefault(); toggleOption(item.value); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', cursor: 'pointer', borderRadius: '6px',
                  fontSize: '14px', fontWeight: 500, transition: 'all 0.15s',
                  background: isSelected ? 'rgba(34,197,94,0.1)' : 'transparent',
                  color: isSelected ? '#166534' : '#334155',
                  userSelect: 'none',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(34,197,94,0.1)' : 'transparent'; }}
              >
                <div style={{
                  width: '16px', height: '16px',
                  border: `1.5px solid ${isSelected ? '#22c55e' : '#cbd5e1'}`,
                  borderRadius: '4px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? '#22c55e' : '#fff',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}>
                  {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                </div>
                {item.label}
              </div>
            );
          })}
        </div>
      ))}
    </div>,
    document.body
  );

  return (
    <div ref={triggerRef} style={{ position: 'relative', width: '100%', minWidth: 0 }}>
      <div
        onClick={() => setOpen(prev => !prev)}
        style={{
          background: '#fff', color: '#1e293b',
          border: `1px solid ${open ? '#22c55e' : '#e2e8f0'}`,
          width: '100%', minHeight: '41px',
          padding: '8px 12px', borderRadius: '8px',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          fontSize: '14.5px', transition: 'all 0.2s',
          boxShadow: open ? '0 0 0 2px rgba(34,197,94,0.2)' : 'none',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '4px', overflow: 'hidden', flex: 1 }}>
          {selected.length > 0 ? (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayLabels}
            </span>
          ) : (
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0, marginLeft: '8px', color: '#64748b',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s'
          }}
        />
      </div>

      {dropdownMenu}
    </div>
  );
}
