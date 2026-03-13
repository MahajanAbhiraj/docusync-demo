from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/expenses", tags=["Expenses"])

class Expense(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    date: str
    account_id: int

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    account_id: int

# In-memory storage for simplicity
expenses_db: List[Expense] = [
    Expense(id=1, title="Groceries", amount=150.50, category="Food", date=datetime.now().strftime("%Y-%m-%d"), account_id=1),
    Expense(id=2, title="Internet Bill", amount=60.00, category="Utilities", date=datetime.now().strftime("%Y-%m-%d"), account_id=1),
]
current_id = 2

@router.get("/", response_model=List[Expense])
def get_expenses(account_id: Optional[int] = Query(None, description="Filter expenses by account ID")):
    """
    Retrieve a list of all expenses. Optionally filter by account ID.
    
    Returns:
        List[Expense]: A list of expense objects.
    """
    if account_id is not None:
        return [exp for exp in expenses_db if exp.account_id == account_id]
    return expenses_db

@router.post("/", response_model=Expense)
def add_expense(expense: ExpenseCreate):
    """
    Add a new expense.
    
    Args:
        expense (ExpenseCreate): The details of the expense to add.
        
    Returns:
        Expense: The newly created expense object.
    """
    global current_id
    current_id += 1
    new_expense = Expense(
        id=current_id,
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        date=datetime.now().strftime("%Y-%m-%d"),
        account_id=expense.account_id
    )
    expenses_db.append(new_expense)
    return new_expense

@router.delete("/{expense_id}")
def delete_expense(expense_id: int):
    """
    Delete an expense by its ID.
    
    Args:
        expense_id (int): The unique identifier of the expense to delete.
        
    Returns:
        dict: A success message.
    """
    global expenses_db
    for i, exp in enumerate(expenses_db):
        if exp.id == expense_id:
            del expenses_db[i]
            return {"message": "Expense deleted successfully"}
    raise HTTPException(status_code=404, detail="Expense not found")
