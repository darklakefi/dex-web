# Claude Code Assistant Documentation

## Project Overview

This is a Solana DEX web application built with Next.js, using a monorepo structure with NX.

## Internationalization (i18n) Strategy

### Current Setup

- **Framework**: next-intl
- **Supported Languages**: English (en), French (fr)
- **Routing Strategy**: Dynamic routes with `[lang]` parameter
- **Locale Prefix**: "as-needed" (no `/en` prefix for English, `/fr` prefix for French)
- **Translation Files**: `/apps/web/locale/{lang}.json`

### Implementation Patterns

#### 1. Client Components

```typescript
"use client";
import { useTranslations } from "next-intl";

export function ComponentName() {
  const t = useTranslations("namespace");
  return <div>{t("key")}</div>;
}
```

#### 2. Server Components

```typescript
import { getTranslations } from "next-intl/server";

export async function ComponentName() {
  const t = await getTranslations("namespace");
  return <div>{t("key")}</div>;
}
```

#### 3. Dynamic Values (Interpolation)

```json
// In translation file
{
  "message": "Welcome {name}!",
  "priceImpact": "Price impact: {value}%"
}
```

```typescript
// In component
t("message", { name: "Alice" });
t("priceImpact", { value: slippage.toString() });
```

#### 4. BUTTON_MESSAGE Pattern

For components with multiple button states, maintain the existing BUTTON_MESSAGE pattern:

```typescript
const t = useTranslations("swap");
const tCommon = useTranslations("common");

const BUTTON_MESSAGE = {
  ENTER_AMOUNT: t("enterAmount"),
  LOADING: tCommon("loading"),
  HIGH_PRICE_IMPACT: (value: string) => t("highPriceImpact", { value }),
  // etc...
};
```

### Translation File Structure

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
    // Common UI elements
  },
  "wallet": {
    "connectWallet": "Connect Wallet",
    "disconnect": "Disconnect"
    // Wallet-related strings
  },
  "swap": {
    "swap": "Swap",
    "enterAmount": "Enter an amount",
    "highPriceImpact": "CONFIRM SWAP WITH {value}% PRICE IMPACT"
    // Swap-specific strings
  },
  "liquidity": {
    "addLiquidity": "Add Liquidity",
    "createPool": "Create Pool"
    // Liquidity-specific strings
  },
  "pages": {
    // Page titles and navigation
  }
}
```

### Components Requiring i18n

#### High Priority (User-facing, frequently used)

1. **SwapForm** (`/app/[lang]/(swap)/_components/SwapForm.tsx`)
   - BUTTON_MESSAGE object
   - Toast messages
   - Error messages

2. **SelectWalletModal** (`/app/_components/SelectWalletModal.tsx`)
   - "Connect Wallet" title
   - Wallet names (keep as-is, they're brand names)

3. **AppFooter** (`/app/_components/AppFooter.tsx`)
   - Legal disclaimer
   - Link labels ("Resources", "Docs", "Support", etc.)

4. **LiquidityForm** (`/app/[lang]/liquidity/_components/LiquidityForm.tsx`)
   - Button messages
   - Error/success notifications
   - Form labels

#### Medium Priority

5. **SelectTokenModal** (`/app/_components/SelectTokenModal.tsx`)
   - "Search for a token" placeholder
   - "No token found" message

6. **TokenTransactionDetails** (`/app/_components/TokenTransactionDetails.tsx`)
   - Labels ("Price Impact", "Max Slippage", etc.)

7. **SwapTransactionHistory** (`/app/[lang]/(swap)/_components/SwapTransactionHistory.tsx`)
   - Table headers
   - Status messages

8. **WithdrawLiquidityModal** (`/app/[lang]/liquidity/_components/WithdrawLiquidityModal.tsx`)
   - Form labels
   - Success/error messages

#### Low Priority

9. **NoResultFound** (`/app/_components/NoResultFound.tsx`)
10. **Various pool panels** (Featured/Trending pools labels)
11. **Form validation messages**

### Implementation Steps

1. **Phase 1**: Expand translation files with all necessary keys
2. **Phase 2**: Update high-priority components (SwapForm, Wallet, Footer)
3. **Phase 3**: Update medium-priority components
4. **Phase 4**: Update low-priority components
5. **Phase 5**: Add French translations for all keys
6. **Phase 6**: Testing and refinement

### Testing Checklist

- [ ] Language switcher works correctly
- [ ] All hardcoded strings are replaced
- [ ] Dynamic values interpolate correctly
- [ ] Pluralization works (if needed)
- [ ] No missing translation warnings in console
- [ ] French translations are accurate
- [ ] RTL support (if needed in future)

### Notes

- Keep brand names (wallet names, "Darklake", etc.) untranslated
- Use consistent terminology across translations
- Consider cultural context for French translations
- Maintain the existing BUTTON_MESSAGE pattern for better code organization
- Server components should use async/await with getTranslations
- Client components must have "use client" directive when using hooks
