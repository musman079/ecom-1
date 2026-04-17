# Complete Project Flow Guide (Roman Urdu)

Date: 2026-04-17
Project: ecommerce-workspace

## 1) Project Ka Big Picture

Yeh project Turborepo based monorepo hai. Iska matlab ek hi repository me multiple apps + shared packages maintain ho rahe hain.

Top level folders:

1. apps/docs -> Next.js docs/demo app (mostly starter content)
2. apps/web -> Main ecommerce web app (actual functional area)
3. apps/mobile -> Expo React Native app (abhi starter level)
4. packages/ui -> Shared UI components jo apps reuse kar sakti hain
5. packages/types -> Shared TypeScript interfaces
6. packages/eslint-config + packages/typescript-config -> shared tooling/config

Core workspace config:

1. pnpm-workspace.yaml -> define karta hai ke apps/* aur packages/* workspaces hain
2. turbo.json -> build/dev/lint/check-types pipeline orchestration
3. package.json (root) -> mono commands, jaise turbo dev, turbo build

## 2) Runtime Entry Flow (Developer Perspective)

Common startup:

1. Root se command chalti hai: pnpm dev
2. Turbo app-level dev scripts run karta hai
3. apps/web default port 3000 pe run hota hai
4. apps/docs port 3001 pe run hota hai
5. apps/mobile Expo ke through alag process me run hota hai

## 3) apps/web Complete Flow

### 3.1 UI + Routing Layer

Main pages in app router:

1. / -> Home storefront
2. /product_details -> Product details (mobile-ish flow)
3. /product_detail_desktop -> Product details desktop flow
4. /cart_checkout -> Cart checkout (interactive)
5. /cart_checkout_desktop -> Desktop checkout (interactive)
6. /profile -> User profile style page
7. /auth -> Login style frontend flow
8. /admin_overview_dashboard -> Admin summary/KPI dashboard
9. /admin_products -> Admin CRUD page (actual working CRUD)
10. /admin_post_edit_product -> Admin editor style screen
11. /kinetic_luxury_fashion_e_commerce -> Editorial/auth-like page

Layout + global styles:

1. app/layout.tsx -> root html/body wrapper, metadata, Material symbols include
2. app/globals.css -> global styling layer

### 3.2 Admin Product Management (Actual Working Backend Flow)

Yeh project ka sab se functional backend section hai.

Request flow:

1. User admin_products page pe form submit karta hai
2. Frontend fetch call API route ko hit karti hai
3. API request validate karta hai
4. API helper functions ko call karta hai
5. Helper JSON data file ko read/write karta hai
6. Response wapas page ko milti hai
7. UI state update hoti hai (list refresh / update / delete)

Files involved:

1. app/admin_products/page.tsx -> frontend CRUD UI + fetch logic
2. app/api/admin/products/route.ts -> GET list, POST create
3. app/api/admin/products/[id]/route.ts -> GET one, PUT update, DELETE remove
4. src/lib/admin-products.ts -> validation + file-based persistence logic
5. data/admin-products.json -> persisted catalog data

### 3.3 Dashboard Data Flow

Admin dashboard API ko hit nahi karta; direct server-side helper call karta hai:

1. admin_overview_dashboard page server component me listAdminProducts call
2. helper se products read
3. dashboard KPI derive karta hai:
   - total products
   - draft/published breakdown
   - total stock units
   - inventory value

File:

1. app/admin_overview_dashboard/page.tsx

### 3.4 Auth Flow Reality Check

Important: UI auth page available hai, lekin backend auth APIs abhi implement nahi hain.

Current state:

1. app/auth/page.tsx frontend transition based login UX deta hai
2. submit pe router push hota hai (profile route), real credential verification nahi
3. app/api/auth/login, logout, me, register folders present hain lekin empty hain

Iska matlab:

1. dependencies (bcryptjs, jose) installed hain
2. actual auth API logic abhi pending hai

### 3.5 Checkout/Product/Profile Flow

Storefront pages ka role:

1. cross-page navigation mostly wired hai
2. cart checkout pages me local state based quantity/totals interactions hain
3. ye flows UX functional hain, lekin order placement ka persistent backend lifecycle abhi full implement nahi

## 4) Data Layer: JSON vs Prisma

Project me 2 directions parallel nazar aati hain:

1. Current active CRUD persistence: JSON file (admin-products.json)
2. Scalable planned model: Prisma schema (SQLite datasource + rich ecommerce models)

Prisma status:

1. prisma/schema.prisma me complete ecommerce domain models present hain
2. src/lib/prisma.ts client singleton configured hai
3. lekin admin products CRUD currently Prisma use nahi kar raha, JSON use kar raha hai

Meaning:

1. short-term functional delivery complete (JSON)
2. long-term production path prepared (Prisma schema available)

## 5) apps/mobile Flow

Current status: starter scaffold

1. Expo app setup ready
2. App.tsx me basic placeholder screen
3. No backend integration yet

Useful when:

1. web flows stable hone ke baad mobile features migrate karne hon

## 6) apps/docs Flow

Current status: mostly Turborepo starter/demo content

1. docs app shared UI package usage show karta hai
2. production documentation portal style me abhi customize nahi hua

## 7) Shared Packages Ka Role

1. packages/ui -> reusable UI components (example: button)
2. packages/types -> shared interfaces (Product, User)
3. packages/eslint-config -> lint consistency across apps
4. packages/typescript-config -> tsconfig consistency across apps

## 8) Kon Si Cheez Kidhar Hai (Quick Locator)

Business/UI pages:

1. apps/web/app/*/page.tsx

Admin backend routes:

1. apps/web/app/api/admin/products/route.ts
2. apps/web/app/api/admin/products/[id]/route.ts

Admin data logic:

1. apps/web/src/lib/admin-products.ts
2. apps/web/data/admin-products.json

DB design:

1. apps/web/prisma/schema.prisma
2. apps/web/src/lib/prisma.ts

Shared code:

1. packages/ui/src/*
2. packages/types/index.ts

## 9) End-to-End Functional Flows (As-Is)

### Shopper UX Flow (frontend heavy)

1. Home -> Product page -> Cart checkout -> Profile/Auth routes

### Admin Catalog Flow (backend connected)

1. Admin Products -> create/update/delete -> JSON store update -> Dashboard KPIs reflect data

## 10) Current Gaps (Important)

1. Auth APIs folders empty hain (real login/register/session not implemented)
2. Order management persistent backend lifecycle incomplete
3. Prisma schema ready hai but active CRUD me abhi use nahi ho rahi
4. Mobile app business flow abhi start nahi hua

## 11) Recommended Next Build Order

1. Auth APIs implement karo (login/register/me/logout + JWT/cookie session)
2. Admin products JSON se Prisma migration plan banao
3. Cart -> Order placement -> Payment status -> Order history flow persist karo
4. Mobile app ko same API contracts ke sath integrate karo

## 12) Fast Commands Reference

Root:

1. pnpm dev
2. pnpm build
3. pnpm lint
4. pnpm check-types

Web app specific (root se):

1. pnpm --filter web dev
2. pnpm --filter web db:generate
3. pnpm --filter web db:migrate
4. pnpm --filter web db:studio

---

Agar chaho to next step me main isi file ka ek version bana sakta hoon jisme har major flow ka sequence diagram style (request -> layer -> response) bhi add ho.