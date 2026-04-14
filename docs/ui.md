# UI Coding Standards

## Component Library

**Only shadcn/ui components are permitted in this project.**

- Do NOT create custom UI components.
- Do NOT use any other component library (Material UI, Chakra, Radix primitives directly, etc.).
- Every UI element — buttons, inputs, dialogs, cards, tables, selects, badges, etc. — must come from shadcn/ui.
- If a needed component does not yet exist in the project, add it via the CLI:
  ```bash
  npx shadcn@latest add <component-name>
  ```
- shadcn/ui components live in `src/components/ui/`. Do not modify generated files unless absolutely necessary and document why.

## Date Formatting

All dates must be formatted using **date-fns**. Do not use `Date.prototype.toLocaleDateString`, `Intl.DateTimeFormat`, or any other formatting approach.

### Required Format

Dates are displayed with an ordinal day suffix, abbreviated month, and 4-digit year:

```
1st Sep 2025
2nd Aug 2025
3rd Jan 2026
4th Jun 2024
```

### Implementation

Use the `do` token from date-fns for the ordinal day:

```ts
import { format } from "date-fns";

format(date, "do MMM yyyy");
// → "1st Sep 2025"
// → "2nd Aug 2025"
// → "3rd Jan 2026"
// → "4th Jun 2024"
```

This format string must be used consistently everywhere a date is displayed to the user.
