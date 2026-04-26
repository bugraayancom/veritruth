use cosmwasm_std::{
    to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Order, Response, StdResult,
};
use cw_storage_plus::Bound;

use crate::error::ContractError;
use crate::msg::{
    ConfigResponse, ExecuteMsg, InstantiateMsg, QueryMsg, StatsResponse, VerificationListResponse,
    VerificationResponse,
};
use crate::state::{Config, VerificationRecord, CONFIG, TOTAL_COUNT, VERIFICATIONS};

const CONTRACT_VERSION: &str = "1.0.0";
const APP_NAME: &str = "veritruth";
const MAX_LIST_LIMIT: u32 = 30;
const DEFAULT_LIST_LIMIT: u32 = 10;

// ─── Instantiate ─────────────────────────────────────────────────────────────

pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let config = Config {
        admin: info.sender.clone(),
        registry_name: msg.registry_name.clone(),
        version: CONTRACT_VERSION.to_string(),
    };

    CONFIG.save(deps.storage, &config)?;
    TOTAL_COUNT.save(deps.storage, &0u64)?;

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("admin", info.sender)
        .add_attribute("registry_name", msg.registry_name)
        .add_attribute("version", CONTRACT_VERSION))
}

// ─── Execute ─────────────────────────────────────────────────────────────────

pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::AnchorVerification {
            verification_id,
            claim_hash,
            claim_preview,
            reliability_score,
            verdict,
            agent_count,
        } => execute_anchor(
            deps,
            env,
            info,
            verification_id,
            claim_hash,
            claim_preview,
            reliability_score,
            verdict,
            agent_count,
        ),
    }
}

fn execute_anchor(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    verification_id: u64,
    claim_hash: String,
    claim_preview: String,
    reliability_score: u8,
    verdict: String,
    agent_count: u8,
) -> Result<Response, ContractError> {
    // Validate score
    if reliability_score > 100 {
        return Err(ContractError::InvalidScore {
            score: reliability_score,
        });
    }

    // Validate verdict
    if !["Verified", "Suspicious", "False"].contains(&verdict.as_str()) {
        return Err(ContractError::InvalidVerdict {
            verdict: verdict.clone(),
        });
    }

    // Validate claim hash (must be 64-char hex = SHA-256)
    if claim_hash.len() != 64 || !claim_hash.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(ContractError::InvalidClaimHash {});
    }

    // Validate claim preview length
    if claim_preview.len() > 500 {
        return Err(ContractError::ClaimPreviewTooLong {});
    }

    // Check for duplicate
    if VERIFICATIONS.has(deps.storage, verification_id) {
        return Err(ContractError::AlreadyAnchored { id: verification_id });
    }

    let record = VerificationRecord {
        verification_id,
        claim_hash: claim_hash.clone(),
        claim_preview,
        reliability_score,
        verdict: verdict.clone(),
        agent_count,
        anchored_by: info.sender.clone(),
        anchored_at: env.block.time.seconds(),
        app: APP_NAME.to_string(),
        schema_version: CONTRACT_VERSION.to_string(),
    };

    VERIFICATIONS.save(deps.storage, verification_id, &record)?;

    // Increment total count
    let count = TOTAL_COUNT.load(deps.storage)?;
    TOTAL_COUNT.save(deps.storage, &(count + 1))?;

    Ok(Response::new()
        .add_attribute("action", "anchor_verification")
        .add_attribute("verification_id", verification_id.to_string())
        .add_attribute("claim_hash", claim_hash)
        .add_attribute("verdict", verdict)
        .add_attribute("reliability_score", reliability_score.to_string())
        .add_attribute("anchored_by", info.sender))
}

// ─── Query ───────────────────────────────────────────────────────────────────

pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_json_binary(&query_config(deps)?),
        QueryMsg::GetVerification { verification_id } => {
            to_json_binary(&query_verification(deps, verification_id)?)
        }
        QueryMsg::ListVerifications { start_after, limit } => {
            to_json_binary(&query_list(deps, start_after, limit)?)
        }
        QueryMsg::Stats {} => to_json_binary(&query_stats(deps)?),
    }
}

fn query_config(deps: Deps) -> StdResult<ConfigResponse> {
    let config = CONFIG.load(deps.storage)?;
    Ok(ConfigResponse {
        admin: config.admin.to_string(),
        registry_name: config.registry_name,
        version: config.version,
    })
}

fn query_verification(deps: Deps, verification_id: u64) -> StdResult<VerificationResponse> {
    let record = VERIFICATIONS.load(deps.storage, verification_id)?;
    Ok(record_to_response(record))
}

fn query_list(
    deps: Deps,
    start_after: Option<u64>,
    limit: Option<u32>,
) -> StdResult<VerificationListResponse> {
    let limit = limit.unwrap_or(DEFAULT_LIST_LIMIT).min(MAX_LIST_LIMIT) as usize;
    let start = start_after.map(Bound::exclusive);

    let verifications: Vec<VerificationResponse> = VERIFICATIONS
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .map(|item| {
            let (_, record) = item?;
            Ok(record_to_response(record))
        })
        .collect::<StdResult<Vec<_>>>()?;

    let total = TOTAL_COUNT.load(deps.storage)?;

    Ok(VerificationListResponse {
        verifications,
        total,
    })
}

fn query_stats(deps: Deps) -> StdResult<StatsResponse> {
    let config = CONFIG.load(deps.storage)?;
    let total = TOTAL_COUNT.load(deps.storage)?;
    Ok(StatsResponse {
        total_verifications: total,
        registry_name: config.registry_name,
        version: config.version,
    })
}

