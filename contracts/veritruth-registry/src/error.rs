use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized: only the admin can perform this action")]
    Unauthorized {},

    #[error("Verification ID {id} already exists on-chain")]
    AlreadyAnchored { id: u64 },

    #[error("Verification ID {id} not found")]
    NotFound { id: u64 },

    #[error("Invalid reliability score {score}: must be between 0 and 100")]
    InvalidScore { score: u8 },

    #[error("Invalid verdict '{verdict}': must be 'Verified', 'Suspicious', or 'False'")]
    InvalidVerdict { verdict: String },

    #[error("Claim preview too long: max 500 characters")]
    ClaimPreviewTooLong {},

    #[error("Claim hash must be a 64-character hex string (SHA-256)")]
    InvalidClaimHash {},
}
