// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../core/AgroStorage.sol";

/**
 * @title RoleManager
 * @dev Quản lý các chức năng phân quyền như Thêm/Xóa Ban kiểm định viên.
 * Chỉ có quản trị viên (Admin - người deploy hợp đồng) mới được định đoạt.
 */
abstract contract RoleManager is AgroStorage {
    
    /**
     * @dev Thêm một ví vào danh sách Kiểm định viên
     * @param _inspector Địa chỉ ví người được cấp quyền
     */
    function addInspector(address _inspector) external onlyAdmin {
        require(_inspector != address(0), "AgroTrust: Invalid address");
        inspectors[_inspector] = true;
        emit InspectorAdded(_inspector); // Phát sự kiện để Frontend biết
    }

    /**
     * @dev Rút lại quyền của một Kiểm định viên
     * @param _inspector Địa chỉ ví bị rút quyền
     */
    function removeInspector(address _inspector) external onlyAdmin {
        inspectors[_inspector] = false;
        emit InspectorRemoved(_inspector); // Phát sự kiện để Frontend biết
    }
}
