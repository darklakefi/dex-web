# Migration Guide: Client-Side to Server Actions

## Overview

This guide provides step-by-step instructions for migrating the existing client-side liquidity form to use Server Actions while maintaining all current functionality.

## Migration Steps

### Step 1: Set Up Server-Side Infrastructure

1. **Add Server Client** (Already Created)
   ```bash
   # File: /libs/orpc/src/serverClient.ts
   # Status: ✅ Created
   ```

2. **Create Server Actions** (Already Created)
   ```bash
   # File: /apps/web/src/app/[lang]/liquidity/_actions/submitLiquidityAction.ts
   # Status: ✅ Created
   ```

3. **Update oRPC Exports**
   ```typescript
   // Add to /libs/orpc/src/index.ts
   export { serverClient } from "./serverClient";
   ```

### Step 2: Integrate with Existing Components

#### Option A: Gradual Migration (Recommended)

1. **Create a Feature Flag**
   ```typescript
   // /apps/web/src/app/[lang]/liquidity/_utils/featureFlags.ts
   export const useServerActions = () => {
     // Could be environment variable, user setting, or gradual rollout
     return process.env.NEXT_PUBLIC_USE_SERVER_ACTIONS === 'true';
   };
   ```

2. **Modify Existing LiquidityForm**
   ```typescript
   // /apps/web/src/app/[lang]/liquidity/_components/LiquidityForm.tsx
   import { useServerActions } from "../_utils/featureFlags";
   import { LiquidityFormEnhanced } from "./LiquidityFormEnhanced";

   export function LiquidityForm() {
     const [{ tokenAAddress, tokenBAddress }] = useQueryStates(selectedTokensParsers);
     const shouldUseServerActions = useServerActions();

     if (shouldUseServerActions) {
       return (
         <LiquidityErrorBoundary>
           <LiquidityFormProvider tokenAAddress={tokenAAddress} tokenBAddress={tokenBAddress}>
             <LiquidityFormEnhanced />
           </LiquidityFormProvider>
         </LiquidityErrorBoundary>
       );
     }

     // Keep existing implementation
     return (
       <LiquidityErrorBoundary>
         <LiquidityFormProvider tokenAAddress={tokenAAddress} tokenBAddress={tokenBAddress}>
           <LiquidityFormContent />
         </LiquidityFormProvider>
       </LiquidityErrorBoundary>
     );
   }
   ```

#### Option B: Complete Migration

1. **Replace LiquidityForm.tsx**
   ```bash
   # Backup existing file
   mv apps/web/src/app/[lang]/liquidity/_components/LiquidityForm.tsx \
      apps/web/src/app/[lang]/liquidity/_components/LiquidityForm.backup.tsx

   # Use enhanced version
   cp apps/web/src/app/[lang]/liquidity/_components/LiquidityFormEnhanced.tsx \
      apps/web/src/app/[lang]/liquidity/_components/LiquidityForm.tsx
   ```

### Step 3: Update LiquidityActionButton

The `LiquidityActionButton` component needs to be updated to work with Server Actions:

```typescript
// Update /apps/web/src/app/[lang]/liquidity/_components/LiquidityActionButton.tsx

interface LiquidityActionButtonProps {
  // ... existing props
  onSubmit?: () => void;
  formId?: string; // For Server Actions
  disabled?: boolean;
}

export function LiquidityActionButton({
  onSubmit,
  formId,
  disabled,
  // ... other props
}: LiquidityActionButtonProps) {
  const handleClick = () => {
    if (formId) {
      // Trigger form submission for Server Actions
      const form = document.getElementById(formId) as HTMLFormElement;
      form?.requestSubmit();
    } else if (onSubmit) {
      // Use existing callback
      onSubmit();
    }
  };

  return (
    <button
      type={formId ? "submit" : "button"}
      form={formId}
      onClick={handleClick}
      disabled={disabled}
      // ... other props
    >
      {/* Button content */}
    </button>
  );
}
```

### Step 4: Update Form Validation

Enhance the existing form validation to work with Server Actions:

```typescript
// Create /apps/web/src/app/[lang]/liquidity/_schemas/liquidityForm.schema.ts
import { z } from "zod";

export const liquidityFormSchema = z.object({
  tokenAAmount: z.string().min(1, "Token A amount is required"),
  tokenBAmount: z.string().min(1, "Token B amount is required"),
  tokenAAddress: z.string().min(1, "Token A address is required"),
  tokenBAddress: z.string().min(1, "Token B address is required"),
  slippage: z.string().optional().default("0.5"),
  userAddress: z.string().min(1, "User address is required"),
});

export type LiquidityFormData = z.infer<typeof liquidityFormSchema>;
```

### Step 5: Testing

