# Restore the Vercel Static Build

## What will change
- Return the project to a browser-only Vite + React build that produces `dist/index.html` and frontend assets for Vercel.
- Keep the existing file-based page navigation while removing the TanStack Start server runtime from the browser build.
- Move the customer AI chat endpoint and admin transcript resend action to secure Lovable Cloud functions, preserving their existing screens and protections.
- Correct the root error-screen typing and make the site title `SR Photo Studio | Harda` available in the static HTML.

## Technical details
- Use Vite with the TanStack Router route-generation plugin, not the TanStack Start plugin; simplify the root document shell for client-side rendering.
- Keep chat persistence, rate limits, transcript emails, and admin role verification server-side in Cloud functions; do not expose service credentials in the browser.
- Verify `npm run build` and `npm run build:dev` both create `dist/index.html`, then confirm the latest preview diagnostics are clear.
