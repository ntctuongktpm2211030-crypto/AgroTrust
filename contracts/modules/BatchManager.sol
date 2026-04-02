// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FarmManager.sol";

/**
 * @title BatchManager
 * @dev Quản lý việc tạo Lô Hàng và Cập nhật Trạng thái vòng đời của từng lô nông sản.
 */
abstract contract BatchManager is FarmManager {
    
    /**
     * @dev Tạo một Lô hàng mới thuộc về một Nông trại (Chỉ chủ trang trại được tạo)
     * @param _farmId           Mã nông trại chủ quản
     * @param _productName      Tên nông sản / lô hàng (VD: "Cà chua đỏ chín muộn vụ Đông")
     * @param _plantType        Loại cây trồng / Giống sử dụng (VD: F1, ST25, New Zealand)
     * @param _cultivationArea  Khu vực canh tác trong trang trại (Khu A, Nhà màng số 3...)
     * @param _sowingDate       Ngày gieo trồng (Unix Timestamp - 10 chữ số)
     * @param _expectedHarvestDate Ngày thu hoạch dự kiến (Unix Timestamp)
     * @param _expectedQuantity Sản lượng dự kiến (Số lượng theo đơn vị)
     * @param _quantityUnit     Đơn vị tính (kg, tấn, thùng, giỏ...)
     * @param _dataHash         Hash mở rộng metadata (IPFS / Backend) cho các trường phụ
     */
    function addBatch(
        uint256 _farmId,
        string memory _productName,
        string memory _plantType,
        string memory _cultivationArea,
        uint256 _sowingDate,
        uint256 _expectedHarvestDate,
        uint256 _expectedQuantity,
        string memory _quantityUnit,
        string memory _dataHash
    ) external onlyFarmOwner(_farmId) {
        require(farms[_farmId].isActive, "AgroTrust: Farm is not active");

        batchCount++;
        batches[batchCount] = Batch({
            batchId:              batchCount,
            farmId:               _farmId,
            productName:          _productName,
            plantType:            _plantType,
            cultivationArea:      _cultivationArea,
            sowingDate:           _sowingDate,
            expectedHarvestDate:  _expectedHarvestDate,
            expectedQuantity:     _expectedQuantity,
            quantityUnit:         _quantityUnit,
            dataHash:             _dataHash,
            status:               BatchStatus.Planted // Trạng thái đầu tiên: Đã gieo trồng
        });

        emit BatchAdded(batchCount, _farmId, _productName);
    }

    /**
     * @dev Cập nhật Trạng thái vòng đời lô hàng (0 -> 8). Chỉ chủ nông trại được gọi.
     */
    function updateBatchStatus(uint256 _batchId, BatchStatus _status) external {
        require(_batchId > 0 && _batchId <= batchCount, "AgroTrust: Invalid batch ID");
        uint256 farmId = batches[_batchId].farmId;
        require(farms[farmId].ownerAddress == msg.sender, "AgroTrust: Caller is not the Farm Owner");

        batches[_batchId].status = _status;
        emit BatchStatusUpdated(_batchId, _status);
    }

    /**
     * @dev Ẩn / hiện lô hàng đối với khách tra cứu (chỉ chủ nông trại của lô)
     */
    function setBatchHiddenFromCustomer(uint256 _batchId, bool _hidden) external {
        require(_batchId > 0 && _batchId <= batchCount, "AgroTrust: Invalid batch ID");
        uint256 farmId = batches[_batchId].farmId;
        require(farms[farmId].ownerAddress == msg.sender, "AgroTrust: Caller is not the Farm Owner");
        batchHiddenFromCustomer[_batchId] = _hidden;
        emit BatchCustomerVisibilityChanged(_batchId, _hidden);
    }
}
