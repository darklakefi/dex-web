# Changelog

All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/) for commit guidelines.

---
## [0.2.0](https://github.com/cocogitto/cocogitto/compare/v0.1.0..0.2.0) - 2025-06-04

### Bug Fixes

- **(ui)** correct highlight background style in Box component - ([3596d11](https://github.com/cocogitto/cocogitto/commit/3596d1137c974efa5078c3c12045b53d312e5f13)) - lewisflude
- **(ui)** update color classes in Box and TextInput components for consistency - ([abcc604](https://github.com/cocogitto/cocogitto/commit/abcc604b7244b2e4162039f48f9b5e2e0bc7e198)) - lewisflude
- **(ui)** correct background color class in Box component for consistency - ([c665a1b](https://github.com/cocogitto/cocogitto/commit/c665a1b7774d362c98dfde3f6f7be8d3b85fb69a)) - lewisflude
- **(ui)** ensure button is disabled when the disabled prop is true - ([f409897](https://github.com/cocogitto/cocogitto/commit/f40989707e4d0deb39075b6dd8d2aa05c778b777)) - lewisflude
- **(ui)** missing stage in Button, allow directly add class on Text - ([707da4c](https://github.com/cocogitto/cocogitto/commit/707da4ca3906800394f6c8600bef3145848883bf)) - Felix
- **(ui)** remove unnecessary newline in darklake theme configuration - ([340ad7b](https://github.com/cocogitto/cocogitto/commit/340ad7b901ec69d42eaf199c6d065619b6697cab)) - lewisflude
- **(ui)** align center for button with icon - ([79981e0](https://github.com/cocogitto/cocogitto/commit/79981e0b5a3a59201395baa06de40bc115e54ef1)) - Felix
- **(ui)** update SVG inclusion pattern to support React components - ([26b8577](https://github.com/cocogitto/cocogitto/commit/26b857778510f703ac3e24408a599ccd4876a22d)) - lewisflude

### Documentation

- **(ui)** add documentation comment for Header component - ([4f51b56](https://github.com/cocogitto/cocogitto/commit/4f51b56ab815e029743f3fa52c51b3b92182d5ab)) - lewisflude

### Features

- **(tailwind)** add custom theme colors and typography styles - ([ff9fc28](https://github.com/cocogitto/cocogitto/commit/ff9fc28fc189c79dad982790ce6a3808c5efd268)) - Felix
- **(tailwind)** add custom tracking utilities for typography - ([2453453](https://github.com/cocogitto/cocogitto/commit/245345393f89b03a8f0d96472bcf3ee9d4c58f71)) - Felix
- **(ui)** typography component - ([606259a](https://github.com/cocogitto/cocogitto/commit/606259ab4f8195c4fa493e45cbf722a57f971f1b)) - Felix
- **(ui)** add Box component for layout - ([c22d19f](https://github.com/cocogitto/cocogitto/commit/c22d19f864237593b1c713d2ccb73957557bd4ee)) - lewisflude
- **(ui)** export Box and Text components from index - ([8c8cd20](https://github.com/cocogitto/cocogitto/commit/8c8cd2090a761692cef85060342e519d8b02ab03)) - lewisflude
- **(ui)** update Box and Text components with new styles and add Storybook configuration - ([2413008](https://github.com/cocogitto/cocogitto/commit/24130086df3e036f1ea9719c0feff077240eb612)) - lewisflude
- **(ui)** add TextInput component and integrate custom fonts into Storybook - ([30ea5db](https://github.com/cocogitto/cocogitto/commit/30ea5db9774eb1840d4297c5e16c1e2c131f5093)) - lewisflude
- **(ui)** enhance TextInput component with state management and improved styling - ([500f3de](https://github.com/cocogitto/cocogitto/commit/500f3de64d1e703593057d80a2076472d2551569)) - lewisflude
- **(ui)** export Button component from index file - ([cf0829c](https://github.com/cocogitto/cocogitto/commit/cf0829c9429c1cba01c62484473ed89ae90dbc28)) - lewisflude
- **(ui)** set tailwind config breakpoint - ([6dea3aa](https://github.com/cocogitto/cocogitto/commit/6dea3aa5927b545375b81c7e20ce048133a70d94)) - Felix
- **(ui)** restructure component imports and add Box, Button, and Text components - ([09e09c8](https://github.com/cocogitto/cocogitto/commit/09e09c8e467039dba3f0845b9702bf77ae9877a2)) - Felix
- **(ui)** add textCase prop to Text component for text transformation options - ([9bcabb0](https://github.com/cocogitto/cocogitto/commit/9bcabb022c9599791923ffe09ce94702a0262211)) - Felix
- **(ui)** create Icon component with various icons - ([bcdeed7](https://github.com/cocogitto/cocogitto/commit/bcdeed7eecfd785f80b84bf7da9d9db9cef79a46)) - lewisflude
- **(ui)** add darklake theme and update Storybook configuration - ([34ed3f2](https://github.com/cocogitto/cocogitto/commit/34ed3f2fabb7a41b8e08585c027e0f20134e830d)) - lewisflude
- **(ui)** add accessibility support with @storybook/addon-a11y to Storybook configuration - ([1459b28](https://github.com/cocogitto/cocogitto/commit/1459b28f3cc7be6d1e9e0d8689b8a3fa8c6381e9)) - lewisflude
- **(ui)** add loading stripe icon - ([8f024d4](https://github.com/cocogitto/cocogitto/commit/8f024d44b1d6115b36542819eebbb16b4516243f)) - Felix
- **(ui)** update Button stages, utilize tailwind merge for Text - ([a51babf](https://github.com/cocogitto/cocogitto/commit/a51babfcd3bf35566ffdce8c47cb51f58b3a3024)) - Felix
- **(ui)** enhance Button component with loading and icon variations - ([325c899](https://github.com/cocogitto/cocogitto/commit/325c899a1d800957656a8e876d2c90b2eae3d771)) - Felix
- **(ui)** refactor Icon component to use static imports for SVG icons and improve performance - ([9eb5946](https://github.com/cocogitto/cocogitto/commit/9eb5946f5e78a334cb1aeef3a55542c8a8370888)) - lewisflude
- **(ui)** add new logo SVG icon to Icon component - ([36d1503](https://github.com/cocogitto/cocogitto/commit/36d1503e43aed7d0ff159b7d917ab0cef5287ddc)) - lewisflude
- **(ui)** implement Header component with logo, navigation links, and action button - ([b78430b](https://github.com/cocogitto/cocogitto/commit/b78430bb97c06448d5b925851cb5857ecad2b1b8)) - lewisflude
- **(ui)** update Header component to support responsive logos and improve link styling - ([41fb75c](https://github.com/cocogitto/cocogitto/commit/41fb75c43caef881c4fb4c1d4c8de3c699abec62)) - lewisflude
- **(ui)** enhance Storybook configuration and add Header component tests - ([18ab052](https://github.com/cocogitto/cocogitto/commit/18ab052c2016df81a3a05fa1149b304bd21a3c0c)) - lewisflude
- **(ui)** export Header and Icon components from index file - ([bfa238f](https://github.com/cocogitto/cocogitto/commit/bfa238f114c961e7e92b9017ed4cd9b19f8b876f)) - lewisflude
- **(ui)** integrate SVGR plugins for SVG handling and update TypeScript configuration - ([9611701](https://github.com/cocogitto/cocogitto/commit/96117019d3a87c56f373fadff6e0be657ac9759f)) - lewisflude
- **(ui)** enhance TypeScript configuration and SVG handling with SVGR options - ([ec1c771](https://github.com/cocogitto/cocogitto/commit/ec1c7715e190de63f94d60663df0891f734910bc)) - lewisflude
- **(utils)** setup utils module - ([db050d2](https://github.com/cocogitto/cocogitto/commit/db050d24f2a1ece3a6deaa358cfc5ac21ee99fa5)) - Felix
- add custom fonts and update Tailwind CSS theme configuration - ([f044f8d](https://github.com/cocogitto/cocogitto/commit/f044f8da540a1741f5edc3e2ce1c7fb5a9847c78)) - lewisflude
- update font class to text component - ([02dc874](https://github.com/cocogitto/cocogitto/commit/02dc874ede112046fe604fe3f7f518fd73f33235)) - Felix
- button component and allow overwrite color in text compononent - ([dc1b538](https://github.com/cocogitto/cocogitto/commit/dc1b538c130c2dbddce6b38d9362977ea1618bde)) - Felix
- add chromatic dependency to enhance UI component testing - ([78f7a75](https://github.com/cocogitto/cocogitto/commit/78f7a75c46d8b250224a1dec045a2d40d01785be)) - lewisflude

### Miscellaneous Chores

- **(deps)** update package dependencies and versions in package.json and pnpm-lock.yaml - ([9fbb8b5](https://github.com/cocogitto/cocogitto/commit/9fbb8b5aa82d07d48f95d60cd959281758944824)) - lewisflude
- **(tailwind)** update color palette to use oklch color format and new colours - ([19b864d](https://github.com/cocogitto/cocogitto/commit/19b864d01b44490c735b6ea1aa9a6c81c3f338c5)) - lewisflude
- **(ui)** move text input to subdirectory - ([688c0b7](https://github.com/cocogitto/cocogitto/commit/688c0b787c964cb4666273e89f464beeda989ced)) - Felix
- set indent style for biome - ([fb65f60](https://github.com/cocogitto/cocogitto/commit/fb65f60caa444318917f3e01a3792eec7cfa0581)) - Felix
- standardize code formatting across configuration files and update TypeScript settings - ([7b9ced8](https://github.com/cocogitto/cocogitto/commit/7b9ced8461ead7cabff07e56129629228bc2dff4)) - lewisflude
- update biome configurations and project structure for web and e2e applications - ([c3d92c3](https://github.com/cocogitto/cocogitto/commit/c3d92c3c773fd0a1a692ac0f6eb4dfd19f30e667)) - lewisflude
- update lint command in documentation and standardize command table formatting - ([7bfd037](https://github.com/cocogitto/cocogitto/commit/7bfd037ec9f2d7f92d50fe5753898649b84379f4)) - lewisflude
- update TypeScript configuration files for consistency and path adjustments - ([6077574](https://github.com/cocogitto/cocogitto/commit/60775749d4a8b227e2a5999c2df1ddaee1fcaf78)) - lewisflude
- update TypeScript configuration files to improve project structure and compatibility - ([e0f4518](https://github.com/cocogitto/cocogitto/commit/e0f4518969c0002cafc7e52e660accddc68d228c)) - lewisflude
- remove example button, using sub folder for ui component - ([19303fe](https://github.com/cocogitto/cocogitto/commit/19303fe69226394a517998f5146bda96b3d7f870)) - Felix
- fix build - ([f2d99d2](https://github.com/cocogitto/cocogitto/commit/f2d99d2738506dd35115a6226eaf360cfab61508)) - Felix

### Refactoring

- **(ui)** update color palette for Button, Box, and Text components to use oklch color values - ([fb34f99](https://github.com/cocogitto/cocogitto/commit/fb34f99db0f6693018f49254d1df1be3e6b2c286)) - Felix
- **(ui)** simplify Text component variants and update Tailwind CSS styles - ([503a1e3](https://github.com/cocogitto/cocogitto/commit/503a1e3fcda3345640a60ada2cbae5db2af0a855)) - Felix
- **(ui)** enhance Icon component styles and simplify rendering - ([151182a](https://github.com/cocogitto/cocogitto/commit/151182a80187fb321583b91f1fb5deeaa3d1d2c0)) - lewisflude
- **(ui)** update darklake theme colors and enhance Icon component styling - ([392221e](https://github.com/cocogitto/cocogitto/commit/392221e196d8eaa5960883aab31cd47ea3ca0731)) - lewisflude
- rename typoraphy to text component - ([57cc8d3](https://github.com/cocogitto/cocogitto/commit/57cc8d3d63611135d74e2dbea8670b5f1b09f31d)) - Felix

### Style

- **(ui)** refine TextInput component styles for improved usability and aesthetics - ([0964f7d](https://github.com/cocogitto/cocogitto/commit/0964f7de2d039632a0477aa25d9e7a03b0bb4400)) - lewisflude

### Tests

- **(ui)** add unit tests for Icon component rendering and props handling - ([b7bf85f](https://github.com/cocogitto/cocogitto/commit/b7bf85f21d048d05d338af20ad150d45444a04f7)) - lewisflude
- **(ui)** add unit tests for Header component rendering - ([24ba8d5](https://github.com/cocogitto/cocogitto/commit/24ba8d5546a1181b8efbac61e19b71925acad7c4)) - lewisflude

---

## [0.1.0] - 2025-05-15

### Documentation

- :memo: Add linter command to README for web project - ([37ebea2](https://github.com/cocogitto/cocogitto/commit/37ebea256aa38566c31e31f588bbe491fe3c5deb)) - lewisflude
- :memo: Update README to correct linter and project targets commands - ([25037a1](https://github.com/cocogitto/cocogitto/commit/25037a1987b9e4b84049a0a9af43188db7556cb2)) - lewisflude
- :sparkles: Add instructions for running unit and end-to-end tests in README.md - ([6c8363c](https://github.com/cocogitto/cocogitto/commit/6c8363ce7987d1f0ae4d31dce2927eef12866567)) - lewisflude
- :sparkles: Revise README.md to update project title, add badges for dependencies, and remove outdated links - ([7c0b1e4](https://github.com/cocogitto/cocogitto/commit/7c0b1e4a2177d6b9bc6915c10bdfe35f44a6cd86)) - lewisflude
- :sparkles: Add DEVELOPMENT.md for comprehensive front-end development guidelines - ([db0f662](https://github.com/cocogitto/cocogitto/commit/db0f66213641076e1c7744ce3d0490a91830cad9)) - lewisflude

### Miscellaneous Chores

- **(deps-dev)** Bump happy-dom in the npm_and_yarn group - ([c5c6253](https://github.com/cocogitto/cocogitto/commit/c5c6253ca9639547ad75afb15d9ad5e640be8b24)) - dependabot[bot]
- **(release)** update CHANGELOG.md for 0.1.0 - ([](https://github.com/cocogitto/cocogitto/commit/)) -
- :sparkles: Add biome configuration file for project settings - ([e37c7fb](https://github.com/cocogitto/cocogitto/commit/e37c7fb61a541c8b7068becf80bdd46c3e0a9696)) - lewisflude
- :sparkles: Update VSCode extensions to include biome and conventional commits - ([0ed40f8](https://github.com/cocogitto/cocogitto/commit/0ed40f8cb22d10c0f1a05121675d36868f0acb3e)) - lewisflude
- :sparkles: Add biome linting targets and configuration for web applications - ([5974eb0](https://github.com/cocogitto/cocogitto/commit/5974eb0e6071d40234eca34587501eec3c4c7324)) - lewisflude
- :sparkles: Enable version control and use ignore file in biome configuration - ([8066db1](https://github.com/cocogitto/cocogitto/commit/8066db1d0df252fd48f6138b0b72f9ce1da9b38c)) - lewisflude
- :sparkles: Upgrade TypeScript to version 5.8.3 in package.json and update pnpm-lock.yaml accordingly - ([d8854cc](https://github.com/cocogitto/cocogitto/commit/d8854cc4c871bdbf5177c204c53fe8703b0c9fc0)) - lewisflude
- :sparkles: Update TypeScript configuration in tsconfig.base.json to enhance module handling and enable additional compiler options - ([9b843c0](https://github.com/cocogitto/cocogitto/commit/9b843c06e4f23a720b0829c0a5c8b7fbc6132a96)) - lewisflude
- :sparkles: Upgrade Next.js to version 15.3.2 in package.json and update pnpm-lock.yaml accordingly - ([8e42bfa](https://github.com/cocogitto/cocogitto/commit/8e42bfa2ce9eeca7679951a47a555b80c71a1c82)) - lewisflude
- :sparkles: Migrate Next.js configuration from JavaScript to TypeScript in next.config.ts - ([c723173](https://github.com/cocogitto/cocogitto/commit/c723173430fa2e5c686ce0f1f4751f00d48c7629)) - lewisflude
- :sparkles: Update TypeScript include paths in tsconfig.json to ensure proper type checking and module resolution - ([ef6b1f8](https://github.com/cocogitto/cocogitto/commit/ef6b1f83a71310dc0f8d4ef3c2900c59e4d7413f)) - lewisflude
- :sparkles: Upgrade Tailwind CSS and PostCSS dependencies in package.json and pnpm-lock.yaml - ([0d3ad5a](https://github.com/cocogitto/cocogitto/commit/0d3ad5aa82499924fbedab8ec5acd619df8453f5)) - lewisflude
- :sparkles: Replace postcss.config.js with postcss.config.mjs and update global.css to use Tailwind CSS imports - ([ff00158](https://github.com/cocogitto/cocogitto/commit/ff00158c2d2655b717160efdedaaa5b6af70ecf1)) - lewisflude
- :sparkles: Add Tailwind CSS extension to VSCode configuration - ([b17ce90](https://github.com/cocogitto/cocogitto/commit/b17ce90de9607dab364cf7022cc71f44f11c115f)) - lewisflude
- :sparkles: Add nursery rule for sorted classes in linter configuration within biome.json - ([501e020](https://github.com/cocogitto/cocogitto/commit/501e0200d7a8515e47acccfd5d4731d0be5c42b3)) - lewisflude
- :fire: Remove unused Tailwind CSS configuration file from the project - ([1ca58c7](https://github.com/cocogitto/cocogitto/commit/1ca58c70e63f5148b004278c4e81670728687e7f)) - lewisflude
- :fire: Remove Jest configuration and related files from the project - ([5b7bb9c](https://github.com/cocogitto/cocogitto/commit/5b7bb9cc59454408c99857c1166f78bee53d546c)) - lewisflude
- :sparkles: Add Vite and Vitest configuration files, update package dependencies, and refine TypeScript settings - ([30a0710](https://github.com/cocogitto/cocogitto/commit/30a0710120347b9ed0d3458b7acb2f161ad6005e)) - lewisflude
- :sparkles: Update Vite configuration to use happy-dom for testing environment and refine asset copying with nxCopyAssetsPlugin - ([25a4a61](https://github.com/cocogitto/cocogitto/commit/25a4a610023c23bd33932f72b410648384cc99c1)) - lewisflude
- :sparkles: Upgrade @playwright/test dependency from ^1.36.0 to ^1.52.0 in package.json - ([8b19e72](https://github.com/cocogitto/cocogitto/commit/8b19e723630d902379bc285e7e659f4ef5d5157b)) - lewisflude
- :sparkles: Reorder imports in Playwright configuration and simplify BASE_URL assignment - ([4a79af2](https://github.com/cocogitto/cocogitto/commit/4a79af2afb68c4f29fdac8d7b66e9bca07588d1f)) - lewisflude
- :sparkles: Update .gitignore, add mcp.json for MCP server configuration, and create VSCode settings for AI agent rule generation - ([8f0de77](https://github.com/cocogitto/cocogitto/commit/8f0de77cfaa60093beef1f820449fcac69178611)) - lewisflude
- :sparkles: Add Vitest Explorer extension to VSCode configuration - ([17bdcc7](https://github.com/cocogitto/cocogitto/commit/17bdcc714263cde9ce43bdbb20570a3621d1735f)) - lewisflude
- :sparkles: Update package.json and pnpm-lock.yaml with dependency upgrades and add Node engine requirement - ([519d70e](https://github.com/cocogitto/cocogitto/commit/519d70ef6a0de240f222ee92037b9ded6704fc65)) - lewisflude
- :sparkles: Add .nvmrc and .tool-versions files to specify Node.js and tool versions - ([ddac96d](https://github.com/cocogitto/cocogitto/commit/ddac96d8bf8a8eea801e1255fb6c9761bb4dcdcc)) - lewisflude
- :sparkles: Update VSCode configuration and .editorconfig for improved formatting and editor settings - ([0e8db63](https://github.com/cocogitto/cocogitto/commit/0e8db636ef58a39efb693398f706604fdebe9a29)) - lewisflude
- :sparkles: Add lefthook configuration for pre-commit linting and update package dependencies - ([91ac85e](https://github.com/cocogitto/cocogitto/commit/91ac85ea3b19f477d8d06d06ff46a9fabe41cb00)) - lewisflude
- :sparkles: Add commitlint configuration and update lefthook for commit message linting - ([6b5c016](https://github.com/cocogitto/cocogitto/commit/6b5c01622457054111d3542de8abd9739aa79303)) - lewisflude
- :sparkles: Update nx.json configuration and add nrwl.angular-console extension recommendation - ([e2632a0](https://github.com/cocogitto/cocogitto/commit/e2632a0be3f36b0bcc543d5cb92907f481a2f44f)) - lewisflude

### Refactoring

- :tada: Add package for biome - ([e49a2c2](https://github.com/cocogitto/cocogitto/commit/e49a2c2765db696990bbd7a89b7eae3c2c73e8a9)) - lewisflude

### Tests

- :sparkles: Add initial test for Page component using React Testing Library - ([8659330](https://github.com/cocogitto/cocogitto/commit/86593300816cd167cfd526624e03236c106cd637)) - lewisflude

<!-- generated by git-cliff -->
