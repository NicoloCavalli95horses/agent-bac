# ===========
# Import
# ===========
import json
from pathlib import Path
from datetime import datetime


# ===========
# Functions
# ===========
def save_to_json(results, f="BAC_REPORT"):
  today = datetime.today().strftime('%Y-%m-%d_%H-%M')
  directory = Path("results")
  directory.mkdir(parents=True, exist_ok=True)
  filename = directory / f"{f}_{today}.json"
  
  with open(filename, "w", encoding="utf-8") as file:
    json.dump(results, file, indent=2, ensure_ascii=False)