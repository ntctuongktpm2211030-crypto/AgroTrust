// Tệp cấu hình Đa Mạng Lưới (Multi-Network)
export const NETWORK_CONFIG = {
  "0x88bb0": { // 560048 (Ethereum Hoodi Testnet)
    name: "Ethereum Hoodi Testnet",
    address: "0xea69deE3F9DD91BCf817f99C76E79849069cd04d",
  },
  "0xaa36a7": { // 11155111 (Sepolia Testnet)
    name: "Sepolia Testnet",
    address: "0x9138745c8C83bb0026B8EA26F3Ed330e3c2023e4", // Điền địa chỉ sau khi deploy
  },
  "0xaef3": { // 44787 (Celo Alfajores Testnet)
    name: "Celo Alfajores Testnet",
    address: "0x55dB029efC2C14976b8f3DFd7C3e5BBdf7fD07C2", 
  },
  "0x515": { // 1301 (Unichain Sepolia Testnet)
    name: "Unichain Sepolia Testnet",
    address: "0x55dB029efC2C14976b8f3DFd7C3e5BBdf7fD07C2",
  }
};
export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "anomalyType",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "details",
        "type": "string"
      }
    ],
    "name": "AnomalyAlert",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "farmId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "productName",
        "type": "string"
      }
    ],
    "name": "BatchAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "inspectorAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "result",
        "type": "string"
      }
    ],
    "name": "BatchInspected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum BatchStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "BatchStatusUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "actionType",
        "type": "string"
      }
    ],
    "name": "CultivationLogAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "farmId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "ownerAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "farmName",
        "type": "string"
      }
    ],
    "name": "FarmAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "farmId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "name": "FarmStatusUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "inspector",
        "type": "address"
      }
    ],
    "name": "InspectorAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "inspector",
        "type": "address"
      }
    ],
    "name": "InspectorRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "anomaly",
        "type": "string"
      }
    ],
    "name": "LogisticsEventAdded",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_farmId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_productName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_plantType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_cultivationArea",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_sowingDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_expectedHarvestDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_expectedQuantity",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_quantityUnit",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_dataHash",
        "type": "string"
      }
    ],
    "name": "addBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_actionType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_materialName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_dosage",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_operatorName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_weatherCondition",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_iotData",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_note",
        "type": "string"
      }
    ],
    "name": "addCultivationLog",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_farmName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_ownerName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_phoneNumber",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_location",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_gpsCoordinates",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_area",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_cropType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      }
    ],
    "name": "addFarm",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_inspector",
        "type": "address"
      }
    ],
    "name": "addInspector",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_eventType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_location",
        "type": "string"
      },
      {
        "internalType": "int256",
        "name": "_temperature",
        "type": "int256"
      },
      {
        "internalType": "int256",
        "name": "_humidity",
        "type": "int256"
      },
      {
        "internalType": "string",
        "name": "_anomaly",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_operatorName",
        "type": "string"
      }
    ],
    "name": "addLogisticsEvent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "batchCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "batchInspections",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "inspectionId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "inspectorAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "inspectorName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "organization",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "inspectionContent",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "result",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "note",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "approvalStatus",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "inspectionHash",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "batchLogistics",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "eventId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "int256",
        "name": "temperature",
        "type": "int256"
      },
      {
        "internalType": "int256",
        "name": "humidity",
        "type": "int256"
      },
      {
        "internalType": "string",
        "name": "anomaly",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "operatorAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "operatorName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "batchLogs",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "actionType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "materialName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "dosage",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "operatorName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "weatherCondition",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "iotData",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "note",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "operatorAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "batches",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "farmId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "productName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "plantType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "cultivationArea",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "sowingDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expectedHarvestDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expectedQuantity",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "quantityUnit",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "dataHash",
        "type": "string"
      },
      {
        "internalType": "enum BatchStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "farmCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "farms",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "farmId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "farmName",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "ownerAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "ownerName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "phoneNumber",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "gpsCoordinates",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "area",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "cropType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchId",
        "type": "uint256"
      }
    ],
    "name": "getBatchInspections",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "inspectionId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "batchId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "inspectorAddress",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "inspectorName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "organization",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "inspectionContent",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "result",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "note",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "approvalStatus",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "inspectionHash",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct Inspection[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchId",
        "type": "uint256"
      }
    ],
    "name": "getBatchLogistics",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "eventId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "batchId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "eventType",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "location",
            "type": "string"
          },
          {
            "internalType": "int256",
            "name": "temperature",
            "type": "int256"
          },
          {
            "internalType": "int256",
            "name": "humidity",
            "type": "int256"
          },
          {
            "internalType": "string",
            "name": "anomaly",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "operatorAddress",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "operatorName",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct LogisticsEvent[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchId",
        "type": "uint256"
      }
    ],
    "name": "getBatchLogs",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "logId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "batchId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "actionType",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "materialName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "dosage",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "operatorName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "weatherCondition",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "iotData",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "note",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "operatorAddress",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct CultivationLog[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_inspectorName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_organization",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_inspectionContent",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_result",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_note",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_approvalStatus",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_inspectionHash",
        "type": "string"
      }
    ],
    "name": "inspectBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "inspectionCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "inspectors",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "logCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "logisticsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_inspector",
        "type": "address"
      }
    ],
    "name": "removeInspector",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchId",
        "type": "uint256"
      },
      {
        "internalType": "enum BatchStatus",
        "name": "_status",
        "type": "uint8"
      }
    ],
    "name": "updateBatchStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_farmId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_farmName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_ownerName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_phoneNumber",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_location",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_gpsCoordinates",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_area",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_cropType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "_isActive",
        "type": "bool"
      }
    ],
    "name": "updateFarm",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];