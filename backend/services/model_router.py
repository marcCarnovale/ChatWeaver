# backend/services/model_router.py

import logging

from openai import OpenAI

from backend.config import OPENAI_API_KEY

local_llm = None
tokenizer = None
MAX_TOKENS = 1024  # GPT-2's maximum token limit


def _initialize_local_model():
    """Load the optional local model only when a caller requests it."""
    global local_llm, tokenizer
    from transformers import AutoTokenizer, pipeline

    if local_llm is None:
        local_llm = pipeline("text-generation", model="gpt2", pad_token_id=50256)
    if tokenizer is None:
        tokenizer = AutoTokenizer.from_pretrained("gpt2")


openAPI_client = None
def init_openapi_session() :
    # Initialize OpenAI client
    global openAPI_client
    openAPI_client = OpenAI(
        api_key=OPENAI_API_KEY,
    )


openai_embedding_dimension = 1536  # For OpenAI's text-embedding-ada-002
openai_index = None


def _get_openai_index():
    global openai_index
    if openai_index is None:
        try:
            import faiss
        except ImportError as error:
            raise RuntimeError(
                "FAISS is not installed. Install backend/requirements-ml.txt."
            ) from error
        openai_index = faiss.IndexFlatL2(openai_embedding_dimension)
    return openai_index

def add_to_faiss(text):
    """
    Add text embeddings to FAISS index.
    """
    if openAPI_client is None :
        init_openapi_session()
    client = openAPI_client
    embedding_response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    import numpy as np

    embedding = embedding_response.data[0].embedding
    embedding_np = np.array(embedding).astype('float32')
    _get_openai_index().add(np.expand_dims(embedding_np, axis=0))

def search_openai_faiss(query, top_k=5):
    """
    Search FAISS index for similar texts.
    """
    if openAPI_client is None :
        init_openapi_session()
    client = openAPI_client
    embedding_response = client.embeddings.create(
        input=query,
        model="text-embedding-ada-002"
    )
    import numpy as np

    embedding = embedding_response.data[0].embedding
    embedding_np = np.array(embedding).astype('float32')
    distances, indices = _get_openai_index().search(np.expand_dims(embedding_np, axis=0), top_k)
    return indices[0]  # Return top_k indices


def get_openai_response(prompt: str, model: str = "gpt-4") -> str:
    """
    Get response from OpenAI GPT API using the new OpenAI client.
    """
    if openAPI_client is None :
        init_openapi_session()
    client = openAPI_client
    try:
        logging.info(f"Generating AI response using OpenAI model: {model}")
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=model,
        )
        logging.info("AI response generated successfully.")
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"Error generating OpenAI response: {e}")
        return ""


def create_open_ai_batch_responses(prompts, model="gpt-4"):
    """
    Create a batch of AI responses for multiple prompts.
    """
    if openAPI_client is None :
        init_openapi_session()
    client = openAPI_client
    batch_payload = {
        "requests": [
            {
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "model": model,
            }
            for prompt in prompts
        ]
    }
    try:
        batch_response = client.batches.create(**batch_payload)
        return batch_response["responses"]
    except Exception as e:
        logging.error(f"Error creating batch responses: {e}")
        return []


def truncate_prompt(prompt: str, max_tokens: int = MAX_TOKENS) -> str:
    """
    Truncate the prompt to ensure it does not exceed the model's maximum token limit.
    
    Args:
        prompt (str): The input prompt.
        max_tokens (int): The maximum number of tokens allowed.
    
    Returns:
        str: Truncated prompt.
    """
    _initialize_local_model()
    tokens = tokenizer.encode(prompt, add_special_tokens=False)
    if len(tokens) > max_tokens - 150:  # Reserve space for max_new_tokens
        tokens = tokens[-(max_tokens - 150):]  # Keep the last tokens
        truncated_prompt = tokenizer.decode(tokens, clean_up_tokenization_spaces=True)
        logging.warning("Prompt truncated to fit the model's maximum token limit.")
        return truncated_prompt
    return prompt

def get_local_llm_response(prompt: str, model: str = "gpt2") -> str:
    """
    Get response from a local Hugging Face LLM.
    """
    # Truncate the prompt if necessary
    _initialize_local_model()
    truncated_prompt = truncate_prompt(prompt)
    
    response = local_llm(
        truncated_prompt, 
        max_new_tokens=150,  # Specify the number of new tokens to generate
        num_return_sequences=1,
        pad_token_id=50256  # Ensure pad_token_id is set
    )
    return response[0]["generated_text"].strip()

def get_response(prompt: str, model_type: str = "openai", model_name: str = "gpt-4") -> str:
    """
    Route prompt to the appropriate model.
    """
    if model_type == "openai":
        return get_openai_response(prompt, model=model_name)
    elif model_type == "local":
        return get_local_llm_response(prompt, model=model_name)
    elif model_type == "None":
        return ""
    else:
        raise ValueError("Unsupported model type.")
