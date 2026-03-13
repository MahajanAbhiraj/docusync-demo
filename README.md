# DocuSync Demo API

This repository is created for testing purposes only. It is intended to be used with the **DocuSync AI** project, which automatically synchronizes documentation in Confluence whenever a pull request is merged.

## Overview

This is a simulated FastAPI project with some simple mock endpoints (`users`, `products`), illustrating how DocuSync can parse docstrings and typing hints to update Confluence pages.

## Getting Started

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the server:**
   ```bash
   python main.py
   ```
   Or use `uvicorn`:
   ```bash
   uvicorn main:app --reload
   ```

3. **Check the documentation:**
   Navigate to [http://localhost:8000/docs](http://localhost:8000/docs) to see the automatically generated OpenAPI interface.
