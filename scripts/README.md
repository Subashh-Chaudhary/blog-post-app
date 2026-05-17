# Automated DB Seeding & Management Architecture

This directory serves as the automated support, data orchestration, and database management engine for our development environment. It consists of a performance-optimized **Python** toolset that communicates directly with **MongoDB** via **PyMongo** to generate realistic mock data and perform database resets.

---

## 1. System Architecture & Seeding Workflow

The seeding suite uses a **modular generator architecture** designed to model real-world social network usage patterns. Instead of simple random distributions, the seeding engine implements probability algorithms to ensure organic-looking data relationships.

```
                  +--------------------------------+
                  |   MongoDB Connection Setup     |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |  Users Generator (Faker Lib)   | --> Enforces lowercase emails
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |   Posts Generator (Markdown)   | --> Maps dynamic author IDs
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |  Comments & Likes Generation   | --> Employs Pareto distribution
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |  Bulk MongoDB Inserts (Batch)  | --> Executes insert_many
                  +--------------------------------+
```

### Data Pipeline & Generation Phases

1. **User Generation**: Creates initial profiles with unique, normalized email addresses and alphanumeric usernames, prepending a default hashed password (`bcrypt`) that matches the backend authentication rules.
2. **Post Generation**: Generates rich markdown content, assigning authorship dynamically to existing user IDs.
3. **Relational Distribution (Pareto Distribution)**: To simulate organic user engagement, comment and like mappings are calculated using a power-law Pareto probability distribution. This mimics real social networks where a small percentage of posts receive the majority of engagement (likes/comments), and a small percentage of users create the majority of activity.
4. **Denormalized Counters**: Calculates and writes parent-level aggregation columns (such as `likeCount` and `commentsCount` on the post document) directly, ensuring that the initial pre-calculated numbers are 100% synchronized with actual counts in secondary collections.
5. **Bulk Insert Pipeline**: Bypasses slow individual insertions, executing high-performance `insert_many` batch queries to populate thousands of records in a single database tick.

---

## 2. Directory Layout & Module Responsibilities

```bash
scripts/
├── clear.py               # Safe database cleanup orchestration
├── seed.py                # Main database seed orchestration
├── requirements.txt       # Dependencies (PyMongo, Faker, python-dotenv)
├── generators/            # Scoped mock-data engines
│   ├── comments.py        # Custom comment tree generator
│   ├── likes.py           # Junction relationship post likes generator
│   ├── posts.py           # Rich markdown body post generator
│   └── users.py           # Normalized profile mock user generator
└── utils/                 # Shared utilities
    └── logger.py          # Unified console logger formatting
```

### Module Responsibilities
* **`seed.py`**: The orchestration core. It imports the individual entity generators, parses global mode parameters (e.g. data scaling sizes), maintains session contexts, and initiates bulk database transactions.
* **`clear.py`**: A dedicated database reset script. It securely empties target collections (`users`, `posts`, `comments`, `post_likes`) and drops temporary indexes to clean up database states without dropping the database entirely.
* **`generators/`**: Encapsulated modules that model data shapes that align perfectly with the Mongoose schemas defined in `/backend-service`.

---

## 3. Strict Safety Guardrails & Conventions

Because the seeding scripts write and delete data directly in MongoDB, they enforce strict safety rules to protect production databases:

* **Production Environment Lock**:
  The seeding and cleanup engines inspect configuration variables (`NODE_ENV` and `MONGODB_URI`) before execution. If the database connection points to a production cluster or `NODE_ENV` is set to `production`, the scripts abort immediately with an exit code of `1` to prevent accidental data loss.
* **Interactive Confirmations**:
  Database clear queries require manual user confirmation. This interactive check can be bypassed in continuous testing environments using the `--force` flag.
* **Transactional Restores**:
  If a seeding step fails mid-execution, the orchestrator attempts to roll back active operations, preventing incomplete database states.

---

## 4. Console Logging Standards

All scripts use a standardized logger (`utils/logger.py`) to output clear, structured progress reports:

* **Color-Coded Console Logs**: Console logs are color-coded to highlight execution states:
  * `INFO` (Blue): Indicates standard progress steps (e.g. *"Generating 200 users..."*).
  * `SUCCESS` (Green): Indicates successful operations (e.g. *"Bulk inserted 500 posts successfully."*).
  * `WARNING` (Yellow): Highlights non-fatal warnings (e.g. *"Collection 'post_likes' is empty, skipping clear."*).
  * `ERROR` (Red): Prints fatal failures before halting execution.
* **Metric Reporting**: At the end of a seeding run, the logger prints a detailed summary table showing the exact number of records created, database execution times, and cache hit metrics.

---

## 5. Future Automation Goals

Planned enhancements for the automation suite include:
* **JSON Schema Validations**: Pre-validating generated data using the backend's compiled schema.
* **Dynamic Media Seeding**: Integrating external APIs or mock assets to generate and upload realistic image URLs directly to local media storage during user and post generation.
* **Complex Interaction Models**: Adding script routines that simulate ongoing user interaction, generating realistic comment updates and post edits over simulated timelines.
