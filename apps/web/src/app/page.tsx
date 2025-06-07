import { Text } from "@dex-web/ui";
import { api } from "../trpc/client";

export default async function Index() {
  const users = await api.userList.query();
  console.log(users);
  return (
    <div>
      <div className="wrapper">
        <div className="container">
          <div id="welcome" className="flex items-center justify-center">
            <Text.Body1 className="animate-bounce">
              Under construction 🚧
            </Text.Body1>
          </div>
        </div>
      </div>
    </div>
  );
}
