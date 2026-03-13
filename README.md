# Personal Expense Tracker

A modern, fast, and responsive full-stack application to track your personal finances and expenses built with **FastAPI** and Vanilla HTML/CSS/JS.

## Features
- **Dashboard:** Instantly view your total spending at a glance.
- **Manage Expenses:** Seamlessly add new expenses with categories (Food, Utilities, Entertainment, Housing, Transportation, Other).
- **History:** View a reverse-chronological list of all your recorded expenses.
- **Delete:** Remove erroneous or outdated expenses with a single click.
- **Responsive UI:** A clean, glassmorphism-inspired interface that works perfectly across all devices.

## Setup Instructions

### Prerequisites
- Python 3.8+

### Installation
1. Clone the repository and navigate to the project root.
2. Install the required backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application
1. Start the FastAPI server using `uvicorn`:
   ```bash
   uvicorn main:app --reload
   ```
2. Open your web browser and navigate to [http://localhost:8000](http://localhost:8000) to access the application UI.
3. Access the interactive API documentation at [http://localhost:8000/docs](http://localhost:8000/docs).
