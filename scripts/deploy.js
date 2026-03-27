import fs from "fs";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("Đang chuẩn bị deploy AgroTrust Smart Contract...");

  let privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Lỗi: Không tìm thấy PRIVATE_KEY trong file .env!");
    process.exit(1);
  }
  
  // Tự động thêm 0x nếu user quên
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }

  if (privateKey.length !== 66 || privateKey === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    console.error("Lỗi: Quên cấu hình PRIVATE_KEY hợp lệ trong file .env!");
    process.exit(1);
  }

  // Khởi tạo Provider & Wallet
  const networkArgIndex = process.argv.indexOf("--network");
  const network = networkArgIndex !== -1 ? process.argv[networkArgIndex + 1] : "sepolia";
  
  let rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
  if (network === "hoodi") {
    rpcUrl = process.env.HOODI_RPC_URL || "https://rpc.hoodi.ethpandaops.io";
    console.log("📍 Mạng mục tiêu: Ethereum Hoodi");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Đang sử dụng ví để deploy: ${wallet.address}`);

  // Đọc file JSON từ artifacts sau khi compile
  const artifactPath = "./artifacts/contracts/AgroTrust.sol/AgroTrust.json";
  if (!fs.existsSync(artifactPath)) {
    console.error("Lỗi: Không tìm thấy artifacts. Hãy chạy 'npx hardhat compile' trước.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(artifactPath, "utf8");
  const parsedMap = JSON.parse(rawData);
  const abi = parsedMap.abi;
  const bytecode = parsedMap.bytecode;

  // Khởi tạo ContractFactory từ Ethers thay vì Hardhat để tránh lỗi plugin
  const AgroTrustFactory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  // Tiến hành deploy
  const agroTrust = await AgroTrustFactory.deploy();

  console.log("Đang chờ giao dịch được xác nhận (mining)...");
  
  // Chờ contract được deploy hoàn chỉnh
  await agroTrust.waitForDeployment();

  const contractAddress = await agroTrust.getAddress();
  
  console.log(`\n✅ AgroTrust đã được deploy thành công tại địa chỉ: ${contractAddress}`);
  
  // Tự động ghi ABI và Address ra file config cho Frontend (Đã cập nhật để hỗ trợ React Vite)
  const frontendConfigPath = "./frontend/src/config.js";
  const configContent = `// Tệp này tự động được tạo ra bởi scripts/deploy.js
export const CONTRACT_ADDRESS = "${contractAddress}";
export const CONTRACT_ABI = ${JSON.stringify(abi, null, 2)};
`;

  fs.writeFileSync(frontendConfigPath, configContent);
  console.log(`✅ File cấu hình đã tự động lưu vào: ${frontendConfigPath}\n`);
}

main().catch((error) => {
  console.error("Lỗi khi deploy:", error);
  process.exitCode = 1;
});
