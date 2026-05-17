import sys
from pathlib import Path

sys.path.insert(
    0,
    str(Path(__file__).resolve().parent.parent / "services" / "enigma-api"),
)

from app.main import app  # noqa: E402  Vercel reads this `app` variable
