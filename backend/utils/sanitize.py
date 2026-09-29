import bleach


ALLOWED_TAGS = {
    "a", "b", "blockquote", "br", "code", "del", "em", "h1", "h2", "h3",
    "h4", "hr", "i", "li", "ol", "p", "pre", "s", "strong", "table",
    "tbody", "td", "th", "thead", "tr", "u", "ul",
}
ALLOWED_ATTRIBUTES = {
    "a": ["href", "title"],
    "td": ["colspan", "rowspan"],
    "th": ["colspan", "rowspan"],
}


def sanitize_html(value):
    if not isinstance(value, str):
        return value
    return bleach.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        protocols={"http", "https", "mailto"},
        strip=True,
        strip_comments=True,
    )


def sanitize_json_strings(value):
    if isinstance(value, str):
        return sanitize_html(value)
    if isinstance(value, list):
        return [sanitize_json_strings(item) for item in value]
    if isinstance(value, dict):
        return {key: sanitize_json_strings(item) for key, item in value.items()}
    return value
