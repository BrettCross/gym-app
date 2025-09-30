from fastapi import status
from fastapi.testclient import TestClient

def test_root(client):
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"status": "MongoDB connected!"}

# import pytest
# from httpx import ASGITransport, AsyncClient

# from main import app


# @pytest.mark.asyncio
# async def test_root(client):
#     response = await client.get("/")
#     assert response.status_code == 200
#     assert response.json() == {"status": "MongoDB connected!"}