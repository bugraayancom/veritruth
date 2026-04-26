use cosmwasm_schema::{cw_serde, QueryResponses};

/// Message sent when first deploying the contract.
#[cw_serde]
pub struct InstantiateMsg {
    /// Human-readable name for this registry instance.
    pub registry_name: String,
}

/// Messages that mutate contract state.
#[cw_serde]
pub enum ExecuteMsg {
    /// Anchor a completed verification result on-chain.
    AnchorVerification {
        /// Unique numeric ID from the VeriTruth off-chain database.
        verification_id: u64,
        /// SHA-256 hex hash of the original claim text.
        claim_hash: String,
        /// First 500 characters of the claim (for on-chain preview).
        claim_preview: String,
        /// Proof of Reliability score (0–100).
        reliability_score: u8,
        /// Final verdict: "Verified", "Suspicious", or "False".
        verdict: String,
        /// Number of AI agents that participated.
        agent_count: u8,
    },
}

/// Read-only queries.
#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    /// Returns the contract configuration.
    #[returns(ConfigResponse)]
    Config {},

    /// Returns a single verification record by its off-chain ID.
    #[returns(VerificationResponse)]
    GetVerification { verification_id: u64 },

    /// Returns a paginated list of all anchored verifications.
    #[returns(VerificationListResponse)]
    ListVerifications {
        /// Start after this ID for pagination (None = from beginning).
        start_after: Option<u64>,
        /// Maximum number of records to return (max 30).
        limit: Option<u32>,
    },

    /// Returns total count of anchored verifications.
    #[returns(StatsResponse)]
    Stats {},
}

// ─── Response types ──────────────────────────────────────────────────────────

#[cw_serde]
pub struct ConfigResponse {
    pub admin: String,
    pub registry_name: String,
    pub version: String,
}

#[cw_serde]
pub struct VerificationResponse {
    pub verification_id: u64,
    pub claim_hash: String,
    pub claim_preview: String,
    pub reliability_score: u8,
    pub verdict: String,
    pub agent_count: u8,
    pub anchored_by: String,
    pub anchored_at: u64,
    pub app: String,
    pub schema_version: String,
}

#[cw_serde]
pub struct VerificationListResponse {
    pub verifications: Vec<VerificationResponse>,
    pub total: u64,
}

#[cw_serde]
pub struct StatsResponse {
    pub total_verifications: u64,
    pub registry_name: String,
    pub version: String,
}
