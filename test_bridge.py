import requests
import os

# Configuration
BRIDGE_URL = "http://localhost:5000/application-submit"

def test_bridge():
    print(f"Testing Bridge at {BRIDGE_URL}...")
    
    # Simulate FormData
    form_data = {
        'idNumber': '20230001',
        'firstName': 'John',
        'middleInitial': 'D',
        'lastName': 'Doe',
        'course': 'BSIT',
        'address': '123 Main St, Barangay 1, City',
        'guardianName': 'Jane Doe',
        'guardianContact': '09123456789'
    }

    # Files (using tiny dummy image for test)
    # Note: In a real test, you'd want valid image bytes that CV2/rembg can process
    # but for structure verification, we'll see if the bridge gets the request.
    
    print("Payload prepared. Sending request...")
    try:
        # We'll skip sending files in this simple check to avoid AI model errors if they are not loaded
        # but the bridge handles optional files.
        response = requests.post(BRIDGE_URL, data=form_data)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_bridge()
