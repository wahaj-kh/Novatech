from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models
from database import engine
from routers import auth, products, cart, uploads, settings, orders

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NovaTech API",
    description="Backend API for NovaTech E-Commerce Platform",
    version="1.0.0",
    swagger_ui_parameters={"docExpansion": "list"}
)

# --- CORS Configuration ---
# Allows the Next.js frontend (localhost:3000) to communicate with this API.
# In production, replace "*" origins with your actual domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(uploads.router)
app.include_router(settings.router)
app.include_router(orders.router)

# Mount static files for uploads
app.mount("/static", StaticFiles(directory="uploads"), name="static")

@app.get("/")
def read_root():
    return {"message": "Welcome to the NovaTech API"}
