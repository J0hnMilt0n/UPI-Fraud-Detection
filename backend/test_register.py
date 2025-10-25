import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'upi_fraud_detection.settings')
django.setup()

import json
from accounts.serializers import RegisterSerializer

# Test with empty strings for optional fields (like frontend sends)
data = {
    'username': 'testuser4',
    'email': 'test4@example.com',
    'first_name': 'Test',
    'last_name': 'User',
    'password': 'password123',
    'password2': 'password123',
    'phone_number': '',
    'upi_id': ''
}

print("Testing registration with data:")
print(json.dumps(data, indent=2))
print()

s = RegisterSerializer(data=data)
print('Valid:', s.is_valid())
print('Errors:', json.dumps(dict(s.errors), indent=2))

if s.is_valid():
    u = s.save()
    print('User created:', u.username)
    print('Profile phone_number:', u.profile.phone_number)
    print('Profile upi_id:', u.profile.upi_id)
else:
    print('Validation failed!')
