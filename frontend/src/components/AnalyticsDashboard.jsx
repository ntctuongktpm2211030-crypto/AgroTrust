import React, { useState, useEffect } from 'react';
import { formatEther } from 'ethers';

const AnalyticsDashboard = ({ contract, account }) => {
    const [stats, setStats] = useState({
        totalBatches: 0,
        passRate: 0,
        avgTransitTime: 0, // In days
        anomaliesCount: 0,
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

            for (let i = 1; i <= Number(count); i++) {
                const b = await contract.batches(i);
                
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

            setStats({
                totalBatches: Number(count),
                passRate: pRate,
                avgTransitTime: avgTime,
                anomaliesCount: anomalies
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="glass-card fade-in" style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu phân tích...</div>;

    return (
        <div className="glass-card fade-in" style={{ padding: '30px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                📊 Dashboard Phân Tích
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Tổng số lô hàng</div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--emerald-light)' }}>{stats.totalBatches}</div>
                </div>

                <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Tỷ lệ đạt chuẩn (Kiểm định)</div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>{stats.passRate}%</div>
                </div>

                <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>TB Thời gian lưu chuyển</div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#8b5cf6' }}>{stats.avgTransitTime} {stats.avgTransitTime > 0 ? 'ngày' : ''}</div>
                </div>

                <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Tổng cảnh báo (Anomalies)</div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>{stats.anomaliesCount}</div>
                </div>
            </div>

            <div style={{ marginTop: '30px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Ghi chú</h3>
                <ul style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6' }}>
                    <li><strong style={{ color: '#fff' }}>Tỷ lệ đạt chuẩn</strong>: Phần trăm số lô hàng đã vượt qua ít nhất một đợt kiểm định.</li>
                    <li><strong style={{ color: '#fff' }}>Thời gian lưu chuyển</strong>: Được tính từ lúc gieo trồng/ghi nhận kiện hàng đầu tiên cho đến khi có sự kiện Giao hàng.</li>
                    <li><strong style={{ color: '#fff' }}>Cảnh báo</strong>: Tổng số sự kiện vi phạm nhiệt độ / quy trình được ghi nhận trên chuỗi khối.</li>
                </ul>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
