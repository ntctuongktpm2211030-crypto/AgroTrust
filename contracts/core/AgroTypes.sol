// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgroTypes
 * @dev Tệp này định nghĩa toàn bộ cấu trúc dữ liệu (Structs) và trạng thái (Enums) dùng chung cho toàn dự án.
 * Phiên bản này đã được mở rộng theo tiêu chuẩn đồ án với đầy đủ các trường thông tin thiết yếu.
 */

// 1. Nông trại (Farm)
// Lưu trữ hồ sơ gốc của các nhà cung cấp/người nông dân tham gia hệ thống.
struct Farm {
    uint256 farmId;        // Mã định danh nông trại (Tăng dần tự động)
    string  farmName;      // Tên nông trại
    address ownerAddress;  // Địa chỉ ví chủ sở hữu (tự động gán từ MetaMask)
    string  ownerName;     // Tên chủ nông trại
    string  phoneNumber;   // Số điện thoại liên hệ
    string  location;      // Địa chỉ cụ thể (Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành)
    string  gpsCoordinates;// Tọa độ GPS (VD: "10.7769, 106.7009")
    string  area;          // Diện tích canh tác (VD: "5 hecta")
    string  cropType;      // Loại nông sản canh tác chính
    string  description;   // Mô tả hoặc tiêu chuẩn chứng nhận (VietGAP, GlobalGAP...)
    bool    isActive;      // Trạng thái: đang hoạt động / tạm ngưng
}

// 2. Trạng thái Vòng đời (BatchStatus - Enum)
// Bao gồm 9 bước tiêu chuẩn phản ánh vòng đời nông sản từ nông trại đến bàn ăn.
enum BatchStatus {
    Planted,      // 0: Đã gieo trồng
    Caring,       // 1: Đang chăm sóc
    Fertilized,   // 2: Đã bón phân
    Sprayed,      // 3: Đã phun thuốc
    Harvested,    // 4: Đã thu hoạch
    Packaged,     // 5: Đã đóng gói
    Transporting, // 6: Đang vận chuyển
    Inspected,    // 7: Đã kiểm định
    Distributed   // 8: Đã phân phối
}

// 3. Lô Nông sản (Batch)
// Lưu trữ thông tin của một lứa gieo hạt/xuất chuồng cụ thể.
struct Batch {
    uint256 batchId;              // Mã lô duy nhất (Tăng dần)
    uint256 farmId;               // Khóa ngoại: liên kết tới Farm nào
    string  productName;          // Tên nông sản cụ thể (VD: Cà chua đỏ, Dâu Tây New Zealand)
    string  plantType;            // Loại cây trồng / Giống sử dụng (VD: Giống F1, ST25)
    string  cultivationArea;      // Khu vực canh tác trong trang trại (VD: Khu A, Nhà màng số 3)
    uint256 sowingDate;           // Ngày gieo trồng (Unix Timestamp)
    uint256 expectedHarvestDate;  // Ngày thu hoạch dự kiến (Unix Timestamp)
    uint256 expectedQuantity;     // Sản lượng dự kiến
    string  quantityUnit;         // Đơn vị tính (kg, tấn, thùng...)
    string  dataHash;             // Hash an toàn (kết hợp với IPFS hoặc Backend cho dữ liệu mở rộng)
    BatchStatus status;           // Trạng thái hiện hành
}

// 4. Nhật ký Canh tác (CultivationLog)
// Bản ghi chi tiết các hoạt động tác động lên lô hàng (Bất biến sau khi ghi).
struct CultivationLog {
    uint256 logId;           // Mã nhật ký
    uint256 batchId;         // Gắn với Lô hàng nào
    string  actionType;      // Hành động (Bón phân / Tưới nước / Phun thuốc / Làm cỏ / Thu hoạch)
    string  description;     // Mô tả chi tiết nội dung công việc
    string  materialName;    // Vật tư sử dụng (Phân NPK, Thuốc trừ sâu, Chế phẩm sinh học...)
    string  dosage;          // Liều lượng và đơn vị (VD: 5kg/ha, 2 lít/1000m2)
    string  operatorName;    // Tên kỹ sư / người thực hiện trực tiếp
    string  weatherCondition;// Điều kiện thời tiết (Nắng / Mưa / Âm u)
    string  iotData;         // Dữ liệu cảm biến IoT đính kèm (VD: "Nhiệt độ: 28°C, Độ ẩm đất: 65%")
    string  note;            // Ghi chú thêm
    address operatorAddress; // Ví điện tử của người ghi log (Bất biến, xác thực danh tính)
    uint256 timestamp;       // Thời điểm ghi nhận (Mặc định lấy từ block.timestamp)
    bool    isActive;        // Quản lý hiển thị: Bật/Tắt (Mặc định true khi khởi tạo)
}

// 5. Hồ sơ Kiểm định (Inspection)
// Lưu quyết định của các cơ quan/bên thanh tra thứ 3 về chất lượng nông sản.
struct Inspection {
    uint256 inspectionId;     // Mã kiểm định (Tăng dần)
    uint256 batchId;          // Lô hàng được kiểm định
    address inspectorAddress; // Địa chỉ ví của thanh tra viên
    string  inspectorName;    // Tên kiểm định viên
    string  organization;     // Đơn vị kiểm định (Cơ quan / Tổ chức)
    string  inspectionContent;// Nội dung kiểm tra thực tế
    string  result;           // Kết quả tổng quát (Đạt / Không đạt / Cần bổ sung)
    string  note;             // Nhận xét chi tiết và đề xuất xử lý
    string  approvalStatus;   // Trạng thái phê duyệt (Đã duyệt / Từ chối / Chờ duyệt)
    string  inspectionHash;   // Mã băm tài liệu/file PDF chứng nhận (IPFS)
    uint256 timestamp;        // Thời gian kiểm định
}

// 6. Sự kiện Logistics (LogisticsEvent)
// Lưu trữ các mốc trong chuỗi cung ứng: Đóng gói, Vận chuyển, Nhận hàng, Lưu kho, Giao hàng.
struct LogisticsEvent {
    uint256 eventId;
    uint256 batchId;
    string eventType;      // Loại sự kiện (Ví dụ: "Đóng gói", "Vận chuyển", "Lưu kho"...)
    string location;       // Địa điểm hiện tại
    int256 temperature;    // Nhiệt độ đo được (nhân 10 hoặc 100 để bỏ số thập phân nếu cần, hoặc cứ để nguyên nếu dùng offchain check)
    int256 humidity;       // Độ ẩm đo được
    string anomaly;        // Cảnh báo bất thường (nếu có, ví dụ: "Nhiệt độ vượt ngưỡng")
    address operatorAddress;
    string operatorName;
    uint256 timestamp;
}
