# Server Actions Integration with oRPC

## Overview

This document outlines the integration pattern between Next.js Server Actions and oRPC for the DEX Web application. The goal is to leverage the benefits of Server Actions while maintaining the existing oRPC architecture without duplication.

## Architecture

### Current State

- **oRPC Client**: Used for client-side API calls to liquidity procedures
- **Location**: `/libs/orpc/src/client.ts`
- **Usage**: Direct calls to `client.liquidity.createLiquidityTransaction`
- **Limitation**: Requires JavaScript, no progressive enhancement

### Enhanced Architecture

```
Client Form → Server Action → oRPC Server Client → Business Logic
     ↓              ↓              ↓                     ↓
Form Submission  Validation   Direct Procedure    Handler Functions
     ↓              ↓              ↓                     ↓
Progressive    Server-side     Type Safety        Existing Logic
Enhancement    Processing      Maintained         Preserved
```

## Key Components

### 1. Server Client (`/libs/orpc/src/serverClient.ts`)

A server-side client that bypasses HTTP and calls oRPC procedures directly:

```typescript
export const serverClient = createServerClient();

// Usage in Server Actions
const response = await serverClient.liquidity.createLiquidityTransaction(input);
```

**Benefits:**
- No HTTP overhead
- Direct procedure invocation
- Type-safe integration
- Reuses existing business logic

### 2. Server Actions (`/apps/web/src/app/[lang]/liquidity/_actions/submitLiquidityAction.ts`)

Server Actions that handle form processing and validation:

```typescript
export async function submitLiquidityAction(
  prevState: LiquidityFormState,
  formData: FormData
): Promise<LiquidityFormState>
```

**Features:**
- Server-side form validation with Zod
- Type-safe input/output handling
- Error handling and field-specific errors
- Progressive enhancement support

### 3. Enhanced Form Component (`/apps/web/src/app/[lang]/liquidity/_components/LiquidityFormEnhanced.tsx`)

A component that supports both client-side and server-side workflows:

```typescript
export function ProgressiveEnhancedLiquidityForm()
```

**Capabilities:**
- Detects JavaScript availability
- Falls back to server-only form when JS is disabled
- Optimistic updates for better UX
- Maintains compatibility with existing wallet integration

## Integration Benefits

### 1. Progressive Enhancement

- **Without JavaScript**: Basic form submission using Server Actions
- **With JavaScript**: Enhanced UX with optimistic updates and real-time validation
- **Graceful Degradation**: Core functionality works in all scenarios

### 2. Performance Improvements

- **Reduced Bundle Size**: Core form logic runs on server
- **Faster Initial Load**: Critical functionality available before JS hydration
- **Better Core Web Vitals**: Improved FCP and LCP scores

### 3. SEO and Accessibility

- **Search Engine Friendly**: Forms work without JavaScript
- **Screen Reader Compatible**: Standard HTML form elements
- **Better Accessibility**: Native form validation and error handling

### 4. Developer Experience

- **Type Safety**: Full TypeScript support throughout the chain
- **No Duplication**: Reuses existing oRPC procedures and handlers
- **Consistent API**: Same business logic for client and server

### 5. Security and Reliability

- **Server-side Validation**: Validation cannot be bypassed
- **Consistent State**: Server-side processing ensures data integrity
- **Error Handling**: Comprehensive error handling at each layer

## Implementation Strategy

### Phase 1: Core Infrastructure ✅

1. **Server Client Setup**
   - Created `/libs/orpc/src/serverClient.ts`
   - Direct procedure invocation without HTTP
   - Type-safe wrapper for existing oRPC procedures

2. **Server Actions Implementation**
   - Created `/apps/web/src/app/[lang]/liquidity/_actions/submitLiquidityAction.ts`
   - Form validation with Zod schemas
   - Error handling and state management

### Phase 2: Form Enhancement ✅

1. **Enhanced Components**
   - Created `/apps/web/src/app/[lang]/liquidity/_components/LiquidityFormEnhanced.tsx`
   - Progressive enhancement support
   - Optimistic updates for better UX

2. **Integration Points**
   - Server Action form submission
   - Client-side transaction signing
   - Seamless fallback mechanisms

### Phase 3: Additional Features (Planned)

1. **Real-time Validation**
   - Server-side field validation
   - Debounced validation requests
   - Client-side error display

2. **Enhanced Error Handling**
   - Field-specific error messages
   - Recovery suggestions
   - Retry mechanisms

3. **Caching Integration**
   - Server-side caching for validation
   - Optimistic cache updates
   - Cache invalidation strategies

## Usage Patterns

### Server Action Implementation

```typescript
const response = await serverClient.liquidity.createLiquidityTransaction({
  maxAmountX,
  maxAmountY,
  slippage: Number(slippage),
  tokenXMint: tokenXAddress,
  tokenYMint: tokenYAddress,
  user: publicKey.toBase58(),
});

return {
  success: response.success,
  transaction: response.transaction,
  error: response.error,
};
```

### Form Component Usage

```typescript
export function ProgressiveEnhancedLiquidityForm() {
  const [hasJS, setHasJS] = useState(false);

  useEffect(() => {
    setHasJS(true);
  }, []);

  return hasJS
    ? <LiquidityFormEnhanced />
    : <LiquidityFormServerOnly />;
}
```

### Error Handling

```typescript
const validationResult = liquidityFormSchema.safeParse(rawFormData);

if (!validationResult.success) {
  return {
    success: false,
    error: "Validation failed",
    fieldErrors: validationResult.error.flatten().fieldErrors,
  };
}
```

## Migration Strategy

### Gradual Adoption

1. **Keep Existing Implementation**: Current client-side flow remains unchanged
2. **Add Server Actions**: New Server Actions run alongside existing code
3. **Progressive Enhancement**: Forms work with and without JavaScript
4. **Feature Flagging**: Control rollout with feature flags

### Backwards Compatibility

- Existing components continue to work
- No breaking changes to current API
- Gradual migration path for each form
- Maintains all current functionality

### Testing Strategy

- Unit tests for Server Actions
- Integration tests for form submission flows
- E2E tests with and without JavaScript
- Performance testing for both paths

## Best Practices

### 1. Validation

- Always validate on the server side
- Use Zod schemas for consistent validation
- Provide clear, actionable error messages
- Handle edge cases gracefully

### 2. Error Handling

- Return structured error responses
- Include field-specific errors where applicable
- Log errors for debugging
- Provide recovery suggestions

### 3. Performance

- Use optimistic updates for better UX
- Minimize server round trips
- Cache validation results where appropriate
- Optimize for Core Web Vitals

### 4. Security

- Never trust client-side input
- Validate all parameters server-side
- Sanitize user input
- Use type-safe parsing

## Future Enhancements

### 1. Real-time Features

- WebSocket integration for live updates
- Real-time form validation
- Live price updates
- Transaction status streaming

### 2. Advanced Caching

- Edge caching for validation
- Optimistic cache updates
- Intelligent cache invalidation
- Offline support

### 3. Performance Optimizations

- Streaming Server Actions
- Parallel validation
- Background processing
- Smart bundling

## Conclusion

The Server Actions integration with oRPC provides a robust foundation for progressive enhancement while maintaining the benefits of the existing architecture. This approach:

- Enhances user experience across all JavaScript availability scenarios
- Improves performance and accessibility
- Maintains type safety and code reusability
- Provides a clear migration path for future development

The implementation balances modern web standards with practical considerations, ensuring that the application remains fast, accessible, and maintainable while leveraging the latest Next.js capabilities.