from fastapi import APIRouter, HTTPException, status
from typing import List
from models.goal import Goal, GoalCreate, GoalUpdate
import services.goal_service as service

router = APIRouter(
    prefix="/goals",
    tags=["Goals"]
)

@router.get("/", response_model=List[Goal])
def read_goals():
    return service.get_all_goals()

@router.get("/{goal_id}", response_model=Goal)
def read_goal(goal_id: int):
    goal = service.get_goal(goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.post("/", response_model=Goal, status_code=status.HTTP_201_CREATED)
def create_goal(goal: GoalCreate):
    return service.create_goal(goal)

@router.put("/{goal_id}", response_model=Goal)
def update_goal(goal_id: int, goal: GoalUpdate):
    updated = service.update_goal(goal_id, goal)
    if not updated:
        raise HTTPException(status_code=404, detail="Goal not found")
    return updated

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: int):
    if not service.delete_goal(goal_id):
        raise HTTPException(status_code=404, detail="Goal not found")
