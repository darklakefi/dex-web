"use client";

import { Box, Button, Text } from "@dex-web/ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { z } from "zod";
import { ConnectWalletButton } from "../../../_components/ConnectWalletButton";
import { getFirstConnectedWalletAdapter } from "../../../_utils/getFirstConnectedWalletAdapter";
import { getFirstConnectedWalletAddress } from "../../../_utils/getFirstConnectedWalletAddress";
import { toast } from "../../../_utils/toast";
import { SelectTokenButton } from "./SelectTokenButton";
import { SwapButton } from "./SwapButton";
import { SwapFormFieldset } from "./SwapFormFieldset";

export const { fieldContext, formContext } = createFormHookContexts();

const swapFormSchema = z.object({
  buyAmount: z.number().nonnegative(),
  sellAmount: z.number().nonnegative(),
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

const formConfig = {
  defaultValues: {
    buyAmount: 0,
    sellAmount: 0,
  } satisfies SwapFormSchema,
  onSubmit: ({
    value,
  }: {
    value: { buyAmount: number; sellAmount: number };
  }) => {
    console.log(value);
  },
  validators: {
    onChange: swapFormSchema,
  },
};

export function SwapForm() {
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
        <form.Field name="sellAmount">
          {(field) => (
            <SwapFormFieldset
              name={field.name}
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
        <form.Field name="buyAmount">
          {(field) => (
            <SwapFormFieldset
              name={field.name}
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
            onClick={() => {
              toast({
                description: "Swap tokens successfully",
                title: "Swap",
                variant: "success",
              });
            }}
          >
            Swap
          </Button>
        )}
      </div>
    </div>
  );
}
