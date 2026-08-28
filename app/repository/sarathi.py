from .applications import ApplicationsRepository
from .auth import AuthRepository
from .database import Database
from .licence import LicenceRepository
from .slots import SlotsRepository
from .tests import TestsRepository


class SarathiRepository(
    AuthRepository,
    ApplicationsRepository,
    SlotsRepository,
    TestsRepository,
    LicenceRepository,
):
    """Composed repository facade exposing all API persistence operations."""

    tasks = ("vehicle_category", "documents", "test_slot", "mock_test", "learner_licence")

    def __init__(self, database: Database):
        self.database = database

    @property
    def pool(self):
        if not self.database.pool:
            raise RuntimeError("Database is not connected.")
        return self.database.pool
