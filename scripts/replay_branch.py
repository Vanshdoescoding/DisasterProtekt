from __future__ import annotations

import json
import os
import sys
from urllib import request


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python scripts/replay_branch.py <run_id> <branch_id>")
        sys.exit(1)

    run_id = sys.argv[1]
    branch_id = sys.argv[2]
    api_url = os.getenv("API_URL", "http://localhost:8000")

    req = request.Request(
        f"{api_url}/runs/{run_id}/branches/{branch_id}/replay",
        method="POST",
        data=json.dumps({}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with request.urlopen(req) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
