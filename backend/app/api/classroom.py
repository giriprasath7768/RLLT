import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from typing import List, Optional

from app.db.database import get_db
from app.db.models import ClassroomCourse, ClassroomModule, ClassroomLesson, ClassroomAssignment, ClassroomSubmission, ClassroomProgress, ClassroomResource, ClassroomQnA, User
from app.api.auth import get_current_user
from app.schemas.classroom import (
    ClassroomCourseCreate, ClassroomCourseUpdate, ClassroomCourseResponse,
    ClassroomModuleCreate, ClassroomModuleUpdate, ClassroomModuleResponse,
    ClassroomLessonCreate, ClassroomLessonUpdate, ClassroomLessonResponse,
    ClassroomAssignmentCreate, ClassroomAssignmentUpdate, ClassroomAssignmentResponse,
    ClassroomSubmissionCreate, ClassroomSubmissionUpdate, ClassroomSubmissionResponse,
    ClassroomProgressCreate, ClassroomProgressUpdate, ClassroomProgressResponse,
    ClassroomResourceCreate, ClassroomResourceUpdate, ClassroomResourceResponse,
    ClassroomQnACreate, ClassroomQnAUpdate, ClassroomQnAResponse
)

router = APIRouter()

# --- Courses ---

@router.get("/courses", response_model=List[ClassroomCourseResponse])
async def read_courses(
    location_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ClassroomCourse)
    
    # Strictly filter by student's registered location
    if current_user.role == "student":
        if not current_user.location_id:
            return [] # No location assigned
        location_id = current_user.location_id

    if location_id:
        query = query.where(ClassroomCourse.location_id == location_id)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/courses", response_model=ClassroomCourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course: ClassroomCourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_course = ClassroomCourse(**course.model_dump())
    db.add(db_course)
    await db.commit()
    await db.refresh(db_course)
    return db_course

