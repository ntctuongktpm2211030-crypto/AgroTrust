// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BatchManager.sol";

/**
 * @title LogManager
 * @dev Quản lý quy trình ghi Nhật ký Canh tác hàng ngày lên Blockchain.
 * Mỗi bản ghi là BẤT BIẾN, không thể sửa/xóa sau khi đã xác nhận.
 */
abstract contract LogManager is BatchManager {
    
    /**
     * @dev Ghi chép 1 hoạt động chăm sóc lên Blockchain (Yêu cầu là Chủ Nông Trại)
     * @param _batchId          Mã lô hàng được ghi nhật ký
     * @param _actionType       Loại hoạt động (Tưới nước / Bón phân / Phun thuốc / Làm cỏ / Thu hoạch)
     * @param _description      Nội dung chi tiết công việc thực hiện
     * @param _materialName     Tên vật tư sử dụng (Phân bón, Thuốc BVTV, Chế phẩm sinh học...)
     * @param _dosage           Liều lượng và đơn vị sử dụng (VD: 5 kg/sào, 2 lít / 1000m2)
     * @param _operatorName     Tên người trực tiếp thực hiện ngoài đồng
     * @param _weatherCondition Điều kiện thời tiết trong ngày (Nắng / Mưa / Râm mát...)
     * @param _iotData          Dữ liệu cảm biến IoT tự động (VD: "Nhiệt độ: 28°C, Độ ẩm: 65%")
     * @param _note             Ghi chú thêm (Nếu có vấn đề phát sinh...)
     */
    function addCultivationLog(
        uint256 _batchId,
        string memory _actionType,
        string memory _description,
        string memory _materialName,
        string memory _dosage,
        string memory _operatorName,
        string memory _weatherCondition,
        string memory _iotData,
        string memory _note
    ) external {
        require(_batchId > 0 && _batchId <= batchCount, "AgroTrust: Invalid batch ID");
        uint256 farmId = batches[_batchId].farmId;
        require(farms[farmId].ownerAddress == msg.sender, "AgroTrust: Caller is not the Farm Owner");

        logCount++;
        CultivationLog memory newLog = CultivationLog({
            logId:            logCount,
            batchId:          _batchId,
            actionType:       _actionType,
            description:      _description,
            materialName:     _materialName,
            dosage:           _dosage,
            operatorName:     _operatorName,
            weatherCondition: _weatherCondition,
            iotData:          _iotData,
            note:             _note,
            operatorAddress:  msg.sender,   // Danh tính người ghi được gán chặt chẽ với ví
            timestamp:        block.timestamp
        });

        batchLogs[_batchId].push(newLog);
        emit CultivationLogAdded(logCount, _batchId, _actionType);
    }

    /**
     * @dev Đọc toàn bộ lịch sử nhật ký canh tác của một Lô hàng (Công khai)
     */
    function getBatchLogs(uint256 _batchId) external view returns (CultivationLog[] memory) {
        return batchLogs[_batchId];
    }
}
