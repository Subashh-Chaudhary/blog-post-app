import argparse
import sys
from utils.logger import get_logger
from utils.db import get_db, close_db
from generators.users import generate_users
from generators.posts import generate_posts
from generators.comments import generate_comments
from generators.likes import generate_likes
from tqdm import tqdm

logger = get_logger("seed")

MODES = {
    "minimal": {"users": 10, "posts": 20, "comments": 40, "likes": 100},
    "medium": {"users": 50, "posts": 150, "comments": 300, "likes": 1000},
    "large": {"users": 200, "posts": 500, "comments": 1500, "likes": 5000},
    "stress-test": {"users": 1000, "posts": 5000, "comments": 20000, "likes": 50000},
}

def seed(mode: str):
    db = get_db()
    counts = MODES.get(mode)
    
    if not counts:
        logger.error(f"[bold red]Invalid mode: {mode}[/bold red]")
        sys.exit(1)
        
    logger.info(f"[bold blue]Starting database seed in '{mode}' mode...[/bold blue]")
    logger.info(f"Target counts: {counts}")
    
    # 1. Clear existing
    logger.info("[yellow]Clearing existing collections...[/yellow]")
    db.users.delete_many({})
    db.posts.delete_many({})
    db.comments.delete_many({})
    db.post_likes.delete_many({})
    
    # 2. Generate Data in Memory
    logger.info("[bold green]Generating users...[/bold green]")
    users = generate_users(counts["users"])
    
    logger.info("[bold green]Generating posts...[/bold green]")
    posts = generate_posts(counts["posts"], users)
    
    logger.info("[bold green]Generating comments...[/bold green]")
    comments = generate_comments(counts["comments"], users, posts)
    
    logger.info("[bold green]Generating likes...[/bold green]")
    likes = generate_likes(counts["likes"], users, posts)
    
    # 3. Update post aggregations (likeCount, commentsCount) in memory
    logger.info("[cyan]Calculating denormalized counts...[/cyan]")
    post_map = {str(p["_id"]): p for p in posts}
    
    for comment in comments:
        post_map[comment["postId"]]["commentsCount"] += 1
        
    for like in likes:
        post_map[like["postId"]]["likeCount"] += 1

    # 4. Insert into MongoDB
    logger.info("[bold magenta]Inserting data into MongoDB...[/bold magenta]")
    
    if users:
        db.users.insert_many(users)
        logger.info(f"Inserted {len(users)} users.")
        
    if posts:
        # Use batch size for very large inserts
        batch_size = 1000
        for i in tqdm(range(0, len(posts), batch_size), desc="Inserting posts"):
            db.posts.insert_many(posts[i:i+batch_size])
        logger.info(f"Inserted {len(posts)} posts.")
        
    if comments:
        for i in tqdm(range(0, len(comments), batch_size), desc="Inserting comments"):
            db.comments.insert_many(comments[i:i+batch_size])
        logger.info(f"Inserted {len(comments)} comments.")
        
    if likes:
        for i in tqdm(range(0, len(likes), batch_size), desc="Inserting likes"):
            db.post_likes.insert_many(likes[i:i+batch_size])
        logger.info(f"Inserted {len(likes)} likes.")
        
    # 5. Output Sample Data / Credentials
    import json
    import os
    
    fixtures_dir = os.path.join(os.path.dirname(__file__), "fixtures")
    os.makedirs(fixtures_dir, exist_ok=True)
    sample_data_path = os.path.join(fixtures_dir, "sample_data.json")
    
    sample_users = []
    for u in users[:10]: # Store top 10 users as examples
        sample_users.append({
            "fullName": u["fullName"],
            "email": u["email"],
            "password": "password123" # The plain text password for all seeded users
        })
        
    sample_data = {
        "description": "Sample credentials and data seeded into the database",
        "default_password": "password123",
        "users": sample_users
    }
    
    with open(sample_data_path, "w") as f:
        json.dump(sample_data, f, indent=2)
        
    logger.info(f"[cyan]Saved sample user credentials to {sample_data_path}[/cyan]")
    
    logger.info("[bold green]✅ Database seeding completed successfully![/bold green]")
    logger.info("\n[bold yellow]--- Seeded User Credentials for Login ---[/bold yellow]")
    for user in sample_users[:5]:
        logger.info(f"👤 [bold]{user['fullName']}[/bold] | Email: [green]{user['email']}[/green] | Password: [magenta]password123[/magenta]")
    logger.info("[bold yellow]-----------------------------------------[/bold yellow]\n")
    
    close_db()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the MongoDB database with realistic test data.")
    parser.add_argument(
        "--mode", 
        type=str, 
        default="minimal", 
        choices=["minimal", "medium", "large", "stress-test"],
        help="Volume of data to generate (minimal, medium, large, stress-test)"
    )
    
    args = parser.parse_args()
    
    try:
        seed(args.mode)
    except KeyboardInterrupt:
        logger.info("\n[yellow]Seeding interrupted by user.[/yellow]")
        close_db()
        sys.exit(0)