@router.put("/courses/{course_id}", response_model=ClassroomCourseResponse)
async def update_course(
    course_id: uuid.UUID,
    course_update: ClassroomCourseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_course = await db.get(ClassroomCourse, course_id)
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    for key, value in course_update.model_dump(exclude_unset=True).items():
        setattr(db_course, key, value)
        
    await db.commit()
    await db.refresh(db_course)
    return db_course

@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_course = await db.get(ClassroomCourse, course_id)
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    await db.delete(db_course)
    await db.commit()
    return None

# --- Modules ---

@router.get("/modules", response_model=List[ClassroomModuleResponse])
async def read_modules(
    course_id: Optional[uuid.UUID] = None,
    location_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ClassroomModule)
    
    # Strictly filter by student's registered location
    if current_user.role == "student":
        if not current_user.location_id:
            return []
        location_id = current_user.location_id

    if course_id:
        query = query.where(ClassroomModule.course_id == course_id)
    if location_id:
        query = query.where(ClassroomModule.location_id == location_id)
        
    result = await db.execute(query.order_by(ClassroomModule.order))
    return result.scalars().all()

@router.post("/modules", response_model=ClassroomModuleResponse, status_code=status.HTTP_201_CREATED)
async def create_module(
    module: ClassroomModuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_module = ClassroomModule(**module.model_dump())
    db.add(db_module)
    await db.commit()
    await db.refresh(db_module)
    return db_module

@router.put("/modules/{module_id}", response_model=ClassroomModuleResponse)
async def update_module(
    module_id: uuid.UUID,
    module_update: ClassroomModuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_module = await db.get(ClassroomModule, module_id)
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    for key, value in module_update.model_dump(exclude_unset=True).items():
        setattr(db_module, key, value)
        
    await db.commit()
    await db.refresh(db_module)
    return db_module

@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_module(
    module_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_module = await db.get(ClassroomModule, module_id)
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    await db.delete(db_module)
    await db.commit()
    return None

# --- Lessons ---

@router.get("/lessons", response_model=List[ClassroomLessonResponse])
async def read_lessons(
    module_id: Optional[uuid.UUID] = None,
    location_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ClassroomLesson)
    
    # Strictly filter by student's registered location
    if current_user.role == "student":
        if not current_user.location_id:
            return []
        location_id = current_user.location_id

    if module_id:
        query = query.where(ClassroomLesson.module_id == module_id)
    if location_id:
        query = query.where(ClassroomLesson.location_id == location_id)
        
    result = await db.execute(query.order_by(ClassroomLesson.order))
    return result.scalars().all()

@router.post("/lessons", response_model=ClassroomLessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    lesson: ClassroomLessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_lesson = ClassroomLesson(**lesson.model_dump())
    db.add(db_lesson)
    await db.commit()
    await db.refresh(db_lesson)
    return db_lesson

@router.put("/lessons/{lesson_id}", response_model=ClassroomLessonResponse)
async def update_lesson(
    lesson_id: uuid.UUID,
    lesson_update: ClassroomLessonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_lesson = await db.get(ClassroomLesson, lesson_id)
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    for key, value in lesson_update.model_dump(exclude_unset=True).items():
        setattr(db_lesson, key, value)
        
    await db.commit()
    await db.refresh(db_lesson)
    return db_lesson

@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_lesson = await db.get(ClassroomLesson, lesson_id)
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    await db.delete(db_lesson)
    await db.commit()
    return None

# --- Assignments ---

@router.get("/assignments", response_model=List[ClassroomAssignmentResponse])
async def read_assignments(
    lesson_id: Optional[uuid.UUID] = None,
    course_id: Optional[uuid.UUID] = None,
    location_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy import or_, and_

    query = select(ClassroomAssignment)
    
    if current_user.role == "student":
        if not current_user.location_id:
            return []
            
        conditions = [ClassroomAssignment.student_id == current_user.id]
        if hasattr(current_user, 'group_id') and current_user.group_id:
            conditions.append(ClassroomAssignment.group_id == current_user.group_id)
            
        conditions.append(
            and_(
                ClassroomAssignment.location_id == current_user.location_id,
                ClassroomAssignment.student_id.is_(None),
                ClassroomAssignment.group_id.is_(None)
            )
        )
        query = query.where(or_(*conditions))
    else:
        if location_id:
            query = query.where(ClassroomAssignment.location_id == location_id)

    if lesson_id:
        query = query.where(ClassroomAssignment.lesson_id == lesson_id)
    if course_id:
        query = query.where(ClassroomAssignment.course_id == course_id)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/assignments", response_model=ClassroomAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assignment: ClassroomAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_assignment = ClassroomAssignment(**assignment.model_dump())
    db.add(db_assignment)
    await db.commit()
    await db.refresh(db_assignment)
    return db_assignment

@router.put("/assignments/{assignment_id}", response_model=ClassroomAssignmentResponse)
async def update_assignment(
    assignment_id: uuid.UUID,
    assignment_update: ClassroomAssignmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_assignment = await db.get(ClassroomAssignment, assignment_id)
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    for key, value in assignment_update.model_dump(exclude_unset=True).items():
        setattr(db_assignment, key, value)
        
    await db.commit()
    await db.refresh(db_assignment)
    return db_assignment

# --- Submissions ---

@router.get("/submissions", response_model=List[ClassroomSubmissionResponse])
async def read_submissions(
    assignment_id: Optional[uuid.UUID] = None,
    location_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ClassroomSubmission)
    
    if current_user.role == "student":
        query = query.where(ClassroomSubmission.student_id == current_user.id)
        if not current_user.location_id:
            return []
        location_id = current_user.location_id

    if assignment_id:
        query = query.where(ClassroomSubmission.assignment_id == assignment_id)
    if location_id:
        query = query.where(ClassroomSubmission.location_id == location_id)
        
    result = await db.execute(query)
    return result.scalars().all()

from fastapi import UploadFile, File, Form
import shutil
import os

@router.post("/submissions/upload", response_model=ClassroomSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def upload_submission(
    assignment_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can upload submissions")

    # Save file
    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Safe filename
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"/api/uploads/{safe_filename}"
    
    db_submission = ClassroomSubmission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        location_id=current_user.location_id,
        file_url=file_url,
        content=file.filename # save original filename in content or we can just leave it as None
    )
    db.add(db_submission)
    await db.commit()
    await db.refresh(db_submission)
    return db_submission

@router.post("/submissions", response_model=ClassroomSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    submission: ClassroomSubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Enforce student id and location
    data = submission.model_dump()
    data["student_id"] = current_user.id
    if current_user.role == "student":
        data["location_id"] = current_user.location_id
        
    db_submission = ClassroomSubmission(**data)
    db.add(db_submission)
    await db.commit()
    await db.refresh(db_submission)
    return db_submission

@router.put("/submissions/{submission_id}", response_model=ClassroomSubmissionResponse)
async def update_submission(
    submission_id: uuid.UUID,
    update_data: dict, # Using dict to allow partial updates for grade, status, content
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_submission = await db.get(ClassroomSubmission, submission_id)
    if not db_submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if current_user.role == "student":
        # Students can only update their own submission's content
        if db_submission.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to edit this submission")
        if "content" in update_data:
            db_submission.content = update_data["content"]
            # Auto-grading logic
            try:
                import json
                answers = json.loads(update_data["content"])
                total_grade = 0.0
                
                # Fetch assignment to match Q&A topic
                db_assignment = await db.get(ClassroomAssignment, db_submission.assignment_id)
                if db_assignment:
                    stmt = select(ClassroomQnA).where(ClassroomQnA.topic == db_assignment.title)
                    qna_result = await db.execute(stmt)
                    qnas = qna_result.scalars().all()
                    
                    for qna in qnas:
                        ans = answers.get(str(qna.id))
                        if ans and qna.choices:
                            for c in qna.choices:
                                if c.get('choice') == ans:
                                    total_grade += float(c.get('grade', 0))
                                    break
                                    
                db_submission.grade = total_grade
                db_submission.status = "graded"
            except Exception as e:
                import logging
                logging.error(f"Auto-grading failed: {e}")
    else:
        # Admins can update grade and status
        if current_user.role not in ["super_admin", "admin", "leader"]:
            raise HTTPException(status_code=403, detail="Not authorized to grade submissions")
            
        if "grade" in update_data:
            db_submission.grade = update_data["grade"]
        if "status" in update_data:
            db_submission.status = update_data["status"]
            
    await db.commit()
    await db.refresh(db_submission)
    return db_submission

# --- Progress ---

@router.get("/progress", response_model=List[ClassroomProgressResponse])
async def read_progress(
    lesson_id: Optional[uuid.UUID] = None,
    location_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ClassroomProgress)
    
    if current_user.role == "student":
        query = query.where(ClassroomProgress.student_id == current_user.id)
        if not current_user.location_id:
            return []
        location_id = current_user.location_id

    if lesson_id:
        query = query.where(ClassroomProgress.lesson_id == lesson_id)
    if location_id:
        query = query.where(ClassroomProgress.location_id == location_id)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/progress", response_model=ClassroomProgressResponse, status_code=status.HTTP_201_CREATED)
async def create_progress(
    progress: ClassroomProgressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import datetime
    
    data = progress.model_dump()
    data["student_id"] = current_user.id
    if progress.completed:
        data["completed_at"] = datetime.datetime.utcnow()
        
    if current_user.role == "student":
        data["location_id"] = current_user.location_id
        
    db_progress = ClassroomProgress(**data)
    db.add(db_progress)
    await db.commit()
    await db.refresh(db_progress)
    return db_progress

# --- Resources ---

@router.get("/resources", response_model=List[ClassroomResourceResponse])
async def read_resources(
    resource_type: Optional[str] = None,
    location_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ClassroomResource)
    
    if current_user.role == "student":
        if not current_user.location_id:
            return []
        location_id = current_user.location_id

    if resource_type:
        query = query.where(ClassroomResource.resource_type == resource_type)
    if location_id:
        query = query.where(or_(ClassroomResource.location_id == location_id, ClassroomResource.location_id.is_(None)))
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/resources", response_model=ClassroomResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    resource: ClassroomResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "student":
        raise HTTPException(status_code=403, detail="Students cannot create resources")
        
    db_resource = ClassroomResource(**resource.model_dump())
    db.add(db_resource)
    await db.commit()
    await db.refresh(db_resource)
    return db_resource

@router.put("/resources/{resource_id}", response_model=ClassroomResourceResponse)
async def update_resource(
    resource_id: uuid.UUID,
    resource_update: ClassroomResourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "student":
        raise HTTPException(status_code=403, detail="Students cannot update resources")
        
    db_resource = await db.get(ClassroomResource, resource_id)
    if not db_resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    for key, value in resource_update.model_dump(exclude_unset=True).items():
        setattr(db_resource, key, value)
        
    await db.commit()
    await db.refresh(db_resource)
    return db_resource

@router.delete("/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "student":
        raise HTTPException(status_code=403, detail="Students cannot delete resources")
        
    db_resource = await db.get(ClassroomResource, resource_id)
    if not db_resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    await db.delete(db_resource)
    await db.commit()
    return None

# --- Q&A ---

@router.get("/qna", response_model=List[ClassroomQnAResponse])
async def read_qna(
    topic: Optional[str] = None,
    location_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ClassroomQnA)
    
    if current_user.role == "student":
        if not current_user.location_id:
            return []
        location_id = current_user.location_id

    if topic:
        query = query.where(ClassroomQnA.topic == topic)
    if location_id:
        query = query.where(or_(ClassroomQnA.location_id == location_id, ClassroomQnA.location_id.is_(None)))
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/qna", response_model=ClassroomQnAResponse, status_code=status.HTTP_201_CREATED)
async def create_qna(
    qna: ClassroomQnACreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "student":
        raise HTTPException(status_code=403, detail="Students cannot create Q&A")
        
    db_qna = ClassroomQnA(**qna.model_dump())
    db.add(db_qna)
    await db.commit()
    await db.refresh(db_qna)
    return db_qna

@router.post("/qna/bulk", response_model=dict, status_code=status.HTTP_201_CREATED)
async def bulk_create_qna(
    qnas: List[ClassroomQnACreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "student":
        raise HTTPException(status_code=403, detail="Students cannot create Q&A")
        
    db_qnas = [ClassroomQnA(**qna.model_dump()) for qna in qnas]
    db.add_all(db_qnas)
    await db.commit()
    return {"message": f"Successfully created {len(db_qnas)} Q&A items"}

@router.delete("/qna/{qna_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_qna(
    qna_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "student":
        raise HTTPException(status_code=403, detail="Students cannot delete Q&A")
        
    db_qna = await db.get(ClassroomQnA, qna_id)
    if not db_qna:
        raise HTTPException(status_code=404, detail="Q&A not found")
        
    await db.delete(db_qna)
    await db.commit()
    return None