fn record_to_response(r: VerificationRecord) -> VerificationResponse {
    VerificationResponse {
        verification_id: r.verification_id,
        claim_hash: r.claim_hash,
        claim_preview: r.claim_preview,
        reliability_score: r.reliability_score,
        verdict: r.verdict,
        agent_count: r.agent_count,
        anchored_by: r.anchored_by.to_string(),
        anchored_at: r.anchored_at,
        app: r.app,
        schema_version: r.schema_version,
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::from_json;

    fn do_instantiate(deps: DepsMut) {
        let msg = InstantiateMsg {
            registry_name: "VeriTruth Registry".to_string(),
        };
        let info = mock_info("admin_addr", &[]);
        instantiate(deps, mock_env(), info, msg).unwrap();
    }

    fn sample_anchor_msg() -> ExecuteMsg {
        ExecuteMsg::AnchorVerification {
            verification_id: 1,
            claim_hash: "a3f8c1d2e4b5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1".to_string(),
            claim_preview: "Scientists confirm coffee reverses aging effects".to_string(),
            reliability_score: 82,
            verdict: "Verified".to_string(),
            agent_count: 3,
        }
    }

    #[test]
    fn test_instantiate() {
        let mut deps = mock_dependencies();
        do_instantiate(deps.as_mut());

        let res: ConfigResponse =
            from_json(query(deps.as_ref(), mock_env(), QueryMsg::Config {}).unwrap()).unwrap();
        assert_eq!(res.admin, "admin_addr");
        assert_eq!(res.registry_name, "VeriTruth Registry");
        assert_eq!(res.version, CONTRACT_VERSION);
    }

    #[test]
    fn test_anchor_and_query() {
        let mut deps = mock_dependencies();
        do_instantiate(deps.as_mut());

        let info = mock_info("user_wallet", &[]);
        execute(deps.as_mut(), mock_env(), info, sample_anchor_msg()).unwrap();

        let res: VerificationResponse = from_json(
            query(
                deps.as_ref(),
                mock_env(),
                QueryMsg::GetVerification { verification_id: 1 },
            )
            .unwrap(),
        )
        .unwrap();

        assert_eq!(res.verification_id, 1);
        assert_eq!(res.verdict, "Verified");
        assert_eq!(res.reliability_score, 82);
        assert_eq!(res.anchored_by, "user_wallet");
        assert_eq!(res.app, "veritruth");
    }

    #[test]
    fn test_duplicate_anchor_fails() {
        let mut deps = mock_dependencies();
        do_instantiate(deps.as_mut());

        let info = mock_info("user_wallet", &[]);
        execute(deps.as_mut(), mock_env(), info.clone(), sample_anchor_msg()).unwrap();

        let err = execute(deps.as_mut(), mock_env(), info, sample_anchor_msg()).unwrap_err();
        assert!(matches!(err, ContractError::AlreadyAnchored { id: 1 }));
    }

    #[test]
    fn test_invalid_verdict_fails() {
        let mut deps = mock_dependencies();
        do_instantiate(deps.as_mut());

        let info = mock_info("user_wallet", &[]);
        let msg = ExecuteMsg::AnchorVerification {
            verification_id: 2,
            claim_hash: "a3f8c1d2e4b5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1".to_string(),
            claim_preview: "test claim".to_string(),
            reliability_score: 50,
            verdict: "InvalidVerdict".to_string(),
            agent_count: 3,
        };
        let err = execute(deps.as_mut(), mock_env(), info, msg).unwrap_err();
        assert!(matches!(err, ContractError::InvalidVerdict { .. }));
    }

    #[test]
    fn test_invalid_score_fails() {
        let mut deps = mock_dependencies();
        do_instantiate(deps.as_mut());

        let info = mock_info("user_wallet", &[]);
        let msg = ExecuteMsg::AnchorVerification {
            verification_id: 3,
            claim_hash: "a3f8c1d2e4b5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1".to_string(),
            claim_preview: "test claim".to_string(),
            reliability_score: 150, // invalid
            verdict: "Verified".to_string(),
            agent_count: 3,
        };
        let err = execute(deps.as_mut(), mock_env(), info, msg).unwrap_err();
        assert!(matches!(err, ContractError::InvalidScore { score: 150 }));
    }

    #[test]
    fn test_list_verifications() {
        let mut deps = mock_dependencies();
        do_instantiate(deps.as_mut());

        // Anchor 3 records
        for i in 1u64..=3 {
            let info = mock_info("user_wallet", &[]);
            let msg = ExecuteMsg::AnchorVerification {
                verification_id: i,
                claim_hash: "a3f8c1d2e4b5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1".to_string(),
                claim_preview: format!("Claim number {}", i),
                reliability_score: 70,
                verdict: "Verified".to_string(),
                agent_count: 3,
            };
            execute(deps.as_mut(), mock_env(), info, msg).unwrap();
        }

        let res: VerificationListResponse = from_json(
            query(
                deps.as_ref(),
                mock_env(),
                QueryMsg::ListVerifications {
                    start_after: None,
                    limit: Some(10),
                },
            )
            .unwrap(),
        )
        .unwrap();

        assert_eq!(res.total, 3);
        assert_eq!(res.verifications.len(), 3);
    }

    #[test]
    fn test_stats() {
        let mut deps = mock_dependencies();
        do_instantiate(deps.as_mut());

        let info = mock_info("user_wallet", &[]);
        execute(deps.as_mut(), mock_env(), info, sample_anchor_msg()).unwrap();

        let res: StatsResponse =
            from_json(query(deps.as_ref(), mock_env(), QueryMsg::Stats {}).unwrap()).unwrap();
        assert_eq!(res.total_verifications, 1);
        assert_eq!(res.registry_name, "VeriTruth Registry");
    }
}
