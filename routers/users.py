from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])

class User(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool = True

mock_users = [
    User(id=1, username="alice", email="alice@example.com"),
    User(id=2, username="bob", email="bob@example.com"),
]

@router.get("/", response_model=List[User])
def get_users():
    """
    Retrieve a list of all users in the system.
    
    Returns:
        List[User]: A list of user objects containing their details.
    """
    return mock_users

@router.get("/{user_id}", response_model=User)
def get_user(user_id: int):
    """
    Retrieve details for a specific user by their ID.
    
    Args:
        user_id (int): The unique identifier of the user.
        
    Returns:
        User: The user object if found, or a simple error dictionary.
    """
    for user in mock_users:
        if user.id == user_id:
            return user
    return {"error": "User not found"}
