from models.goal import GoalCreate, GoalUpdate, Goal
from data.goals_db import db
from typing import List, Optional

def get_all_goals() -> List[Goal]:
    return [Goal(**g) for g in db.get_all()]

def get_goal(goal_id: int) -> Optional[Goal]:
    data = db.get_by_id(goal_id)
    if data:
        return Goal(**data)
    return None

def create_goal(goal_in: GoalCreate) -> Goal:
    # Handle pydantic v1 vs v2 dict
    data_dict = goal_in.model_dump() if hasattr(goal_in, "model_dump") else goal_in.dict()
    data = db.add(data_dict)
    return Goal(**data)

def update_goal(goal_id: int, goal_in: GoalUpdate) -> Optional[Goal]:
    data_dict = goal_in.model_dump(exclude_unset=True) if hasattr(goal_in, "model_dump") else goal_in.dict(exclude_unset=True)
    data_to_update = {k: v for k, v in data_dict.items() if v is not None}
    
    updated_data = db.update(goal_id, data_to_update)
    if updated_data:
        return Goal(**updated_data)
    return None

def delete_goal(goal_id: int) -> bool:
    return db.delete(goal_id)
