import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { BlockchainReceipt } from '@overengineered-todo/shared';

const RPC_URL = process.env.HARDHAT_RPC_URL || 'http://localhost:8545';

let contract: ethers.Contract;
let signer: ethers.Signer;

const ABI = [
  'function completeTask(string memory taskName, uint256 taskId) public',
  'function getCompletionHistory(address user) public view returns (uint256[] memory)',
  'function getCompletion(uint256 id) public view returns (tuple(string taskName, uint256 taskId, uint256 timestamp, address completedBy))',
  'function totalCompletions() public view returns (uint256)',
  'event TaskCompletedOnChain(uint256 indexed completionId, address indexed user, string taskName, uint256 taskId, uint256 timestamp)',
];

export async function initContract(): Promise<void> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  signer = await provider.getSigner(0);

  const deploymentPath = path.join(__dirname, '../../../blockchain/deployment.json');
  if (!fs.existsSync(deploymentPath)) {
    throw new Error('Contract not deployed. Run: cd blockchain && npm run deploy');
  }
  const { address } = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
  contract = new ethers.Contract(address, ABI, signer);
  console.log(`[blockchain-service] Connected to contract at ${address}`);
}

export async function mintTaskCompletion(taskName: string, taskId: string): Promise<BlockchainReceipt> {
  const numericId = parseInt(taskId.replace(/\D/g, '').slice(0, 8)) || Date.now();
  const tx = await contract.completeTask(taskName, numericId);
  const receipt = await tx.wait();

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    taskId,
    taskName,
    timestamp: Date.now(),
  };
}
