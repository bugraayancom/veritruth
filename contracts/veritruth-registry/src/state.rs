use cosmwasm_schema::cw_serde;
use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};

/// Contract-level configuration stored at instantiation.
#[cw_serde]
pub struct Config {
    /// The address that deployed this contract (can update admin).
    pub admin: Addr,
    /// Human-readable name for this registry instance.
    pub registry_name: String,
    /// Version string for schema evolution.
    pub version: String,
}

/// A single verification proof anchored on-chain.
#[cw_serde]
pub struct VerificationRecord {
    /// Unique numeric ID from the VeriTruth off-chain database.
    pub verification_id: u64,
    /// SHA-256 hex hash of the original claim text.
    pub claim_hash: String,
    /// The full claim text (truncated to 500 chars for gas efficiency).
    pub claim_preview: String,
    /// Proof of Reliability score (0–100).
    pub reliability_score: u8,
    /// Final verdict: "Verified", "Suspicious", or "False".
    pub verdict: String,
    /// Number of AI agents that participated in the analysis.
    pub agent_count: u8,
    /// Address of the wallet that anchored this record.
    pub anchored_by: Addr,
    /// Block timestamp (Unix seconds) when the record was anchored.
    pub anchored_at: u64,
    /// App identifier for cross-platform verification.
    pub app: String,
    /// Schema version for forward compatibility.
    pub schema_version: String,
}

/// Contract-wide configuration singleton.
pub const CONFIG: Item<Config> = Item::new("config");

/// Registry of all verification records, keyed by verification_id.
pub const VERIFICATIONS: Map<u64, VerificationRecord> = Map::new("verifications");

/// Total count of anchored verifications (used as a quick stats query).
pub const TOTAL_COUNT: Item<u64> = Item::new("total_count");
