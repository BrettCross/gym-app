import json
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv

from backend.database import init_db
from backend.models.exercise import Exercise
from backend.utils.constants import SYSTEM_USER_ID


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

load_dotenv()

async def seed_exercises():
    """
    Main execution logic for seeding the Global Exercise Library.
    """

    try:
        await init_db()
        logger.info("Database connection initialized successfully.")

        base_path = Path(__file__).resolve().parent.parent
        file_path = base_path / "scripts" / "seed_data.json"

        if not file_path.exists():
            logger.error(f"Seed file not found at: {file_path}")
            return

        with open(file_path, "r") as f:
            exercises_data = json.load(f)
        
        logger.info(f"Loaded {len(exercises_data)} exercises from seed file.")

        count = 0
        for item in exercises_data:
            exists = await Exercise.find_one(
                Exercise.name == item["name"],
                Exercise.user_id == SYSTEM_USER_ID
            )

            if not exists:
                new_exercise = Exercise(**item, user_id=SYSTEM_USER_ID)
                await new_exercise.insert()
                count += 1
                logger.debug(f"Inserted: {item['name']}")
            else:
                logger.debug(f"Skipped existing: {item['name']}")

        logger.info(f"Seeding complete! {count} new records added.")

    except Exception as e:
        logger.error(f"Seeding failed with error: {e}")
        
    finally:
        # Note: Beanie/Motor handles connection closing via the event loop
        logger.info("Seeding process finished.")

if __name__ == "__main__":
    # Ensure the script runs within the asyncio event loop
    asyncio.run(seed_exercises())