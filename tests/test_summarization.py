"""Unit tests for summarization helper functions."""

from backend.services.summarization_service import extract_code_snippets, alias_code_snippets


def test_extract_code_snippets():
    texts = ["Example ```code``` snippet", "No code here"]
    snippets = extract_code_snippets(texts)
    assert snippets == ["```code```"]


def test_alias_code_snippets():
    texts = ["Example ```code``` snippet", "Another ```code``` here"]
    snippets = ["```code```"]
    mapping = alias_code_snippets(snippets, texts)
    assert "[CODE_SNIPPET_1]" in mapping
    assert mapping["[CODE_SNIPPET_1]"] == "```code```"
    assert all("[CODE_SNIPPET_1]" in t for t in texts)
