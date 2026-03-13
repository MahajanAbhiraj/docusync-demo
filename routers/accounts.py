from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/accounts", tags=["Accounts"])

class Account(BaseModel):
    id: int
    name: str

class AccountCreate(BaseModel):
    name: str

# In-memory storage for simplicity
accounts_db: List[Account] = [
    Account(id=1, name="Personal"),
    Account(id=2, name="Business"),
]
current_account_id = 2

@router.get("/", response_model=List[Account])
def get_accounts():
    """
    Retrieve a list of all accounts.
    
    Returns:
        List[Account]: A list of account objects.
    """
    return accounts_db

@router.post("/", response_model=Account)
def add_account(account: AccountCreate):
    """
    Add a new account.
    
    Args:
        account (AccountCreate): The details of the account to add.
        
    Returns:
        Account: The newly created account object.
    """
    global current_account_id
    current_account_id += 1
    new_account = Account(
        id=current_account_id,
        name=account.name
    )
    accounts_db.append(new_account)
    return new_account
