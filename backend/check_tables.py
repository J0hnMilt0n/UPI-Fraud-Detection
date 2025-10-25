import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'upi_fraud_detection.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]

print("\n=== Database Tables ===")
for table in tables:
    print(f"  - {table}")

print(f"\nTotal: {len(tables)} tables")

# Check if transactions table exists
if 'transactions_transaction' in tables:
    print("\n✓ transactions_transaction table EXISTS")
else:
    print("\n✗ transactions_transaction table MISSING")
    print("Running migrate...")
    import subprocess
    subprocess.run(['python', 'manage.py', 'migrate'])
