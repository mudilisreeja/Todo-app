from sqlalchemy.orm import Session
import models, schema

# Create a task
def create_task(db: Session, task: schema.TaskCreate):
    new_task = models.Task(**task.dict()) 
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

# Get all tasks
def get_tasks(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Task).offset(skip).limit(limit).all()

# Get  task by ID
def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id).first()

# Update a task
def update_task(db: Session, task_id: int, task: schema.TaskUpdate):
    existing_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not existing_task:
        return None
    for key, value in task.dict(exclude_unset=True).items():  
        setattr(existing_task, key, value)
    db.commit()
    db.refresh(existing_task)
    return existing_task
    

# Delete a task
def delete_task(db: Session, task_id: int):
    task = db.query(models.Task).filter(models.Task.id == task_id).first() 
    if task:
        db.delete(task)
        db.commit()
        return True
    return False
