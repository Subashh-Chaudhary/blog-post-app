from faker import Faker
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from typing import List, Dict, Any

fake = Faker()

# Standard bcrypt hash for "password123"
# Using a static hash is much faster for seeding and standard practice for dummy data
DEFAULT_PASSWORD_HASH = "$2b$10$wJkC5QP9/GjBElFlM7UJ4OmBa6M17fWZDgaPHMpBlzpUKOM3t67W."

def generate_users(count: int) -> List[Dict[str, Any]]:
    users = []
    now = datetime.utcnow()
    
    for _ in range(count):
        created_at = fake.date_time_between(start_date='-1y', end_date='now')
        updated_at = created_at + timedelta(days=fake.random_int(min=0, max=30))
        if updated_at > now:
            updated_at = now
            
        user = {
            "_id": ObjectId(),
            "fullName": fake.name(),
            "email": fake.unique.email(),
            "password": DEFAULT_PASSWORD_HASH,
            "createdAt": created_at,
            "updatedAt": updated_at
        }
        users.append(user)
        
    return users
