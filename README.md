# Muhasib Server

The Muhasib Server project contains the API,
database, and other server-side code for the
Muhasib project.

The server project is built in **TypeScript** with
**Node.js** and **Express**. [Turso](https://turso.tech/) is used for Database.

## Scripts

Start in Development mode: `pnpm dev`

Build: `pnpm build`

Start in Production mode : `pnpm start`

Format the code with prettier: `pnpm format`

Lint the code: `pnpm lint`

Run tests: `pnpm test`

---

## Environment Variables

Environment variables are securely stored with dotenv-vault.

Login to dotenv-vault: `pnpm env:login`

Open dotenv-vault: `pnpm env:open`

Pull environment from dotenv-vault: `pnpm env:pull`

Push environment to dotenv-vault: `pnpm env:push`
