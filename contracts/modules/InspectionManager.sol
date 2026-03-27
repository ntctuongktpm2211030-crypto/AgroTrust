// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./LogManager.sol";

/**
 * @title InspectionManager
 * @dev Quản lý quy trình kiểm định chất lượng Lô hàng do Kiểm định viên chuyên môn thực hiện.
 * Chỉ tài khoản được Admin duyệt vai trò "Inspector" mới được ghi phiếu kiểm định.
 */
abstract contract InspectionManager is LogManager {

    /**
     * @dev Ghi phiếu kiểm định lô hàng (Chỉ Kiểm định viên được duyệt mới được gọi)
     * @param _batchId           Mã lô hàng cần kiểm định
     * @param _inspectorName     Tên kiểm định viên
     * @param _organization      Đơn vị/Tổ chức kiểm định
     * @param _inspectionContent Nội dung kiểm tra thực tế
     * @param _result            Kết quả tổng quát (Đạt / Không đạt / Cần bổ sung)
     * @param _note              Nhận xét chi tiết và đề xuất xử lý
     * @param _approvalStatus    Trạng thái phê duyệt (Đã duyệt / Từ chối / Chờ duyệt)
     * @param _inspectionHash    Mã Hash file tài liệu PDF / ảnh chứng nhận (IPFS)
     */
    function inspectBatch(
        uint256 _batchId,
        string memory _inspectorName,
        string memory _organization,
        string memory _inspectionContent,
        string memory _result,
        string memory _note,
        string memory _approvalStatus,
        string memory _inspectionHash
    ) external onlyInspector {
        require(_batchId > 0 && _batchId <= batchCount, "AgroTrust: Invalid batch ID");

        inspectionCount++;
        Inspection memory newInspection = Inspection({
            inspectionId:      inspectionCount,
            batchId:           _batchId,
            inspectorAddress:  msg.sender,
            inspectorName:     _inspectorName,
            organization:      _organization,
            inspectionContent: _inspectionContent,
            result:            _result,
            note:              _note,
            approvalStatus:    _approvalStatus,
            inspectionHash:    _inspectionHash,
            timestamp:         block.timestamp
        });

        batchInspections[_batchId].push(newInspection);
        
        // Tự động cập nhật trạng thái lô thành "Đã Kiểm Định" sau khi ghi phiếu thành công
        batches[_batchId].status = BatchStatus.Inspected;

        emit BatchInspected(_batchId, msg.sender, _result);
        emit BatchStatusUpdated(_batchId, BatchStatus.Inspected);
    }

    /**
     * @dev Đọc toàn bộ hồ sơ kiểm định của một Lô hàng (Công khai cho người tiêu dùng tra cứu)
     */
    function getBatchInspections(uint256 _batchId) external view returns (Inspection[] memory) {
        return batchInspections[_batchId];
    }
}
