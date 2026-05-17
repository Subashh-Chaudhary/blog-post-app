import random
from datetime import datetime, timedelta
import math

def random_date(start_date: datetime, end_date: datetime) -> datetime:
    """Generate a random datetime between `start_date` and `end_date`."""
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates) if days_between_dates > 0 else 0
    random_number_of_seconds = random.randrange(86400)
    return start_date + timedelta(days=random_number_of_days, seconds=random_number_of_seconds)

def get_pareto_distribution(items: list, count: int, alpha: float = 1.16) -> list:
    """
    Selects items based on a Pareto distribution (e.g. 80-20 rule).
    Useful to make a few users highly active, or a few posts highly popular.
    """
    if not items:
        return []
        
    weights = []
    n = len(items)
    for i in range(n):
        # Rank based weight using Pareto probability density
        rank = i + 1
        weight = alpha / (rank ** (alpha + 1))
        weights.append(weight)
        
    # Shuffle weights to not always favor the first elements
    random.shuffle(weights)
    
    # We use random.choices with weights to pick items with replacement
    # so we might need to deduplicate depending on use case. 
    # For likes/comments generation counts per item, we just need a distribution of counts.
    return weights

def distribute_counts(total_items: int, count_to_distribute: int) -> list:
    """
    Distributes `count_to_distribute` over `total_items` with a Pareto-like inequality.
    Returns a list of counts of length `total_items`.
    """
    if total_items == 0:
        return []
    
    counts = [0] * total_items
    weights = get_pareto_distribution(range(total_items), total_items, alpha=1.1)
    
    # Normalize weights
    total_weight = sum(weights)
    probs = [w / total_weight for w in weights]
    
    for _ in range(count_to_distribute):
        # Choose an index based on probabilities
        idx = random.choices(range(total_items), weights=probs, k=1)[0]
        counts[idx] += 1
        
    return counts
