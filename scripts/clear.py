import sys
from utils.logger import get_logger
from utils.db import get_db, close_db

logger = get_logger("clear")

def clear_db(force: bool = False):
    if not force:
        confirm = input("⚠️  Are you sure you want to clear the users, posts, comments, and post_likes collections? (y/N): ")
        if confirm.lower() != 'y':
            logger.info("Aborted.")
            sys.exit(0)
            
    db = get_db()
    
    logger.info("[yellow]Clearing collections...[/yellow]")
    
    # Drop instead of delete_many is faster, but delete_many keeps indexes.
    # We use delete_many to preserve existing Mongoose indexes.
    
    result_users = db.users.delete_many({})
    logger.info(f"Deleted {result_users.deleted_count} users.")
    
    result_posts = db.posts.delete_many({})
    logger.info(f"Deleted {result_posts.deleted_count} posts.")
    
    result_comments = db.comments.delete_many({})
    logger.info(f"Deleted {result_comments.deleted_count} comments.")
    
    result_likes = db.post_likes.delete_many({})
    logger.info(f"Deleted {result_likes.deleted_count} post likes.")
    
    logger.info("[bold green]✅ Database cleared successfully![/bold green]")
    close_db()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Clear seeded collections from the database.")
    parser.add_argument("--force", action="store_true", help="Bypass confirmation prompt")
    args = parser.parse_args()
    
    try:
        clear_db(args.force)
    except KeyboardInterrupt:
        logger.info("\n[yellow]Operation interrupted by user.[/yellow]")
        close_db()
        sys.exit(0)
