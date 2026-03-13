from fastapi import FastAPI
from routers import users, products

app = FastAPI(
    title="Demo E-commerce API",
    description="This is a simple demo API for testing DocuSync AI. It contains basic endpoints for user and product management.",
    version="1.0.0"
)

app.include_router(users.router)
app.include_router(products.router)

@app.get("/")
def read_root():
    """
    Root endpoint that returns a simple welcome message.
    """
    return {
        "message": "Welcome to the Demo E-commerce API!",
        "docs": "Visit /docs for the Swagger UI documentation."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
