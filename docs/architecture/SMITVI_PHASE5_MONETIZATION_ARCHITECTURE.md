# SMITVI Phase 5 — Intelligence Marketplace & Monetization

**Status:** Implemented (Phase 5)  
**Builds on:** Marketplace listings/orders, Stripe/Razorpay, consultations, graph, search, recommendations, AI Twin  

## 1. Principle

Monetization is **optional**. Creators choose free, paid Twin, products, subscriptions, or services.

Do **not** duplicate payment infrastructure — extend it.

## 2. Mapping (spec → codebase)

| Spec | Implementation |
|------|------------------|
| Product | `MarketplaceListing` (+ slug, visibility, ratings, content ref) |
| Order | `MarketplaceOrder` (existing) |
| Payment | `Payment` (existing) |
| ProductAccess | `MarketplaceAccess` |
| CreatorWallet | `CreatorWallet` |
| Payout | `CreatorPayout` |
| Refund | `MarketplaceRefund` |
| TwinSubscription | `TwinCreatorSubscription` |
| Paid AI Twin | `TwinMonetizationSettings` |
| Service / Booking | `ConsultationOffer` + `ConsultationRequest` (existing) |
| Reviews | `MarketplaceReview` |
| Revenue events | `MarketplaceEvent` |
| Platform fees | `PlatformFeeConfig` (admin-configurable) |
| PaymentProvider | `PaymentProviderPort` → Stripe/Razorpay adapters (existing clients) |

## 3. Revenue flow

```
Listing (DRAFT) → publish → ACTIVE
Buyer → checkout (existing) → Payment webhook
  → idempotent markOrderPaid
  → MarketplaceFulfillmentService
      → grant access
      → credit wallet (pending → available per payout rules)
      → graph CREATED_BY / HAS_EXPERTISE edges
      → MarketplaceEvent
```

## 4. Platform fees

`PlatformFeeConfig` rows by `category` (`PRODUCT`, `CONSULTATION`, `AI_ACCESS`, `SUBSCRIPTION`).  
Fallback: `MARKETPLACE_COMMISSION_RATE` from env/constants (20% default).

Admin: `/admin/marketplace` — view fees, listings, orders, refunds queue.

## 5. Graph integration

On publish: `MarketplaceGraphSyncService` links listing entity to seller USER node and topic/skills from title/tags.

## 6. Search & recommendations

- Search: product keyword match in `UnifiedSearchService` / marketplace list API  
- Recommendations: `RecommendationService.recommendKnowledge` + marketplace listings by graph overlap  

## 7. Security

- Webhook signature verification (existing)  
- Order fulfillment idempotent on `PAID`/`FULFILLED`  
- Download/access via `MarketplaceAccess` + auth check  
- No card storage  

## 8. AI product assist

`ProductAssistService` → Twin generate API → **DRAFT listing only** (never auto-publish).

## 9. Public store

`/u/[username]/store` — hub store tab (products, consultations, Twin CTA).

## 10. Migration

`20260808200000_phase5_monetization`
