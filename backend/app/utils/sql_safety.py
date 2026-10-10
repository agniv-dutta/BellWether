"""Read-only SQL validation used by the merchant copilot.

Guarantees that model-generated SQL can only ever be a single read-only
``SELECT`` statement. The query is also executed on a read-only SQLite
connection, so even a bypass here cannot mutate data.
"""

from __future__ import annotations

import re

FORBIDDEN_KEYWORDS = (
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "ATTACH",
    "DETACH",
    "PRAGMA",
    "CREATE",
    "REPLACE",
    "VACUUM",
    "REINDEX",
)

DEFAULT_LIMIT = 100


class SqlSafetyError(ValueError):
    """Raised when generated SQL does not pass the safety checks."""


def validate_sql(sql: str) -> str:
    """Validate ``sql`` and return it with a guaranteed ``LIMIT``.

    Raises :class:`SqlSafetyError` if the statement could modify data or
    contains more than one statement.
    """
    if not sql or not sql.strip():
        raise SqlSafetyError("Empty SQL statement.")

    body = sql.strip().rstrip(";").strip()
    if not body:
        raise SqlSafetyError("Empty SQL statement.")

    # Reject multiple statements (any semicolon inside the body).
    if ";" in body:
        raise SqlSafetyError("Multiple SQL statements are not allowed.")

    # Must be a single SELECT statement.
    if not re.match(r"^\s*select\b", body, re.IGNORECASE):
        raise SqlSafetyError("Only single SELECT queries are allowed.")

    # Reject known write / dangerous keywords.
    for keyword in FORBIDDEN_KEYWORDS:
        if re.search(rf"\b{re.escape(keyword)}\b", body, re.IGNORECASE):
            raise SqlSafetyError(f"Keyword '{keyword}' is not allowed.")

    # Enforce a row limit.
    if not re.search(r"\blimit\s+\d+\s*$", body, re.IGNORECASE):
        body = body.rstrip() + f" LIMIT {DEFAULT_LIMIT}"

    return body