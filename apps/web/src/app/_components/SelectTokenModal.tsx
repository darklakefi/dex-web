"use client";

import type { Token } from "@dex-web/orpc/schemas/index";
import { Box, Button, Modal, TextInput } from "@dex-web/ui";
import { pasteFromClipboard } from "@dex-web/utils";
import {
  type AnyFieldApi,
  createFormHook,
  createFormHookContexts,
  useStore,
} from "@tanstack/react-form";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useRouter, useSearchParams } from "next/navigation";
import { createSerializer, useQueryStates } from "nuqs";
import { Suspense, useCallback } from "react";
import * as z from "zod";
import { selectedTokensParsers } from "../_utils/searchParams";
import { TokenSelectorContent } from "./_hooks/TokenSelectorContent";
import { useRecentTokens } from "./_hooks/useRecentTokens";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldComponents: { TextInput },
  fieldContext,
  formComponents: {},
  formContext,
});

const serializeTokens = createSerializer(selectedTokensParsers);

interface SelectTokenModalProps {
  type: "buy" | "sell";
}

export function SelectTokenModal({ type }: SelectTokenModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );
  const { recentTokens, addRecentToken } = useRecentTokens();

  const handleClose = useCallback(() => router.back(), [router]);

  const from = searchParams.get("from") || "/";
  const allowUnknownTokens = from.includes("liquidity");

  const handleSelectToken = useCallback(
    (token: Token, e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      addRecentToken(token);

      const selectedAddress = token.address;
      const [newTokenA, newTokenB] =
        type === "buy"
          ? [
              selectedAddress,
              selectedAddress === tokenBAddress ? tokenAAddress : tokenBAddress,
            ]
          : [
              selectedAddress === tokenAAddress ? tokenBAddress : tokenAAddress,
              selectedAddress,
            ];

      const targetURL = serializeTokens(from, {
        tokenAAddress: newTokenA,
        tokenBAddress: newTokenB,
      });

      router.replace(targetURL as never);
    },
    [addRecentToken, type, tokenAAddress, tokenBAddress, from, router],
  );

  const form = useAppForm({
    defaultValues: { query: "" },
    onSubmit: () => {},
    validators: {
      onBlur: ({ value }: { value: { query: string } }) =>
        z.object({ query: z.string().default("") }).parse(value),
    },
  });

  const query = useStore(form.store, (state) => state.values.query);
  const [debouncedQuery] = useDebouncedValue(query, {
    wait: query === "" ? 0 : 300,
  });

  const handlePaste = useCallback((field: AnyFieldApi) => {
    pasteFromClipboard((pasted: string) => field.handleChange(pasted.trim()));
  }, []);

  return (
    <Modal onClose={handleClose}>
      <Button
        className="absolute top-5 right-5 cursor-pointer p-2.5 md:top-7 md:right-6 xl:right-10"
        icon="times"
        onClick={handleClose}
        variant="secondary"
      />
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
          <TokenSelectorContent
            allowUnknownTokens={allowUnknownTokens}
            debouncedQuery={debouncedQuery}
            isInitialLoad={query === ""}
            onSelectToken={handleSelectToken}
            recentTokens={recentTokens}
          />
        </Suspense>
      </Box>
    </Modal>
  );
}
