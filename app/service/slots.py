import json
from datetime import UTC, datetime
from typing import Any

import asyncpg

from .common import external_id


def slot_payload(row: asyncpg.Record) -> dict[str, Any]:
    starts = datetime.combine(row["slot_date"], row["start_time"], tzinfo=UTC)
    ends = datetime.combine(row["slot_date"], row["end_time"], tzinfo=UTC)
    seats = row["capacity"] - row["booked_count"]
    return {"slotId": external_id("slot", row["id"]), "startsAt": starts.isoformat(), "endsAt": ends.isoformat(), "availableSeats": seats, "status": "available" if seats else "full"}


def question_payload(row: asyncpg.Record) -> dict[str, Any]:
    options = row["options"] if isinstance(row["options"], list) else json.loads(row["options"])
    return {"questionId": external_id("question", row["id"]), "text": row["question_text"], "answers": [{"answerId": option["id"], "text": option["text"]} for option in options]}
