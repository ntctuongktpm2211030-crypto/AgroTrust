import { execSync } from 'child_process';

const networks = ['sepolia', 'hoodi', 'celo', 'unichain'];

console.log("🚀 Bắt đầu quá trình Deploy tự động lên tất cả các mạng...");

for (const net of networks) {
  console.log(`\n================================`);
  console.log(`🌐 Đang deploy lên mạng: ${net.toUpperCase()}`);
  console.log(`================================`);
  
  try {
    execSync(`npx hardhat run scripts/deploy.js --network ${net}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ Lỗi khi deploy mạng ${net}: Vui lòng kiểm tra lại cấu hình hoặc số dư phí Gas.`);
  }
}

console.log("\n✅ Đã hoàn tất qúa trình deploy đa mạng. File config.js đã tự động được nạp địa chỉ mới nhất.");
