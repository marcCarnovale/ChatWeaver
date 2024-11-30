"""
Management Script for Chatweaver

This script provides command-line functionality to parse HTML conversations and store them in the database.
"""

import argparse
import asyncio
from services.html_parser import parse_chatgpt_html
from services.context_service import save_conversation
from pathlib import Path
from backend.database import init_db

async def main():
    parser = argparse.ArgumentParser(description="Chatweaver Management Script")
    parser.add_argument("--parse-html", type=str, help="Path to ChatGPT HTML file to parse and store.")
    parser.add_argument("--init-db", action="store_true", help="Initialize the database.")
    
    args = parser.parse_args()
    
    if args.init_db:
        # Call the database initialization function
        print("Initializing database...")
        await init_db()
        print("Database initialized successfully.")

    if args.parse_html:
        html_path = Path(args.parse_html)
        if not html_path.exists():
            print(f"File {args.parse_html} does not exist.")
            return
        
        with open(html_path, "r", encoding="utf-8") as file:
            html_content = file.read()
        
        parsed_conversation = parse_chatgpt_html(html_content)
        await save_conversation(parsed_conversation)
        print(f"Conversation {parsed_conversation['conversation_id']} saved successfully.")

if __name__ == "__main__":
    asyncio.run(main())
