from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# Courses
class ClassroomCourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    location_id: UUID

class ClassroomCourseCreate(ClassroomCourseBase):
    pass

class ClassroomCourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class ClassroomCourseResponse(ClassroomCourseBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Modules
class ClassroomModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: Optional[int] = 0
    course_id: UUID
    location_id: UUID

class ClassroomModuleCreate(ClassroomModuleBase):
    pass

class ClassroomModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

class ClassroomModuleResponse(ClassroomModuleBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Lessons
class ClassroomLessonBase(BaseModel):
    title: str
    content: Optional[str] = None
    video_url: Optional[str] = None
    order: Optional[int] = 0
    module_id: UUID
    location_id: UUID

class ClassroomLessonCreate(ClassroomLessonBase):
    pass

class ClassroomLessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    order: Optional[int] = None

class ClassroomLessonResponse(ClassroomLessonBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Assignments
class ClassroomAssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    lesson_id: Optional[UUID] = None
    course_id: Optional[UUID] = None
    location_id: UUID
    group_id: Optional[UUID] = None
    student_id: Optional[UUID] = None

class ClassroomAssignmentCreate(ClassroomAssignmentBase):
    pass

class ClassroomAssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None

class ClassroomAssignmentResponse(ClassroomAssignmentBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Submissions
class ClassroomSubmissionBase(BaseModel):
    content: Optional[str] = None
    file_url: Optional[str] = None
    status: Optional[str] = "submitted"
    grade: Optional[float] = None
    assignment_id: UUID
    student_id: UUID
    location_id: UUID

class ClassroomSubmissionCreate(BaseModel):
    content: Optional[str] = None
    assignment_id: UUID
    location_id: UUID

class ClassroomSubmissionUpdate(BaseModel):
    content: Optional[str] = None
    status: Optional[str] = None
    grade: Optional[float] = None

class ClassroomSubmissionResponse(ClassroomSubmissionBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Progress
class ClassroomProgressBase(BaseModel):
    completed: Optional[bool] = False
    completed_at: Optional[datetime] = None
    student_id: UUID
    lesson_id: UUID
    location_id: UUID

class ClassroomProgressCreate(BaseModel):
    lesson_id: UUID
    location_id: UUID
    completed: Optional[bool] = False

class ClassroomProgressUpdate(BaseModel):
    completed: Optional[bool] = None

class ClassroomProgressResponse(ClassroomProgressBase):
    id: UUID
    
    class Config:
        from_attributes = True

# Resources
class ClassroomResourceBase(BaseModel):
    title: str
    resource_type: str # 'video', 'audio', 'study_material', 'link', 'book'
    url: str
    location_id: Optional[UUID] = None

class ClassroomResourceCreate(ClassroomResourceBase):
    pass

class ClassroomResourceUpdate(BaseModel):
    title: Optional[str] = None
    resource_type: Optional[str] = None
    url: Optional[str] = None

class ClassroomResourceResponse(ClassroomResourceBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Q&A
class ClassroomQnABase(BaseModel):
    topic: str
    question_number: Optional[str] = None
    question_text: str
    answer_text: Optional[str] = None
    location_id: Optional[UUID] = None
    seven_tnt: Optional[str] = None
    category: Optional[str] = None
    stage: Optional[str] = None
    choices: Optional[list] = None

class ClassroomQnACreate(ClassroomQnABase):
    pass

class ClassroomQnAUpdate(BaseModel):
    topic: Optional[str] = None
    question_number: Optional[str] = None
    question_text: Optional[str] = None
    answer_text: Optional[str] = None
    location_id: Optional[UUID] = None
    seven_tnt: Optional[str] = None
    category: Optional[str] = None
    stage: Optional[str] = None
    choices: Optional[list] = None

class ClassroomQnAResponse(ClassroomQnABase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
