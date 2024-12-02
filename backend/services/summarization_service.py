from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
import logging
import re

# Initialize the summarization pipeline
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
sentence_transformer = SentenceTransformer("all-MiniLM-L6-v2")  # Or another Sentence Transformer model

def summarize_text_chain(
    comment_chain: list,
    max_summary_length: int = 500,
    block_summary_length: int = 150,
    final_comment_length: int = 300
) -> str:
    """
    Summarize a chain of comments recursively, keeping the most important blocks
    and identifying recurring code snippets or patterns.

    Args:
        comment_chain (list): List of comments to summarize. Each comment should have `text` and `source` fields.
        max_summary_length (int): Maximum total summary length.
        block_summary_length (int): Maximum summary length per block.
        final_comment_length (int): Maximum allowed length for the final comment.

    Returns:
        str: A formatted summary of the comment chain.
    """
    try:
        # Step 1: Extract the text from the comment chain
        comment_texts = [f"{comment['source']}: {comment['text']}" for comment in comment_chain]

        # Step 2: Detect and alias recurring code snippets
        code_snippets = extract_code_snippets(comment_texts)
        aliases = alias_code_snippets(code_snippets, comment_texts)

        # Step 3: Summarize blocks recursively
        summarized_blocks = []
        for i in range(0, len(comment_texts), 3):  # Summarize in blocks of 3 comments
            block = " ".join(comment_texts[i:i + 3])
            summary = summarizer(block, max_length=block_summary_length, min_length=40, do_sample=False)
            summarized_blocks.append(summary[0]['summary_text'])

        # Step 4: Rank blocks by importance
        block_embeddings = sentence_transformer.encode(summarized_blocks, convert_to_tensor=True)
        final_embedding = sentence_transformer.encode(comment_texts[-1], convert_to_tensor=True)
        block_scores = util.pytorch_cos_sim(block_embeddings, final_embedding).squeeze(1)

        # Keep the top-ranked blocks
        top_block_indices = block_scores.argsort(descending=True)[:3]
        top_blocks = [summarized_blocks[i] for i in top_block_indices]

        # Step 5: Summarize the final comment if necessary
        final_comment = comment_texts[-1]
        if len(final_comment) > final_comment_length:
            final_comment = summarizer(final_comment, max_length=final_comment_length, min_length=100, do_sample=False)[0]['summary_text']

        # Step 6: Format the summary
        formatted_summary = (
            "This is a summary of a conversation between users and an LLM, "
            "where 'User' represents human inputs and 'LLM' represents model responses. "
            "Recurring code snippets have been aliased where possible.\n\n"
        )
        if aliases:
            formatted_summary += "Aliases for code snippets:\n" + "\n".join(f"{alias}: {snippet}" for alias, snippet in aliases.items()) + "\n\n"

        formatted_summary += "\n\n".join(top_blocks) + "\n\nFinal comment:\n" + final_comment
        return formatted_summary

    except Exception as e:
        logging.error(f"Error in summarizing comment chain: {e}")
        return "\n".join(comment['text'] for comment in comment_chain)  # Fallback to concatenated text

def extract_code_snippets(texts: list) -> list:
    """
    Extract code snippets from a list of texts using regex.

    Args:
        texts (list): List of text strings.

    Returns:
        list: List of unique code snippets.
    """
    code_pattern = re.compile(r"```.*?```", re.DOTALL)
    snippets = set()
    for text in texts:
        snippets.update(code_pattern.findall(text))
    return list(snippets)

def alias_code_snippets(snippets: list, texts: list) -> dict:
    """
    Replace recurring code snippets with aliases.

    Args:
        snippets (list): List of code snippets.
        texts (list): List of text strings.

    Returns:
        dict: A mapping of aliases to code snippets.
    """
    alias_map = {}
    for idx, snippet in enumerate(snippets):
        alias = f"[CODE_SNIPPET_{idx + 1}]"
        alias_map[alias] = snippet
        for i, text in enumerate(texts):
            texts[i] = text.replace(snippet, alias)
    return alias_map
