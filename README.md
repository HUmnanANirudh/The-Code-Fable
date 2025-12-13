# The Code Fable

The Code Fable is a web application that analyzes public GitHub repositories and visualizes their structure as a "fable".

## Architecture

-   **Frontend:** React, Vite, TailwindCSS, and `react-force-graph-2d` for graph visualization.
-   **Backend:** Python, FastAPI, Celery, Redis, and PostgreSQL (mocked with in-memory storage).

## How to Run

### 1. Backend

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

### 2. Frontend

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

### 3. Worker (Optional)

The backend uses a Celery worker to perform the analysis. To run the worker, you'll need to have Redis installed and running.

First, navigate to the `backend` directory:

```bash
cd backend
```

Then, run the Celery worker:

```bash
celery -A worker.worker.celery_app worker --loglevel=info
```

