import { ethers } from "ethers";

const ABI = [
  "function fakeFunction(string a, string b, string c)"
];

async function test() {
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
  const contract = new ethers.Contract(ethers.ZeroAddress, ABI, provider);
  
  try {
    await contract.fakeFunction("1", undefined, "3");
  } catch (err) {
    console.error("Test 1:", err.message);
  }
}

test();
