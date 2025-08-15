"use client";

import { Box, Icon, Text } from "@dex-web/ui";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useState } from "react";
import { SlippageCustomOption } from "../[lang]/(swap)/_components/SlippageCustomOption";
import { SlippageDefaultOption } from "../[lang]/(swap)/_components/SlippageDefaultOption";

export type Slippage = {
  type: string;
  value: string;
};
export function slippageIsWithinRange(slippage: string) {
  return Number(slippage) > 0 && Number(slippage) <= 99;
}
export function TokenTransactionSettingsButton({
  onChange,
}: {
  onChange: (slippage: string) => void;
}) {
  const [slippage, setSlippage] = useState<Slippage>({
    type: "0.5",
    value: "0.5",
  });

  const handleChange = (slippage: string) => {
    if (slippageIsWithinRange(slippage)) {
      onChange(slippage);
    }
  };

  return (
    <Popover>
      {() => (
        <>
          <PopoverButton as="div" className={"cursor-pointer"}>
            <button
              aria-label="settings"
              className="inline-flex cursor-pointer items-center justify-center bg-green-800 p-2 text-green-300 hover:text-green-200 focus:text-green-200"
              type="button"
            >
              <Icon className="size-5" name="cog" />
            </button>
          </PopoverButton>
          <PopoverPanel anchor={"bottom end"} className="z-30 mt-1">
            {({ close }) => (
              <Box className="gap-4 bg-green-800 p-4" shadow="sm">
                <div className="flex items-center justify-between">
                  <Text.Body2 className="text-green-300">
                    set maximum slippage
                  </Text.Body2>
                  <button
                    aria-label="close"
                    className="cursor-pointer"
                    onClick={() => {
                      close();
                    }}
                    type="button"
                  >
                    <Icon className="size-4 text-green-400" name="times" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <SlippageDefaultOption
                    onClick={() => {
                      setSlippage({
                        type: "0.5",
                        value: "0.5",
                      });
                      handleChange("0.5");
                    }}
                    selected={slippage.type === "0.5"}
                    slippage={0.5}
                  />
                  <SlippageDefaultOption
                    onClick={() => {
                      setSlippage({
                        type: "1",
                        value: "1",
                      });
                      handleChange("1");
                    }}
                    selected={slippage.type === "1"}
                    slippage={1}
                  />
                  <SlippageDefaultOption
                    onClick={() => {
                      setSlippage({
                        type: "2",
                        value: "2",
                      });
                      handleChange("2");
                    }}
                    selected={slippage.type === "2"}
                    slippage={2}
                  />
                  <SlippageCustomOption
                    onChange={(slippage: Slippage) => {
                      setSlippage({
                        type: "custom",
                        value: slippage.value,
                      });
                      handleChange(slippage.value);
                    }}
                    onClick={(slippage: Slippage) => {
                      setSlippage({
                        type: "custom",
                        value: slippage.value,
                      });
                    }}
                    slippage={slippage}
                  />
                </div>
              </Box>
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
