from typing import Any

import asyncpg


class Database:
    """Owns the PostgreSQL pool used by repositories and request handlers."""

    def __init__(self, database_url: str):
        self.database_url = database_url
        self.pool: asyncpg.Pool | None = None

    async def connect(self) -> asyncpg.Pool:
        self.pool = await asyncpg.create_pool(
            self.database_url,
            min_size=1,
            max_size=8,
            server_settings={"search_path": "sarathi,public"},
        )
        return self.pool

    async def close(self) -> None:
        if self.pool:
            await self.pool.close()
            self.pool = None

    def _routine_query(self, name: str, args: tuple[Any, ...], scalar: bool = False) -> tuple[str, tuple[Any, ...]]:
        placeholders = ", ".join(f"${index}" for index in range(1, len(args) + 1))
        query = f"SELECT {name}({placeholders}) AS value" if scalar else f"SELECT * FROM {name}({placeholders})"
        return query, args

    async def routine_fetch(self, name: str, *args: Any) -> list[asyncpg.Record]:
        if not self.pool:
            raise RuntimeError("Database is not connected.")
        query, values = self._routine_query(name, args)
        return await self.pool.fetch(query, *values)

    async def routine_fetchrow(self, name: str, *args: Any) -> asyncpg.Record | None:
        if not self.pool:
            raise RuntimeError("Database is not connected.")
        query, values = self._routine_query(name, args)
        return await self.pool.fetchrow(query, *values)

    async def routine_fetchval(self, name: str, *args: Any) -> Any:
        if not self.pool:
            raise RuntimeError("Database is not connected.")
        query, values = self._routine_query(name, args, scalar=True)
        return await self.pool.fetchval(query, *values)

    async def routine_execute(self, name: str, *args: Any) -> None:
        if not self.pool:
            raise RuntimeError("Database is not connected.")
        query, values = self._routine_query(name, args, scalar=True)
        await self.pool.execute(query, *values)
