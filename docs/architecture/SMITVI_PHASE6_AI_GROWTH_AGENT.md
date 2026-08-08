# SMITVI Phase 6 — AI Growth Agent

**Status:** Implemented (Phase 6)  
**Compliance:** Human-in-the-loop outreach only — no autonomous social spam or credential bypass.

## 1. Objective

Internal growth intelligence to answer: who to invite, why Smitvi fits, scores, drafts, funnel state, activation, and revenue attribution — optimizing **activated, monetizing creators**, not raw signups.

## 2. Reuse (no duplication)

| System | Growth use |
|--------|------------|
| Human Intelligence Graph | Gap analysis, prospect matching, lookalikes |
| Search analytics (`SearchEvent`) | Demand / zero-result opportunities |
| Recommendations / learning gaps | Topic demand signals |
| Marketplace analytics | Supply/demand for products |
| `GetGrowthMetrics` | Activation KPIs |
| `referrerUsername` on Profile | Referral attribution |
| Admin RBAC | All growth APIs |

## 3. Architecture

```
GrowthGapAnalyzer + GrowthOpportunityEngine
        ↓
Prospect import (manual/CSV/API metadata only)
        ↓
ProspectResearchService (public fields → summary, UNKNOWN if missing)
        ↓
GrowthGraphMatcher + LookalikeEngine
        ↓
GrowthScoringService (fit, creator, monetization, network, overall)
        ↓
ValuePropositionEngine + GrowthMessageService (drafts)
        ↓
MessageApprovalService (mandatory before "sent" record)
        ↓
Manual outreach + OutreachEvent (no auto-send to LinkedIn)
        ↓
GrowthConversionService (prospect ↔ user, activation milestones)
        ↓
GrowthReportService (daily/weekly briefs)
```

## 4. Scoring (explainable, versioned)

`GrowthModelVersion` records weight sets. Default v1 weights:

- Expertise/demand match (search + graph gap): 25%
- Creator signals (portfolio URL, content hints): 20%
- Monetization paths (consulting, templates, course): 20%
- Network gap value: 15%
- Lookalike similarity to top creators: 10%
- Referral/trust signals: 10%

Outputs 0–100 with `scoreBreakdown` JSON.

## 5. Pipeline statuses

`DISCOVERED` → `RESEARCHED` → `QUALIFIED` → … → `MONETIZED` / `NOT_INTERESTED` / `DO_NOT_CONTACT`

Suppression list blocks outreach and imports.

## 6. Anti-spam

- Daily outreach limit (config `GROWTH_DAILY_OUTREACH_LIMIT`, default 50 approved drafts marked sent)
- Duplicate detection (email/url normalized)
- Human approval required for `APPROVED` → `CONTACTED`
- No automated LinkedIn login or bulk send

## 7. Portfolio audit funnel (public)

`POST /api/growth/portfolio-audit` — user submits public portfolio URL; returns heuristic audit + CTA (no private scraping of authenticated pages).

## 8. APIs (admin)

Under `/api/admin/growth/*` — require `requireAdmin()`.

## 9. Background jobs

`GrowthJob` table for research/score/report; processed via `GrowthJobRunner` (sync chunk on admin trigger or cron-ready hook).

## 10. Privacy

Professional public fields only; no passwords, DMs, or sensitive attributes in prospect records.
