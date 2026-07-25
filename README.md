# Mandala — Full-Stack Ecommerce Site

A complete, self-hosted ecommerce stack for **Mandala**: a minimalist storefront selling authentic Nepali handicraft, a real Express + SQLite backend, and an admin dashboard for managing products and orders yourself — no code editing required after setup.

```
mandala-fullstack/
├── server/     Express API + SQLite database (products, orders, admin auth)
├── public/     The storefront (what customers see)
└── admin/      The admin dashboard (what you use to manage the store)
```

One Node process serves all three — the storefront, the admin dashboard, and the API — so there's only one thing to run and one thing to deploy.

## 1. Run it locally

You'll need [Node.js](https://nodejs.org) **22.5 or newer** installed (check with `node -v`). The database uses Node's built-in SQLite support, so there's no native module to compile — no Xcode Command Line Tools, no build errors, nothing else to install.

```bash
cd server
npm install
cp .env.example .env
npm run seed      # creates the database, loads 12 starter products, creates your admin login
npm start
```

You'll see `ExperimentalWarning: SQLite is an experimental feature` in the terminal when the server starts — that's expected and harmless, just Node letting you know its built-in SQLite support is newer API surface. It doesn't affect anything.

Then open:
- **Storefront:** http://localhost:3000
- **Admin dashboard:** http://localhost:3000/admin

Default admin login (set in `server/.env`, only used the first time you seed):
- Email: `admin@mandala.com`
- Password: `mandala2026`

**Log in and change this password immediately** — Account settings for password change is available via `POST /api/auth/change-password`, or edit `ADMIN_PASSWORD` in `.env` and re-seed on a fresh database.

## 2. Managing your store day to day

Once it's running, go to `/admin`:

- **Products** — add, edit, delete products; upload your own photos (drag-and-drop not required, just click to upload); toggle a product visible/hidden on the storefront without deleting it.
- **Orders** — every order placed through checkout is saved for real. View customer details, items, and totals, and move an order through statuses (pending → processing → shipped → completed).

Nothing here requires touching code. The old approach of editing a `products.js` file by hand is gone — this is a real backend now.

## 3. How orders and payment work right now

Checkout saves a real order to the database with the customer's shipping details and the items they bought — that part is fully functional today. Card payment is **not** connected to a live processor yet, so no money actually changes hands through the site. To start accepting real payments:

1. Create a [Stripe](https://stripe.com) account (or PayPal, if you prefer).
2. Add your Stripe secret key to `server/.env` as `STRIPE_SECRET_KEY`.
3. Wire `server/routes/orders.js` to create a Stripe Checkout Session and only mark the order paid after Stripe confirms it (Stripe's docs walk through this — "Checkout Session" + webhook is the standard pattern).

This is the one piece intentionally left for you to connect, since it requires your own Stripe/PayPal account and business details.

## 4. Deploying so the site is live on the internet

This is a normal Node.js app, so it runs on most hosts. A few good options:

**Render or Railway (easiest)**
- Create a new "Web Service" from your repo, root directory `server/`.
- Build command: `npm install`. Start command: `npm start`.
- Add the environment variables from `.env.example` in the host's dashboard (set real values, especially `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`).
- **Important:** SQLite (`mandala.db`) and uploaded images (`server/uploads/`) are plain files. Most cloud hosts wipe the filesystem on every deploy unless you attach a **persistent disk/volume** — both Render and Railway support this. Mount it at `server/` (or point `DB_PATH` and uploads storage at the mounted folder) so your products and orders survive redeploys.
- After first deploy, run `npm run seed` once (Render/Railway both let you run a one-off shell command) to create your admin login.

**A VPS (DigitalOcean, Linode, etc.)**
- Clone the repo, `cd server && npm install`, copy `.env.example` to `.env` and fill it in, `npm run seed`, then run it with a process manager like `pm2` so it stays up (`pm2 start server.js --name mandala`).
- Put Nginx or Caddy in front for HTTPS.

**A note on scale:** SQLite is genuinely fine for a small-to-medium store — it's a real, durable database, not a toy. If you outgrow it later, swapping `server/db.js` for Postgres is a contained change since all the queries live in the `routes/` files.

## 5. Environment variables (`server/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | Port the server listens on (default 3000) |
| `JWT_SECRET` | Signs admin login sessions — set to a long random string in production |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only by `npm run seed` to create your first admin account |
| `STRIPE_SECRET_KEY` | Optional, for connecting real payments (see §3) |

## 6. Brand details

- **Tagline used on-site:** "Bring Home the Spirit of the Himalayas" (hero headline), eyebrow "Handcrafted in Nepal"
- **Palette:** warm cream background, charcoal ink, terracotta + maroon + gold accents
- **Type:** Fraunces (display serif) + Jost (body sans), loaded from Google Fonts
- **Placeholder imagery:** every product photo currently comes from free stock photography (Pexels), standing in for real product shots. Replace them via the admin dashboard's image upload whenever you have real photography — no code changes needed.

## 7. What's still a placeholder / next steps

- **Payments** — see §3, needs your Stripe/PayPal account.
- **Transactional email** — customers don't yet get an order confirmation email; the "order confirmed" screen is shown in-browser only. Adding this means picking an email provider (Resend, Postmark, SendGrid) and sending from `routes/orders.js` after an order is created.
- **Shipping/tax rules** — shipping is currently a flat $12 (free over $120), and there's no tax calculation. Both are simple to adjust in `server/routes/orders.js`.
- **Newsletter and contact forms** — currently show a success message in the browser but aren't connected to a real email list or inbox yet.
