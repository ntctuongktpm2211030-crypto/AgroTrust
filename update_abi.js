const fs = require('fs');
const configPath = './frontend/src/config.js';
const abiPath = './artifacts/contracts/AgroTrust.sol/AgroTrust.json';
const abiData = JSON.parse(fs.readFileSync(abiPath));
const currentConfig = fs.readFileSync(configPath, 'utf8');
const networkConfigMatch = currentConfig.match(/export const NETWORK_CONFIG = (\{[\s\S]*?\});\r?\nexport const CONTRACT_ABI/);
if (networkConfigMatch) {
    const newConfig = `// Tệp cấu hình Đa Mạng Lưới (Multi-Network)\nexport const NETWORK_CONFIG = ${networkConfigMatch[1]};\nexport const CONTRACT_ABI = ${JSON.stringify(abiData.abi, null, 2)};\n`;
    fs.writeFileSync(configPath, newConfig);
    console.log('ABI updated successfully');
} else {
    console.log('Regex failed');
}
