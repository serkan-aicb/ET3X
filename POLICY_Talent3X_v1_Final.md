# Talent3X Policy v1.0 (Final)

> **Governance Layer:** ev8 Kernel  
> **Platform Layer:** Talent3X  
> **Effective Date:** 2026-01-01T00:00:00Z  
> **Status:** ACTIVE  
> **Canonicalization:** EV8_CANON_JSON_1  
> **Hash Algorithm:** KECCAK256  

---

## 1. Architectural Foundation

### 1.1 Four-Layer Trust Model

| Layer | Responsibility | Authority |
|-------|---------------|-----------|
| **ev8 Kernel** | DID issuance, policy validation, canonical truth storage, hash anchoring | Root of trust |
| **Talent3X Platform** | Profiles, task flows, submissions, evaluator UX, dashboards, exports | Orchestration & interface |
| **Canonical Artifacts** | Durable, self-contained evaluation records | Source of truth |
| **Projection Artifacts** | Derived views: profiles, analytics, summaries | Read-only interpretation |

**Core Principle:** Truth is separate from UI. If Talent3X disappears, canonical artifacts preserve meaning, accountability, and portability.

### 1.2 Storage Boundaries

**In ev8 / Canonical Backend:**
- Active policy hash
- Action records
- Submission hash + optional reference
- Evaluation result
- Evaluator receipt
- Snapshot hash + body reference
- Proof bundle hash + reference

**In Talent3X App Database:**
- User account to DID mapping
- Profile metadata
- Task drafts and UI state
- Framework labels and skill labels
- Permission state
- Projection caches

**With the Student (Exportable):**
- Student proof bundle
- Policy snapshot
- Evaluation result
- Evaluator receipt

**With the Evaluator:**
- Evaluator receipt
- Linked evaluation result
- Linked policy snapshot (or hash)

---

## 2. Identity

| Field | Specification |
|-------|--------------|
| Issuer | ev8 |
| DID Method | `did:ev8` |
| Flow | Student signs up in Talent3X -> Talent3X requests DID from ev8 -> Student receives `did:ev8:...` -> Talent3X stores app-user DID linkage |

---

## 3. Action (Task) Specification

### 3.1 Action Type
- **Type:** `EVALUATION_CONTAINER`
- **Granularity:** `TASK`

### 3.2 Required Context Fields

| Field | Type | Required | Source/Values |
|-------|------|----------|---------------|
| `subjectDid` | STRING | Yes | Student DID |
| `actionId` | STRING | Yes | Unique task identifier |
| `actionCategory` | ENUM | Yes | `COURSE_TASK`, `PROJECT_WORK`, `ASSESSMENT`, `PRACTICAL_EXERCISE`, `RESEARCH_ACTIVITY`, `INTERNSHIP_ACTIVITY`, `COMPANY_CHALLENGE`, `PEER_COLLABORATION` |
| `issuerDid` | STRING | Yes | Creator DID |
| `skillIds` | ARRAY | Yes | Framework-bound from `OULU_GENERIC_SKILLS_OR_EXTENSIONS` |
| `difficulty` | ENUM | Yes | `FOUNDATIONAL`, `INTERMEDIATE`, `ADVANCED`, `EXCEPTIONAL` |

### 3.3 Forbidden Fields
- `privateNotesRaw`
- `medicalInformation`
- `personalAddress`
- `privatePhone`
- `privateEmail`

---

## 4. Submission Specification

### 4.1 Payload Mode
`HASH_PLUS_OPTIONAL_REFERENCE`

### 4.2 Accepted Evidence Types
- `DOCUMENT_HASH`
- `PROJECT_HASH`
- `ASSESSMENT_HASH`
- `MEDIA_HASH`
- `PORTFOLIO_HASH`
- `EXTERNAL_LINK_HASH`

### 4.3 Integrity
- **Method:** `HASH_COMMITMENT`
- **Algorithm:** `KECCAK256`

### 4.4 Forbidden Payload Fields
- `rawPersonalStatementUnredacted`
- `healthData`
- `privateContactData`
- `governmentIdNumber`
- `rawResumeFile`

---

## 5. Evaluation Specification

### 5.1 Core Model

| Attribute | Value |
|-----------|-------|
| Schema ID | `EV8_SKILL_EVALUATION_V1` |
| Input Mode | `SINGLE_SCORE` |
| Scale | `RUBRIC_SCORE` (0-5) |
| Aggregation | `WEIGHTED_AVERAGE_WITH_MEDIAN_FALLBACK` |

