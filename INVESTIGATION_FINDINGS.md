# E-Commerce Application Flow Investigation Report
**Date:** May 25, 2026  
**Status:** Critical Issues Found ⚠️

---

## 🔐 1. AUTH FLOW CHECK

### ✅ Session Retrieval Logic
- **File:** [src/lib/auth-session.ts](src/lib/auth-session.ts)
- **Function:** `getSessionFromRequest()` (line 42)
- **Status:** Working correctly for NextAuth sessions
- **Details:** Uses NextAuth's `getServerSession()` to retrieve sessions
- **Issue:** Only works with NextAuth sessions, doesn't handle custom JWT tokens

### ✅ getCurrentUserFromRequest Logic
- **File:** [src/lib/get-current-user.ts](src/lib/get-current-user.ts#L121)
- **Function:** `getCurrentUserFromRequest()` (line 121)
- **Status:** Dual token support implemented
- **Flow:**
  1. First attempts NextAuth JWT token via `getToken()`
  2. Falls back to custom JWT token via `readAuthTokenFromRequest()`
  3. Returns `SanitizedAuthUser` with role resolved from database

### ❌ CRITICAL: Role Checking After Login (auth-client.tsx)
- **File:** [app/auth/auth-client.tsx](app/auth/auth-client.tsx#L140-L161)
- **Location:** Lines 140-161 (post-login logic)
- **Issue:** Role determination logic appears correct BUT...
```typescript
const role = mePayload.user?.role ?? "CUSTOMER";  // Line 147 & 153
router.push(role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin_overview_dashboard" : "/");
```
- **Root Cause:** `role` value depends on `/api/auth/me` response - see next item

### ❌ CRITICAL: /api/auth/me Endpoint Role Response
- **File:** [app/api/auth/me/route.ts](app/api/auth/me/route.ts)
- **Status:** Returns role correctly IF database has role assigned
- **Problem:** User role assignment depends on ADMIN_EMAILS check
- **Missing Data:**
  - `ADMIN_EMAILS` environment variable is **NOT SET** in `.env.local`
  - Without it, `getAdminEmails()` returns empty array
  - Admin email check in middleware always fails
  - **SEE ISSUE #1 BELOW**

### ✅ JWT Token Verification
- **File:** [src/lib/auth.ts](src/lib/auth.ts#L127-L150)
- **Function:** `verifyAuthToken()` (line 127)
- **Status:** Working correctly
- **Details:** Uses `jose` library with HS256 algorithm
- **Validation:** Checks for required fields (sub, email, role)

### ❌ Middleware Protection for /admin_* Routes
- **File:** [middleware.ts](middleware.ts)
- **Protected Routes:**
  ```
  /admin_overview_dashboard/:path*
  /admin_products/:path*
  /admin_orders/:path*
  /admin_returns/:path*
  /admin_post_edit_product/:path*
  /api/admin/:path*
  ```
- **Status:** Middleware checks tokens BUT...
- **Critical Problem at Line 27:**
  ```typescript
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
  });
  ```
  If both are the same (they are!), token retrieval works BUT:
  
- **Failing at Lines 33-36:**
  ```typescript
  const adminByRole = tokenRoles.includes("ADMIN") || tokenRoles.includes("SUPER_ADMIN");
  const adminByEmail = getAdminEmails().includes(normalizedEmail);  // ← EMPTY!
  
  if (!adminByRole && !adminByEmail) {
    return forbiddenResponse(request);  // ← BLOCKS ACCESS
  }
  ```
  - `tokenRoles` may be empty if user was created before role assignment
  - `getAdminEmails()` returns empty array (env var missing)
  - **Result: Unauthorized 403 to ALL admin routes**

---

## 🔴 CRITICAL FINDING #1: ADMIN_EMAILS Not Configured

### Issue Details
- **Severity:** 🔴 CRITICAL - Blocks all admin access
- **Missing Variable:** `ADMIN_EMAILS` in `.env.local`
- **Current Value:** Not set (empty list)
- **Expected Format:** `ADMIN_EMAILS=admin@example.com,owner@example.com`

### Where It's Used
1. **middleware.ts (line 26):** `getAdminEmails()` called to check access
2. **next-auth.ts (line 149):** `getAdminEmails()` called in authorize callback
3. **src/lib/auth.ts (line 84-92):** `getAdminEmails()` function returns empty array

### Code Flow
```
User logs in
  ↓
NextAuth CredentialsProvider.authorize() called
  ↓
getAdminEmails() checks if email in list → Returns EMPTY []
  ↓
User role NOT set to ADMIN (only CUSTOMER)
  ↓
/api/auth/me returns role: "CUSTOMER"
  ↓
auth-client.tsx redirects to "/" not "/admin_overview_dashboard"
  ↓
If user tries direct access to /admin routes → middleware blocks (adminByEmail empty)
```

### Solution Required
Add to `.env.local`:
```
ADMIN_EMAILS=admin@example.com,owner@example.com
```

---

## 🔴 CRITICAL FINDING #2: Hybrid Database Architecture

### Issue Details
- **Severity:** 🔴 CRITICAL - Causes data inconsistency and failed orders
- **Problem:** Application uses BOTH MongoDB AND Prisma simultaneously
- **Data Split:**
  - **Prisma:** User, Cart, CartItem, Product, ProductVariant
  - **MongoDB:** Order, Payment, Shipment, Review (legacy)
- **Location:** [src/lib/ecommerce-db.ts](src/lib/ecommerce-db.ts)

### Conflicting Checkout Functions

#### Function #1: `checkoutFromPrismaCart()` (Line 1239)
```typescript
// Mixes two databases:
const cartRow = await prisma.cart.findUnique(...);  // Prisma
const decremented = await prisma.productVariant.updateMany(...);  // Prisma
const orderResult = await orders.insertOne(orderBody);  // MongoDB ← DIFFERENT DB!
```
**Problem:** If MongoDB insert fails after Prisma updates, stock is decremented but order doesn't exist
**Error Handler:** Lines 1403-1425 attempts rollback but:
- Can't rollback if MongoDB write fails partway through
- User sees "Failed to finalize order" but stock is already gone

#### Function #2: `checkoutCart()` (Line 1661)
- Uses MongoDB only for both cart and orders
- Deprecated/legacy implementation

#### Function #3: `placeOrderFromItems()` (Line 1661)
- Uses MongoDB only
- Called by `/api/orders` POST endpoint

### API Route Inconsistency
| Route | Function Used | Database | Issue |
|-------|---|---|---|
| POST /api/checkout | `checkoutFromPrismaCart()` | Prisma cart + MongoDB order | 🔴 Hybrid |
| POST /api/orders | `placeOrderFromItems()` | MongoDB only | ⚠️ Legacy |

### Error Logs
- **Line 1403:** `console.error("Mongo order insert failed after Prisma checkout; rolling back.");`
- **Line 1425:** `console.error("Checkout rollback failed", rollbackErr);`

---

## 📦 2. ADMIN REDIRECT ISSUE

### Current Behavior
After successful login in `auth-client.tsx` (lines 133-161):

```typescript
// Line 133-138: signIn via NextAuth
const loginResult = await signIn("credentials", {
  email: form.email.trim(),
  password: form.password,
  redirect: false,
});

// Line 140-147: Fetch user role from /api/auth/me
const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
const mePayload = await meResponse.json();
const role = mePayload.user?.role ?? "CUSTOMER";

// Line 153: Redirect based on role
router.push(role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin_overview_dashboard" : "/");
```

### Why Redirect Fails

**Scenario 1: ADMIN_EMAILS not set**
- Login succeeds ✓
- `/api/auth/me` returns `role: "CUSTOMER"` (not "ADMIN")
- User redirected to "/" instead of "/admin_overview_dashboard" ✗

**Scenario 2: Role assigned but token not updated**
- Database has user with ADMIN role
- NextAuth session might not include role immediately
- `/api/auth/me` calls `getCurrentUserFromRequest()`
- This queries database for role - should work ✓

**Scenario 3: Timing Issue**
- `signIn()` completes
- NextAuth creates JWT with old role
- Immediately fetches `/api/auth/me` 
- If JWT callback hasn't run yet, role might be stale

### What's Broken
```
✗ Role not in response from /api/auth/me
  ↓ Because: ADMIN_EMAILS is empty
  ↓ Because: User created without admin role
  ↓ Because: getAdminEmails() returns []
  ↓ Result: No redirect to admin dashboard
  ↓ Plus: Middleware blocks direct access to /admin routes (403)
```

---

## 📦 3. ORDER PLACEMENT FLOW

### API Endpoints

#### POST /api/orders (Line 1-75)
- **Auth:** Requires session via `requireSession(request)`
- **Input:** Array of items with productId/quantity
- **Processing:** Uses `placeOrderFromItems()` (MongoDB-based)
- **Issues:**
  - Expects item list but user has cart in Prisma
  - Doesn't use Prisma cart at all
  - No inventory conflict management
  - Missing cart clearing after order

#### POST /api/checkout (Line 1-200)
- **Auth:** Requires session via `requireSession(request)`
- **Input:** Shipping address, payment method, coupon
- **Processing:** 
  1. Validates address (all fields required)
  2. Calls `checkoutFromPrismaCart(session.userId, {...})`
  3. Attempts Stripe session creation if `paymentMethod === "card"`
- **Issues:**
  - Uses hybrid Prisma+MongoDB approach ⚠️
  - Complex Stripe line item calculation (lines 19-66)
  - Stock decrement happens before order finalization

### Cart Retrieval
- **Location:** [app/api/cart/route.ts](app/api/cart/route.ts)
- **Implementation:** `readUserCart()` - Uses Prisma
- **Database:** Queries `prisma.cart` with nested relationships
- **Issue:** Cart in Prisma but orders might need to go to MongoDB

### Order Creation Flow (checkoutFromPrismaCart)

```
1. Fetch Prisma cart with all items
   ↓
2. Validate product availability & status
   ↓
3. Validate stock quantities
   ↓
4. Calculate pricing (shipping, tax, discount)
   ↓
5. Apply coupon if provided
   ↓
6. TRANSACTION: Decrement stock in Prisma
   ↓
7. Insert order into MongoDB
   ↓ IF FAILS:
8. ROLLBACK: Increment stock back in Prisma
   ↓
9. Create notification
   ↓
10. Update coupon usage count (MongoDB)
```

### Error Scenarios

| Scenario | Handling | Issue |
|----------|----------|-------|
| Empty cart | Returns error | ✓ Correct |
| Product unavailable | Returns error | ✓ Correct |
| Insufficient stock | Returns error | ✓ Correct |
| Stock changed during checkout | Aborts transaction | ✓ Correct (Prisma) |
| MongoDB insert fails | Attempts Prisma rollback | ⚠️ May partially fail |
| Coupon invalid | Returns error | ✓ Correct |
| Shipping address incomplete | Returns 400 | ✓ Correct |

### API Error Handling
- **Line 38-40:** AuthError → 401 response
- **Line 52-54:** Validation error → 400 response with details
- **Line 56-58:** Order creation error → 500 response
- **Line 69-72:** Generic catch → 500 response

---

## 🔍 4. GENERAL ISSUES

### Console Logging & Error Handling

| Location | Type | Line | Issue |
|----------|------|------|-------|
| middleware.ts | Info | — | No error logging for blocked requests |
| next-auth.ts | ERROR | 221 | OAuth user sync failure logged |
| checkout/route.ts | WARN | 165 | Stripe zero order total (info only) |
| checkout/route.ts | ERROR | 190 | Stripe session creation failure |
| auth/me/route.ts | ERROR | 38 | Generic "Auth me API failed" |
| ecommerce-db.ts | ERROR | 1403 | Mongo insert failure after Prisma update |
| ecommerce-db.ts | ERROR | 1425 | Checkout rollback failed |
| ecommerce-db.ts | WARN | 234 | Invalid env config for rules |

### TypeScript Issues
- ✅ No strict TypeScript errors detected in auth flow
- ✅ No type mismatches in API responses
- ⚠️ Type assertion on line 1661 uses `as never` (suspicious)

### Environment Variables Analysis

**Currently Set in .env.local:**
```
✓ DATABASE_URL=mongodb+srv://...
✓ MONGODB_URL=mongodb+srv://...
✓ MONGODB_DB_NAME=1ecom
✓ JWT_SECRET=f3c9e5a1b7d24f6c8e3a9d1f7b4c6e8a2d5f9b1c7e4a8d6f0c2b9e1a4d7f3c8
✓ NEXTAUTH_SECRET=f3c9e5a1b7d24f6c8e3a9d1f7b4c6e8a2d5f9b1c7e4a8d6f0c2b9e1a4d7f3c8
✓ JWT_EXPIRY=7d
✓ NEXTAUTH_URL=http://localhost:3000
✓ NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Missing Critical Variables:**
```
✗ ADMIN_EMAILS (CRITICAL - blocks admin role assignment)
✗ STRIPE_SECRET_KEY (optional - required for card payments)
✗ STRIPE_WEBHOOK_SECRET (optional - required for webhooks)
```

### Incomplete Implementations

| Feature | Status | Details |
|---------|--------|---------|
| Admin Email Auth | 🔴 Broken | ADMIN_EMAILS not set |
| NextAuth OAuth | ⚠️ Partial | Google/GitHub conditional on env vars |
| Stripe Payments | ⚠️ Partial | Only if STRIPE_SECRET_KEY set |
| Order Notifications | ✅ Complete | Mongo-based |
| Coupon System | ✅ Complete | With usage tracking |
| Inventory Management | ⚠️ Risky | Dual database decrement |

### Database Schema Issues

**Prisma Order Model:**
```prisma
model Order {
  totalInCents    Int        // Stored as cents
  shippingInCents Int        // Stored as cents
  taxInCents      Int        // Stored as cents
  discountInCents Int        // Stored as cents
}
```

**MongoDB Order Schema:**
```javascript
{
  total: number,           // Decimal dollars
  shippingCost: number,   // Decimal dollars
  taxAmount: number,      // Decimal dollars
  discountAmount: number  // Decimal dollars
}
```

**Mismatch Issues:**
- Field names different (totalInCents vs total)
- Units different (cents vs dollars)
- If system tries to migrate orders between databases, conversion errors likely
- Status enums also differ between systems

---

## 📋 INVESTIGATION CHECKLIST - ISSUES FOUND

### Authentication Flow ✓
- [x] Session retrieval working via NextAuth
- [x] JWT token verification working
- [x] getCurrentUserFromRequest handles dual tokens
- [x] Middleware protects admin routes (structure correct)
- [❌] ADMIN_EMAILS environment variable NOT SET
- [❌] Admin users cannot get ADMIN role
- [❌] Middleware blocks admin access (adminByEmail is empty list)

### Admin Redirect ✓
- [x] auth-client.tsx redirect logic looks correct
- [x] /api/auth/me endpoint returns role correctly
- [❌] Role determination fails - user gets CUSTOMER instead of ADMIN
- [❌] Root cause: getAdminEmails() returns empty array (missing env var)
- [❌] Users redirected to "/" instead of "/admin_overview_dashboard"
- [x] No console errors in auth-client.tsx (uses try/catch)

### Order Placement Flow ✓
- [x] Order creation endpoints exist (/api/orders, /api/checkout)
- [x] Cart checkout API working (Prisma-based)
- [x] API error handling implemented
- [x] Auth guard implemented (requireSession)
- [❌] Dual database architecture causes risk (Prisma + MongoDB)
- [❌] Three conflicting checkout functions
- [❌] Order table schema mismatch between databases
- [❌] Potential data loss if MongoDB insert fails after Prisma decrement

### General Issues ✓
- [x] Console.error logging present for critical failures
- [x] No critical TypeScript errors
- [x] Environment variables mostly configured
- [❌] ADMIN_EMAILS is missing (critical)
- [❌] STRIPE_SECRET_KEY optional (card payments won't work)
- [❌] Incomplete implementation: Hybrid database system

---

## 🚨 ROOT CAUSE ANALYSIS

### Why Admin Access is Broken

**Primary Cause:** `ADMIN_EMAILS` not in environment

**Cascading Failures:**
```
1. ADMIN_EMAILS missing from .env.local
   ↓
2. getAdminEmails() returns []
   ↓
3. User login doesn't assign ADMIN role
   ↓
4. /api/auth/me returns role: "CUSTOMER"
   ↓
5. auth-client.tsx redirects to "/" not "/admin_overview_dashboard"
   ↓
6. If user navigates to /admin directly, middleware blocks (403)
   ↓
7. Middleware: adminByEmail.includes() on empty list = false
   ↓
8. forbiddenResponse returns 403 Forbidden
```

### Why Order System is Fragile

**Primary Cause:** Using two databases simultaneously

**Risk Scenarios:**
```
1. User adds items to Prisma cart
   ↓
2. User clicks "Checkout"
   ↓
3. System decrements stock in Prisma ✓
   ↓
4. System tries to insert order into MongoDB
   ↓
5. MongoDB insert fails (network, auth, etc.)
   ↓
6. Rollback runs but Prisma transaction already committed ✗
   ↓
7. Stock gone but order not created
   ↓
8. Inventory corrupted
```

---

## 📊 SEVERITY SUMMARY

| Issue | Severity | Impact | Fix Complexity |
|-------|----------|--------|-----------------|
| ADMIN_EMAILS missing | 🔴 CRITICAL | No admin access | Low |
| Hybrid DB architecture | 🔴 CRITICAL | Data corruption risk | High |
| Multiple checkout functions | 🔴 CRITICAL | Inconsistent behavior | High |
| Role timing issue | 🟠 HIGH | Occasional redirect failures | Medium |
| Schema mismatch | 🟠 HIGH | Migration/integration issues | High |
| Stripe integration incomplete | 🟡 MEDIUM | Card payments may fail | Medium |
| OAuth setup incomplete | 🟡 MEDIUM | Social login unavailable | Medium |

---

## ✅ NEXT STEPS

1. **IMMEDIATE (Critical):**
   - [ ] Add `ADMIN_EMAILS` to `.env.local`
   - [ ] Verify admin user can access /admin routes
   - [ ] Test admin redirect after login

2. **SHORT TERM (High Priority):**
   - [ ] Consolidate checkout functions (use Prisma exclusively or MongoDB exclusively)
   - [ ] Fix order creation to use single database
   - [ ] Implement proper transaction handling

3. **MEDIUM TERM (Important):**
   - [ ] Review and fix database schema mismatch
   - [ ] Add STRIPE_SECRET_KEY configuration
   - [ ] Complete OAuth setup (Google/GitHub)

4. **LONG TERM (Enhancement):**
   - [ ] Migrate all data to single database (Prisma)
   - [ ] Remove MongoDB dependency
   - [ ] Consolidate cart/order system
