"use client";

import { tanstackClient } from "@dex-web/orpc";
import { getTokensInputSchema } from "@dex-web/orpc/schemas";
import { Box, Button, Modal, NoResultFound, TextInput } from "@dex-web/ui";
import { pasteFromClipboard, useDebouncedValue } from "@dex-web/utils";
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
import { selectedTokensParsers } from "../_utils/searchParams";
import { TokenList } from "../[lang]/(swap)/_components/TokenList";

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

  const [{ buyTokenAddress, sellTokenAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const handleClose = () => {
    router.push(
      `/?sellTokenAddress=${sellTokenAddress}&buyTokenAddress=${buyTokenAddress}`,
    );
  };

  const handleSelect = (
    selectedTokenAddress: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    if (type === "buy") {
      const sellAddress =
        selectedTokenAddress === sellTokenAddress
          ? buyTokenAddress
          : sellTokenAddress;
      router.push(
        `/?sellTokenAddress=${sellAddress}&buyTokenAddress=${selectedTokenAddress}`,
      );
    } else {
      const buyAddress =
        selectedTokenAddress === buyTokenAddress
          ? sellTokenAddress
          : buyTokenAddress;
      router.push(
        `/?sellTokenAddress=${selectedTokenAddress}&buyTokenAddress=${buyAddress}`,
      );
    }
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
    <Modal onClose={handleClose}>
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
          {data.tokens.length > 0 ? (
            <TokenList onSelect={handleSelect} tokens={data.tokens} />
          ) : (
            <NoResultFound className="py-20" search={debouncedQuery} />
          )}
        </Suspense>
      </Box>
    </Modal>
  );
}
