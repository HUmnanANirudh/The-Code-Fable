# The Code Fable
<img width="1240" height="447" alt="screenshot-2025-12-14_08-31-16" src="https://github.com/user-attachments/assets/668a86a4-4a76-4339-97cc-29a24272c42b" />


The Code Fable is a web application that analyzes public GitHub repositories and visualizes their structure as a "The Tale".

<img width="1240" height="600" alt="screenshot-2025-12-14_16-46-20" src="https://github.com/user-attachments/assets/7bc775eb-d3d7-4613-8e7a-bb73d39dd9a2" />


## Architecture

-   **Frontend:** React, Vite, TailwindCSS, and `react-force-graph-2d`(D3.js) for graph visualization.
-   **Backend:** Python, FastAPI, Celery, Redis.

  

## How to Run

### Option 1: Docker (Recommended)

The easiest way to run the entire project is using Docker Compose, which sets up all services (backend, frontend, worker, PostgreSQL, and Redis) automatically.

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

**Useful Docker commands:**
```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Restart a specific service
docker-compose restart backend
```

**Environment variables:** For production or custom configuration, create a `.env` file in the root directory with your settings (database credentials, API keys, etc.).

### Option 2: Manual Setup

#### 1. Backend

First, navigate to the `backend` directory:

```bash
cd backend
```

Then, create a virtual environment and install the dependencies:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Finally, run the backend server:

```bash
uvicorn app.main:app --reload
```

#### 2. Frontend

In a separate terminal, navigate to the `frontend` directory:

```bash
cd frontend
```

Then, install the dependencies:

```bash
npm install
```

Finally, run the frontend development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### 3. Worker

The backend uses a Celery worker to perform the analysis. To run the worker, you'll need to have Redis installed and running.

First, navigate to the `backend` directory:

```bash
cd backend
```

Then, run the Celery worker:

```bash
celery -A worker.worker.celery_app worker --loglevel=info
```

