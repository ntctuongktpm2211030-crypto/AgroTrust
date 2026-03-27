// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./InspectionManager.sol";

/**
 * @title LogisticsManager
 * @dev Quản lý các sự kiện trong chuỗi Logistics (Đóng gói, Vận chuyển, Nhận hàng, Lưu kho, Giao hàng).
 * Cung cấp cơ chế cảnh báo tự động khi ghi nhận các chỉ số bất thường.
 */
abstract contract LogisticsManager is InspectionManager {
    
    /**
     * @dev Ghi nhận một sự kiện Logistics mới
     */
    function addLogisticsEvent(
        uint256 _batchId,
        string memory _eventType,
        string memory _location,
        int256 _temperature,
        int256 _humidity,
        string memory _anomaly,
        string memory _operatorName
    ) external {
        require(_batchId > 0 && _batchId <= batchCount, "AgroTrust: Invalid batch ID");

        // Nếu có cảnh báo bất thường được truyền vào, phát sự kiện AnomalyAlert
        if (bytes(_anomaly).length > 0) {
            emit AnomalyAlert(_batchId, "LOGISTICS_ANOMALY", _anomaly);
        }

        logisticsCount++;
        LogisticsEvent memory newEvent = LogisticsEvent({
            eventId: logisticsCount,
            batchId: _batchId,
            eventType: _eventType,
            location: _location,
            temperature: _temperature,
            humidity: _humidity,
            anomaly: _anomaly,
            operatorAddress: msg.sender,
            operatorName: _operatorName,
            timestamp: block.timestamp
        });

        batchLogistics[_batchId].push(newEvent);

        emit LogisticsEventAdded(_batchId, _eventType, _anomaly);
        
        // Cập nhật trạng thái lô hàng dựa trên eventType
        if (keccak256(abi.encodePacked(_eventType)) == keccak256(abi.encodePacked(unicode"Đóng gói"))) {
            batches[_batchId].status = BatchStatus.Packaged;
            emit BatchStatusUpdated(_batchId, BatchStatus.Packaged);
        } else if (keccak256(abi.encodePacked(_eventType)) == keccak256(abi.encodePacked(unicode"Vận chuyển"))) {
            batches[_batchId].status = BatchStatus.Transporting;
            emit BatchStatusUpdated(_batchId, BatchStatus.Transporting);
        } else if (keccak256(abi.encodePacked(_eventType)) == keccak256(abi.encodePacked(unicode"Giao hàng"))) {
            batches[_batchId].status = BatchStatus.Distributed;
            emit BatchStatusUpdated(_batchId, BatchStatus.Distributed);
        }
    }

    /**
     * @dev Đọc toàn bộ chuỗi sự kiện logistics của một lô hàng
     */
    function getBatchLogistics(uint256 _batchId) external view returns (LogisticsEvent[] memory) {
        return batchLogistics[_batchId];
    }
}
