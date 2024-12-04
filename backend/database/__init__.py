# backend/database/__init__.py

from databases import Database
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData, Table, Column, Integer, String, ForeignKey, Text, UniqueConstraint
from sqlalchemy import Column, Integer, String, ForeignKey, Text, UniqueConstraint, Boolean
import json

DATABASE_URL = "sqlite+aiosqlite:///./chatweaver.db"

# Initialize Async Database and Metadata
metadata = MetaData()

# Define Conversations table
conversations = Table(
    "conversations",
    metadata,
    Column("conversation_id", String, primary_key=True),
    Column("data", String, nullable=False),
)

# Define Feedback table
feedback = Table(
    "feedback",
    metadata,
    Column("context_id", String, primary_key=True),
    Column("flags", Integer, default=0),
    Column("approvals", Integer, default=0),
)


# Define Categories table
categories = Table(
    "categories",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", String, unique=True, nullable=False),
    Column("description", Text, nullable=True),
)


# Define the Threads table
threads = Table(
    "threads",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("category_id", Integer, ForeignKey("categories.id"), nullable=False),
    Column("title", String, nullable=False),
    Column("description", Text, nullable=True),
    Column("root_comment_id", Integer),
)


comments = Table(
    "comments",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("thread_id", Integer, ForeignKey("threads.id"), nullable=False),
    Column("parent_id", Integer, ForeignKey("comments.id"), nullable=True),
    Column("text", Text, nullable=False),
    Column("flags", Integer, default=0),
    Column("approvals", Integer, default=0),
    Column("model_name", String, nullable=True),
    Column("hidden", Boolean, default=False),
)

embedding_mapping = Table(
    "embedding_mapping",
    metadata,
    Column("faiss_index", Integer, primary_key=True, autoincrement=True),
    Column("thread_id", Integer, ForeignKey("threads.id"), unique=True, nullable=False),
)


# Asynchronous SQLAlchemy engine and sessionmaker
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

database = Database(DATABASE_URL)


async def init_db():
    """
    Initializes the database connection and creates tables if they do not exist.
    """
    print("Initializing database...")
    async with engine.begin() as conn:
        # Create all tables, including the modified threads table
        await conn.run_sync(metadata.create_all)
    # Connect the asynchronous database
    await database.connect()
    print("Database initialized.")

async def close_db_connection():
    """
    Closes the database connection and disposes of the engine.
    """
    print("Closing database connection...")
    await database.disconnect()
    await engine.dispose()
    print("Database connection closed.")

async def save_conversation(conversation):
    """
    Save a conversation into the database.
    
    Args:
        conversation (dict): Parsed conversation data.
    """
    query = conversations.insert().values(
        conversation_id=conversation["conversation_id"],
        data=json.dumps(conversation)
    )
    await database.execute(query)

async def get_conversation(conversation_id):
    """
    Retrieve a conversation from the database.
    
    Args:
        conversation_id (str): ID of the conversation to retrieve.
    
    Returns:
        dict: Retrieved conversation data or None if not found.
    """
    query = conversations.select().where(conversations.c.conversation_id == conversation_id)
    row = await database.fetch_one(query)
    if row:
        return json.loads(row["data"])
    return None

async def save_feedback(context_id, action):
    """
    Log feedback (flag or approve) for a retrieved context.
    
    Args:
        context_id (str): Unique identifier for the context.
        action (str): Either "flag" or "approve".
    """
    query = feedback.select().where(feedback.c.context_id == context_id)
    existing = await database.fetch_one(query)
    if not existing:
        # Insert new feedback record
        insert_query = feedback.insert().values(
            context_id=context_id,
            flags=1 if action == "flag" else 0,
            approvals=1 if action == "approve" else 0
        )
        await database.execute(insert_query)
    else:
        # Update existing feedback record
        if action == "flag":
            update_query = feedback.update().where(feedback.c.context_id == context_id).values(flags=feedback.c.flags + 1)
        elif action == "approve":
            update_query = feedback.update().where(feedback.c.context_id == context_id).values(approvals=feedback.c.approvals + 1)
        else:
            raise ValueError("Invalid action")
        await database.execute(update_query)

async def save_context(context_id: str, text: str):
    """
    Save a context into the database.
    
    Args:
        context_id (str): Unique identifier for the context.
        text (str): The context text.
    """
    query = threads.insert().values(
        thread_id=context_id,
        text=text,
        flags=0,
        approvals=0
    )
    await database.execute(query)

async def get_feedback_summary() -> dict:
    """
    Retrieve aggregated feedback metrics.
    
    Returns:
        dict: Total flags and approvals.
    """
    try:
        total_flags = await database.fetch_val("SELECT SUM(flags) FROM feedback")
        total_approvals = await database.fetch_val("SELECT SUM(approvals) FROM feedback")
        return {
            "total_flags": total_flags if total_flags else 0,
            "total_approvals": total_approvals if total_approvals else 0
        }
    except Exception as e:
        print(f"Error fetching feedback summary: {e}")
        return {"total_flags": 0, "total_approvals": 0}

async def save_threads(threads_list):
    """
    Save multiple threads into the database.
    
    Args:
        threads_list (list): List of context dictionaries.
    """
    async with database.transaction():
        for context in threads_list:
            await save_context(context["thread_id"], context["text"])
