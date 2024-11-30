# backend/main.py

import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.context import router as context_router
from backend.routes.feedback import router as feedback_router
from backend.routes.categories import router as categories_router  # Import the categories router
from backend.database import init_db, close_db_connection
from backend.services.executor import executor  # Import the executor
from backend.dependencies import vector_db  # Import the vector_db instance
from backend.routes.threads import router as threads_router
from backend.routes.comments import router as comments_router

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

# Initialize FastAPI app
app = FastAPI(title="Chatweaver Backend")

# Include API routes
app.include_router(context_router, prefix="/api", tags=["Context"])
app.include_router(feedback_router, prefix="/api", tags=["Feedback"])
app.include_router(categories_router, prefix="/api", tags=["Categories"])  # Include the categories router
app.include_router(threads_router, prefix="/api", tags=["Threads"])
app.include_router(comments_router, prefix="/api", tags=["Comments"])

# Add CORS middleware (if necessary)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """
    Event triggered when the server starts.
    Initializes the database connection and shared resources.
    """
    logging.info("Starting up resources...")
    print("Start up resources...")
    
    # Initialize the database
    await init_db()
    logging.info("Database initialized.")
    
    # Initialize VectorDB
    await vector_db.initialize()
    logging.info("VectorDB initialized.")

@app.on_event("shutdown")
async def shutdown_event():
    """
    Event triggered when the server shuts down.
    Cleans up resources like database connections and the executor.
    """
    logging.info("Shutting down resources...")
    
    # Close the database connection
    try:
        await close_db_connection()
        logging.info("Database connection closed.")
    except Exception as e:
        logging.error("Error closing database connection: %s", e)
    
    # Shutdown the ThreadPoolExecutor
    try:
        executor.shutdown(wait=True)
        logging.info("ThreadPoolExecutor shutdown complete.")
    except Exception as e:
        logging.error("Error shutting down ThreadPoolExecutor: %s", e)
    
    # Cancel all pending asyncio tasks to ensure shutdown
    try:
        tasks = [task for task in asyncio.all_tasks() if task is not asyncio.current_task()]
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        logging.info("All asyncio tasks cancelled.")
    except Exception as e:
        logging.error("Error cancelling asyncio tasks: %s", e)
    
    logging.info("Shutdown complete.")

@app.get("/")
def root():
    """
    Root endpoint for testing the server's health.
    Returns:
        dict: Health check message.
    """
    return {"message": "Chatweaver Backend is running"}
