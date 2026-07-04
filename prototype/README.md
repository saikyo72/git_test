# ClassPay (MVP)

Small MVP to track class payments.

Setup (developer):

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client (after configuring `DATABASE_URL`):

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Run in development:

```bash
npm run dev
```

Next steps: implement DB schema, authentication, rooms, uploads.
