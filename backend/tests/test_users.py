import pytest
from fastapi import status
from main import app

@pytest.mark.asyncio
async def test_create_user(client):  # client should be AsyncClient from conftest.py
    response = client.post(
        "/users",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "secretpassword",
            "full_name": "Test User"
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["username"] == "testuser"
    assert "id" in data

# return an empty list
@pytest.mark.asyncio
async def test_list_users(client):
    response = client.get("/users")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data == []

# populate db and return all users
@pytest.mark.asyncio
async def test_list_users2(client):
    client.post(
        "/users",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "secretpassword",
            "full_name": "Test User"
        },
    )
    client.post(
        "/users",
        json={
            "username": "testuser2",
            "email": "test2@example.com",
            "password": "secretpassword",
            "full_name": "Test User2"
        },
    )
    response = client.get("/users")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    assert data[0]["username"] == "testuser"
    assert data[1]["username"] == "testuser2"