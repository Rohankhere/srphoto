# Project Architecture Rules

- Keep this site as a browser-only Vite + React application; server-side features belong in Lovable Cloud functions so static hosts only need the `dist` directory.
- Keep the enquiry submission form on the dedicated inquiry route, with links from the homepage and contact page, so visitors have a focused submission screen.