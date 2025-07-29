"use client";

import { tanstackClient } from "@dex-web/orpc";
import { Box, Button, Text } from "@dex-web/ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { z } from "zod";
import { ConnectWalletButton } from "../../../_components/ConnectWalletButton";
import { getFirstConnectedWalletAdapter } from "../../../_utils/getFirstConnectedWalletAdapter";
import { getFirstConnectedWalletAddress } from "../../../_utils/getFirstConnectedWalletAddress";
import { toast } from "../../../_utils/toast";
import { selectedTokensParsers } from "../_utils/searchParams";
import { SelectTokenButton } from "./SelectTokenButton";
import { SwapButton } from "./SwapButton";
import { SwapFormFieldset } from "./SwapFormFieldset";

const MOCK_TRANSACTION_STATUS = "success";

export const { fieldContext, formContext } = createFormHookContexts();

const swapFormSchema = z.object({
  buy: z.object({
    amount: z.number().nonnegative(),
    token: z.string(),
  }),
  sell: z.object({
    amount: z.number().nonnegative(),
    token: z.string(),
  }),
});

type SwapFormSchema = z.infer<typeof swapFormSchema>;

const { useAppForm } = createFormHook({
  fieldComponents: {
    SwapFormFieldset,
  },

  fieldContext,
  formComponents: {},
  formContext,
});

export function SwapForm() {
  const [{ buyTokenAddress, sellTokenAddress }] = useQueryStates(
    selectedTokensParsers,
  );
  const { data: buyTokenDetails } = useSuspenseQuery(
    tanstackClient.getTokenDetails.queryOptions({
      input: { address: buyTokenAddress },
    }),
  );
  const { data: sellTokenDetails } = useSuspenseQuery(
    tanstackClient.getTokenDetails.queryOptions({
      input: { address: sellTokenAddress },
    }),
  );

  const formConfig = {
    defaultValues: {
      buy: {
        amount: 0,
        token: buyTokenDetails?.symbol as string,
      },
      sell: {
        amount: 0,
        token: sellTokenDetails?.symbol as string,
      },
    } satisfies SwapFormSchema,

    onSubmit: ({
      value,
    }: {
      value: {
        buy: {
          amount: number;
          token: string;
        };
        sell: {
          amount: number;
          token: string;
        };
      };
    }) => {
      if (MOCK_TRANSACTION_STATUS === "success") {
        toast({
          description: `Swapped ${value.sell.amount} ${value.sell.token} for ${value.buy.amount} ${value.buy.token}`,
          title: "Swap",
          variant: "success",
        });
      } else {
        toast({
          description: `Swap failed`,
          title: "Swap",
          variant: "error",
        });
      }
    },
    validators: {
      onChange: swapFormSchema,
    },
  };
  const form = useAppForm(formConfig);
  const { wallets } = useWallet();
  const firstConnectedWalletAdapter = getFirstConnectedWalletAdapter(wallets);

  const firstConnectedWalletAddress = firstConnectedWalletAdapter
    ? getFirstConnectedWalletAddress(firstConnectedWalletAdapter)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <Box background="highlight" className="flex-row">
        <div>
          <Text.Body2
            as="label"
            className="mb-6 block text-green-300 uppercase"
          >
            Selling
          </Text.Body2>
          <SelectTokenButton type="sell" />
        </div>
        <form.Field name="sell.amount">
          {(field) => (
            <SwapFormFieldset
              name="sell.amount"
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(Number(e.target.value))
              }
              value={field.state.value}
            />
          )}
        </form.Field>
      </Box>
      <div className="flex items-center justify-center">
        <SwapButton />
      </div>
      <Box background="highlight" className="flex-row">
        <div>
          <Text.Body2
            as="label"
            className="mb-6 block text-green-300 uppercase"
          >
            Buying
          </Text.Body2>
          <SelectTokenButton type="buy" />
        </div>
        <form.Field name="buy.amount">
          {(field) => (
            <SwapFormFieldset
              name="buy.amount"
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(Number(e.target.value))
              }
              value={field.state.value}
            />
          )}
        </form.Field>
      </Box>
      <div className="w-full">
        {!firstConnectedWalletAddress || !firstConnectedWalletAdapter ? (
          <ConnectWalletButton className="w-full py-3" wallets={wallets} />
        ) : (
          <Button
            className="w-full cursor-pointer py-3"
            onClick={form.handleSubmit}
            type="submit"
          >
            Swap
          </Button>
        )}
      </div>
    </div>
  );
}
