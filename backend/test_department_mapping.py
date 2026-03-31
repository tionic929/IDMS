import requests
import json

url = "http://localhost:8000/api/students"

# Test data
data = {
    'idNumber': 'EMP-001',
    'firstName': 'John',
    'lastName': 'Doe',
    'course': 'Employee',
    'department': 'IT Support',
    'address': '123 Tech St',
    'email': 'john.doe@example.com'
}

print(f"Sending request to {url}...")
try:
    response = requests.post(url, data=data)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 201:
        result = response.json()
        print("Success! Data received:")
        student_data = result.get('data', {})
        print(f"  Course (mapped): {student_data.get('course')}")
        print(f"  Department: {student_data.get('department')}")
        
        if student_data.get('course') == 'IT SUPPORT':
            print("\nVERIFICATION SUCCESS: 'Employee' course correctly mapped to 'IT SUPPORT' department.")
        else:
            print(f"\nVERIFICATION FAILED: Expected 'IT SUPPORT' but got '{student_data.get('course')}'")
    else:
        print(f"Error: {response.text}")

except Exception as e:
    print(f"Request failed: {e}")
