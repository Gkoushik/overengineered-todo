import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const ProofOfProductivity = await ethers.getContractFactory('ProofOfProductivity');
  const contract = await ProofOfProductivity.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`ProofOfProductivity deployed to: ${address}`);

  const deploymentInfo = { address, deployedAt: new Date().toISOString() };
  fs.writeFileSync(
    path.join(__dirname, '../deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
}

main().catch(console.error);
