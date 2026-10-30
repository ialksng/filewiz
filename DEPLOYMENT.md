# Deploy FileWiz on Vercel

The repository is configured as one Vercel project. Vercel builds the React app and serves the Express API from the same deployment, so the browser uses `/work/projects/filewiz/api/...` on the same domain. The app's public URL is `https://ialksng.me/work/projects/filewiz/`.

## Create the Vercel project

1. Import this GitHub repository into Vercel.
2. Set **Root Directory** to the repository root (`.`), not `client` or `server`.
3. Name the Vercel project `filewiz-ialksng` so the main `ialksng` site's Vercel routing can forward requests to `https://filewiz-ialksng.vercel.app`.
4. Leave the framework as Vite (or let Vercel detect it). The repository's `vercel.json` sets the build command to `npm run build`, output to `client/dist`, and routes the app's `/work/projects/filewiz/api/*` path to the Express function.
5. Add the environment variables below in Vercel for Production and Preview as appropriate, then deploy. Test on the generated `*.vercel.app` URL first.

Do not set a separate API host or `VITE_API_BASE_URL` in Vercel. Production API requests use `/work/projects/filewiz/api` on the same domain as the app. The browser based file tools can run without account credentials, but API features need the relevant services configured.

Do not add `ialksng.me` as a custom domain to this FileWiz project. The main `ialksng` Vercel project owns that domain and forwards `/work/projects/filewiz/*` to this project's `*.vercel.app` hostname. See the main site's `VERCEL_DEPLOYMENT.md` for the shared-domain routing setup.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string, for example a MongoDB Atlas connection string |
| `JWT_SECRET` | Long, random secret used to sign account sessions |
| `GOOGLE_CLIENT_ID` | Google Web OAuth client ID verified by the API |
| `VITE_GOOGLE_CLIENT_ID` | Same Web OAuth client ID, exposed to the browser for Google sign-in |
| `GEMINI_API_KEY` | Gemini API key for the assistant and document summaries |

In Google Cloud Console, authorize `https://ialksng.me` as a JavaScript origin. Keep Google client secrets and Gemini keys out of `VITE_` variables; only the public Google client ID belongs in `VITE_GOOGLE_CLIENT_ID`.

## Optional environment variables

| Variable | Purpose |
| --- | --- |
| `APP_ORIGIN` | Password reset link base. Set to `https://ialksng.me/work/projects/filewiz` |
| `GEMINI_MODEL` | Gemini model override; defaults to `gemini-3.8-flash` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | SMTP delivery for forgot-password emails; required to deliver reset links |
| `FILEWIZ_ADMIN_EMAIL` | Email address granted account administration |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `FILEWIZ_PREMIUM_PRICE_PAISE` | Optional premium billing configuration |

`VERCEL_URL` is supplied by Vercel and used for preview CORS. `MONGODB_URI`, `JWT_SECRET`, and service keys must be set in the Vercel project settings; Vercel does not provide the MongoDB database, OAuth application, Gemini account, or SMTP service.

The API health endpoint is `/api/status`. Vercel functions use temporary storage for request files, so uploaded files are not kept between requests. The main file tools process files in the browser. Optional server-side PDF compression also requires Ghostscript (`gs`); it is not included in the standard Vercel function runtime.

## Local development

Install dependencies from the repository root with `npm ci`. Run the Vite frontend with `npm run dev`; run the Express API in a second terminal with `npm run api:dev` and configure `server/.env` from `server/.env.example`. For local API-backed sign-in, set `client/.env.local` from `client/.env.example`; production should leave `VITE_API_BASE_URL` unset.

The Vercel production build can be reproduced from the repository root with `npm run build`.