1. **Unit Tests for Server Actions**
   ```typescript
   // /apps/web/src/app/[lang]/liquidity/_actions/__tests__/submitLiquidityAction.test.ts
   import { submitLiquidityAction } from "../submitLiquidityAction";

   describe("submitLiquidityAction", () => {
     it("should validate form data", async () => {
       const formData = new FormData();
       formData.set("tokenAAmount", "100");
       formData.set("tokenBAmount", "200");
       // ... set other required fields

       const result = await submitLiquidityAction({ success: false }, formData);
       expect(result.success).toBe(true);
     });

     it("should handle validation errors", async () => {
       const formData = new FormData();
       // Missing required fields

       const result = await submitLiquidityAction({ success: false }, formData);
       expect(result.success).toBe(false);
       expect(result.fieldErrors).toBeDefined();
     });
   });
   ```

2. **Integration Tests**
   ```typescript
   // Test both client-side and server-side flows
   describe("Liquidity Form Integration", () => {
     it("should work with JavaScript disabled", async () => {
       // Test server-only flow
     });

     it("should work with JavaScript enabled", async () => {
       // Test enhanced flow
     });
   });
   ```

### Step 6: Performance Monitoring

Add monitoring to compare performance between approaches:

```typescript
// /apps/web/src/app/[lang]/liquidity/_utils/performanceMonitoring.ts
export const trackFormSubmission = (
  method: 'client' | 'server',
  duration: number,
  success: boolean
) => {
  // Send metrics to your analytics service
  analytics.track('liquidity_form_submission', {
    method,
    duration,
    success,
    timestamp: Date.now(),
  });
};
```

## Environment Setup

### Development

```bash
# Add environment variables for feature flags
echo "NEXT_PUBLIC_USE_SERVER_ACTIONS=true" >> .env.local
```

### Production Rollout

1. **Phase 1: Internal Testing**
   ```env
   NEXT_PUBLIC_USE_SERVER_ACTIONS=false
   NEXT_PUBLIC_SERVER_ACTIONS_BETA=true
   ```

2. **Phase 2: Gradual Rollout**
   ```env
   NEXT_PUBLIC_USE_SERVER_ACTIONS=true
   NEXT_PUBLIC_SERVER_ACTIONS_PERCENTAGE=10
   ```

3. **Phase 3: Full Rollout**
   ```env
   NEXT_PUBLIC_USE_SERVER_ACTIONS=true
   ```

## Rollback Plan

If issues are discovered, quickly rollback using the feature flag:

```bash
# Emergency rollback
kubectl set env deployment/dex-web NEXT_PUBLIC_USE_SERVER_ACTIONS=false
```

## Validation Checklist

Before going live, ensure:

- [ ] Server Actions work without JavaScript
- [ ] Client-side enhancements work with JavaScript
- [ ] Form validation works on both client and server
- [ ] Error handling is comprehensive
- [ ] Performance is equal or better
- [ ] Accessibility is maintained or improved
- [ ] All existing tests pass
- [ ] New tests cover Server Actions
- [ ] Monitoring is in place
- [ ] Rollback plan is tested

## Common Issues and Solutions

### Issue 1: TypeScript Errors

**Problem**: Type mismatches between client and server
**Solution**: Ensure shared types are properly exported

```typescript
// /libs/orpc/src/index.ts
export type { CreateLiquidityTransactionInput } from "./schemas";
```

### Issue 2: Form Data Not Persisting

**Problem**: Form resets on Server Action submission
**Solution**: Use hidden inputs and proper state management

```typescript
// Add hidden inputs for all form state
<input type="hidden" name="tokenAAddress" value={tokenAAddress || ""} />
```

### Issue 3: Client-Side State Out of Sync

**Problem**: Client state doesn't reflect server changes
**Solution**: Use optimistic updates and proper state synchronization

```typescript
// Update client state after successful Server Action
useEffect(() => {
  if (state.success) {
    form.setFieldValue("tokenAAmount", "0");
    form.setFieldValue("tokenBAmount", "0");
  }
}, [state.success]);
```

### Issue 4: Progressive Enhancement Not Working

**Problem**: JavaScript detection issues
**Solution**: Use proper hydration detection

```typescript
const [isHydrated, setIsHydrated] = useState(false);

useEffect(() => {
  setIsHydrated(true);
}, []);

// Use isHydrated instead of checking for window
```

## Next Steps

After successful migration:

1. **Monitor Performance**: Track Core Web Vitals improvements
2. **Gather Feedback**: Collect user feedback on the enhanced experience
3. **Optimize Further**: Implement additional Server Action features
4. **Expand Usage**: Apply pattern to other forms in the application
5. **Documentation**: Update team documentation with new patterns

## Support

For questions about this migration:

1. Review the implementation examples in `/apps/web/src/app/[lang]/liquidity/_examples/`
2. Check the comprehensive documentation in `/docs/server-actions-orpc-integration.md`
3. Run the test suite to verify functionality
4. Contact the development team for assistance