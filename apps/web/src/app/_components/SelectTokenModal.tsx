"use client";

import { QUERY_CONFIG, tanstackClient } from "@dex-web/orpc";
import {
  getTokensWithPoolsInputSchema,
  type Token,
} from "@dex-web/orpc/schemas/index";
import { Box, Button, Modal, TextInput } from "@dex-web/ui";
import { pasteFromClipboard, useDebouncedValue } from "@dex-web/utils";
import {
  type AnyFieldApi,
  createFormHook,
  createFormHookContexts,
  useStore,
} from "@tanstack/react-form";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { createSerializer, useQueryStates } from "nuqs";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useLocalStorageState from "use-local-storage-state";
import { useWalletPublicKey } from "../../hooks/useWalletCache";
import { logger } from "../../utils/logger";
import { selectedTokensParsers } from "../_utils/searchParams";
import { TokenList } from "../[lang]/(swap)/_components/TokenList";
import { NoResultFound } from "./NoResultFound";

const selectTokenModalFormSchema = getTokensWithPoolsInputSchema.pick({
  query: true,
});

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldComponents: {
    TextInput,
  },

  fieldContext,
  formComponents: {},
  formContext,
});

const allowUnknownTokenReturnUrls = ["liquidity"];

const serialize = createSerializer(selectedTokensParsers);

const formConfig = {
  defaultValues: {
    query: "",
  },
  onSubmit: ({ value }: { value: { query: string } }) => {
    logger.log(value);
  },
  validators: {
    onBlur: ({ value }: { value: { query: string } }) =>
      selectTokenModalFormSchema.parse(value),
  },
};

interface SelectTokenModalProps {
  type: "buy" | "sell";
  returnUrl: string;
}

