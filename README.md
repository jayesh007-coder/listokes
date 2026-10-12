# Listokes — AI Life Optimization Application

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jayesh007-coder/listokes)

A full-stack server-based personal life optimization application:
- **Backend**: Python FastAPI with async PostgreSQL engine (`asyncpg` + `SQLAlchemy 2.0`), bcrypt password hashing, and HS256 JWT tokens.
- **Database**: PostgreSQL 16 with UUID primary keys and foreign-key isolation.
- **Frontend**: React Native Expo SDK 57 (iOS, Android, Web) with reactive auth state and live server sync.

---

## 🚀 1-Click Free Cloud Hosting (Render.com)

Click the button above or follow these steps:
1. Open [https://render.com/deploy?repo=https://github.com/jayesh007-coder/listokes](https://render.com/deploy?repo=https://github.com/jayesh007-coder/listokes).
2. Sign in with GitHub.
3. Render reads [`render.yaml`](./render.yaml) and automatically provisions:
   - **`listokes-api`**: Free FastAPI Web Service with HTTPS URL (`https://listokes-api.onrender.com`).
   - **`listokes-db`**: Free Managed PostgreSQL Database.
4. Click **Apply** — your backend is online 24/7!

---

## 📱 Running the Mobile Frontend

```bash
# Install dependencies
npm install

# Start on web browser
npm run web

# Or start on Android / iOS
npm run android
npm run ios
```

### Connect App to Hosted Backend:
1. Open the Listokes mobile app.
2. Tap the **Backend Status Banner** at the top.
3. Enter your live cloud URL (e.g. `https://listokes-api.onrender.com`).
4. Tap **Save & Test** — the indicator turns green (**Backend Online**).

---

## 💻 Running the Backend Locally (Optional)

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # On Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
