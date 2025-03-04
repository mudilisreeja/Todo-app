from fastapi import HTTPException, status
import schema
from sqlalchemy.orm import Session
import models


def validate_task_data(task: schema.TaskCreate):
    if not task.title.strip():
        raise HTTPException(status_code=400, detail="Title should not be empty")
    if task.description and len(task.description) > 500:
        raise HTTPException(status_code=400, detail="Description must be less than 500 characters")
    return task



def validate_task_update(task: models.Task, task_update: schema.TaskUpdate):

    if task_update.title is not None and task_update.title != task.title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title cannot be updated"
        )

    
    if task_update.description is not None and task_update.description != task.description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description cannot be updated"
        )

    
    allowed_statuses = ["pending", "in_progress","completed","hold","cancel"]
    if task_update.status is not None and task_update.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed values are: {', '.join(allowed_statuses)}"
        )

    return task_update


