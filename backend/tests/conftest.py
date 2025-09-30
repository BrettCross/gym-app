import os
import pytest
# import pytest_asyncio
from fastapi.testclient import TestClient

from main import app
# from db.mongo import init_db


# # ------------------------------------
# # 0. set ENVironment variable to test
# # ------------------------------------
os.environ["ENV"] = "test"

# # ----------------------------------------
# # 1. Use a separate MongoDB test database
# # ----------------------------------------
# @pytest_asyncio.fixture(scope="session")
# async def test_db():
#     """
#     Initialize a clean test database before running tests.
#     """
#     print("CREATING A TEST DB")
#     client = await init_db()

#     yield  # tests will run here

#     # Cleanup: drop the test database after tests finish
#     client.drop_database("gym_app_test")
#     client.close()


# ----------------------------------------
# 2. Provide a FastAPI TestClient
# ----------------------------------------
@pytest.fixture
def client():
    """
    Fixture for synchronous test client.
    """
    with TestClient(app) as c:
        yield c
