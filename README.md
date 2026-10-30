# FileWiz

FileWiz is a MERN based file utilities app. The React frontend and Express API deploy together as one Vercel project, with MongoDB as the app's database. Its public route is `https://ialksng.me/work/projects/filewiz/`.

## Local development

1. Install Node.js 20 or later.
2. Run `npm ci` from the repository root.
3. Copy `server/.env.example` to `server/.env` and configure MongoDB and the services you want to use.
4. Run `npm run dev` for the frontend and `npm run api:dev` in a second terminal for the API.
5. For local API calls, copy `client/.env.example` to `client/.env.local`. Production uses same-origin `/api` and should leave `VITE_API_BASE_URL` unset.

The browser based file tools can work without an account. Sign-in and account recovery use MongoDB, Google sign-in requires a Google Web OAuth client ID, assistant features require a Gemini API key, and password reset emails require SMTP settings.

## Deploy

Import the repository root into Vercel. The root `vercel.json` sets the build and output paths, mounts the API as a Vercel function, and routes the site under `/work/projects/filewiz/`. Configure the production environment variables listed in [DEPLOYMENT.md](DEPLOYMENT.md).

## Privacy and external services

Most file tools process files in the browser. QR codes are generated locally. Ads are opt-in and only load on tool pages after a visitor allows them. Authentication, URL shortening, optional Google Drive saves, AI assistance, and optional server-side PDF compression have separate data flows described in the Privacy Policy.

MongoDB, Google OAuth, Gemini, email delivery, payment, and ad-network services must be configured by the project owner. Live payments are not implemented or enabled.
