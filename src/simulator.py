import time
import random
import requests
from faker import Faker

fake = Faker()

API_BASE_URL = "http://localhost:8000/api"
TRACK_URL = f"{API_BASE_URL}/track-action"
STATUS_URL = f"{API_BASE_URL}/test-status"

def check_test_status():
    try:
        response = requests.get(STATUS_URL)
        if response.status_code == 200:
            return response.json().get("status")

    except requests.exceptions.ConnectionError:
        print("Cannot reach the API.")
    return "STOPPED"

def generate_user_action():
    """
        Generates realistic e-commerce user behavior.

        intentionally biasing the simulation to make Group B.
        >Group A: 5%
        >Group B: 6.5%
    """
    user_id = fake.uuid4()
    group = random.choice(["A", "B"])
    converted = 0
    purchase_amount = 0.0
    
    if group == "A":
        if random.random() <= 0.05: 
            converted = 1
            purchase_amount = round(random.uniform(50.0, 300.0), 2) 
            
    elif group == "B":
        if random.random() <= 0.065:
            converted = 1
            purchase_amount = round(random.uniform(450.0, 650.0), 2)

    return {
        "user_id": str(user_id),
        "group_name": group,
        "converted": converted,
        "purchase_amount": purchase_amount
    }

def run_simulation():    
    while True:
        status = check_test_status()
        
        if status == "RUNNING":
            payload = generate_user_action()
            
            response = requests.post(TRACK_URL, json=payload)
            
            if response.status_code == 200:

                action_text = f"Purchased ({payload['purchase_amount']} TL)" if payload['converted'] == 1 else "No Purchased"
                print(f"[Live Traffic] Group: {payload['group_name']} | Result: {action_text}")
            
            time.sleep(random.uniform(0.2, 0.5))
            
        else:
            time.sleep(5)

if __name__ == "__main__":
    run_simulation()
