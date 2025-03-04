from pydantic import BaseModel
from typing import Optional

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None

class TaskCreate(TaskBase):
    status: Optional[str] = "pending"  

class Task(TaskBase):
    id: int
    status: str  

    class Config:
        orm_mode = True  

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  