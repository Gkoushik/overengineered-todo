#!/bin/bash
set -e

echo "[blockchain] Waiting for Hardhat node to be ready..."
until curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; do
  sleep 2
done

echo "[blockchain] Deploying ProofOfProductivity contract..."
echo "[blockchain] This is the most overengineered checkbox in history."
cd blockchain
npx hardhat compile
npx hardhat run scripts/deploy.ts --network localhost
echo "[blockchain] Contract deployed. Your productivity is now immutable on a local blockchain."
echo "[blockchain] Real blockchain would cost ~\$12 in gas. This costs \$0. But looks the same on camera."
