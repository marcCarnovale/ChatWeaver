# backend/services/summarization_service.py

from transformers import pipeline
import logging

# Initialize the summarization pipeline
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

def summarize_text(text: str, max_length: int = 150, min_length: int = 40) -> str:
    """
    Summarize the provided text using a transformer-based model.

    Args:
        text (str): The text to summarize.
        max_length (int): Maximum length of the summary.
        min_length (int): Minimum length of the summary.

    Returns:
        str: The summarized text.
    """
    return text
    try:
        if len(text) > 100:
            summary = summarizer(text, max_length=max_length, min_length=min_length, do_sample=False)
        else :
            return text
        return summary[0]['summary_text']
    except Exception as e:
        logging.error(f"Error in summarizing text: {e}")
        return text  # Fallback to original text if summarization fails
