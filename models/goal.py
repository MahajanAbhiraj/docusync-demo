from pydantic import BaseModel, Field
from typing import Optional

class GoalBase(BaseModel):
    title: str = Field(..., title="Title", description="The title of the savings goal", example="Vacation Fund")
    target_amount: float = Field(..., gt=0, title="Target Amount", description="The target amount to save", example=1500.0)
    current_amount: float = Field(0.0, ge=0, title="Current Amount", description="The current amount saved", example=200.0)

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None

class Goal(GoalBase):
    id: int

    class Config:
        from_attributes = True
        orm_mode = True
