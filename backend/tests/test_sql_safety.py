"""Tests for the read-only SQL safety validator."""

from __future__ import annotations

import pytest

from app.utils.sql_safety import SqlSafetyError, validate_sql


def test_valid_select_is_allowed():
    assert validate_sql("SELECT name, price FROM products") == (
        "SELECT name, price FROM products LIMIT 100"
    )


def test_existing_limit_is_preserved():
    sql = "SELECT * FROM sales LIMIT 5"
    assert validate_sql(sql) == sql


def test_trailing_semicolon_is_tolerated():
    assert validate_sql("SELECT * FROM products;") == (
        "SELECT * FROM products LIMIT 100"
    )


def test_empty_sql_rejected():
    with pytest.raises(SqlSafetyError):
        validate_sql("")


@pytest.mark.parametrize(
    "malicious",
    [
        "INSERT INTO products (name) VALUES ('x')",
        "UPDATE products SET stock = 0",
        "DELETE FROM products",
        "DROP TABLE products",
        "ALTER TABLE products ADD COLUMN x TEXT",
        "ATTACH DATABASE 'other.db' AS other",
        "PRAGMA table_info(products)",
        "SELECT * FROM products; DROP TABLE products",
        "SELECT * FROM products; SELECT * FROM sales",
        "SELECT * FROM products WHERE name LIKE 'a; DROP TABLE products'",
        "CREATE TABLE evil (id INT)",
        "WITH cte AS (SELECT 1) SELECT * FROM cte",
    ],
)
def test_malicious_sql_rejected(malicious):
    with pytest.raises(SqlSafetyError):
        validate_sql(malicious)


def test_keywords_inside_string_literals_without_word_boundary_ok():
    # "updates" is a different word from "UPDATE".
    sql = "SELECT name FROM products WHERE description LIKE '%updates quickly%'"
    result = validate_sql(sql)
    assert result == (
        "SELECT name FROM products WHERE description LIKE '%updates quickly%' "
        "LIMIT 100"
    )