import React, { useState, useEffect } from 'react';

const AnalyticsDashboard = ({ contract, account }) => {
    const [stats, setStats] = useState({
        totalBatches: 0,
        passRate: 0,
        avgTransitTime: 0, // In days
        anomaliesCount: 0,
    });
    const [chartData, setChartData] = useState({
        statusBars: [],
        monthlyTrend: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, [contract]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const count = await contract.batchCount();
            let passCount = 0;
            let completedCount = 0;
            let totalTransitTime = 0;
            let anomalies = 0;
            const statusCounters = {};
            const monthlyCounters = {};
            const now = new Date();
            const monthKeys = [];
            for (let k = 5; k >= 0; k--) {
                const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                monthKeys.push(key);
                monthlyCounters[key] = 0;
            }

            for (let i = 1; i <= Number(count); i++) {
                const b = await contract.batches(i);
                const statusKey = Number(b.status);
                statusCounters[statusKey] = (statusCounters[statusKey] || 0) + 1;
                if (b.sowingDate && Number(b.sowingDate) > 0) {
                    const d = new Date(Number(b.sowingDate) * 1000);
                    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    if (monthlyCounters[mk] !== undefined) monthlyCounters[mk] += 1;
                }
                
                // Inspections for pass rate
                const inspections = await contract.getBatchInspections(i);
                let passed = false;
                for (const ins of inspections) {
                    if (ins.result && ins.result.toLowerCase().includes('đạt')) passed = true;
                }
                if (passed) passCount++;
                
                // Logistics for transit time and anomalies
                const logistics = await contract.getBatchLogistics(i);
                
                let timeFirst = b.sowingDate > 0 ? Number(b.sowingDate) : null;
                let timeLast = null;
                
                for (const ev of logistics) {
                    if (ev.anomaly && ev.anomaly.length > 0) anomalies++;
                    if (timeFirst === null) timeFirst = Number(ev.timestamp);
                    if (ev.eventType.includes('Giao') || ev.eventType.includes('Phân phối') || ev.eventType.includes('Nhận')) {
                        timeLast = Number(ev.timestamp);
                    }
                }
                
                if (timeFirst && timeLast && timeLast > timeFirst) { // has start and end
                    totalTransitTime += (timeLast - timeFirst);
                    completedCount++;
                }
            }

            const pRate = count > 0 ? ((passCount / Number(count)) * 100).toFixed(1) : 0;
            const avgTime = completedCount > 0 ? (totalTransitTime / completedCount / (60 * 60 * 24)).toFixed(1) : 0;
            const scoreCalc = pRate - (anomalies * 5);
            const safetyScore = count > 0 ? Math.max(0, Math.min(100, scoreCalc)).toFixed(0) : 0;

            setStats({
                totalBatches: Number(count),
                passRate: pRate,
                avgTransitTime: avgTime,
                anomaliesCount: anomalies,
                safetyScore: safetyScore
            });

            const statusLabels = ['Gieo', 'Chăm sóc', 'Bón', 'Phun', 'Thu hoạch', 'Đóng gói', 'Vận chuyển', 'Kiểm định', 'Phân phối'];
            const statusBars = statusLabels.map((label, idx) => ({
                label,
                value: statusCounters[idx] || 0,
            }));
            const monthlyTrend = monthKeys.map(key => {
                const [y, m] = key.split('-');
                return { label: `${m}/${String(y).slice(-2)}`, value: monthlyCounters[key] || 0 };
            });
            setChartData({ statusBars, monthlyTrend });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderBarChart = (bars) => {
        const max = Math.max(...bars.map(x => x.value), 1);
        return (
            <div className="chart-wrap">
                {bars.map((b, idx) => {
                    const h = Math.max(8, Math.round((b.value / max) * 140));
                    return (
                        <div className="bar-col" key={`${b.label}-${idx}`}>
                            <div className="bar-val">{b.value}</div>
                            <div className="bar-track">
                                <div className="bar-fill" style={{ height: `${h}px` }} />
                            </div>
                            <div className="bar-label">{b.label}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderLineChart = (points) => {
        const w = 680;
        const h = 220;
        const pad = 24;
        const max = Math.max(...points.map(p => p.value), 1);
        const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
        const coords = points.map((p, i) => {
            const x = pad + i * stepX;
            const y = h - pad - (p.value / max) * (h - pad * 2);
            return { ...p, x, y };
        });
        const polyline = coords.map(c => `${c.x},${c.y}`).join(' ');
        const area = `${pad},${h - pad} ${polyline} ${w - pad},${h - pad}`;

        return (
            <div className="line-chart-box">
                <svg viewBox={`0 0 ${w} ${h}`} className="line-chart-svg" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="trendStroke" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                        <linearGradient id="trendArea" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(14,165,233,0.28)" />
                            <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
                        </linearGradient>
                    </defs>
                    <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="rgba(15,118,110,0.2)" />
                    <polygon points={area} fill="url(#trendArea)" />
                    <polyline points={polyline} fill="none" stroke="url(#trendStroke)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    {coords.map((c, idx) => (
                        <g key={`dot-${idx}`}>
                            <circle cx={c.x} cy={c.y} r="4.5" fill="#0ea5e9" />
                            <text x={c.x} y={c.y - 10} textAnchor="middle" fontSize="11" fill="#0f766e" fontWeight="700">{c.value}</text>
                        </g>
                    ))}
                </svg>
                <div className="line-x-labels">
                    {points.map((p, idx) => <span key={`lb-${idx}`}>{p.label}</span>)}
                </div>
            </div>
        );
    };

    const renderGauge = ({ value, max = 100, label, colorA, colorB, suffix = '' }) => {
        const safeMax = Math.max(max, 1);
        const ratio = Math.max(0, Math.min(1, Number(value) / safeMax));
        const r = 38;
        const c = 2 * Math.PI * r;
        const dash = c * ratio;
        return (
            <div className="gauge-card">
                <svg viewBox="0 0 120 120" className="gauge-svg">
                    <circle cx="60" cy="60" r={r} className="gauge-bg" />
                    <circle
                        cx="60"
                        cy="60"
                        r={r}
                        className="gauge-fg"
                        style={{
                            strokeDasharray: `${dash} ${c}`,
                            stroke: `url(#g-${label.replace(/\s+/g, '-')})`
                        }}
                    />
                    <defs>
                        <linearGradient id={`g-${label.replace(/\s+/g, '-')}`} x1="0" x2="1" y1="0" y2="1">
                            <stop offset="0%" stopColor={colorA} />
                            <stop offset="100%" stopColor={colorB} />
                        </linearGradient>
                    </defs>
                    <text x="60" y="57" textAnchor="middle" className="gauge-value">{value}{suffix}</text>
                    <text x="60" y="73" textAnchor="middle" className="gauge-max">/{max}</text>
                </svg>
                <div className="gauge-label">{label}</div>
            </div>
        );
    };

    if (loading) return <div className="glass-card fade-in" style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu phân tích...</div>;

    return (
        <div className="glass-card fade-in" style={{ padding: '32px 40px' }}>
            <style>
            {`
            .glass-stat-card {
                background: rgba(255, 255, 255, 0.75);
                backdrop-filter: blur(28px) saturate(200%);
                -webkit-backdrop-filter: blur(28px) saturate(200%);
                padding: 24px;
                border-radius: 20px;
                border: 1.5px solid rgba(22, 163, 74, 0.22);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                flex-direction: column;
                gap: 12px;
                box-shadow: 0 4px 30px rgba(0,0,0,0.03);
            }
            .glass-stat-card:hover {
                transform: translateY(-4px) scale(1.02);
                background: rgba(255, 255, 255, 0.9);
                box-shadow: 0 20px 40px -10px rgba(22, 163, 74, 0.15);
                border: 1.5px solid rgba(22, 163, 74, 0.4);
            }
            .glass-note-panel {
                background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(56, 189, 248, 0.05));
                border-left: 4px solid #0ea5e9;
                padding: 20px 24px;
                border-radius: 12px;
                border-top: 1px solid rgba(14, 165, 233, 0.2);
                border-right: 1px solid rgba(14, 165, 233, 0.2);
                border-bottom: 1px solid rgba(14, 165, 233, 0.2);
            }
            .glow-text {
                background: linear-gradient(135deg, #15803d 0%, #ca8a04 55%, #16a34a 100%);
                background-size: 200%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .chart-panel {
                margin-top: 26px;
                background: rgba(255, 255, 255, 0.82);
                border: 1.5px solid rgba(22,163,74,0.18);
                border-radius: 18px;
                padding: 20px;
                box-shadow: 0 8px 26px rgba(0,0,0,0.04);
            }
            .chart-title {
                margin: 0 0 14px;
                font-size: 14px;
                font-weight: 800;
                color: var(--text-2);
                letter-spacing: 0.2px;
            }
            .chart-wrap {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(52px, 1fr));
                gap: 10px;
                align-items: end;
                min-height: 185px;
            }
            .bar-col {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
            }
            .bar-track {
                width: 100%;
                max-width: 34px;
                height: 150px;
                border-radius: 10px;
                background: rgba(6,95,70,0.08);
                display: flex;
                align-items: flex-end;
                overflow: hidden;
                border: 1px solid rgba(6,95,70,0.08);
            }
            .bar-fill {
                width: 100%;
                border-radius: 10px 10px 0 0;
                background: linear-gradient(180deg, #22c55e 0%, #0ea5e9 100%);
                box-shadow: 0 -4px 12px rgba(14,165,233,0.2);
                transition: height .4s ease;
            }
            .bar-label {
                font-size: 10px;
                color: var(--text-3);
                font-weight: 700;
                text-align: center;
                line-height: 1.2;
                min-height: 24px;
            }
            .bar-val {
                font-size: 11px;
                color: #0f766e;
                font-weight: 800;
            }
            .line-chart-box {
                width: 100%;
            }
            .line-chart-svg {
                width: 100%;
                height: 220px;
                border-radius: 12px;
                background: linear-gradient(180deg, rgba(14,165,233,0.05), rgba(34,197,94,0.03));
                border: 1px solid rgba(14,165,233,0.15);
            }
            .line-x-labels {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                margin-top: 8px;
                font-size: 11px;
                font-weight: 700;
                color: var(--text-3);
                text-align: center;
            }
            .gauge-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 14px;
            }
            .gauge-card {
                background: rgba(255,255,255,0.72);
                border: 1px solid rgba(16,185,129,0.16);
                border-radius: 14px;
                padding: 14px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            .gauge-svg {
                width: 110px;
                height: 110px;
            }
            .gauge-bg {
                fill: none;
                stroke: rgba(6,95,70,0.14);
                stroke-width: 10;
            }
            .gauge-fg {
                fill: none;
                stroke-width: 10;
                stroke-linecap: round;
                transform: rotate(-90deg);
                transform-origin: 60px 60px;
                transition: stroke-dasharray .45s ease;
            }
            .gauge-value {
                font-size: 18px;
                font-weight: 900;
                fill: #065f46;
            }
            .gauge-max {
                font-size: 10px;
                font-weight: 700;
                fill: #6b8d83;
            }
            .gauge-label {
                font-size: 12px;
                color: var(--text-2);
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: .3px;
            }
            `}
            </style>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(22,163,74,0.2), rgba(22,163,74,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(22,163,74,0.3)', boxShadow: '0 0 20px rgba(22,163,74,0.1)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                </div>
                <div>
                    <h2 className="glow-text" style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                        Dashboard Phân Tích
                    </h2>
                    <div style={{ fontSize: '14px', color: 'var(--text-3)', marginTop: '4px', fontWeight: 600 }}>
                        Theo dõi thời gian thực các chỉ số hiệu suất & an toàn nguồn gốc
                    </div>
                </div>
            </div>
            
            <div className="chart-panel">
                <h3 className="chart-title">Biểu đồ KPI tổng quan</h3>
                <div className="gauge-grid">
                    {renderGauge({ value: stats.totalBatches, max: Math.max(stats.totalBatches || 1, 10), label: 'Tổng lô', colorA: '#0ea5e9', colorB: '#0369a1' })}
                    {renderGauge({ value: Number(stats.passRate), max: 100, label: 'Tỷ lệ đạt', colorA: '#22c55e', colorB: '#15803d', suffix: '%' })}
                    {renderGauge({ value: Number(stats.avgTransitTime), max: Math.max(Number(stats.avgTransitTime) + 3, 10), label: 'TB ngày', colorA: '#8b5cf6', colorB: '#6d28d9' })}
                    {renderGauge({ value: Number(stats.anomaliesCount), max: Math.max(Number(stats.anomaliesCount) + 3, 10), label: 'Anomalies', colorA: '#ef4444', colorB: '#b91c1c' })}
                    {renderGauge({ value: Number(stats.safetyScore || 0), max: 100, label: 'Safety', colorA: '#f59e0b', colorB: '#16a34a', suffix: '%' })}
                </div>
            </div>

            <div className="chart-panel">
                <h3 className="chart-title">Biểu đồ cột trạng thái lô hàng</h3>
                {renderBarChart(chartData.statusBars)}
            </div>

            <div className="chart-panel">
                <h3 className="chart-title">Biểu đồ đường xu hướng tạo lô (6 tháng gần nhất)</h3>
                {renderLineChart(chartData.monthlyTrend)}
            </div>

            <div className="glass-note-panel" style={{ marginTop: '36px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    Ghi chú Phụ Lục Cảnh Báo
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.6' }}>
                        <strong style={{ color: 'var(--text-1)', display: 'block', marginBottom: '6px' }}>✅ Tỷ lệ đạt chuẩn</strong>
                        Phần trăm số lượng lô hàng đã vượt qua ít nhất một đợt kiểm định chất lượng minh bạch.
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.6' }}>
                        <strong style={{ color: 'var(--text-1)', display: 'block', marginBottom: '6px' }}>🚚 Thời gian lưu chuyển</strong>
                        Được tính từ lúc gieo trồng hoặc ghi nhận kiện hàng đầu tiên cho đến khi có sự kiện Giao hàng / Phân phối.
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.6' }}>
                        <strong style={{ color: 'var(--text-1)', display: 'block', marginBottom: '6px' }}>⚠️ Cảnh báo (Anomalies)</strong>
                        Các sự kiện vi phạm nhiệt độ kho lạnh {">30°C / <2°C"} hoặc độ ẩm được cảm biến ghi nhận tự động trên chuỗi khối bảo mật.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
