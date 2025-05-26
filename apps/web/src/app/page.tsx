import { Button, Text, Box } from "@dex-fe-web/ui";

export default function Index() {
  return (
    <div>
      <div className="wrapper">
        <div className="container">
          <div id="welcome">
            <Box padding="lg" background="base">
              <div className="flex flex-col gap-2">
                <Text.Heading>Hello there,</Text.Heading>
                <Text.Body2>Welcome web 👋</Text.Body2>
                <Button.Primary text="Click me" />
                <Button.PrimaryDark text="Click me" />
                <Button.Secondary text="Click me" />
                <Button.Tertiary text="Click me" />
              </div>
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
}
