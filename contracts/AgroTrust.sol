// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./modules/LogisticsManager.sol";

/**
 * @title AgroTrust Smart Contract (Bản Tích Hợp Cuối Cùng)
 * @dev Thông qua mô hình kế thừa (Inheritance) tuyến tính, Hợp đồng này bao gồm tóm tắt TẤT CẢ tính năng
 * từ (Storage -> Roles -> Farms -> Batches -> Logs -> Inspections -> Logistics). Khối mã được chia tách logic ra các 
 * thư mục con để dễ đọc thuật toán, nhưng khi Compile & Deploy sẽ gộp chung vào 1 Hợp đồng tổng hợp.
 * Điều chỉnh kiến trúc này giúp đảm bảo code minh bạch mà vẫn tối đa hóa phí triển khai mạng (Gas Fees).
 */
contract AgroTrust is LogisticsManager {
    
    /**
     * @dev Hàm khởi tạo. Chạy đúng 1 lần duy nhất trên Blockchain khi hệ thống chính thức hoạt động.
     */
    constructor() {
        // Trao quyền quản trị cao nhất (Admin) cho Địa chỉ Ví đã bung (Deploy) hợp đồng này
        admin = msg.sender;
    }
}
