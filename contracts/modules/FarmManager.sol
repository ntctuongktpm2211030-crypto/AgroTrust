// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoleManager.sol";

/**
 * @title FarmManager
 * @dev Quản lý quy trình đăng ký và cập nhật hồ sơ Nông Trại với đầy đủ thông tin bài bản.
 */
abstract contract FarmManager is RoleManager {
    
    /**
     * @dev Đăng ký một Nông Trại mới (Chủ nông trại tự đăng ký, địa chỉ ví tự động gán)
     * @param _farmName      Tên nông trại
     * @param _ownerName     Họ tên chủ nông trại
     * @param _phoneNumber   Số điện thoại liên hệ
     * @param _location      Địa chỉ cụ thể (Đường, phường/xã, quận/huyện, tỉnh/thành)
     * @param _gpsCoordinates Tọa độ GPS (Vĩ độ, Kinh độ)
     * @param _area          Diện tích canh tác (VD: "5 hecta")
     * @param _cropType      Loại nông sản canh tác chính
     * @param _description   Mô tả và tiêu chuẩn đạt được (VietGAP, GlobalGAP, Organic...)
     */
    function addFarm(
        string memory _farmName,
        string memory _ownerName,
        string memory _phoneNumber,
        string memory _location,
        string memory _gpsCoordinates,
        string memory _area,
        string memory _cropType,
        string memory _description
    ) external {
        farmCount++;
        farms[farmCount] = Farm({
            farmId:         farmCount,
            farmName:       _farmName,
            ownerAddress:   msg.sender, // Tự động gán Ví MetaMask là chủ sở hữu
            ownerName:      _ownerName,
            phoneNumber:    _phoneNumber,
            location:       _location,
            gpsCoordinates: _gpsCoordinates,
            area:           _area,
            cropType:       _cropType,
            description:    _description,
            isActive:       true
        });

        emit FarmAdded(farmCount, msg.sender, _farmName);
    }

    /**
     * @dev Cập nhật thông tin nông trại (Chỉ chủ sở hữu được thực hiện)
     */
    function updateFarm(
        uint256 _farmId,
        string memory _farmName,
        string memory _ownerName,
        string memory _phoneNumber,
        string memory _location,
        string memory _gpsCoordinates,
        string memory _area,
        string memory _cropType,
        string memory _description,
        bool _isActive
    ) external onlyFarmOwner(_farmId) {
        farms[_farmId].farmName       = _farmName;
        farms[_farmId].ownerName      = _ownerName;
        farms[_farmId].phoneNumber    = _phoneNumber;
        farms[_farmId].location       = _location;
        farms[_farmId].gpsCoordinates = _gpsCoordinates;
        farms[_farmId].area           = _area;
        farms[_farmId].cropType       = _cropType;
        farms[_farmId].description    = _description;
        farms[_farmId].isActive       = _isActive;

        emit FarmStatusUpdated(_farmId, _isActive);
    }
}
