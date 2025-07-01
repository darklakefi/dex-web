"use client";

import { Box, Icon, Text } from "@dex-web/ui";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useState } from "react";
import { SlippageCustomOption } from "./SlippageCustomOption";
import { SlippageDefaultOption } from "./SlippageDefaultOption";

export function SwapPageSettingButton() {
  const [selectedOption, setSelectedOption] = useState<string>("0.5");
  const [slippage, setSlippage] = useState<string>("0.5");
  const [customSlippage, setCustomSlippage] = useState<string>("");

  return (
    <Popover>
      {() => (
        <>
          <PopoverButton as="div" className={"cursor-pointer"}>
            <button
              aria-label="settings"
              className="inline-flex items-center justify-center bg-green-800 p-2 text-green-300 hover:text-green-200 focus:text-green-200"
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
                      setSelectedOption("0.5");
                      setSlippage("0.5");
                    }}
                    selected={selectedOption === "0.5"}
                    slippage={0.5}
                  />
                  <SlippageDefaultOption
                    onClick={() => {
                      setSelectedOption("1");
                      setSlippage("1");
                    }}
                    selected={selectedOption === "1"}
                    slippage={1}
                  />
                  <SlippageDefaultOption
                    onClick={() => {
                      setSelectedOption("2");
                      setSlippage("2");
                    }}
                    selected={selectedOption === "2"}
                    slippage={2}
                  />
                  <SlippageCustomOption
                    onChange={(slippage: string) => {
                      setCustomSlippage(slippage);
                      setSlippage(slippage);
                    }}
                    onClick={(slippage: string) => {
                      setSelectedOption("custom");
                      setCustomSlippage(slippage);
                    }}
                    selected={selectedOption === "custom"}
                    slippage={customSlippage}
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
