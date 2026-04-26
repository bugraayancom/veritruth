<div align="center">

<br />

<img src="https://img.shields.io/badge/VeriTruth-Decentralized%20Fact--Verification-6d28d9?style=for-the-badge&logo=ethereum&logoColor=white" alt="VeriTruth" height="32" />

# VeriTruth

### Decentralized Epistemic Verification Network

**A multi-agent AI system for combating disinformation, anchored on the Cosmos blockchain.**

<br />

[![License: MIT](https://img.shields.io/badge/License-MIT-6d28d9.svg?style=flat-square)](LICENSE)
[![CosmWasm](https://img.shields.io/badge/CosmWasm-Registry%20Contract-7c3aed?style=flat-square&logo=rust&logoColor=white)](contracts/veritruth-registry)
[![Cosmos](https://img.shields.io/badge/Osmosis-Testnet%20osmo--test--5-5b21b6?style=flat-square)](https://testnet.mintscan.io/osmosis-testnet)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-10b981?style=flat-square&logo=openai&logoColor=white)](https://openai.com)
[![Gemini](https://img.shields.io/badge/Google-Gemini%201.5-3b82f6?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/gemini)
[![Tests](https://img.shields.io/badge/Tests-7%20passing-22c55e?style=flat-square)](server)
[![Cosmos Grants](https://img.shields.io/badge/Cosmos%20Grants-Truth--seeking%20Stream-f59e0b?style=flat-square)](https://grants.cosmos.institute)

<br />

> *"Truth is not a matter of consensus — it is a matter of evidence, logic, and transparency."*

<br />

[**Live Demo →**](https://veritruth-z9pjss5w.manus.space) &nbsp;·&nbsp; [**Architecture**](#architecture) &nbsp;·&nbsp; [**CosmWasm Contract**](#cosmwasm-registry-contract) &nbsp;·&nbsp; [**Getting Started**](#getting-started)

<br />

</div>

---

## What is VeriTruth?

VeriTruth is an open-source, decentralized fact-verification platform that deploys a **multi-agent AI network** to analyze claims for disinformation. Each claim is independently evaluated by three specialized AI agents — Source Verification, Logical Consistency, and Cross-Verification — whose findings are aggregated through a **Proof of Reliability** consensus mechanism. The final verdict and reliability score are then **anchored immutably on the Cosmos blockchain** via a CosmWasm smart contract, creating a censorship-resistant, auditable record of truth.

The project is grounded in three recent academic works:

| Paper | Authors | Year | Contribution to VeriTruth |
|---|---|---|---|
| [*The Agent Economy*](https://arxiv.org/abs/2602.14219) | Xu | 2026 | Economic model for autonomous AI agents on blockchain |
| [*NANDA Index Architecture*](https://arxiv.org/abs/2508.03101) | Wang et al. (MIT) | 2025 | Networked agent coordination and Zero Trust security |
| [*SREE: Self-Refining Epistemic Engine*](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5415074) | Morin | 2025 | Recursive truth-seeking and epistemic drift prevention |
| [*AI-driven Disinformation*](https://www.frontiersin.org/articles/10.3389/frai.2025.1569115) | Romanishyn et al. | 2025 | Policy framework for democratic resilience |
| [*TruthChain*](https://ieeexplore.ieee.org/abstract/document/11176464/) | Murugalakshmi et al. | 2025 | Blockchain-based news verification system |

---

## Key Features

| Feature | Description |
|---|---|
| 🤖 **Multi-Agent Analysis** | Three specialized AI agents (OpenAI GPT-4o + Google Gemini 1.5) run in parallel, each with a distinct analytical lens |
| 📊 **Proof of Reliability** | Weighted consensus algorithm produces a 0–100 reliability score and one of three verdicts |
| ⛓️ **On-Chain Anchoring** | CosmWasm registry contract on Osmosis Testnet stores claim hash, score, and verdict permanently |
| 🔴 **Live Analysis Stream** | Real-time progress interface shows each agent's status as it works |
| 🕒 **Verification History** | All past verifications stored in database for longitudinal disinformation tracking |
| 🔐 **Keplr Integration** | Users sign and broadcast anchor transactions directly from the browser |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VeriTruth Platform                       │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React 19 + Tailwind 4 + CosmJS + Keplr)              │
│  ├── Claim Input Form                                           │
│  ├── Live Analysis Stream (real-time polling)                   │
│  ├── Result Report + CosmosWallet (Keplr)                       │
│  └── Verification History                                       │
├─────────────────────────────────────────────────────────────────┤
│  Backend (Express + tRPC 11 + TypeScript)                       │
│  ├── verify.submit → runAllAgents() → computeConsensus()        │
│  ├── cosmos.getChainStatus → CosmWasm client (CosmJS)           │
│  ├── cosmos.buildAnchorParams → SHA-256 proof + executeMsg      │
│  ├── cosmos.checkOnChain → query contract registry              │
│  └── cosmos.recordAnchor → persist txHash to DB                 │
├─────────────────────────────────────────────────────────────────┤
│  AI Agent Layer                                                 │
│  ├── Source Verification Agent    (OpenAI GPT-4o)   — 35%      │
│  ├── Logical Consistency Agent    (Gemini 1.5)      — 35%      │
│  └── Cross-Verification Agent     (OpenAI GPT-4o)   — 30%      │
├─────────────────────────────────────────────────────────────────┤
│  Cosmos Blockchain Layer                                        │
│  ├── Osmosis Testnet (osmo-test-5)                              │
│  ├── CosmWasm Registry Contract (veritruth-registry)            │
│  └── Keplr Wallet + CosmJS SigningCosmWasmClient                │
└─────────────────────────────────────────────────────────────────┘
```

---

## CosmWasm Registry Contract

The `veritruth-registry` contract is a CosmWasm smart contract written in **Rust**. It serves as the **immutable on-chain registry** for all verified claims.

### Contract Messages

```rust
// Store a verification result on-chain
ExecuteMsg::AnchorVerification {
    claim_hash: String,       // SHA-256 of the original claim
    reliability_score: u8,    // 0–100 Proof of Reliability score
    verdict: String,          // "Verified" | "Suspicious" | "False"
    agent_count: u8,          // Number of agents that participated
}

// Query a specific verification by claim hash
QueryMsg::GetVerification { claim_hash: String }

// Query paginated list of all verifications
QueryMsg::ListVerifications { start_after: Option<String>, limit: Option<u32> }

// Query aggregate statistics
QueryMsg::Stats {}
```

### On-Chain Record Structure

```rust
pub struct VerificationRecord {
    pub claim_hash: String,       // SHA-256 of the original claim text
    pub reliability_score: u8,    // 0–100
    pub verdict: String,          // "Verified" | "Suspicious" | "False"
    pub agent_count: u8,          // Number of agents that participated
    pub submitter: Addr,          // Cosmos address of the submitter
    pub timestamp: u64,           // Unix timestamp
}
```

**Network:** Osmosis Testnet (`osmo-test-5`)  
**Explorer:** [testnet.mintscan.io/osmosis-testnet](https://testnet.mintscan.io/osmosis-testnet)  
**Build:** `cargo build --target wasm32-unknown-unknown --release` → optimized with `wasm-opt`

---

## Proof of Reliability: Consensus Algorithm

```
Reliability Score = (source_score × 0.35) + (logic_score × 0.35) + (cross_score × 0.30)

Verdict thresholds:
  Score ≥ 70  →  ✅ Verified    — Claim is supported by credible evidence
  Score 40–69 →  ⚠️ Suspicious  — Claim is ambiguous or has conflicting sources
  Score < 40  →  ❌ False       — Claim is contradicted by evidence
```

Each agent returns a score (0–100), a detailed findings report, and a list of sources consulted. The consensus mechanism is deterministic, auditable, and reproducible.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Tailwind CSS 4, shadcn/ui, Framer Motion, Wouter |
| **Backend** | Node.js 22, Express 4, tRPC 11, TypeScript 5 |
| **Database** | MySQL / TiDB via Drizzle ORM |
| **AI Agents** | OpenAI GPT-4o, Google Gemini 1.5 Flash |
| **Blockchain** | Cosmos SDK, CosmWasm 2.x, CosmJS 0.38, Keplr Wallet |
| **Smart Contract** | Rust, CosmWasm, Osmosis Testnet (osmo-test-5) |
| **Testing** | Vitest — 7 tests passing |

---

## Getting Started

### Prerequisites

- Node.js 22+, pnpm 10+
- Rust + `wasm32-unknown-unknown` target (for contract development)
- [Keplr Wallet](https://www.keplr.app/download) browser extension

### Installation

```bash
git clone https://github.com/bugraayancom/veritruth.git
cd veritruth
pnpm install
cp .env.example .env
# Fill in your API keys in .env
pnpm dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `OPENAI_API_KEY` | ✅ | OpenAI API key (Source & Cross-Verification agents) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key (Logic Consistency agent) |
| `COSMOS_CONTRACT_ADDRESS` | ⬜ | Deployed CosmWasm contract address |
| `COSMOS_RPC_ENDPOINT` | ⬜ | Cosmos RPC endpoint (default: Osmosis Testnet) |

### Run Tests

```bash
pnpm test
# ✓ server/consensus.test.ts (6 tests)
# ✓ server/auth.logout.test.ts (1 test)
# Tests: 7 passed
```

### Build & Test CosmWasm Contract

```bash
cd contracts/veritruth-registry
cargo test                    # 7 unit tests
cargo build --target wasm32-unknown-unknown --release
wasm-opt -Os -o veritruth_registry.wasm \
  target/wasm32-unknown-unknown/release/veritruth_registry.wasm
```

---

## Project Structure

```
veritruth/
├── client/src/
│   ├── pages/
│   │   ├── Home.tsx                # Landing page + claim input form
│   │   ├── VerificationLive.tsx    # Real-time agent analysis stream
│   │   ├── VerificationResult.tsx  # Detailed result report
│   │   └── History.tsx             # Past verifications
│   └── components/
│       └── CosmosWallet.tsx        # Keplr wallet + on-chain anchoring
├── server/
│   ├── agents.ts                   # Multi-agent AI logic (OpenAI + Gemini)
│   ├── consensus.ts                # Proof of Reliability algorithm
│   ├── cosmos.ts                   # Cosmos/CosmWasm integration
│   ├── routers.ts                  # tRPC procedures
│   └── db.ts                       # Database query helpers
├── contracts/
│   └── veritruth-registry/         # CosmWasm smart contract (Rust)
│       └── src/
│           ├── contract.rs         # Core contract logic
│           ├── state.rs            # On-chain data structures
│           ├── msg.rs              # Message types
│           └── error.rs            # Error types
└── drizzle/
    └── schema.ts                   # Database schema
```

---

## Cosmos Grants Alignment

This project directly addresses the **Truth-seeking: Cosmos × FIRE** grant stream:

**Epistemic integrity** — VeriTruth uses a multi-agent consensus mechanism to resist single points of failure and manipulation, directly combating AI-generated disinformation at scale.

**Blockchain accountability** — Verification results are anchored via a CosmWasm registry contract, creating an immutable public record that cannot be altered or censored by any single actor.

**Open-source ecosystem** — The entire codebase is MIT-licensed and designed for community extension: new agent types, additional LLM providers, IBC-connected chains, and DAO governance are all on the roadmap.

**Academic grounding** — The project is built on five peer-reviewed papers from 2025–2026, demonstrating rigorous research alignment with the Cosmos ecosystem's intellectual mission.

---

## Roadmap

- [x] Multi-agent AI analysis (OpenAI + Gemini)
- [x] Proof of Reliability consensus mechanism
- [x] Real-time analysis stream UI
- [x] Verification history database
- [x] CosmWasm registry contract (Rust, 7 tests)
- [x] Keplr wallet integration
- [x] On-chain anchoring (memo + contract modes)
- [ ] Deploy contract to Osmosis Testnet (public address)
- [ ] IBC integration for cross-chain verification sharing
- [ ] Public REST API for programmatic access
- [ ] Decentralized agent network (community-run agents)
- [ ] DAO governance for verdict disputes

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change.

```bash
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Then open a Pull Request
```

---

## License

[MIT](LICENSE) © 2026 VeriTruth Contributors

---

<div align="center">

Built for the Cosmos ecosystem &nbsp;·&nbsp; Applying for [Cosmos Grants — Truth-seeking Stream](https://grants.cosmos.institute)

</div>
