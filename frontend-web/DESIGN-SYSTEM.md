# Frontend Design System

## Authentication

Login, register, forgot-password, and reset-password share `components/auth/AuthLayout.jsx`. Keep their layout and form-control styles there instead of creating page-specific variants.

Theme-dependent authentication colors live in `app/globals.css` as `--auth-*` variables. Update both `:root` and `.dark` values together. The button foreground is controlled separately by `--auth-accent-contrast` so text stays readable in both themes.

Shared form classes are exported from `AuthLayout.jsx`: `authLabelClass`, `authInputClass`, `authButtonClass`, `authIconButtonClass`, and `authLinkClass`. Reuse these exports in authentication pages. Page files should contain form behavior and content, not duplicate visual rules.

## Making a change

1. Change a color in the matching light and dark `--auth-*` tokens.
2. Change a shared control in its exported class in `AuthLayout.jsx`.
3. Keep page-specific spacing or structure local only when the workflow genuinely differs.
4. Run `npx eslint app/register/page.jsx app/login/page.jsx app/forgot-password/page.jsx app/reset-password/page.jsx components/auth/AuthLayout.jsx` from `frontend-web`.

This system currently covers authentication screens only. Other product areas have their own UI patterns and should be consolidated separately, with their own shared components and tokens.