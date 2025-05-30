import { Box, Button, Text } from "@dex-fe-web/ui";
import { truncate } from "@dex-fe-web/utils";

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
                <Button.Primary text="Click me" isLoading />
                <Button.Primary text="Click me" leadingIcon="plus" />
                <Button.Primary text="Click me" trailingIcon="plus" />
                <Button.PrimaryDark icon="trending" />
                <Text.Body1>
                  {truncate("63RVzWobK3MzvHdMSKiXYnnAthFCVhPRzxWqaN4p4rP5")}
                </Text.Body1>
              </div>
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
}
