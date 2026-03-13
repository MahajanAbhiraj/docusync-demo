# Project Overview

## Introduction
The **Personal Expense Tracker** is a comprehensive solution designed to help individuals monitor their daily spending habits. By providing a streamlined interface and a robust backend, the project ensures that managing personal finances is both efficient and intuitive.

## Architecture & Technology Stack
The application adopts a decoupled client-server architecture:

1. **Backend (FastAPI)**:
   - Built on top of Python's FastAPI framework for high-performance API routing and validation.
   - Pydantic models are used to strictly define the shapes of `Expense` objects, ensuring data integrity across requests.
   - The application serves an organized RESTful API out of the `routers/` directory to separate concerns cleanly.

2. **Frontend (HTML/CSS/JS)**:
   - Located in the `static/` directory, the frontend consists of native web technologies for maximum performance without the overhead of complex frameworks.
   - Features modern CSS styling, including flexible grid layouts, smooth transitions, and a premium "glassmorphism" aesthetic.
   - The JavaScript tier (`app.js`) handles asynchronous communication (`fetch`) with the backend API to dynamically update the UI state.

## Core Capabilities
- **Real-time Synchronization:** Adding or deleting an expense reflects instantly on the UI.
- **Data Encapsulation:** Expense records are securely tracked, storing critical metadata like title, amount, category, and date.
- **Extensibility:** The modular FastAPI structure allows for straightforward additions of future features (e.g., authentication, database persistence using SQLAlchemy, or advanced charting).
