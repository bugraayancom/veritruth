/**
 * VeriTruth Registry - CosmWasm Deploy Script
 * Deploys to Osmosis Testnet (osmo-test-5) which supports CosmWasm
 *
 * Usage:
 *   MNEMONIC="your 24 word mnemonic" node deploy.mjs
 *
 * The script will:
 *   1. Upload the wasm bytecode to the chain
 *   2. Instantiate the contract
 *   3. Print the contract address
 */

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Configuration ────────────────────────────────────────────────────────────
const RPC_ENDPOINT = "https://rpc.testnet.osmosis.zone";
const CHAIN_ID = "osmo-test-5";
const DENOM = "uosmo";
const GAS_PRICE = GasPrice.fromString(`0.025${DENOM}`);
const WASM_PATH = join(__dirname, "artifacts/veritruth_registry.wasm");

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) {
    console.error("ERROR: MNEMONIC environment variable is required");
    console.error("Usage: MNEMONIC='your 24 word mnemonic' node deploy.mjs");
    process.exit(1);
  }

  console.log("🔗 Connecting to", CHAIN_ID, "at", RPC_ENDPOINT);

  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "osmo",
  });

  const [account] = await wallet.getAccounts();
  console.log("📬 Deployer address:", account.address);

  const client = await SigningCosmWasmClient.connectWithSigner(
    RPC_ENDPOINT,
    wallet,
    { gasPrice: GAS_PRICE }
  );

  // Check balance
  const balance = await client.getBalance(account.address, DENOM);
  console.log("💰 Balance:", balance.amount, DENOM);

  if (BigInt(balance.amount) < BigInt(1_000_000)) {
    console.warn("⚠️  Low balance. Get testnet tokens from:");
    console.warn("   https://faucet.testnet.osmosis.zone");
    process.exit(1);
  }

  // Upload wasm
  console.log("\n📤 Uploading contract bytecode...");
  const wasmCode = readFileSync(WASM_PATH);
  const uploadResult = await client.upload(
    account.address,
    wasmCode,
    "auto",
    "VeriTruth Registry v1.0.0"
  );
  console.log("✅ Upload successful!");
  console.log("   Code ID:", uploadResult.codeId);
  console.log("   TX Hash:", uploadResult.transactionHash);

  // Instantiate
  console.log("\n🚀 Instantiating contract...");
  const initMsg = {
    registry_name: "VeriTruth Verification Registry",
  };

  const instantiateResult = await client.instantiate(
    account.address,
    uploadResult.codeId,
    initMsg,
    "VeriTruth Registry",
    "auto",
    {
      memo: "VeriTruth Registry - Cosmos Grants Truth-seeking Stream",
    }
  );

  console.log("✅ Contract instantiated!");
  console.log("   Contract Address:", instantiateResult.contractAddress);
  console.log("   TX Hash:", instantiateResult.transactionHash);
  console.log("\n📋 Save these values to your .env:");
  console.log(`   COSMOS_CONTRACT_ADDRESS=${instantiateResult.contractAddress}`);
  console.log(`   COSMOS_CODE_ID=${uploadResult.codeId}`);
  console.log(`   COSMOS_CHAIN_ID=${CHAIN_ID}`);

  // Verify by querying stats
  console.log("\n🔍 Verifying contract...");
  const stats = await client.queryContractSmart(
    instantiateResult.contractAddress,
    { stats: {} }
  );
  console.log("   Stats:", JSON.stringify(stats));
  console.log("\n🎉 Deployment complete!");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
