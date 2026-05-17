# Blog Application Database Seeding System

This is a production-grade Python database seeding system for generating realistic relational data (users, posts, comments, likes) that aligns with the backend's Mongoose schemas.

## Features

- **Schema Alignment**: Accurately mimics `backend-service` Mongoose schemas.
- **Relational Integrity**: Generates valid string references for `authorId`, `postId`, and `userId`.
- **Realistic Data Distribution**: Uses Pareto-like probability distributions to ensure some posts are highly popular and some users are highly active, simulating real-world social engagement.
- **Batch Processing**: Utilizes `insert_many` and optimized memory-denormalization for extreme performance.
- **Environment Safety**: Refuses to execute in `NODE_ENV=production` environments.

## Prerequisites

- Python 3.9+
- MongoDB instance running (local or remote)

## Setup

1. **Navigate to the scripts directory:**
   ```bash
   cd scripts
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Linux/Mac
   # venv\Scripts\activate   # On Windows
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration:**
   The script automatically reads the `.env` file located in the project root (`../.env`). Ensure that `MONGODB_URI` is correctly set.

## Execution

### Seeding Data

You can run the seed script with different modes that dictate the volume of generated data:

```bash
# Minimal mode (10 users, 20 posts) - Default
python seed.py

# Medium mode (50 users, 150 posts)
python seed.py --mode=medium

# Large mode (200 users, 500 posts, 5000 likes)
python seed.py --mode=large

# Stress-test mode (1000 users, 5000 posts, 50000 likes)
python seed.py --mode=stress-test
```

*Note: The seeding script automatically clears the relevant collections (`users`, `posts`, `comments`, `post_likes`) before generating new data to prevent ID collisions.*

### Clearing Data

If you only want to clear the seeded data without generating new data:

```bash
# Prompts for confirmation
python clear.py

# Bypasses confirmation (useful for CI/CD or automation)
python clear.py --force
```

## Architecture

The seeder uses a modular generator architecture:
- `generators/` contains individual logic for each entity.
- Generators operate entirely in memory.
- `utils/random_utils.py` handles complex distributions (e.g., Pareto) for realistic comment/like assignment.
- `seed.py` orchestrates the generators, computes denormalized counters (`likeCount`, `commentsCount`), and bulk inserts the documents via PyMongo for maximum efficiency.
