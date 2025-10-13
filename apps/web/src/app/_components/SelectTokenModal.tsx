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
import { useQueryStates } from "nuqs";
import { Suspense, useCallback, useState } from "react";
import * as z from "zod";
import { selectedTokensParsers } from "../_utils/searchParams";
import { TokenSelectorContent } from "./_hooks/TokenSelectorContent";
import { useRecentTokens } from "./_hooks/useRecentTokens";

const selectTokenModalFormSchema = z.object({
  query: z.string().default(""),
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
  onSubmit: () => {},
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

  const [{ tokenAAddress, tokenBAddress }, setTokens] = useQueryStates(
    selectedTokensParsers,
  );

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);

    setTimeout(() => {
      const from = searchParams.get("from");
      if (from) {
        router.replace(from as never);
        return;
      }

      const fallbackUrl = returnUrl ? `/${returnUrl}` : "/";
      router.replace(fallbackUrl as never);
    }, 0);
  }, [searchParams, router, returnUrl]);

  const { recentTokens, addRecentToken } = useRecentTokens();

  const handleSelectToken = useCallback(
    async (selectedToken: Token, e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      const selectedTokenAddress = selectedToken.address;
      addRecentToken(selectedToken);

      if (type === "buy") {
        const sellAddress =
          selectedTokenAddress === tokenBAddress
            ? tokenAAddress
            : tokenBAddress;

        await setTokens({
          tokenAAddress: selectedTokenAddress,
          tokenBAddress: sellAddress,
        });
      } else {
        const buyAddress =
          selectedTokenAddress === tokenAAddress
            ? tokenBAddress
            : tokenAAddress;

        await setTokens({
          tokenAAddress: buyAddress,
          tokenBAddress: selectedTokenAddress,
        });
      }

      handleClose();
    },
    [
      addRecentToken,
      type,
      tokenBAddress,
      tokenAAddress,
      setTokens,
      handleClose,
    ],
  );

  const form = useAppForm(formConfig);

  const rawQuery = useStore(form.store, (state) => state.values.query);
  const isInitialLoad = rawQuery === "";

  const [debouncedQuery] = useDebouncedValue(rawQuery, {
    wait: isInitialLoad ? 0 : 300,
  });

  const handlePaste = useCallback((field: AnyFieldApi) => {
    pasteFromClipboard((pasted: string) => {
      field.handleChange(pasted.trim());
    });
  }, []);

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
          <TokenSelectorContent
            debouncedQuery={debouncedQuery}
            isInitialLoad={isInitialLoad}
            onSelectToken={handleSelectToken}
            recentTokens={recentTokens}
            returnUrl={returnUrl}
          />
        </Suspense>
      </Box>
    </Modal>
  );
}
