import json
import os
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from smolagents import CodeAgent, tool
from smolagents.models import OpenAIModel


ROOT_DIR = Path(__file__).resolve().parents[1]
DATASET_PATH = ROOT_DIR / "src" / "assets" / "mock-spotify-listener-data.json"


def _load_dataset() -> dict:
    with DATASET_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


@tool
def get_current_datetime(timezone: str = "UTC") -> str:
    """Return the current datetime in ISO and local formats for a given IANA timezone.

    Args:
        timezone: IANA timezone such as America/Los_Angeles.
    """
    now = datetime.now(ZoneInfo(timezone))
    return json.dumps(
        {
            "timezone": timezone,
            "iso": now.isoformat(),
            "readable": now.strftime("%Y-%m-%d %H:%M:%S"),
        }
    )


@tool
def get_listener_summary() -> str:
    """Return listener profile and 30-day summary metrics from local Spotify mock data."""
    data = _load_dataset()
    return json.dumps(
        {
            "listenerProfile": data.get("listenerProfile", {}),
            "summary": data.get("summary", {}),
        }
    )


@tool
def get_top_items(category: str, limit: int = 5) -> str:
    """Return top genres, artists, or tracks from local Spotify mock data.

    Args:
        category: One of genres, artists, or tracks.
        limit: Maximum number of records returned.
    """
    data = _load_dataset()
    bounded_limit = max(1, min(int(limit), 20))

    mapping = {
        "genres": data.get("topGenres30d", []),
        "artists": data.get("topArtists30d", []),
        "tracks": data.get("topTracks30d", []),
    }

    if category not in mapping:
        return json.dumps({"error": "Unknown category. Use genres, artists, or tracks."})

    return json.dumps({"items": mapping[category][:bounded_limit]})


def _build_task(messages: list[dict]) -> str:
    transcript_lines = []
    for message in messages:
        role = message.get("role", "user")
        content = message.get("content", "")
        transcript_lines.append(f"{role}: {content}")

    transcript = "\n".join(transcript_lines)
    return (
        "You are Resonate, a concise Spotify assistant. "
        "Use tools when factual listener data is needed.\n\n"
        "Conversation transcript:\n"
        f"{transcript}\n\n"
        "Write only the final assistant response to the latest user message."
    )


def main() -> int:
    raw = sys.stdin.read().strip()
    payload = json.loads(raw) if raw else {}
    messages = payload.get("messages", [])

    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("GPT_API_KEY")
    if not api_key:
        print(json.dumps({"content": "OpenAI API key is missing."}))
        return 0

    model_id = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    model = OpenAIModel(model_id=model_id, api_key=api_key)

    agent = CodeAgent(
        tools=[get_current_datetime, get_listener_summary, get_top_items],
        model=model,
        max_steps=5,
    )

    task = _build_task(messages)
    result = agent.run(task)

    print(json.dumps({"content": str(result)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
