# SelectTokenModal Performance Optimizations

## Overview
This document outlines the performance optimizations applied to the SelectTokenModal component and related data fetching logic using TanStack Query best practices.

## Key Optimizations

### 1. **Query Configuration with Proper Cache Times**
- **staleTime**: Configures how long data is considered fresh
- **gcTime**: Configures how long unused data stays in cache

```typescript
// Token lists (frequently changing)
staleTime: 2 * 60 * 1000    // 2 minutes
gcTime: 5 * 60 * 1000        // 5 minutes

// Search results (deterministic, can cache longer)
staleTime: 5 * 60 * 1000     // 5 minutes
gcTime: 10 * 60 * 1000       // 10 minutes

// Token metadata (rarely changes)
staleTime: 10 * 60 * 1000    // 10 minutes
gcTime: 30 * 60 * 1000       // 30 minutes

// Owner validation (static data)
staleTime: 30 * 60 * 1000    // 30 minutes
gcTime: 60 * 60 * 1000       // 1 hour
```

**Benefits**:
- Reduces unnecessary network requests
- Improves perceived performance
- Maintains data freshness where it matters

### 2. **Prefetching Popular Searches**
```typescript
useEffect(() => {
  const popularSearches = ["SOL", "USDC", "USDT"];
  popularSearches.forEach((searchTerm) => {
    queryClient.prefetchQuery(/* ... */);
  });
}, [queryClient]);
```

**Benefits**:
- Instant results for common searches
- Utilizes idle time effectively
- Improves user experience for popular tokens

### 3. **Predictive Prefetching**
```typescript
useEffect(() => {
  if (rawQuery.length >= 2 && rawQuery.length < 10) {
    const timer = setTimeout(() => {
      queryClient.prefetchQuery(/* ... */);
    }, 100);
    return () => clearTimeout(timer);
  }
}, [rawQuery, queryClient]);
```

**Benefits**:
- Anticipates user needs
- Reduces perceived latency
- Smooth typing experience

### 4. **PlaceholderData for Smooth Transitions**
```typescript
placeholderData: (previousData) => previousData
```

**Benefits**:
- Keeps previous results visible while loading new ones
- Eliminates loading flickers
- Provides better visual continuity
- Combined with opacity transition for visual feedback

### 5. **Memoization of Expensive Computations**

#### Component-level Memoization
```typescript
const queryInput = useMemo(
  () => ({
    limit: 8,
    offset: 0,
    onlyWithPools: false,
    query: debouncedQuery,
  }),
  [debouncedQuery],
);
```

#### Callback Memoization
```typescript
const handleSelectToken = useCallback(
  (selectedToken: Token, e: React.MouseEvent<HTMLButtonElement>) => {
    // ... handler logic
  },
  [/* dependencies */],
);
```

**Benefits**:
- Prevents unnecessary re-renders
- Maintains referential equality
- Reduces React reconciliation work

### 6. **React.memo for TokenList Component**
```typescript
export const TokenList = memo(TokenListComponent, (prevProps, nextProps) => {
  // Custom comparison logic
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.onSelect !== nextProps.onSelect) return false;
  if (prevProps.tokens.length !== nextProps.tokens.length) return false;
  
  // Shallow comparison of token addresses
  for (let i = 0; i < prevProps.tokens.length; i++) {
    if (prevProps.tokens[i].address !== nextProps.tokens[i].address) {
      return false;
    }
  }
  
  return true;
});
```

**Benefits**:
- Prevents re-rendering when props haven't meaningfully changed
- Reduces DOM operations
- Improves list rendering performance

### 7. **Conditional Query Execution (NoResultFound)**
```typescript
const shouldQueryOwner = allowUnknownTokens && isValidSolanaAddress(search);

const { data: tokenOwner } = useQuery({
  ...queryOptions,
  enabled: shouldQueryOwner,  // Only query when needed
  // ... optimized cache config
});
```

**Benefits**:
- Eliminates unnecessary API calls
- Reduces bandwidth usage
- Improves performance when unknown tokens aren't allowed

### 8. **Optimized Debounce Timing**
```typescript
const debouncedQuery = useDebouncedValue(
  rawQuery, 
  isInitialLoad ? 0 : 300  // Instant on initial load, 300ms delay when typing
);
```

**Benefits**:
- Immediate results on initial load
- Reduces query spam during typing
- Balances responsiveness with efficiency

### 9. **Centralized Query Key Factory**
```typescript
export const tokenQueryKeys = {
  all: ["tokens"] as const,
  lists: () => [...tokenQueryKeys.all, "list"] as const,
  list: (filters) => [...tokenQueryKeys.lists(), filters] as const,
  // ... more keys
};
```

**Benefits**:
- Type-safe query keys
- Consistent cache management
- Easier cache invalidation
- Better debugging

## Performance Metrics Expected

### Before Optimizations
- Initial load: ~500ms
- Search query: ~300-400ms per keystroke
- Repeated searches: Full network round trip
- Re-renders: Frequent, unoptimized

### After Optimizations
- Initial load: ~200ms (cached after first load)
- Search query: ~100-150ms (debounced + cached)
- Repeated searches: Instant (from cache)
- Re-renders: Minimized via memoization
- Popular tokens: Instant (prefetched)

## Best Practices Applied

1. ✅ **Optimize staleTime over gcTime**: Data stays fresh longer, reducing refetches
2. ✅ **Use placeholderData**: Smooth UX during transitions
3. ✅ **Prefetch predictably**: Anticipate user needs
4. ✅ **Memoize callbacks**: Prevent unnecessary re-renders
5. ✅ **Conditional queries**: Only fetch when needed
6. ✅ **Component memoization**: Reduce reconciliation work
7. ✅ **Centralized query keys**: Better cache management
8. ✅ **Proper debouncing**: Balance responsiveness and efficiency

## Files Modified

- `apps/web/src/app/_components/SelectTokenModal.tsx`
- `apps/web/src/app/_components/NoResultFound.tsx`
- `apps/web/src/app/[lang]/(swap)/_components/TokenList.tsx`
- `apps/web/src/hooks/useTokenSearch.ts` (new)
- `libs/orpc/src/lib/queryKeys.ts` (new)
- `libs/orpc/src/index.ts`

## Testing Recommendations

1. Test with slow network conditions (3G throttling)
2. Verify cache behavior with React Query DevTools
3. Monitor re-renders with React DevTools Profiler
4. Test search responsiveness with rapid typing
5. Verify prefetching is working for popular tokens
6. Test placeholder data transitions

## Future Improvements

1. **Infinite scroll**: Load more tokens as user scrolls
2. **Virtual scrolling**: For large token lists
3. **Image lazy loading**: Defer off-screen token images
4. **Request deduplication**: At the global level
5. **Service Worker caching**: For offline support
