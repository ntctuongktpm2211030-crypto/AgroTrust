import * as dotenv from "dotenv";
dotenv.config();

// Sử dụng plugin ethers để deploy bằng script
import "@nomicfoundation/hardhat-ethers";

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {},
};

const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Chỉ thêm mạng cấu hình khi PRIVATE_KEY thực sự được khai báo hợp lệ để tránh lỗi compile
if (PRIVATE_KEY && PRIVATE_KEY.length === 66 && PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
  config.networks.sepolia = {
    url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    accounts: [PRIVATE_KEY]
  };
  config.networks.hoodi = {
    url: process.env.HOODI_RPC_URL || "https://rpc.hoodi.ethpandaops.io",
    accounts: [PRIVATE_KEY]
  };

  config.networks.unichain = {
    url: process.env.UNICHAIN_RPC_URL || "https://sepolia.unichain.org",
    accounts: [PRIVATE_KEY]
  };
}

export default config;
