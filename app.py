from fastapi import FastAPI, Depends, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schema, crud
from database import SessionLocal, engine
from validator import validate_task_data, validate_task_update

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

@app.get("/")
def read_root():
    return {"message": "Welcome to the TODO list app"}

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create a new task
@app.post("/tasks/", response_model=schema.Task, status_code=status.HTTP_201_CREATED)
def create_task(task: schema.TaskCreate, db: Session = Depends(get_db)):
    # Validate task data
    validate_task_data(task)
    
    # Create the task in the database
    db_task = crud.create_task(db=db, task=task)
    return db_task

# Get all tasks
@app.get("/tasks/", response_model=list[schema.Task])
def read_tasks(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    tasks = crud.get_tasks(db, skip=skip, limit=limit)
    return tasks

# Get a task by ID
@app.get("/tasks/{task_id}", response_model=schema.Task)
def read_task(task_id: int, db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id=task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# Update a task
@app.put("/tasks/{task_id}", response_model=schema.Task)
def update_task(task_id: int, task_update: schema.TaskUpdate, db: Session = Depends(get_db)):
    # Fetch the existing task
    existing_task = crud.get_task(db, task_id=task_id)
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Validate the update data
    validate_task_update(existing_task, task_update)

    # Update only the fields provided in the request
    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(existing_task, key, value)

    # Commit changes to the database
    db.commit()
    db.refresh(existing_task)

    return existing_task

# Delete a task
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    success = crud.delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}