# NextJS - Bare Minimum (Hosted on Vercel)

Previous tier: [Git Repositories - Good](0002-GitRepositories-Good.md) | Next tier: [NextJS - Good](../Notes/NextJS-Good.md) (notes)

I have hosted in ECS before but it's not worth it

## What this tier gets you

A repo set up per the Git Repositories tiers now gets an actual app in it - a bootstrapped NextJS project with TypeScript, Tailwind, ESLint, App Router, and a `src/` directory. No opinionated lint/format config yet - that's the [Good](../Notes/NextJS-Good.md) tier's job

```bash
pnpm create next-app@latest r3thought-app --ts --app --tailwind --src-dir --import-alias "@/*" --eslint --no-react-compiler --agents-md
```

## Reference - NextJS' documentation

[NextJS' Docs](https://nextjs.org/docs) are very good, and include

- [Getting Started](https://nextjs.org/docs/app/getting-started) covers a lot of things at a high level
  - Installation
  - Project Structure
  - Layouts and Pages
  - Linking and Navigating
  - Server and Client Components
  - Fetching Data
  - Mutating Data
  - Caching
    - Can cache components
    - Can also cache data, but I'm not sure how this compares to just using Tanstack's React Query
  - Revalidating
  - Error Handling
  - CSS
  - Image Optimisation
  - Font Optimisation
    - Seemingly very useful for setting your font directly in html
    - You can check out [Variable Fonts on Google Font](https://fonts.google.com/variablefonts)
      - `import { Roboto } from 'next/font/google'`
  - Metadata and OpenGraph Images
  - Router Handlers
  - Proxy seems like an interesting tool
    - [Backend for Frontend - Proxy](https://nextjs.org/docs/app/guides/backend-for-frontend#proxy)
    - [proxy.js docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
  - Deploying (There are also templates If you want to host on Flightcontrol, Railway, Replit, or Hostinger)
    - I'm fine with deploying to Vercel for the moment, but you can also check out the official [Docker documentation on hosting NextJS yourself](https://docs.docker.com/guides/nextjs)
  - Upgrading (Between NextJS versions)
- [Installation](https://nextjs.org/docs/app/getting-started/installation) should be referred to before kicking off any new project
  - Quick Start - `pnpm create next-app@latest my-app --yes` - `--yes` goes with the defaults of `TypeScript, Tailwind CSS, ESLint, App Router, and Turbopack`
  - Customise Settings - Run `pnpm create next-app` and select the `Customize Settings` option

    ```bash
    Would you like to use TypeScript? No / Yes
    Which linter would you like to use? ESLint / Biome / None
    Would you like to use React Compiler? No / Yes
    Would you like to use Tailwind CSS? No / Yes
    Would you like your code inside a`src/` directory? No / Yes
    Would you like to use App Router? (recommended) No / Yes
    Would you like to customize the import alias (`@/_` by default)? No / Yes
    What import alias would you like configured? @/_
    Would you like to include AGENTS.md to guide coding agents to write up-to-date Next.js code? No / Yes
    ```

    - Personally, I'd use TS-ESLint over plain ESLint, and I've never found a reason to use Biome instead
    - After you've done this once, you can then opt to reuse previous settings when running `pnpm create next-app`
      - These settings are stored in various places depending on your OS. See [conf](https://www.npmjs.com/package/conf) for the latest docs, but as of August 18, 2026
        - macOS: ~/Library/Preferences/create-next-app-nodejs/config.json
        - Linux: ~/.config/create-next-app-nodejs/config.json (respects $XDG_CONFIG_HOME)
        - Windows: %APPDATA%\create-next-app-nodejs\Config\config.json
    - You can delete them later with `create-next-app --reset-preferences`

- Manual
  - Check out the [docs](https://nextjs.org/docs/app/getting-started/installation#manual-installation) if you absolutely must

- [Guides](https://nextjs.org/docs/app/guides) like
  - [Instant Navigation](https://nextjs.org/docs/app/guides/instant-navigation)
- [Templates](https://vercel.com/templates/next.js) like
  - [SaaS Starter](https://vercel.com/templates/next.js/next-js-saas-starter)