### 5.2 Dimension Model (Interpretation, Not Input)

Dimensions define how a single evaluator score is interpreted. Evaluators see the logic but are not forced into separate scoring interactions.

| Dimension | Weight | Required |
|-----------|--------|----------|
| `skill_mastery` | 0.35 | Yes |
| `evidence_quality` | 0.20 | Yes |
| `practical_application` | 0.20 | Yes |
| `communication_reflection` | 0.10 | No |
| `collaboration_professionalism` | 0.15 | No |

### 5.3 Evaluator Guidance

| Score | Meaning |
|-------|---------|
| 1 | Weak demonstration |
| 2 | Limited demonstration |
| 3 | Adequate demonstration |
| 4 | Strong demonstration |
| 5 | Excellent demonstration |

### 5.4 Difficulty Handling

| Difficulty | Multiplier |
|-----------|------------|
| `FOUNDATIONAL` | 0.8 |
| `INTERMEDIATE` | 1.0 |
| `ADVANCED` | 1.2 |
| `EXCEPTIONAL` | 1.4 |

**Rule:** Difficulty belongs to the task, not the evaluator. It is stable before evaluation begins.

### 5.5 Evaluator Rules

- Allowed roles: `PROFESSOR`, `COMPANY`, `MENTOR`
- Must declare role
- **Self-evaluation forbidden**
- Max **one evaluation per evaluator per action per subject**
- Optional comment required automatically if score is 1 or 5

### 5.6 Committee Rules
- Min evaluators: 1
- Max evaluators: 3
- Quorum: Not required

---

## 6. Roles & Capabilities

| Role | DID Class | Capabilities |
|------|-----------|--------------|
| `STUDENT` | INDIVIDUAL | SUBMIT, VIEW_OWN, EXPORT_PROOF_HISTORY |
| `PROFESSOR` | INDIVIDUAL | CREATE_ACTION, EVALUATE, VERIFY, ATTEST |
| `COMPANY` | ORGANIZATION | CREATE_ACTION, EVALUATE, VERIFY, ATTEST, VIEW_GRANTED |
| `UNIVERSITY` | ORGANIZATION | CREATE_ACTION, VERIFY, ATTEST, DEFINE_FRAMEWORK |
| `MENTOR` | INDIVIDUAL | EVALUATE, VERIFY |
| `PLATFORM_OPERATOR` | ORGANIZATION | VERIFY_POLICY, INDEX, ANCHOR_BATCH |

---

## 7. Lifecycle Rules

| Phase | Rule |
|-------|------|
| Open | `EXPLICIT_CREATE_ACTION` |
| Limits | Max 1 evaluation per evaluator; 10-minute cooldown |
| Timing | Deadlines optional, issuer-defined allowed |
| Closure | `FIRST_VALID_OR_DEADLINE`; issuer may close manually |

---

## 8. Recognition & Projections

### 8.1 Canonical Outputs
- `verified_skill_score`
- `evaluation_count`
- `attestation_status`
- `evidence_count`
- `domain_coverage`
- `difficulty_adjusted_score`

### 8.2 Projection Presets

| View | Method |
|------|--------|
| Student profile | `LATEST_OR_WEIGHTED_PER_SKILL` |
| Company candidate | `DOMAIN_SUMMARY_WITH_EVIDENCE` |
| Institution dashboard | `AGGREGATED_DOMAIN_ANALYTICS` |

### 8.3 Anti-Abuse
- No opaque scoring
- No off-kernel recognition
- No hidden manual overrides
- Traceable evidence required

---

## 9. Policy Hashing & Binding

### 9.1 Hashing Method
```
policyHash = KECCAK256(canonical_json(full_policy))
```

### 9.2 Binding Requirement
Every evaluation result and receipt MUST bind to the active policy hash.

### 9.3 Artifact Dependency Chain

```
Policy (root)
  -> policyHash
  -> Snapshot (contains policyHash)
    -> snapshotHash
    -> Evaluation Result (contains policyHash + snapshotHash)
      -> evaluationResultHash
      -> Evaluator Receipt (contains hashOfPolicy + hashOfSnapshot + hashOfEvaluationResult)
        -> evaluationReceiptHash
        -> Student Proof Bundle (contains all artifacts + integrity refs)
          -> proofBundleHash
```

