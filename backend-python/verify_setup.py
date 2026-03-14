
import sys
import unittest
import importlib
try:
    import fastapi
    print("✅ fastapi imported")
except ImportError:
    print("❌ fastapi MISSING")

try:
    import sqlalchemy
    print("✅ sqlalchemy imported")
except ImportError:
    print("❌ sqlalchemy MISSING")

try:
    import pydantic
    print("✅ pydantic imported")
except ImportError:
    print("❌ pydantic MISSING")

try:
    import alembic
except ImportError:
    pass

try:
    from app.main import app
    print("✅ app.main imported successfully")
except Exception as e:
    print(f"❌ app.main failed to import: {e}")
    import traceback
    traceback.print_exc()

import os
# Check for __init__.py files
for root, dirs, files in os.walk('app'):
    if '__init__.py' not in files:
        print(f"⚠️ Warning: Missing __init__.py in {root}")
    else:
        # print(f"✅ __init__.py found in {root}")
        pass

print("Verification complete.")
