"use client";

import { Box, Text } from "@dex-web/ui";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { z } from "zod";
import { SelectTokenButton } from "./SelectTokenButton";
import { SwapButton } from "./SwapButton";
import { SwapFormFieldset } from "./SwapFormFieldset";

export const { fieldContext, formContext } = createFormHookContexts();

const swapFormSchema = z.object({
  buyAmount: z.number(),
  sellAmount: z.number(),
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

  return (
    <div>
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
                field.handleChange(e.target.valueAsNumber)
              }
              value={field.state.value}
            />
          )}
        </form.Field>
      </Box>
    </div>
  );
}
