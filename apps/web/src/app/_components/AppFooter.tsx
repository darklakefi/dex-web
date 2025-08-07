//"use client";
import { Footer, Icon, Text } from "@dex-web/ui";
//import { useWallet } from "@solana/wallet-adapter-react";

export const AppFooter = () => {
  //const { disconnect } = useWallet();
  //const handleClick = () => {
  //  disconnect();
  //};

  return (
    <Footer
      logo={<Icon className="h-6 w-auto stroke-none" name="logo-lg" />}
      socialMediaLinks={[]}
    >
      <div className="flex flex-col items-start gap-5">
        {/*
        <Text.Link className="inline-flex items-baseline justify-center leading-none no-underline">
          MEV
        </Text.Link>
        <Text.Link className="inline-flex items-baseline justify-center text-green-300 leading-none no-underline">
          What is MEV?
        </Text.Link>
        */}
        <Text
          as="a"
          className="inline-flex items-baseline justify-center gap-2 text-green-300 no-underline"
          href="https://mev-checker.darklake.fi/"
          variant="link"
        >
          MEV Checker{" "}
          <Icon className="size-4 fill-green-300" name="external-link" />
        </Text>
      </div>
      <div className="flex flex-col items-start gap-5">
        <Text.Link className="inline-flex items-baseline justify-center no-underline">
          Resources
        </Text.Link>
        <Text
          as="a"
          className="inline-flex items-baseline justify-center gap-2 text-green-300 no-underline"
          href="https://docs.darklake.fi"
          variant="link"
        >
          Docs <Icon className="size-4 fill-green-300" name="external-link" />
        </Text>
        <Text
          as="a"
          className="inline-flex items-baseline justify-center gap-2 text-green-300 no-underline"
          href="https://darklake.typeform.com/contact"
          variant="link"
        >
          Support{" "}
          <Icon className="size-4 fill-green-300" name="external-link" />
        </Text>
        <Text
          as="a"
          className="inline-flex items-baseline justify-center gap-2 text-green-300 no-underline"
          href="https://docs.darklake.fi/cookies-policy"
          variant="link"
        >
          Cookies Policy{" "}
          <Icon className="size-4 fill-green-300" name="external-link" />
        </Text>
      </div>
      {/*
      <div className="flex flex-col items-start gap-5">
        <Text.Link className="inline-flex items-baseline justify-center no-underline">
          Protocol Stats
        </Text.Link>
        <Text.Link className="inline-flex flex-col items-baseline justify-center text-green-300 no-underline">
          <div>TVL</div>
          <div>$421.23M</div>
        </Text.Link>
        <Text.Link className="inline-flex flex-col items-baseline justify-center text-green-300 no-underline">
          <div>7D Vol</div>
          <button
            className="cursor-pointer"
            onClick={handleClick}
            type="button"
          >
            $21.23M
          </button>
        </Text.Link>
      </div>
      */}
    </Footer>
  );
};
