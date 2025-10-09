"use client";

import type { Token } from "@dex-web/orpc/schemas/index";
import { Box, Button, Modal, TextInput } from "@dex-web/ui";
import { pasteFromClipboard, useDebouncedValue } from "@dex-web/utils";
import {
  type AnyFieldApi,
  createFormHook,
  createFormHookContexts,
  useStore,
} from "@tanstack/react-form";
import { useRouter, useSearchParams } from "next/navigation";
import { createSerializer, useQueryStates } from "nuqs";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as z from "zod";
import { logger } from "../../utils/logger";
import { selectedTokensParsers } from "../_utils/searchParams";
import { TokenSelectorContent } from "./_hooks/TokenSelectorContent";
import { useRecentTokens } from "./_hooks/useRecentTokens";
import { useTokenPrefetching } from "./_hooks/useTokenPrefetching";

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

  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const [isClosing, setIsClosing] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);

    setTimeout(() => {
      const from = searchParams.get("from");
      if (from) {
        router.replace(from as never);
        return;
      }
      router.back();
    }, 0);
  }, [searchParams, router]);

  const { recentTokens, addRecentToken } = useRecentTokens();

  const handleSelectToken = useCallback(
    (selectedToken: Token, e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      const currentFrom = searchParams.get("from");
      const baseReturn = currentFrom || `/${returnUrl}`;
      const selectedTokenAddress = selectedToken.address;
      addRecentToken(selectedToken);

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
      addRecentToken,
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

  useTokenPrefetching(rawQuery, isClosing);

  useEffect(() => {
    const handleScroll = () => {
      setShowSearchBar(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setShowSearchBar(false);
      }, 2000);
    };

    const modalContent = modalContentRef.current;
    if (modalContent) {
      const scrollableElements = modalContent.querySelectorAll(
        '[class*="overflow-y-auto"]',
      );

      scrollableElements.forEach((element) => {
        element.addEventListener("scroll", handleScroll, { passive: true });
      });

      return () => {
        scrollableElements.forEach((element) => {
          element.removeEventListener("scroll", handleScroll);
        });
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, []);

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
      <Box
        className="flex max-h-full w-full max-w-sm drop-shadow-xl"
        ref={modalContentRef}
      >
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showSearchBar
              ? "mb-4 max-h-32 opacity-100"
              : "mb-0 max-h-0 opacity-0"
          }`}
        >
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
        </div>
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
