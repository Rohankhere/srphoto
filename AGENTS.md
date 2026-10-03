# Project Architecture Rules

- Keep the TanStack Start Vite plugin in the Vite plugin chain because file routes, API handlers, and server functions depend on its generated entry aliases and client/server transforms.