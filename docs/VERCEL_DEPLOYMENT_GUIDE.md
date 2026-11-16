# PrepNova deployment on Vercel

This guide covers the current target architecture: the React/Vite frontend and Express API are separate Vercel projects from this repository; the FastAPI AI service will run on AWS. Deploy the backend first, then configure and deploy the frontend with its API URL.

## Vercel projects

Create two Vercel projects connected to the same Git repository:

| Project | Root directory | Framework / build settings |
|---|---|---|
| Frontend | `frontend` | Vite; build `npm run build`; output `dist` |
| Backend | `backend` | Express; no build command required; `src/app.js` exports the Express app |

The existing `frontend/vercel.json` rewrite supports React client-side routes. The Express app connects to MongoDB when a request reaches an API route; production requests return `503` when `MONGO_URI` is missing or the database cannot connect. It does not fall back to localhost in production.

## Environment variables

Set these in the **backend Vercel project** for Preview and Production as needed:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | Remote MongoDB connection string; never use localhost in Vercel. |
| `JWT_SECRET` | Long random secret for application tokens. |
| `JWT_EXPIRES_IN` | Token lifetime, for example `7d`. |
| `FRONTEND_URL` | Exact deployed frontend origin, such as `https://<frontend-project>.vercel.app`; comma-separate any explicitly allowed origins. |
| `AI_SERVICE_URL` | HTTPS base URL for the AWS FastAPI service; add after the teammate provides it. |
| `AI_SERVICE_API_KEY` | Optional shared service key; if used, configure the same key in AWS. |
| `AI_SERVICE_TIMEOUT_MS` | Backend timeout for calls to the AI service; currently defaults to 30000 ms. |
| `DEEPGRAM_API_KEY` | Required for voice interview token generation. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Google OAuth credentials and callback. Set the callback to `https://<backend-project>.vercel.app/api/auth/oauth/google/callback` and add it to the Google OAuth client. |
| `PASSWORD_RESET_SECRET` | Secret used by the password reset flow. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `EMAIL_FROM_NAME` | Configure password reset and security email delivery. |

Set this **build-time variable in the frontend Vercel project** for Preview and Production:

```text
VITE_API_URL=https://<backend-project>.vercel.app
```

Do not include a trailing slash. Redeploy the frontend after changing this variable. Add secrets through Vercel project settings; do not commit them to `.env` files.

When the AWS service is ready, set `AI_SERVICE_URL` in the backend project and configure the shared key on both services if authentication is enabled. Until then, backend routes that need AI extraction, interview generation, or RAG cannot complete their AI work.

## Deployment order and smoke checks

1. Create the backend Vercel project with root directory `backend` and add its environment variables.
2. Deploy it and open `https://<backend-project>.vercel.app/health`. It should return status `ok` and database `connected`.
3. Set `FRONTEND_URL` to the frontend’s exact production origin. Update the Google OAuth redirect URI if OAuth is enabled.
4. Create the frontend Vercel project with root directory `frontend`, set `VITE_API_URL` to the backend origin, and deploy.
5. Check registration/login and browser console/network errors. After AWS publishes the AI URL, set `AI_SERVICE_URL` and verify resume/JD extraction and interview generation end to end.

## Current Vercel constraints

- Vercel Functions cap request and response bodies at **4.5 MB**. PrepNova's backend currently accepts PDF uploads up to 10 MB and the frontend advertises 5 MB, so uploads above Vercel's function payload limit will be rejected before Express sees them. Use a direct-to-object-storage upload flow or host the API somewhere that supports the intended upload size before treating large PDF uploads as production-ready.
- The live speech flow opens its WebSocket from the browser directly to Deepgram; the backend only issues the short-lived token. This does not require hosting a WebSocket server on Vercel.
- Keep the API and database in nearby regions when selecting Vercel and MongoDB regions. The AI service can remain on AWS; the backend calls it over HTTPS.

## Local checks

From the repository root:

```powershell
cd backend
node --test --test-concurrency=1 tests/unit/*.test.js
cd ..\frontend
npm run build
cd ..\AIService
python -m unittest discover -s tests -p "test_*.py" -v
```

The backend integration suite also requires an isolated MongoDB instance. The AWS URL is needed for production AI smoke checks.