export function SelectTokenModal({
  type,
  returnUrl = "",
}: SelectTokenModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: publicKey } = useWalletPublicKey();
  const connectedWalletAddress: string = publicKey?.toBase58() ?? "";

  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    // Immediate visual feedback
    setIsClosing(true);

    // Defer navigation to next tick to allow React to update
    setTimeout(() => {
      const from = searchParams.get("from");
      if (from) {
        router.replace(from as never);
        return;
      }
      router.back();
    }, 0);
  }, [searchParams, router]);

  const [searchedTokens, setSearchedTokens] = useLocalStorageState<{
    [key: string]: Token[];
  }>("tokenSearched", {
    defaultValue: {},
  });

  const walletRecentSearches = searchedTokens[connectedWalletAddress] ?? [];

  const setRecentSearches = useCallback(
    (token: Token) => {
      if (connectedWalletAddress) {
        const currentSearches = searchedTokens[connectedWalletAddress] || [];
        const updatedSearches = [
          token,
          ...currentSearches.filter((t) => t.address !== token.address),
        ].slice(0, 10);
        setSearchedTokens({
          ...searchedTokens,
          [connectedWalletAddress]: updatedSearches,
        });
      }
    },
    [connectedWalletAddress, searchedTokens, setSearchedTokens],
  );

  // Memoize callbacks to prevent unnecessary re-renders
  const handleSelectToken = useCallback(
    (selectedToken: Token, e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      const currentFrom = searchParams.get("from");
      const baseReturn = currentFrom || `/${returnUrl}`;
      const selectedTokenAddress = selectedToken.address;
      setRecentSearches(selectedToken);

      if (type === "buy") {
        const sellAddress =
          selectedTokenAddress === tokenBAddress
            ? tokenAAddress
            : tokenBAddress;

        const urlWithParams = serialize(baseReturn, {
          tokenAAddress: selectedTokenAddress,
          tokenBAddress: sellAddress,
        });

        router.push(urlWithParams as never);
      } else {
        const buyAddress =
          selectedTokenAddress === tokenAAddress
            ? tokenBAddress
            : tokenAAddress;

        const urlWithParams = serialize(baseReturn, {
          tokenAAddress: buyAddress,
          tokenBAddress: selectedTokenAddress,
        });

        router.push(urlWithParams as never);
      }
    },
    [
      searchParams,
      returnUrl,
      setRecentSearches,
      type,
      tokenBAddress,
      tokenAAddress,
      router,
    ],
  );

  const form = useAppForm(formConfig);

  const rawQuery = useStore(form.store, (state) => state.values.query);
  const isInitialLoad = rawQuery === "";

  const debouncedQuery = useDebouncedValue(rawQuery, isInitialLoad ? 0 : 300);
  const queryClient = useQueryClient();

  // Memoize query input to prevent unnecessary re-renders
  const queryInput = useMemo(
    () => ({
      limit: 8,
      offset: 0,
      onlyWithPools: false,
      query: debouncedQuery,
    }),
    [debouncedQuery],
  );

  // Main query with optimized configuration
  const { data } = useSuspenseQuery({
    ...tanstackClient.tokens.getTokensWithPools.queryOptions({
      input: queryInput,
    }),
    gcTime: debouncedQuery
      ? QUERY_CONFIG.tokenSearch.gcTime
      : QUERY_CONFIG.tokens.gcTime,
    staleTime: debouncedQuery
      ? QUERY_CONFIG.tokenSearch.staleTime
      : QUERY_CONFIG.tokens.staleTime,
  });

  // Prefetch popular tokens on mount for instant results
  useEffect(() => {
    if (isClosing) return; // Skip if closing

    const popularSearches = ["SOL", "USDC", "USDT"];
    popularSearches.forEach((searchTerm) => {
      queryClient.prefetchQuery(
        tanstackClient.tokens.getTokensWithPools.queryOptions({
          input: {
            limit: 8,
            offset: 0,
            onlyWithPools: false,
            query: searchTerm,
          },
        }),
      );
    });
  }, [queryClient, isClosing]);

  // Prefetch next likely query as user types (predictive prefetching)
  const prefetchTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Clear any existing timer
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current);
    }

    // Skip if closing
    if (isClosing) return;

    if (rawQuery.length >= 2 && rawQuery.length < 10) {
      prefetchTimerRef.current = setTimeout(() => {
        // Prefetch with the current partial query
        queryClient.prefetchQuery(
          tanstackClient.tokens.getTokensWithPools.queryOptions({
            input: {
              limit: 8,
              offset: 0,
              onlyWithPools: false,
              query: rawQuery,
            },
          }),
        );
      }, 100);
    }

    // Cleanup on unmount
    return () => {
      if (prefetchTimerRef.current) {
        clearTimeout(prefetchTimerRef.current);
      }
    };
  }, [rawQuery, queryClient, isClosing]);

  const handlePaste = useCallback((field: AnyFieldApi) => {
    pasteFromClipboard((pasted: string) => {
      field.handleChange(pasted.trim());
    });
  }, []);

  // Early return if closing to prevent unnecessary renders
  if (isClosing) {
    return null;
  }

  return (
    <Modal onClose={handleClose}>
      <Button
        className="absolute top-5 right-5 cursor-pointer p-2.5 md:top-7 md:right-6 xl:right-10"
        icon="times"
        onClick={handleClose}
        variant="secondary"
      ></Button>
      <Box className="flex max-h-full w-full max-w-sm drop-shadow-xl">
        <form.Field name="query">
          {(field) => (
            <TextInput
              autoFocus
              className="shrink-0"
              label={
                <>
                  Search Token or{" "}
                  <Button
                    className="cursor-pointer"
                    onClick={() => handlePaste(field)}
                    variant="secondary"
                  >
                    Paste
                  </Button>{" "}
                  Address
                </>
              }
              leadingIcon="search"
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Search for a token"
              value={field.state.value}
            />
          )}
        </form.Field>
        <Suspense
          fallback={<div className="h-32 animate-pulse rounded bg-green-600" />}
        >
          {isInitialLoad && (
            <>
              {walletRecentSearches.length > 0 && (
                <TokenList
                  onSelect={handleSelectToken}
                  title="Recently Searches"
                  tokens={walletRecentSearches}
                />
              )}
              <TokenList
                onSelect={handleSelectToken}
                title="tokens by 24h volume"
                tokens={data.tokens}
              />
            </>
          )}

          {!isInitialLoad ? (
            data.tokens.length > 0 ? (
              <TokenList onSelect={handleSelectToken} tokens={data.tokens} />
            ) : (
              <NoResultFound
                allowUnknownTokens={allowUnknownTokenReturnUrls.includes(
                  returnUrl,
                )}
                className="py-20"
                handleSelect={handleSelectToken}
                search={debouncedQuery}
              />
            )
          ) : null}
        </Suspense>
      </Box>
    </Modal>
  );
}