---

## 10. Artifact Specifications

### 10.1 Policy Snapshot

```json
{
  "snapshotType": "EVALUATION_INTERPRETATION_SNAPSHOT",
  "snapshotVersion": "1.0",
  "policyRef": {
    "name": "TALENT3X_POLICY",
    "policyVersion": 1,
    "policyHash": "<ACTIVE_POLICY_HASH>",
    "canonicalization": "EV8_CANON_JSON_1"
  },
  "authority": {
    "kernel": "ev8",
    "didMethod": "did:ev8",
    "authoritativeSource": "EV8_KERNEL"
  },
  "evaluationModel": {
    "schemaId": "EV8_SKILL_EVALUATION_V1",
    "inputMode": "SINGLE_SCORE",
    "scale": { "type": "RUBRIC_SCORE", "min": 0, "max": 5 },
    "difficultyNormalization": {
      "method": "MULTIPLIER",
      "values": {
        "FOUNDATIONAL": 0.8,
        "INTERMEDIATE": 1.0,
        "ADVANCED": 1.2,
        "EXCEPTIONAL": 1.4
      }
    },
    "aggregation": { "method": "WEIGHTED_AVERAGE_WITH_MEDIAN_FALLBACK" }
  },
  "taskContext": {
    "actionCategory": "<ACTION_CATEGORY>",
    "frameworkRef": "OULU_GENERIC_SKILLS_OR_EXTENSIONS",
    "difficulty": { "code": "<DIFFICULTY>", "label": "<Resolved label>" },
    "skills": [
      { "skillId": "<ID>", "label": "<Resolved label>" }
    ],
    "skillResolution": {
      "method": "RESOLVED_AT_EVALUATION_TIME",
      "immutable": true
    }
  },
  "recognitionModel": {
    "canonicalScore": true,
    "viewModel": "CANONICAL_PLUS_PROJECTION",
    "outputs": ["verified_skill_score", "evaluation_count", "attestation_status", "evidence_count", "domain_coverage", "difficulty_adjusted_score"]
  }
}
```

### 10.2 Evaluation Result Record

```json
{
  "evaluationResult": {
    "resultType": "SKILL_EVALUATION_RESULT",
    "resultVersion": "1.0",
    "policyRef": {
      "policyHash": "<ACTIVE_POLICY_HASH>",
      "snapshotHash": "<SNAPSHOT_HASH>"
    },
    "identifiers": {
      "evaluationId": "<EVALUATION_ID>",
      "actionId": "<ACTION_ID>"
    },
    "participants": {
      "subjectDid": "<STUDENT_DID>",
      "evaluatorDid": "<EVALUATOR_DID>",
      "evaluatorRole": "<PROFESSOR|COMPANY|MENTOR>"
    },
    "context": {
      "actionCategory": "<ACTION_CATEGORY>",
      "difficulty": "<FOUNDATIONAL|INTERMEDIATE|ADVANCED|EXCEPTIONAL>"
    },
    "skills": [
      { "skillId": "<SKILL_ID>", "score": 4 }
    ],
    "metadata": {
      "evaluatedAt": "<ISO_8601_UTC_TIMESTAMP>",
      "evidenceCount": 1,
      "hasOptionalComment": true,
      "timeStandard": "ISO_8601_UTC"
    }
  }
}
```

### 10.3 Evaluator Receipt

```json
{
  "evaluationReceipt": {
    "receiptType": "EVALUATION_SUBMISSION_RECEIPT",
    "receiptVersion": "1.0",
    "policyRef": { "policyHash": "<ACTIVE_POLICY_HASH>" },
    "evaluationRef": { "evaluationId": "<EVALUATION_ID>" },
    "evaluator": {
      "evaluatorDid": "<EVALUATOR_DID>",
      "role": "<PROFESSOR|COMPANY|MENTOR>"
    },
    "signedContext": {
      "actionId": "<ACTION_ID>",
      "subjectDid": "<STUDENT_DID>",
      "skillsEvaluated": ["<SKILL_ID_1>"],
      "difficulty": "<DIFFICULTY_LEVEL>"
    },
    "signature": {
      "method": "EV8_SIGNED_EVENT",
      "signatureValue": "<SIGNATURE>",
      "signedAt": "<ISO_TIMESTAMP>"
    },
    "integrity": {
      "hashOfPolicy": "<POLICY_HASH>",
      "hashOfSnapshot": "<SNAPSHOT_HASH>",
      "hashOfEvaluationResult": "<EVALUATION_RESULT_HASH>"
    }
  }
}
```

