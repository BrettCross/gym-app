import pytest
from httpx import AsyncClient
from fastapi import status
from main import app

@pytest.mark.asyncio
async def test_create_user(client):  # client should be AsyncClient from conftest.py
    response = client.post(
        "/users",
        json={
            "username": "testuser3",
            "email": "test3@example.com",
            "password": "secretpassword",
            "full_name": "Test User"
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["username"] == "testuser3"
    assert "id" in data


# import pytest
# from fastapi import status

# @pytest.mark.asyncio
# async def test_create_user(client):
#     response = client.post(
#         "/users",
#         json={
#             "username": "testuser",
#             "email": "test@example.com",
#             "password": "secretpassword",
#             "full_name": "Test User"
#         },
#     )
#     assert response.status_code == status.HTTP_201_CREATED
#     data = response.json()
#     assert data["username"] == "testuser"
#     assert "id" in data

