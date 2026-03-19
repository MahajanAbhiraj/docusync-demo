from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import csv
import io

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

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    account_id: Optional[int] = None

VALID_CATEGORIES = ["Food", "Utilities", "Entertainment", "Housing", "Transportation", "Health", "Shopping", "Travel", "Other"]

# In-memory storage for simplicity
expenses_db: List[Expense] = [
    Expense(id=1, title="Groceries", amount=150.50, category="Food", date="2026-03-10", account_id=1),
    Expense(id=2, title="Internet Bill", amount=60.00, category="Utilities", date="2026-03-11", account_id=1),
    Expense(id=3, title="Netflix", amount=15.99, category="Entertainment", date="2026-03-11", account_id=1),
    Expense(id=4, title="Gym Membership", amount=45.00, category="Health", date="2026-03-12", account_id=2),
    Expense(id=5, title="Uber Ride", amount=22.50, category="Transportation", date="2026-03-13", account_id=2),
    Expense(id=6, title="Coffee Shop", amount=8.75, category="Food", date="2026-03-13", account_id=1),
    Expense(id=7, title="Amazon Order", amount=89.99, category="Shopping", date="2026-03-14", account_id=1),
]
current_id = 7


@router.get("/", response_model=List[Expense])
def get_expenses(
    account_id: Optional[int] = Query(None, description="Filter expenses by account ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in title"),
    min_amount: Optional[float] = Query(None, description="Filter by minimum amount"),
    max_amount: Optional[float] = Query(None, description="Filter by maximum amount"),
):
    """Retrieve all expenses with optional filters."""
    result = expenses_db
    if account_id is not None:
        result = [e for e in result if e.account_id == account_id]
    if category:
        result = [e for e in result if e.category.lower() == category.lower()]
    if search:
        result = [e for e in result if search.lower() in e.title.lower()]
    if min_amount is not None:
        result = [e for e in result if e.amount >= min_amount]
    if max_amount is not None:
        result = [e for e in result if e.amount <= max_amount]
    return result


@router.post("/", response_model=Expense)
def add_expense(expense: ExpenseCreate):
    """Add a new expense."""
    global current_id
    current_id += 1
    new_expense = Expense(
        id=current_id,
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        date=datetime.now().strftime("%Y-%m-%d"),
        account_id=expense.account_id,
    )
    expenses_db.append(new_expense)
    return new_expense


@router.put("/demo/{expense_id}", response_model=Expense)
def update_expense(expense_id: int, update: ExpenseUpdate):
    """Update an existing expense."""
    for expense in expenses_db:
        if expense.id == expense_id:
            if update.title is not None:
                expense.title = update.title
            if update.amount is not None:
                expense.amount = update.amount
            if update.category is not None:
                expense.category = update.category
            if update.account_id is not None:
                expense.account_id = update.account_id
            return expense
    raise HTTPException(status_code=404, detail="Expense not found")


@router.delete("/{expense_id}")
def delete_expense(expense_id: int):
    """Delete an expense by ID."""
    global expenses_db
    for i, exp in enumerate(expenses_db):
        if exp.id == expense_id:
            del expenses_db[i]
            return {"message": "Expense deleted successfully"}
    raise HTTPException(status_code=404, detail="Expense not found")


@router.get("/export/csv")
def export_expenses_csv(account_id: Optional[int] = Query(None)):
    """Export all expenses (or filtered by account) as a CSV file."""
    data = expenses_db
    if account_id is not None:
        data = [e for e in data if e.account_id == account_id]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "title", "amount", "category", "date", "account_id"])
    for exp in data:
        writer.writerow([exp.id, exp.title, exp.amount, exp.category, exp.date, exp.account_id])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"},
    )


@router.post("/import/csv")
async def import_expenses_csv(file: UploadFile = File(...)):
    """Import expenses from a CSV file. Columns: title, amount, category, date (optional), account_id."""
    global current_id
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    required = {"title", "amount", "category", "account_id"}
    if not reader.fieldnames or not required.issubset(set(reader.fieldnames)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must have columns: {', '.join(required)}",
        )

    imported = []
    for row in reader:
        try:
            current_id += 1
            exp = Expense(
                id=current_id,
                title=row["title"].strip(),
                amount=float(row["amount"]),
                category=row.get("category", "Other").strip(),
                date=row.get("date", datetime.now().strftime("%Y-%m-%d")).strip() or datetime.now().strftime("%Y-%m-%d"),
                account_id=int(row["account_id"]),
            )
            expenses_db.append(exp)
            imported.append(exp)
        except (ValueError, KeyError) as e:
            raise HTTPException(status_code=400, detail=f"Invalid row data: {e}")

    return {"imported": len(imported), "expenses": imported}


@router.get("/analytics")
def get_analytics(account_id: Optional[int] = Query(None)):
    """Return spending analytics: total, by-category breakdown, and recent monthly totals."""
    data = expenses_db
    if account_id is not None:
        data = [e for e in data if e.account_id == account_id]

    total = sum(e.amount for e in data)

    # Category breakdown
    category_totals: dict = {}
    for e in data:
        category_totals[e.category] = category_totals.get(e.category, 0) + e.amount

    # Monthly breakdown (by YYYY-MM)
    monthly_totals: dict = {}
    for e in data:
        month = e.date[:7]  # "YYYY-MM"
        monthly_totals[month] = monthly_totals.get(month, 0) + e.amount

    count = len(data)
    avg = total / count if count > 0 else 0
    top_category = max(category_totals, key=category_totals.get) if category_totals else None

    return {
        "total": round(total, 2),
        "count": count,
        "average": round(avg, 2),
        "top_category": top_category,
        "category_breakdown": {k: round(v, 2) for k, v in sorted(category_totals.items(), key=lambda x: -x[1])},
        "monthly_breakdown": {k: round(v, 2) for k, v in sorted(monthly_totals.items())},
    }
