# Deployment Guide: Hugging Face Spaces (Docker)

This guide explains how to deploy the Django backend to Hugging Face Spaces using the Docker container configuration we've set up.

## Prerequisites

-   A Hugging Face account (https://huggingface.co/)
-   Git installed locally

## Step 1: Create a New Space

1.  Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **"Create new Space"**.
2.  **Space Name**: Enter a name (e.g., `jbook-backend`).
3.  **License**: Choose a license (e.g., MIT).
4.  **SDK**: Select **Docker**.
5.  **Space Hardware**: Choose **Free** (CPU Basic).
6.  Click **"Create Space"**.

## Step 2: Configure Environment Variables

The application needs certain environment variables to run securely.

1.  In your new Space, go to the **Settings** tab.
2.  Scroll down to **"Variables and secrets"**.
3.  Add the following **Secrets** (for sensitive data):
    *   `SECRET_KEY`: Generate a random long string (you can use an online generator).
    *   `DATABASE_URL`: Your production database URL.
        *   **Option A: External Database (Recommended for Free Tier)**: Use a free PostgreSQL database like **Neon** or **Supabase**. Get the connection string (e.g., `postgres://user:pass@host:port/db`) and paste it here.
        *   **Option B: Persistent SQLite (Paid)**: If you purchase "Persistent Storage" in Hugging Face Space settings, the storage is mounted at `/data`. Set this variable to `sqlite:////data/db.sqlite3` to save the database there.
        *   **Option C: Ephemeral SQLite (Default)**: If you leave this empty, it uses a temporary SQLite file. **WARNING**: All data (users, progress) will be DELETED every time the Space restarts (which happens frequently). Only use this for testing.

4.  Add the following **Variables** (public config):
    *   `DEBUG`: `False` (for production).
    *   `ALLOWED_HOSTS`: `*` (or your specific HF Space domain, e.g., `huggingface.co`).
    *   `CSRF_TRUSTED_ORIGINS`: `https://huggingface.co,https://YOUR_SPACE_NAME.hf.space` (replace with your actual space URL).

## Step 3: Push Code to Hugging Face

You can push the code directly via Git.

1.  **Clone your Space locally** (find the command in your Space's "Files" tab, "Clone this space"):
    ```bash
    git clone https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
    cd YOUR_SPACE_NAME
    ```

2.  **Copy backend files** into this directory.
    *   Copy the entire contents of your local `backend/` folder into the root of the cloned repository. Use:
    ```bash
    cp -r /path/to/jbook/backend/* .
    ```
    *   **Important**: 
        *   The `Dockerfile` must be in the root of the Space repository.
        *   The `README.md` from backend folder (containing YAML metadata like `sdk: docker`) should replace the default README.

3.  **Commit and Push**:
    ```bash
    git add .
    git commit -m "Initial commit"
    git push
    ```

## Step 4: Verification

1.  Go to the **App** tab in your Space.
2.  It will show "Building" status. Wait for it to finish.
3.  Once "Running", you will see the root API response (if you have one) or a Not Found page (since `core/urls.py` might point to `/admin` or `/api`).
4.  Test the API: `https://YOUR_SPACE_NAME.hf.space/api/content/kanji`

## Notes

-   **Database Persistence**: By default, SQLite inside the container resets every time the Space restarts. For real production use, connect to an external PostgreSQL database using the `DATABASE_URL` secret.
-   **Static Files**: Whitenoise is configured to serve static files (like Admin CSS) efficiently.
-   **CORS**: Update `CSRF_TRUSTED_ORIGINS` if you face CSRF errors.

## Testing Locally with Docker

You can run the container locally to verify everything works before pushing.

1.  **Build the image**:
    ```bash
    cd backend
    docker build -t jbook-backend .
    ```

2.  **Run the container**:
    ```bash
    docker run -p 7860:7860 jbook-backend
    ```

3.  Access the API at `http://localhost:7860/api/content/kanji`.
