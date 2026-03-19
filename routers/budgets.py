from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/budgets", tags=["Budgets"])

class Budget(BaseModel):
    id: int
    category: str
    target_amount: float
    month: str  # YYYY-MM
    account_id: int

class BudgetCreate(BaseModel):
    category: str
    target_amount: float
    month: str
    account_id: int

class BudgetUpdate(BaseModel):
    target_amount: Optional[float] = None

# In-memory DB
budgets_db: List[Budget] = [
    Budget(id=1, category="Food", target_amount=500.0, month="2026-03", account_id=1),
    Budget(id=2, category="Entertainment", target_amount=100.0, month="2026-03", account_id=1)
]
current_id = 2

@router.get("/", response_model=List[Budget])
def get_budgets(account_id: Optional[int] = Query(None)):
    if account_id:
        return [b for b in budgets_db if b.account_id == account_id]
    return budgets_db

@router.post("/", response_model=Budget)
def create_budget(budget: BudgetCreate):
    global current_id
    current_id += 1
    new_budget = Budget(
        id=current_id,
        category=budget.category,
        target_amount=budget.target_amount,
        month=budget.month,
        account_id=budget.account_id
    )
    budgets_db.append(new_budget)
    return new_budget

@router.put("/{budget_id}", response_model=Budget)
def update_budget(budget_id: int, update: BudgetUpdate):
    for b in budgets_db:
        if b.id == budget_id:
            if update.target_amount is not None:
                b.target_amount = update.target_amount
            return b
    raise HTTPException(status_code=404, detail="Budget not found")
