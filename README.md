# VeriTruth — Decentralized Epistemic Verification Network

> **Cosmos Grants Application — Truth-seeking: Cosmos × FIRE Stream**

VeriTruth is a multi-agent, decentralized fact-verification platform that combats AI-driven disinformation. Specialized AI agents analyze each claim in parallel and produce a transparent, tamper-resistant **Proof of Reliability** score. Completed verifications are permanently anchored on the Cosmos blockchain via Keplr wallet.

---

## Project Vision

The internet is increasingly vulnerable to AI-generated disinformation. Traditional fact-checking platforms are centralized, opaque, and susceptible to censorship. VeriTruth addresses this with three core principles:

**Decentralization** — Verification power is distributed across a network of independent AI agents rather than a single authority. **Transparency** — Every agent's reasoning steps and sources are fully reported. **Autonomy** — Agents are designed as independent epistemic actors aligned with Agent Economy principles.

---

## Academic Foundations

This project is grounded in peer-reviewed research published in 2025–2026:

| Paper | Year | Contribution |
|---|---|---|
| [The Agent Economy](https://arxiv.org/abs/2602.14219) — Xu | 2026 | Blockchain-based autonomous agent economy architecture |
| [NANDA Index Architecture](https://arxiv.org/abs/2508.03101) — Wang et al. | 2025 | Decentralized agent discovery and Zero Trust security |
| [SREE Framework](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5415074) — Morin | 2025 | Recursive verification to prevent epistemic drift |
| [AI-driven Disinformation](https://www.frontiersin.org/articles/10.3389/frai.2025.1569115) — Romanishyn et al. | 2025 | Policy recommendations for democratic resilience |
| [TruthChain](https://ieeexplore.ieee.org/abstract/document/11176464/) — Murugalakshmi et al. | 2025 | Blockchain-based news verification system |

---

## Features

**Claim Input Form** — A clean homepage form where users submit any text claim or news statement for analysis.

**Multi-Agent AI Analysis** — Three specialized agents run in parallel using OpenAI and Gemini APIs:
- Source Verification Agent — assesses source credibility and citation quality
- Logical Consistency Agent — detects logical fallacies and internal contradictions
- Cross-Verification Agent — compares the claim against independent data points

**Live Analysis Stream** — A real-time progress interface showing each agent's status step by step.

**Consensus Mechanism** — A weighted-average algorithm computes the final Proof of Reliability score and verdict.

**Verification Result Report** — A detailed report showing each agent's findings, individual scores, and the final consensus decision.

**Verification History** — All past analyses are stored in the database and accessible from the history page.

**Cosmos Blockchain Anchor** — After analysis, users can anchor their verification result permanently on the Cosmos blockchain via Keplr wallet.

### Verdict Criteria

| Verdict | Proof of Reliability | Description |
|---|---|---|
| **Verified** | ≥ 70 | Claim is supported by credible sources and is logically consistent |
| **Suspicious** | 40–69 | Claim is ambiguous or has conflicting sources |
| **False** | < 40 | Claim is contradicted by evidence or logically incoherent |

---

## Cosmos Blockchain Integration

VeriTruth integrates with the Cosmos ecosystem to provide immutable, on-chain proof of each verification result.

### How It Works

When a verification is completed, the user can anchor the result on-chain by connecting their Keplr wallet. The platform builds a compact proof object containing a SHA-256 hash of the claim, the Proof of Reliability score, the verdict, and a timestamp. This proof is broadcast as the memo of a minimal self-transfer transaction on the Cosmos network.

```json
{
  "app": "veritruth",
  "version": "1.0",
  "id": 42,
  "claim_hash": "a3f8c1d2e4b5f6a7",
  "score": 82,
  "verdict": "Verified",
  "agents": 3,
  "ts": 1745658000
}
```

### Network Configuration

| Parameter | Value |
|---|---|
| Primary Network | Cosmos Hub Testnet (theta-testnet-001) |
| Fallback RPC | `https://cosmos-rpc.publicnode.com:443` |
| Explorer | [explorer.polypore.xyz](https://explorer.polypore.xyz/theta-testnet-001) |
| Wallet | Keplr browser extension |
| Transaction Type | MsgSend self-transfer with proof memo |

### Anchoring Flow

1. User completes a claim analysis on VeriTruth.
2. On the result page, user clicks **"Anchor to Cosmos"** and connects their Keplr wallet.
3. The backend generates the proof JSON and transaction parameters.
4. Keplr prompts the user to sign a minimal self-transfer with the proof as memo.
5. The transaction hash is recorded in the VeriTruth database alongside the verification.
6. The user receives a direct link to view the anchored transaction on the Cosmos Explorer.

### Why Cosmos?

Cosmos was chosen for its IBC interoperability, low transaction fees, and alignment with the decentralized, open-source ethos of this project. The Cosmos Grants Truth-seeking stream directly supports projects that use blockchain infrastructure to combat epistemic manipulation — which is the core mission of VeriTruth.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VeriTruth Platform                       │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React 19 + Tailwind 4)                               │
│  ├── Claim Input Form                                           │
│  ├── Live Analysis Stream (polling)                             │
│  ├── Result Report + CosmosWallet (Keplr)                       │
│  └── Verification History                                       │
├─────────────────────────────────────────────────────────────────┤
│  Backend (Express + tRPC)                                       │
│  ├── verify.submit → runAllAgents() → computeConsensus()        │
│  ├── cosmos.getChainStatus → StargateClient (CosmJS)            │
│  ├── cosmos.buildAnchorParams → SHA-256 proof generation        │
│  └── cosmos.recordAnchor → persist txHash to DB                 │
├─────────────────────────────────────────────────────────────────┤
│  AI Agent Layer                                                 │
│  ├── Source Verification Agent (OpenAI GPT-4o)                  │
│  ├── Logical Consistency Agent (Gemini 1.5 Pro)                 │
│  └── Cross-Verification Agent (OpenAI GPT-4o)                   │
├─────────────────────────────────────────────────────────────────┤
│  Cosmos Blockchain Layer                                        │
│  └── On-chain proof anchor via Keplr + CosmJS SigningStargateClient │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Node.js, Express 4, tRPC 11 |
| Database | MySQL (TiDB) via Drizzle ORM |
| AI Agents | OpenAI GPT-4o, Google Gemini 1.5 Pro |
| Blockchain | Cosmos Hub, CosmJS, Keplr Wallet |
| Testing | Vitest |

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Keplr browser extension (for blockchain anchoring)
- OpenAI API key
- Google Gemini API key

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

See [`.env.example`](.env.example) for all required variables.

---

## Cosmos Grants Alignment

This project directly addresses the **Truth-seeking: Cosmos × FIRE** grant stream:

**Epistemic integrity** — VeriTruth uses a multi-agent consensus mechanism to resist single points of failure and manipulation, directly combating AI-generated disinformation.

**Blockchain accountability** — Verification results are anchored on-chain, creating an immutable public record that cannot be altered or censored.

**Open-source ecosystem** — The entire codebase is MIT-licensed and designed for community extension, including adding new agent types, supporting additional LLM providers, and integrating with IBC-connected chains.

**Academic grounding** — The project is built on five peer-reviewed papers from 2025–2026, demonstrating rigorous research alignment.

---

## Roadmap

**Phase 1 (Current MVP):** Multi-agent analysis, Proof of Reliability score, Cosmos blockchain anchoring via Keplr.

**Phase 2:** CosmWasm smart contract for on-chain verification registry; decentralized agent staking and slashing.

**Phase 3:** IBC integration to broadcast verification results across Cosmos-connected chains; DAO governance for agent parameter updates.

---

## License

MIT © 2026 VeriTruth Contributors
