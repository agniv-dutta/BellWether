"""Tests for the /health endpoint."""


def test_health_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "project" in body
    assert "chat_model" in body


def test_health_returns_json(client):
    response = client.get("/health")
    assert response.headers["content-type"].startswith("application/json")