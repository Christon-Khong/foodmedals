# Task: Add Google, Facebook, X/Twitter OAuth

Add 3 free OAuth providers to this NextAuth v4 app. Keep existing email/password login working.

## Files already modified (validate + fix types only)

These files have already been updated. Run `npx prisma generate` to regenerate types, then fix any remaining TS errors.

### `prisma/schema.prisma` — DONE
- `passwordHash` changed to `String?`
- `Account` model added
- `accounts Account[]` added to User

### `.env` — DONE
- 6 empty OAuth vars added: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`

### `lib/auth.ts` — DONE
- GoogleProvider, FacebookProvider, TwitterProvider (v2.0) added
- Custom `foodMedalsAdapter()` written (maps `displayName`↔`name`, `avatarUrl`↔`image`)
- CredentialsProvider guards `!user.passwordHash` for OAuth-only users

### `app/auth/signin/page.tsx` — DONE
- 3 social buttons (Google, Facebook, X) with inline SVG icons
- "or" divider between social and email form
- Submit button text → "Sign in with email"

### `app/auth/signup/page.tsx` — DONE
- Same 3 social buttons + divider
- Submit button text → "Create account with email"

### `prisma/migrations/20260303000000_add_oauth_accounts/migration.sql` — DONE
- `ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`
- `CREATE TABLE "accounts"` with FK to users

## Steps to run

```bash
# 1. Generate Prisma client with new Account model
npx prisma generate

# 2. Apply migration to database
npx prisma migrate deploy

# 3. Type-check
npx tsc --noEmit

# 4. Build
npm run build
```

## If tsc finds errors

The custom adapter in `lib/auth.ts` may need type annotations adjusted after `prisma generate` updates the client types. Key things to check:

- `prisma.account` must exist (needs regenerated client)
- `createUser` data param: type as `{ name?: string | null; email: string; image?: string | null; emailVerified?: Date | null }`
- `linkAccount` data param: type as `AdapterAccount`
- `updateUser` data param: type as `Partial<AdapterUser> & Pick<AdapterUser, "id">`
- `provider_providerAccountId` compound unique key must match schema

## Constraints

- DO NOT install `@auth/prisma-adapter` — we use a custom adapter because User schema uses `displayName`/`avatarUrl` not `name`/`image`
- DO NOT change session strategy — must stay `jwt`
- DO NOT remove CredentialsProvider
- DO NOT modify any files outside the ones listed above
