from faker import Faker
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from typing import List, Dict, Any
import random
from utils.random_utils import distribute_counts

fake = Faker()

def generate_posts(count: int, users: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    posts = []
    now = datetime.utcnow()
    
    # We want some users to have more posts than others. 
    # Use our pareto distribution for author selection.
    num_users = len(users)
    posts_per_user = distribute_counts(num_users, count)
    
    for user_idx, num_posts in enumerate(posts_per_user):
        author = users[user_idx]
        
        for _ in range(num_posts):
            created_at = fake.date_time_between(start_date=author['createdAt'], end_date='now')
            updated_at = created_at + timedelta(days=fake.random_int(min=0, max=10))
            if updated_at > now:
                updated_at = now
                
            post = {
                "_id": ObjectId(),
                "title": fake.sentence(nb_words=6).rstrip('.'),
                "content": "\n\n".join(fake.paragraphs(nb=random.randint(3, 8))),
                "published": fake.boolean(chance_of_getting_true=90),
                "authorId": str(author["_id"]),
                "commentsCount": 0, # Will be updated after comments generation
                "likeCount": 0, # Will be updated after likes generation
                "createdAt": created_at,
                "updatedAt": updated_at
            }
            posts.append(post)
            
    # Shuffle to mix posts chronologically and by author
    random.shuffle(posts)
    return posts
