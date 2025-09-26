from fastapi import status
from fastapi.testclient import TestClient

def test_root(client):
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"status": "MongoDB connected!"}