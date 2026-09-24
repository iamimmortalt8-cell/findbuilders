# FindBuilders Backend API 🛠️

The backend service for FindBuilders provides administrative functions, email notifications, authentication middleware, and privileged database operations.

## Architecture

- **Runtime**: Node.js & Express
- **Language**: TypeScript (`tsx` for dev, `tsc` for production)
- **Database Client**: `@supabase/supabase-js` (with Service Role credentials)
- **Email Service**: Resend (`resend`) with HTML email templates and deduplication guard
- **Security**: Helmet, CORS whitelist, JWT validation, Express rate limiting, Zod schema validation

## Structure

```
backend/
├── src/
│   ├── controllers/      # Route handler logic
│   ├── email/            # Email service, templates & delivery guard
│   ├── lib/              # Supabase admin client and validators
│   ├── middleware/       # Auth, error handling, rate limiting & validation
│   ├── routes/           # Express route definitions (auth, admin, products, profiles)
│   ├── services/         # Business logic layer
│   ├── types/            # TypeScript type definitions
│   └── server.ts         # Main Express application entry point
├── dotenv-preload.ts     # Dotenv preloader for tsx / node
├── package.json
└── tsconfig.json
```

## Setup & Running

### Environment Configuration

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

### Scripts

```bash
# Development (with auto-reload via tsx)
npm run dev

# Build TypeScript to dist/
npm run build

# Start production server
npm run start
```
