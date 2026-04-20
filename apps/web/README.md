This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Basic Admin Setup

Admin access is now protected at API and page level.

### 1) Configure admin emails

Create `apps/web/.env` and add:

```env
JWT_SECRET=replace-with-a-strong-secret
ADMIN_EMAILS=admin@example.com,owner@example.com
```

Any account created with an email listed in `ADMIN_EMAILS` gets `ADMIN` role automatically.

### 2) Access admin dashboard

- Login at `/auth`
- If your account has admin access, you are redirected to `/admin_overview_dashboard`
- Non-admin users are redirected to `/profile`

### 3) Promote existing user to admin (if account already exists)

If user was created before this setup, either:

- Add their email to `ADMIN_EMAILS` and login again, or
- Update `users.roles` in MongoDB to include `ADMIN`

## Local Environment Setup (MongoDB)

1. Copy env template:

```bash
cp .env.example .env.local
```

2. Fill `DATABASE_URL` and required secrets in `.env.local`.
3. Install dependencies from repo root:

```bash
pnpm install
```

4. Generate Prisma client:

```bash
pnpm --filter web db:generate
```

5. Push Prisma schema to MongoDB:

```bash
pnpm --filter web db:push
```

6. Run web app:

```bash
pnpm --filter web dev
```

Troubleshooting:
- If `db:push` fails, verify MongoDB URI, network access, and DB user permissions.
