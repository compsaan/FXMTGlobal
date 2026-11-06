import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path


version_path = Path("platform-version.json")
data = json.loads(version_path.read_text(encoding="utf-8"))

current = str(data.get("version", ""))
match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)", current)
if not match:
    raise SystemExit(f"Invalid platform version: {current!r}")

if data.get("initialized"):
    major, minor, patch = (int(part) for part in match.groups())
    data["version"] = f"{major}.{minor}.{patch + 1}"
else:
    # Keep the initial release at 1.0.0 when version tracking is first enabled.
    data["initialized"] = True

timestamp = os.environ.get("SOURCE_TIMESTAMP", "")
try:
    updated_at = datetime.fromisoformat(timestamp.replace("Z", "+00:00")).astimezone(timezone.utc)
except ValueError:
    updated_at = datetime.now(timezone.utc)

data["updatedAt"] = updated_at.strftime("%Y-%m-%d")
data["sourceCommit"] = os.environ.get("SOURCE_SHA", "")
version_path.write_text(
    json.dumps(data, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
