from faker import Faker
from bson.objectid import ObjectId
from datetime import datetime
from typing import List, Dict, Any, Set, Tuple
import random
from utils.random_utils import distribute_counts

fake = Faker()

def generate_likes(count: int, users: List[Dict[str, Any]], posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    likes = []
    
    # We must enforce unique combination of userId and postId
    # Max possible likes = len(users) * len(posts)
    max_likes = len(users) * len(posts)
    actual_count = min(count, max_likes)
    
    # Distribute likes unevenly among posts
    num_posts = len(posts)
    likes_per_post = distribute_counts(num_posts, actual_count)
    
    used_combinations: Set[Tuple[str, str]] = set()
    
    for post_idx, num_likes in enumerate(likes_per_post):
        post = posts[post_idx]
        post_id_str = str(post["_id"])
        
        # We can't have more likes on a post than there are users
        num_likes = min(num_likes, len(users))
        
        # Select 'num_likes' unique users for this post
        liking_users = random.sample(users, num_likes)
        
        for user in liking_users:
            user_id_str = str(user["_id"])
            
            # Safety check, should be guaranteed by random.sample though
            combo = (user_id_str, post_id_str)
            if combo in used_combinations:
                continue
            used_combinations.add(combo)
                
            # Ensure like is created after the post
            created_at = fake.date_time_between(start_date=post['createdAt'], end_date='now')
            
            like = {
                "_id": ObjectId(),
                "userId": user_id_str,
                "postId": post_id_str,
                "createdAt": created_at,
                "updatedAt": created_at
            }
            likes.append(like)
            
    return likes
