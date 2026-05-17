from faker import Faker
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from typing import List, Dict, Any
import random
from utils.random_utils import distribute_counts

fake = Faker()

def generate_comments(count: int, users: List[Dict[str, Any]], posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    comments = []
    now = datetime.utcnow()
    
    # Distribute comments unevenly among posts (some posts are very popular)
    num_posts = len(posts)
    comments_per_post = distribute_counts(num_posts, count)
    
    # Track comments per post for parent-child relationship (replies)
    post_comments_map = {str(p['_id']): [] for p in posts}
    
    for post_idx, num_comments in enumerate(comments_per_post):
        post = posts[post_idx]
        post_id_str = str(post["_id"])
        
        for _ in range(num_comments):
            # Select random user
            user = random.choice(users)
            
            created_at = fake.date_time_between(start_date=post['createdAt'], end_date='now')
            updated_at = created_at
            
            # 20% chance to be a reply if there are existing comments on this post
            parent_comment_id = None
            existing_comments = post_comments_map[post_id_str]
            if existing_comments and random.random() < 0.2:
                parent_comment = random.choice(existing_comments)
                parent_comment_id = str(parent_comment["_id"])
                # Adjust created_at to be after parent comment
                if parent_comment['createdAt'] > created_at:
                    created_at = fake.date_time_between(start_date=parent_comment['createdAt'], end_date='now')
                    updated_at = created_at
            
            comment = {
                "_id": ObjectId(),
                "postId": post_id_str,
                "userId": str(user["_id"]),
                "content": fake.paragraph(nb_sentences=random.randint(1, 4)),
                "parentCommentId": parent_comment_id,
                "createdAt": created_at,
                "updatedAt": updated_at
            }
            
            comments.append(comment)
            post_comments_map[post_id_str].append(comment)
            
    return comments
