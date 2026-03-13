# API Documentation

This document explicitly details the RESTful endpoints exposed by the **Personal Expense Tracker** backend. The API is hosted on a local FastAPI instance, conventionally accessible at `http://localhost:8000`.

## 1. Web Layer

### 1.1 Application Entrypoint
- **Method:** `GET`
- **Path:** `/`
- **Description:** Serves the primary web application (`index.html`) to the client.

## 2. Expenses Resource

The core resource of the application is the `/expenses` endpoint group.

### 2.1 Retrieve All Expenses
- **Method:** `GET`
- **Path:** `/expenses/`
- **Description:** Fetches all recorded expenses from the system.
- **Response:** `200 OK`
  ```json
  [
    {
      "id": 1,
      "title": "Groceries",
      "amount": 150.50,
      "category": "Food",
      "date": "2026-03-13"
    },
    ...
  ]
  ```

### 2.2 Create New Expense
- **Method:** `POST`
- **Path:** `/expenses/`
- **Description:** Submits a new expense payload to be recorded.
- **Request Body:**
  ```json
  {
    "title": "Internet Bill",
    "amount": 60.00,
    "category": "Utilities"
  }
  ```
- **Response:** `200 OK` (Returns the newly created expense object including its generated ID and date)
  ```json
  {
    "id": 3,
    "title": "Internet Bill",
    "amount": 60.00,
    "category": "Utilities",
    "date": "2026-03-13"
  }
  ```

### 2.3 Delete Expense
- **Method:** `DELETE`
- **Path:** `/expenses/{expense_id}`
- **Description:** Removes a specific expense record by its unique identifier.
- **Path Parameters:**
  - `expense_id` (integer) - The ID of the expense to delete.
- **Response:** `200 OK`
  ```json
  {
    "message": "Expense deleted successfully"
  }
  ```
- **Error Response:** `404 Not Found` (If the ID does not correspond to an existing record)
  ```json
  {
    "detail": "Expense not found"
  }
  ```

> **Interactive Docs:** Remember that FastAPI automatically generates live Swagger documentation at `/docs` where you can execute test payloads against these endpoints directly.
