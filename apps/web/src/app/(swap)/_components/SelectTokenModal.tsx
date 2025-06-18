"use client";

import { getTokensInputSchema, tanstackClient } from "@dex-web/orpc";
import { Box, Button, Modal, TextInput } from "@dex-web/ui";
import { useDebouncedValue } from "@dex-web/utils";
import {
  createFormHook,
  createFormHookContexts,
  useStore,
} from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
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

interface SelectTokenModalProps {
  type: "buy" | "sell";
}

export function SelectTokenModal({ type }: SelectTokenModalProps) {
  const router = useRouter();

  const [{ buyTokenAddress, sellTokenAddress }, setSelectedTokens] =
    useQueryStates(selectedTokensParsers);

  const handleSelect = (tokenAddress: string) => {
    if (type === "buy") {
      setSelectedTokens({
        buyTokenAddress: tokenAddress,
        sellTokenAddress: sellTokenAddress,
      });
    } else {
      setSelectedTokens({
        buyTokenAddress: buyTokenAddress,
        sellTokenAddress: tokenAddress,
      });
    }
    router.push("/");
  };

  const form = useAppForm({
    defaultValues: {
      query: "",
    },
    onSubmit: ({ value }) => {
      alert(JSON.stringify(value, null, 2));
    },
    validators: {
      onChange: ({ value }) => selectTokenModalFormSchema.parse(value),
    },
  });

  const rawQuery = useStore(form.store, (state) => state.values.query);
  const debouncedQuery = useDebouncedValue(rawQuery, 300);

  const { data } = useSuspenseQuery(
    tanstackClient.getTokens.queryOptions({
      input: {
        limit: 8,
        offset: 0,
        query: debouncedQuery,
      },
    }),
  );

  return (
    <Modal onClose={() => router.push("/")}>
      <Box className="flex max-h-full w-full max-w-sm drop-shadow-xl">
        <form.Field name="query">
          {(field) => (
            <TextInput
              autoFocus
              className="shrink-0"
              label={
                <>
                  Search Token or <Button variant="secondary">Paste</Button>{" "}
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
        <TokenList onSelect={handleSelect} tokens={data.tokens} />
      </Box>
    </Modal>
  );
}
