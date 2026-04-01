import { useMemo, useState } from "react";
import { History, Trash2, Search } from "lucide-react";
import { clearUserActivity, getUserActivity } from "../utils/userActivity";

const formatTime = (isoString) => {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
};

export default function UserActivityDashboard() {
  const [keyword, setKeyword] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const items = useMemo(() => {
    const data = getUserActivity();
    const q = keyword.trim().toLowerCase();
    if (!q) return data;
    return data.filter((x) =>
      [x.title, x.detail, x.account, x.role, x.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [keyword, refreshKey]);

  const handleClear = () => {
    clearUserActivity();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="dash-wrap">
      <h2 className="dash-title">
        <History
          size={28}
          style={{ display: "inline-block", verticalAlign: "text-bottom", marginRight: "8px" }}
        />
        Lịch Sử Thao Tác
      </h2>

      <div className="card-panel glass-card">
        <div style={{ display: "flex", gap: "12px", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "220px", flex: "1" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm thao tác theo từ khóa..."
              style={{ width: "100%", paddingLeft: "36px" }}
            />
          </div>
          <button className="btn-outline" onClick={handleClear} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Trash2 size={16} />
            Xóa lịch sử
          </button>
        </div>
      </div>

      <div className="card-panel glass-card">
        <h3>Danh sách thao tác ({items.length})</h3>
        {items.length === 0 ? (
          <p className="empty-msg">Chưa có thao tác nào được ghi nhận.</p>
        ) : (
          <div className="farms-grid">
            {items.map((item) => (
              <div className="farm-item" key={item.id}>
                <div className="farm-id">{formatTime(item.timestamp)}</div>
                <div className="farm-title">{item.title}</div>
                {item.detail && <span>{item.detail}</span>}
                <span style={{ color: "var(--text-secondary)" }}>
                  {item.account ? `Ví: ${item.account.slice(0, 6)}...${item.account.slice(-4)}` : "Ví: —"}{" "}
                  | Vai trò: {item.role || "—"}
                </span>
                <span className="active-badge">{item.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
