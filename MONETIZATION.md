# Orbs Monetization Strategy

## Approach: Lite + Full Version (Separate Apps)

Instead of in-app purchases, we'll publish two separate apps:

### Orbs Lite (Free)
- **Bundle ID:** `dev.quickbeam.orbs.lite`
- **Price:** Free
- **Content:** Levels 1-15
- **Purpose:** Let players experience the core gameplay, morphing orbs, and get hooked before structures add complexity

### Orbs (Paid)
- **Bundle ID:** `dev.quickbeam.orbs`
- **Price:** $2.99 - $4.99 (TBD)
- **Content:** All levels (1-25+)
- **Purpose:** Full game experience with structures, all morph types, complete progression

## Why This Approach

### Pros
- No payment code to write or maintain
- No IAP configuration or receipt validation
- No third-party services (RevenueCat, etc.)
- App Store handles all payment/tracking
- Clean, complete experience for paying users
- Lite version gets its own reviews/ratings for discovery

### Cons
- Two apps to maintain (99% shared codebase)
- Users lose progress when upgrading (no cloud sync)
- Extra friction to convert (must visit App Store)
- Two App Store listings to manage

## Implementation

### Config Flag
```javascript
// In quasar.config.js or environment config
const IS_LITE_VERSION = process.env.LITE_VERSION === 'true'
```

### Level Gating
```javascript
if (IS_LITE_VERSION && level > 15) {
  showUpgradePrompt()
  return
}
```

### Lite Version UI
- "Get Full Version" button in menu/settings
- Locked level icons with "Full Version" badge for levels 16+
- Deep link to paid app in App Store

### Build Commands
```bash
# Full version
quasar build -m capacitor -T ios

# Lite version
LITE_VERSION=true quasar build -m capacitor -T ios
```

## Alternatives Considered

### In-App Purchase (Rejected)
- RevenueCat: Free up to $2,500/mo revenue, then 1% cut
- Added complexity: receipt validation, restore purchases, edge cases
- Overkill for simple unlock model

### Single Paid App (Rejected)
- No way for users to try before buying
- Harder to get initial downloads/reviews
- Less App Store visibility (free apps rank better)
