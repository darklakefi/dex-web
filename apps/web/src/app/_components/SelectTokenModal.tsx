"use client";

import { tanstackClient } from "@dex-web/orpc";
import { getTokensInputSchema } from "@dex-web/orpc/schemas";
import { Box, Button, Modal, TextInput } from "@dex-web/ui";
import { pasteFromClipboard, useDebouncedValue } from "@dex-web/utils";
import {
  type AnyFieldApi,
  createFormHook,
  createFormHookContexts,
  useStore,
} from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createSerializer, useQueryStates } from "nuqs";
import { Suspense } from "react";
import { selectedTokensParsers } from "../_utils/searchParams";
import { TokenList } from "../[lang]/(swap)/_components/TokenList";
import { NoResultFound } from "./NoResultFound";

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

const allowUnknownTokenReturnUrls = ["liquidity"];

const serialize = createSerializer(selectedTokensParsers);

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
  returnUrl: string;
  allowList?: string[];
}

export function SelectTokenModal({
  type,
  returnUrl = "",
  allowList,
}: SelectTokenModalProps) {
  const t = useTranslations("tokens");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const handleClose = () => {
    const from = searchParams.get("from");
    if (from) {
      router.push(from);
      return;
    }
    router.back();
  };

  const handleSelect = (
    selectedTokenAddress: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();

    const currentFrom = searchParams.get("from");
    const baseReturn = currentFrom || `/${returnUrl}`;

    if (type === "buy") {
      const sellAddress =
        selectedTokenAddress === tokenBAddress ? tokenAAddress : tokenBAddress;
      const urlWithParams = serialize(baseReturn, {
        tokenAAddress: selectedTokenAddress,
        tokenBAddress: sellAddress,
      });
      router.push(urlWithParams);
    } else {
      const buyAddress =
        selectedTokenAddress === tokenAAddress ? tokenBAddress : tokenAAddress;
      const urlWithParams = serialize(baseReturn, {
        tokenAAddress: buyAddress,
        tokenBAddress: selectedTokenAddress,
      });
      router.push(urlWithParams);
    }
  };

  const form = useAppForm(formConfig);

  const rawQuery = useStore(form.store, (state) => state.values.query);
  const isInitialLoad = rawQuery === "";

  const debouncedQuery = useDebouncedValue(rawQuery, isInitialLoad ? 0 : 300);

  const { data } = useSuspenseQuery(
    tanstackClient.tokens.getTokens.queryOptions({
      input: {
        allowList,
        limit: 8,
        offset: 0,
        query: debouncedQuery,
      },
    }),
  );

  const handlePaste = (field: AnyFieldApi) => {
    pasteFromClipboard((pasted: string) => {
      field.handleChange(pasted.trim());
    });
  };

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
              placeholder={t("searchPlaceholder")}
              value={field.state.value}
            />
          )}
        </form.Field>
        <Suspense
          fallback={<div className="h-32 animate-pulse rounded bg-green-600" />}
        >
          {data.tokens.length > 0 ? (
            <TokenList onSelect={handleSelect} tokens={data.tokens} />
          ) : (
            <NoResultFound
              allowUnknownTokens={allowUnknownTokenReturnUrls.includes(
                returnUrl,
              )}
              className="py-20"
              handleSelect={handleSelect}
              search={debouncedQuery}
            />
          )}
        </Suspense>
      </Box>
    </Modal>
  );
}
