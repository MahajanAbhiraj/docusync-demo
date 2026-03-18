from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import expenses, accounts
import os

app = FastAPI(
    title="Personal Expense Tracker API",
    description="Backend API for managing personal expenses.",
    version="1.0.0"
)

app.include_router(expenses.router)
app.include_router(accounts.router)

# Ensure static directory exists
os.makedirs("static", exist_ok=True)

# Mount the static directory to serve CSS and JS
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/health")
def health_check():
    """
    Health check endpoint to verify the API is running.
    """
    return {"status": "ok", "version": "1.0.0"}

@app.get("/")
def read_root():
    """
    Serve the main UI of the application.
    """
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
