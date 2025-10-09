# @dex-web/ui

Shared UI component library for the DEX Web application.

## Overview

This library provides reusable React components built with Tailwind CSS. All components are documented in Storybook and designed with accessibility and user experience best practices.

## Components

- **Box**: Flexible container component
- **Button**: Primary button component with variants
- **Footer**: Application footer
- **Header**: Application header with navigation
- **Hero**: Landing page hero section
- **Icon**: Icon component with type-safe icon names
- **Modal**: Accessible modal dialog
- **NumericInput**: Input for numeric values (amounts, prices)
- **PageLayout**: Consistent page layout wrapper
- **Text**: Typography component
- **TextInput**: Standard text input field
- **Toast**: Toast notification component
- **Tooltip**: Accessible tooltip component

## Usage

```typescript
import {
  Button,
  Modal,
  NumericInput,
  Icon,
  Toast,
} from '@dex-web/ui';

function MyComponent() {
  return (
    <div>
      <Button onClick={handleClick}>Click me</Button>
      <NumericInput
        value={amount}
        onChange={setAmount}
        placeholder="0.00"
      />
      <Icon name="wallet" />
    </div>
  );
}
```

## Development

```bash
# Build the library
pnpm nx build ui

# Run tests
pnpm nx test ui

# Lint
pnpm nx lint ui
```

## Storybook

View component documentation and interactive examples:

```bash
# Run Storybook locally
pnpm storybook

# Build Storybook
pnpm build-storybook
```

## Testing

Components are tested using Vitest and Testing Library:

```bash
pnpm nx test ui
```

## Styling

All components use Tailwind CSS. Global styles and tokens are defined in the component library's CSS files.

## Contributing

When adding new components:

1. Create component in `src/lib/ComponentName/`
2. Add Storybook stories for all variants and states
3. Write comprehensive tests (rendering, interactions, accessibility)
4. Export from `src/index.ts`
5. Follow existing patterns for props and styling
6. Ensure accessibility (ARIA labels, keyboard navigation, etc.)
