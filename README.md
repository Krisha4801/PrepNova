# PrepNova

PrepNova is a mock interview simulator with an Express backend and a vanilla HTML/CSS/JavaScript frontend.

## Setup

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Create your backend environment file:

```bash
cp .env.example .env
```

Fill in only the values you need. `MONGO_URI` is optional for the interview flow. `GROQ_API_KEY` is only needed if you want LLM fallback behavior.

## Run

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend/src
python -m http.server 5173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/index.html
```

The frontend expects the backend at:

```text
http://localhost:5000
```
