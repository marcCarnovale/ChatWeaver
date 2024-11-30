"""
HTML Parsing Module

This module provides functionality to parse ChatGPT conversation HTML into structured JSON.
"""

from bs4 import BeautifulSoup
import json
import asyncio
from concurrent.futures import ProcessPoolExecutor
from typing import Dict

executor = ProcessPoolExecutor()

def parse_chatgpt_html_sync(html_content: str) -> Dict:
    """
    Synchronous function to parse ChatGPT HTML into structured JSON.

    Args:
        html_content (str): Raw HTML of the ChatGPT conversation.

    Returns:
        dict: Parsed conversation data.
    """
    soup = BeautifulSoup(html_content, "html.parser")
    parsed_data = {"conversation_id": None, "nodes": []}
    
    # Extract conversation ID
    conversation_id = soup.find("div", {"class": "conversation-id"})
    if conversation_id:
        parsed_data["conversation_id"] = conversation_id.text.strip()
    
    # Extract messages
    for message in soup.find_all("div", {"class": "message"}):
        role = message.get("data-role", "unknown")
        content = message.find("div", {"class": "content"}).text.strip()
        timestamp = message.get("data-timestamp", None)
        model = message.get("data-model", "unknown")
    
        parsed_data["nodes"].append({
            "role": role,
            "content": content,
            "timestamp": timestamp,
            "model": model
        })
    
    return parsed_data

async def parse_chatgpt_html(html_content: str) -> Dict:
    """
    Asynchronous wrapper for parsing ChatGPT HTML.

    Args:
        html_content (str): Raw HTML of the ChatGPT conversation.

    Returns:
        dict: Parsed conversation data.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, parse_chatgpt_html_sync, html_content)
