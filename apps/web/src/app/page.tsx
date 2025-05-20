import { ExampleButton } from "@dex-fe-web/ui";

export default function Index() {
  return (
    <div>
      <div className="wrapper">
        <div className="container">
          <div id="welcome">
            <h1>
              <span> Hello there, </span>
              Welcome web 👋
            </h1>
            <ExampleButton variant="secondary">Click me</ExampleButton>
          </div>
        </div>
      </div>
    </div>
  );
}
