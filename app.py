from fastapi import FastAPI, Depends, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schema, crud
from database import SessionLocal, engine
from validator import validate_task_data, validate_task_update
import logging

logging.basicConfig(level=logging.DEBUG)

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the TODO list app"}

# User registration
@app.post("/register", response_model=schema.User)
def register_user(user: schema.UserCreate, db: Session = Depends(get_db)):
    db_user_email = crud.get_user_by_email(db, email=user.email)
    if db_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user_username = crud.get_user_by_username(db, username=user.username)
    if db_user_username:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    return crud.create_user(db=db, user=user)

# Login endpoint
@app.post("/login", response_model=schema.User)
def login_user(login_data: schema.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=login_data.email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found with this email")
    return user

# Get user profile
@app.get("/users/{user_id}", response_model=schema.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Create a new task
@app.post("/tasks/", response_model=schema.Task, status_code=status.HTTP_201_CREATED)
def create_task(task: schema.TaskCreate, user_id: int, db: Session = Depends(get_db)):
    validate_task_data(task)
    
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return crud.create_task(db=db, task=task, user_id=user_id)

# Get all tasks for a user
@app.get("/tasks/user/{user_id}", response_model=List[schema.Task])
def read_user_tasks(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    return crud.get_tasks(db, skip=skip, limit=limit, user_id=user_id)

# Get a task by ID (checking ownership)
@app.get("/tasks/{task_id}", response_model=schema.Task)
def read_task(task_id: int, user_id: int, db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id=task_id)
    if task is None or task.owner_id != user_id:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized")
    return task

# Update a task (checking ownership)
@app.put("/tasks/{task_id}", response_model=schema.Task)
def update_task(task_id: int, task_update: schema.TaskUpdate, user_id: int, db: Session = Depends(get_db)):
    existing_task = crud.get_task(db, task_id=task_id)
    if not existing_task or existing_task.owner_id != user_id:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized")
    
    validate_task_update(existing_task, task_update)

    # Use existing CRUD function
    updated_task = crud.update_task(db, task_id, task_update, user_id)
    
    if not updated_task:
        raise HTTPException(status_code=500, detail="Failed to update task")
    
    return updated_task

# Delete a task (checking ownership)
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, user_id: int, db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id=task_id)
    if not task or task.owner_id != user_id:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized")
    
    if task.status != 'cancelled':
        raise HTTPException(status_code=400, detail="Only cancelled tasks can be deleted")
    
    return crud.delete_task(db, task_id, user_id=user_id)

# Get all users
@app.get("/users/", response_model=List[schema.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_users(db, skip=skip, limit=limit)
