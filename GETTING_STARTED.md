# 🚀 Getting Started Guide

This guide will help you get the Lyric Video Generator up and running in 10 minutes.

## Step 1: Prerequisites Check

Make sure you have installed:

```bash
# Check Node.js version (need 18+)
node --version

# Check npm version (need 9+)
npm --version

# Check Docker (optional but recommended)
docker --version
docker-compose --version

# Check Python (need 3.11+)
python3.12 --version  # Should show 3.12.x
```

If you're missing any, install them:
- [Node.js](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Python 3.12**: `brew install python@3.12` (macOS) or [Python.org](https://www.python.org/downloads/)

## Step 2: Clone & Install

```bash
# Navigate to the project directory
cd "/Users/evejohns/Projects/Lyrics Video Generator"

# Install all dependencies
npm install

# This will install dependencies for:
# - Root workspace
# - Frontend
# - Backend
# - Shared types
```

## Step 3: Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Open .env and configure (minimal setup for local dev):
# - DATABASE_URL: Use default (postgres://postgres:password@localhost:5432/lyric_video_generator)
# - JWT_SECRET: Set to any random string
# - Everything else can use defaults for now
```

## Step 4: Start Services

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL, Redis, Python service, and MinIO
npm run docker:up

# Wait about 30 seconds for services to start

# Check if services are running
docker ps
```

You should see 4 containers running:
- `lvg-postgres` (PostgreSQL)
- `lvg-redis` (Redis)
- `lvg-python-sync` (Python AI service)
- `lvg-minio` (S3-compatible storage)

### Option B: Manual Setup (Advanced)

If you don't want to use Docker:

1. **Install PostgreSQL 16** locally
2. **Install Redis 7** locally
3. **Create database**: `createdb lyric_video_generator`
4. **Set up Python environment**:
   ```bash
   cd backend/python
   ./run-local.sh  # This will set up venv and start the service
   ```

## Step 5: Initialize Database

```bash
# Run database migrations (creates all tables)
npm run db:migrate

# This will execute backend/src/database/schema.sql
```

## Step 6: Start Development Servers

Open **two terminal windows**:

### Terminal 1: Backend + Frontend
```bash
npm run dev
```

This starts:
- Frontend dev server on http://localhost:5173
- Backend API server on http://localhost:3000

### Terminal 2: Python Sync Service (if not using Docker)
```bash
cd backend/python
./run-local.sh
```

Note: This automatically uses Python 3.12 and sets up a virtual environment.

## Step 7: Open the App

Visit http://localhost:5173 in your browser!

You should see:
- ✅ Landing page with "Get Started Free" button
- ✅ Sign up form works
- ✅ Dashboard (after signup)

## 🎉 Success!

You now have the full stack running:

| Service | URL | Status Check |
|---------|-----|--------------|
| Frontend | http://localhost:5173 | Open in browser |
| Backend API | http://localhost:3000 | http://localhost:3000/health |
| Python Sync | http://localhost:8000 | http://localhost:8000/health |
| PostgreSQL | localhost:5432 | `psql -U postgres -d lyric_video_generator` |
| Redis | localhost:6379 | `redis-cli ping` |
| MinIO | http://localhost:9001 | Login: minioadmin / minioadmin |

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Or if using local PostgreSQL
psql -U postgres -l
```

### Python Service Not Starting

```bash
# Check Python version (need 3.11+)
python3 --version

# Install dependencies manually
cd backend/python
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend Shows 404 for API Calls

Make sure:
1. Backend is running on port 3000
2. Check `frontend/vite.config.ts` proxy settings
3. Check browser console for CORS errors

## 📚 Next Steps

Now that everything is running:

1. **Create an account** at http://localhost:5173/register
2. **Explore the dashboard** - empty for now, but structure is there
3. **Check the API** - Visit http://localhost:3000/health
4. **Read the main README.md** for architecture details
5. **Start building features** - Check the spec document for what to build next

## 🔥 Quick Test

Test the API manually:

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "<your-test-password>",
    "name": "Test User"
  }'

# You should get back a token and user object
```

## 💡 Development Tips

1. **Hot Reload**: Frontend and backend auto-reload on file changes
2. **Logs**: Watch the terminal for errors
3. **Database GUI**: Use [pgAdmin](https://www.pgadmin.org/) or [TablePlus](https://tableplus.com/)
4. **API Testing**: Use [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/)
5. **Code Formatting**: Run `npm run format` before committing

## 🆘 Need Help?

- Check the main [README.md](README.md)
- Review the [full spec document](# Lyric Video Generator - Complete App Specification.md)
- Check Docker logs: `docker-compose logs -f`
- Database logs: `docker logs -f lvg-postgres`

Happy coding! 🎵✨
