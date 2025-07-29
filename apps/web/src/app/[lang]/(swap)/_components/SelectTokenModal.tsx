"use client";

import { tanstackClient } from "@dex-web/orpc";
import { getTokensInputSchema, type Token } from "@dex-web/orpc/schemas";
import { Box, Button, Modal, NoResultFound, TextInput } from "@dex-web/ui";
import { pasteFromClipboard, useDebouncedValue } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  type AnyFieldApi,
  createFormHook,
  createFormHookContexts,
  useStore,
} from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { Suspense } from "react";
import useLocalStorageState from "use-local-storage-state";
import { getFirstConnectedWalletAdapter } from "../../../_utils/getFirstConnectedWalletAdapter";
import { getFirstConnectedWalletAddress } from "../../../_utils/getFirstConnectedWalletAddress";
import { selectedTokensParsers } from "../_utils/searchParams";
import { TokenList } from "./TokenList";

const selectTokenModalFormSchema = getTokensInputSchema.pick({
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

const formConfig = {
  defaultValues: {
    query: "",
  },
  onSubmit: ({ value }: { value: { query: string } }) => {
    console.log(value);
  },
  validators: {
    onChange: ({ value }: { value: { query: string } }) =>
      selectTokenModalFormSchema.parse(value),
  },
};

interface SelectTokenModalProps {
  type: "buy" | "sell";
}

export function SelectTokenModal({ type }: SelectTokenModalProps) {
  const router = useRouter();
  const { wallets } = useWallet();
  const firstConnectedWalletAdapter = getFirstConnectedWalletAdapter(wallets);
  const firstConnectedWalletAddress = firstConnectedWalletAdapter
    ? getFirstConnectedWalletAddress(firstConnectedWalletAdapter)
    : null;

  const [{ buyTokenAddress, sellTokenAddress }, setSelectedTokens] =
    useQueryStates(selectedTokensParsers);

  const [searchedTokens, setSearchedTokens] = useLocalStorageState<{
    [key: string]: Token[];
  }>("tokenSearched", {
    defaultValue: {},
  });

  const walletRecentSearches = firstConnectedWalletAddress
    ? (searchedTokens[firstConnectedWalletAddress] ?? [])
    : [];

  const setRecentSearches = (token: Token) => {
    if (firstConnectedWalletAddress) {
      const currentSearches = searchedTokens[firstConnectedWalletAddress] || [];
      const updatedSearches = [
        token,
        ...currentSearches.filter((t) => t.address !== token.address),
      ].slice(0, 10);
      setSearchedTokens({
        ...searchedTokens,
        [firstConnectedWalletAddress]: updatedSearches,
      });
    }
  };

  const handleCloseModal = () => {
    router.push("/");
  };

  const handleSelect = (token: Token) => {
    if (type === "buy") {
      setSelectedTokens({
        buyTokenAddress: token.address,
        sellTokenAddress: sellTokenAddress,
      });
    } else {
      setSelectedTokens({
        buyTokenAddress: buyTokenAddress,
        sellTokenAddress: token.address,
      });
    }
    setRecentSearches(token);
    handleCloseModal();
  };

  const form = useAppForm(formConfig);

  const rawQuery = useStore(form.store, (state) => state.values.query);
  const isInitialLoad = rawQuery === "";

  const debouncedQuery = useDebouncedValue(rawQuery, isInitialLoad ? 0 : 300);

  const { data } = useSuspenseQuery(
    tanstackClient.getTokens.queryOptions({
      input: {
        limit: 8,
        offset: 0,
        query: debouncedQuery,
      },
    }),
  );

  const handlePaste = (field: AnyFieldApi) => {
    pasteFromClipboard((pasted) => {
      field.handleChange(pasted.trim());
    });
  };

  return (
    <Modal onClose={handleCloseModal}>
      <Box className="flex max-h-[80%] w-full max-w-sm overflow-y-scroll drop-shadow-xl">
        <form.Field name="query">
          {(field) => (
            <TextInput
              autoFocus
              className="shrink-0"
              label={
                <>
                  Search Token or{" "}
                  <Button
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
                  onSelect={handleSelect}
                  title="Recently Searches"
                  tokens={walletRecentSearches}
                />
              )}
              <TokenList
                onSelect={handleSelect}
                title={"tokens by 24h volume"}
                tokens={data.tokens}
              />
            </>
          )}

          {!isInitialLoad ? (
            data.tokens.length > 0 ? (
              <TokenList onSelect={handleSelect} tokens={data.tokens} />
            ) : (
              <NoResultFound className="py-20" search={debouncedQuery} />
            )
          ) : null}
        </Suspense>
      </Box>
    </Modal>
  );
}
