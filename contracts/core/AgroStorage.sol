// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AgroTypes.sol";

/**
 * @title AgroStorage
 * @dev Tệp này chứa tất cả biến State (Trạng thái bộ nhớ của Blockchain), 
 * các Events thông báo khi có thay đổi, và các Modifiers (Hàm kiểm tra quyền).
 * Tách biệt nội dung này giúp các module khác dùng chung dữ liệu một cách an toàn.
 */
abstract contract AgroStorage {

    // ------------------------------------------------------------------------
    // Biến lưu trữ (State Variables)
    // ------------------------------------------------------------------------
    address public admin;                       // Người triển khai hệ thống (Toàn quyền)
    mapping(address => bool) public inspectors; // Danh sách kiểm định viên được cấp quyền

    // Bộ đếm đếm tổng số ID (Tự động tăng dần mỗi khi tạo mới)
    uint256 public farmCount;
    uint256 public batchCount;
    uint256 public logCount;
    uint256 public inspectionCount; // Bộ đếm tổng số phiếu kiểm định

    // Các bảng dữ liệu (Mapping - giống khái niệm Tables trong Database SQL)
    mapping(uint256 => Farm) public farms;                                 // farmId => Dữ liệu Nông trại
    mapping(uint256 => Batch) public batches;                              // batchId => Dữ liệu Lô hàng
    mapping(uint256 => CultivationLog[]) public batchLogs;                 // batchId => Mảng các Nhật ký canh tác
    mapping(uint256 => Inspection[]) public batchInspections;              // batchId => Mảng các Phiếu kiểm định

    // ------------------------------------------------------------------------
    // Sự kiện (Events) - Dùng để báo cho Frontend biết Blockchain vừa cập nhật
    // ------------------------------------------------------------------------
    event InspectorAdded(address indexed inspector);
    event InspectorRemoved(address indexed inspector);
    event FarmAdded(uint256 indexed farmId, address indexed ownerAddress, string farmName);
    event FarmStatusUpdated(uint256 indexed farmId, bool isActive);
    event BatchAdded(uint256 indexed batchId, uint256 indexed farmId, string productName);
    event BatchStatusUpdated(uint256 indexed batchId, BatchStatus status);
    event CultivationLogAdded(uint256 indexed logId, uint256 indexed batchId, string actionType);
    event BatchInspected(uint256 indexed batchId, address indexed inspectorAddress, string result);

    // ------------------------------------------------------------------------
    // Modifier (Kiểm soát Quyền Hạn Hợp Đồng)
    // ------------------------------------------------------------------------

    // Chỉ Admin (Người triển khai) mới được gọi hàm này
    modifier onlyAdmin() {
        require(msg.sender == admin, "AgroTrust: Caller is not the Admin");
        _;
    }

    // Chỉ Thanh Tra Viên đã được Admin xét duyệt mới được phân tích và đánh giá lô hàng
    modifier onlyInspector() {
        require(inspectors[msg.sender], "AgroTrust: Caller is not an Inspector");
        _;
    }

    // Chỉ chủ sở hữu đích thực của 1 Nông Trại mới được thao tác (Ví dụ tạo lô hàng, viết nhật ký)
    modifier onlyFarmOwner(uint256 _farmId) {
        require(_farmId > 0 && _farmId <= farmCount, "AgroTrust: Invalid farm ID");
        require(farms[_farmId].ownerAddress == msg.sender, "AgroTrust: Caller is not the Farm Owner");
        _;
    }
}
