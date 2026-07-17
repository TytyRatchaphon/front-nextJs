This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The Live Chat GIF picker uses the official GIPHY React SDK. Add a Web API key to your local environment:

```bash
NEXT_PUBLIC_GIPHY_API_KEY=your_giphy_web_api_key
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Production Build Notes

Use Node `22` for production builds.

Recommended pre-build steps:

```bash
node -v
npm ci
npm run build
```

CI/CD cache checklist:

- Cache `~/.npm`
- Cache `.next/cache`
- Do not cache `.next/standalone`
- Do not cache `.next/static`
- Do not cache `node_modules` if using `npm ci`

Suggested cache keys:

- npm cache: lockfile hash (`package-lock.json`)
- Next cache: lockfile hash + source hash for `src/**`, `next.config.ts`, `tsconfig.json`

Typical restore order:

1. Restore `~/.npm`
2. Restore `.next/cache`
3. Run `npm ci`
4. Run `npm run build`
