from typing import List, Optional

class MockGoalsDB:
    """Mock database for Savings Goals"""
    def __init__(self):
        self._goals = []
        self._current_id = 1

    def get_all(self) -> List[dict]:
        return self._goals

    def get_by_id(self, goal_id: int) -> Optional[dict]:
        for goal in self._goals:
            if goal["id"] == goal_id:
                return goal
        return None

    def add(self, goal_data: dict) -> dict:
        goal_data["id"] = self._current_id
        self._current_id += 1
        self._goals.append(goal_data)
        return goal_data
    
    def update(self, goal_id: int, goal_data: dict) -> Optional[dict]:
        goal = self.get_by_id(goal_id)
        if goal:
            goal.update(goal_data)
            return goal
        return None

    def delete(self, goal_id: int) -> bool:
        goal = self.get_by_id(goal_id)
        if goal:
            self._goals.remove(goal)
            return True
        return False

# Global instance
db = MockGoalsDB()
