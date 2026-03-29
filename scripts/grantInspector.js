import fs from "fs";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("⚡ Đang cấu hình Script cấp quyền Inspector...");

  let privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ Lỗi: Không tìm thấy PRIVATE_KEY trong file .env!");
    process.exit(1);
  }
  
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }

  // Lấy danh sách arguments từ command line
  // Cú pháp đúng: node scripts/grantInspector.js <CONTRACT_ADDRESS> <INSPECTOR_ADDRESS> [--network name]
  const args = process.argv.slice(2);
  const contractAddress = args[0];
  const inspectorAddress = args[1];

  if (!contractAddress || !contractAddress.startsWith("0x") || contractAddress.length !== 42) {
    console.error("❌ Lỗi: Địa chỉ Smart Contract không hợp lệ!");
    console.log("=> Cách dùng: node scripts/grantInspector.js <CONTRACT_ADDRESS> <INSPECTOR_ADDRESS> [--network sepolia/hoodi/celo/unichain]");
    process.exit(1);
  }

  if (!inspectorAddress || !inspectorAddress.startsWith("0x") || inspectorAddress.length !== 42) {
    console.error("❌ Lỗi: Địa chỉ ví Inspector không hợp lệ!");
    console.log("=> Cách dùng: node scripts/grantInspector.js <CONTRACT_ADDRESS> <INSPECTOR_ADDRESS> [--network sepolia/hoodi/celo/unichain]");
    process.exit(1);
  }

  const networkArgIndex = process.argv.indexOf("--network");
  const network = networkArgIndex !== -1 ? process.argv[networkArgIndex + 1] : "sepolia";
  
  let rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
  if (network === "hoodi") {
    rpcUrl = process.env.HOODI_RPC_URL || "https://rpc.hoodi.ethpandaops.io";
    console.log("📍 Mạng mục tiêu: Ethereum Hoodi");
  } else if (network === "celo") {
    rpcUrl = process.env.CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org";
    console.log("📍 Mạng mục tiêu: Celo Alfajores");
  } else if (network === "unichain") {
    rpcUrl = process.env.UNICHAIN_RPC_URL || "https://sepolia.unichain.org";
    console.log("📍 Mạng mục tiêu: Unichain Sepolia");
  } else {
    console.log("📍 Mạng mục tiêu: Sepolia");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`🔑 Đang sử dụng ví Admin: ${wallet.address}`);

  const artifactPath = "./artifacts/contracts/AgroTrust.sol/AgroTrust.json";
  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Lỗi: Không tìm thấy artifacts. Hãy chạy 'npx hardhat compile' trước.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(artifactPath, "utf8");
  const parsedMap = JSON.parse(rawData);
  const abi = parsedMap.abi;

  const agroTrust = new ethers.Contract(contractAddress, abi, wallet);

  console.log(`⏳ Đang gửi giao dịch cấp quyền Inspector cho ví: ${inspectorAddress}...`);
  try {
    const tx = await agroTrust.addInspector(inspectorAddress);
    console.log(`⛓️  Giao dịch đã được gửi. Hash: ${tx.hash}`);
    console.log("⏳ Đang chờ xác nhận từ mạng lưới...");
    
    await tx.wait();
    console.log(`✅ Thành công! Đã cấp quyền Kiểm định viên (Inspector) cho ví: ${inspectorAddress}`);
  } catch (error) {
    console.error("❌ Lỗi trong quá trình cấp quyền:", error.reason || error.message);
  }
}

main().catch((error) => {
  console.error("❌ Lỗi hệ thống:", error);
  process.exitCode = 1;
});