### 10.4 Student Proof Bundle

```json
{
  "studentProofBundle": {
    "bundleType": "PORTABLE_EVALUATION_PROOF",
    "bundleVersion": "1.0",
    "evaluationResult": { ... },
    "policySnapshot": { ... },
    "evaluationReceipt": { ... },
    "exportMetadata": {
      "exportedAt": "<ISO_TIMESTAMP>",
      "exportedBy": "<STUDENT_DID>"
    },
    "integrity": {
      "hashOfPolicy": "<POLICY_HASH>",
      "hashOfSnapshot": "<SNAPSHOT_HASH>",
      "hashOfEvaluationResult": "<EVALUATION_RESULT_HASH>",
      "hashOfEvaluationReceipt": "<EVALUATION_RECEIPT_HASH>"
    }
  }
}
```

---

## 11. Dispute Resolution

| Attribute | Rule |
|-----------|------|
| Enabled | Yes |
| Method | `CHALLENGE_WITH_REVIEW_EVENT` |
| Student challenge | Allowed |
| Issuer review | Allowed |
| Record | As kernel event |
| Critical rule | **Never overwrite original canonical record** |

---

## 12. Security & Privacy

### 12.1 Privacy Rules
- No PII on-chain
- No raw evidence on-chain
- Forbidden context fields: `studentPrivateEmail`, `studentPhone`, `homeAddress`, `healthData`

### 12.2 Integrity Rules
- Require canonical JSON
- Require policy hash binding

### 12.3 Rate Limits
- Per evaluator per action: 1
- Cooldown: 10 minutes

---

## 13. Extensions

### 13.1 Framework Alignment
- `OULU_GENERIC_SKILLS`
- `UEL_COMPETENCY_MAPPING`
- `CUSTOM_FRAMEWORKS`

### 13.2 Attestation
Enabled for: `skill_mastery`, `domain_coverage`, `verified_completion`, `institution_endorsement`, `company_validation`

---

## 14. Implementation Priority

### Phase 1 (MVP)
1. DID issuance via ev8
2. Framework registry
3. Task creation
4. Submission hashing
5. Single-score evaluator UI
6. Evaluation result generation
7. Evaluator receipt generation
8. Student snapshot generation
9. Proof bundle export

### Phase 2
1. Profile projections
2. Institution dashboard
3. Dispute flow
4. Attestation flow
5. Additional frameworks

### Phase 3
1. AI-assisted evaluation support
2. Advanced analytics
3. Calibration workflows
4. Richer portability / company views

---

## 15. Final Governance Rules

1. **Policy hash binding is non-negotiable** — every evaluation must bind to the active policy hash.
2. **Framework-bound skills only** — no freeform skill entry during rating.
3. **Difficulty is task-level context** — not editable at evaluation time.
4. **Single-score UI, structured backend** — low friction, high fidelity.
5. **Canonical vs. projection separation** — UI never becomes the truth source.
6. **Time standard: ISO 8601 UTC** — all timestamps must follow this format.
7. **Hash order is strict:** Policy -> Snapshot -> Result -> Receipt -> Bundle.
8. **Snapshot immutability** — skill labels and descriptors are frozen at evaluation time.
9. **Evaluation uniqueness** — one evaluation per evaluator per action per subject.
10. **No circular references** — result does not contain receipt hash, receipt contains result hash.

---

## 16. Verification Checklist

After implementation, confirm:

- [ ] `policyHash` is deterministic across environments
- [ ] Snapshot contains resolved skill labels
- [ ] Difficulty multiplier is applied consistently
- [ ] Evaluator cannot submit twice for same task
- [ ] All timestamps are UTC ISO format
- [ ] Evaluation result + snapshot + receipt hashes are linked
- [ ] Bundle contains all prior hashes for portable verification
- [ ] No PII on-chain
- [ ] No raw evidence on-chain
- [ ] Canonical JSON canonicalization is applied before every hash

---

*End of Talent3X Policy v1.0*

> "Hash the rules first, then the meaning, then the result, then the signature, then the package."
