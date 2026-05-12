import enum
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func, Enum as SQLEnum, Integer, Float, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base

class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    leader = "leader"
    student = "student"
    ttom_user = "ttom_user"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.student)
    is_active = Column(Boolean, default=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)

    name = Column(String, nullable=True)
    address = Column(String, nullable=True)
    mobile_number = Column(String, nullable=True)
    dob = Column(DateTime(timezone=True), nullable=True)
    gender = Column(String, nullable=True)
    category = Column(String, nullable=True)
    stage = Column(String, nullable=True)
    enrollment_number = Column(String, unique=True, index=True, nullable=True)
    activation_email_sent = Column(Boolean, default=False)
    assessment_status = Column(String, default="pending")
    assessment_marks = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    group_id = Column(UUID(as_uuid=True), ForeignKey("student_groups.id"), nullable=True)

    group = relationship("StudentGroup", back_populates="members")
    media = relationship("Media", back_populates="owner")

class Media(Base):
    __tablename__ = "media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String, nullable=False)
    s3_key = Column(String, nullable=False)
    file_type = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="media")

class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

class StudentTouchCount(Base):
    __tablename__ = "student_touch_counts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    transformation_touches = Column(Integer, default=0)
    team_transformation_touches = Column(Integer, default=0)
    klt_reading_plan_touches = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="touch_counts")

class StudentHighlight(Base):
    __tablename__ = "student_highlights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=False, index=True)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    selected_text = Column(String, nullable=True)
    color = Column(String, nullable=True)
    label = Column(String, nullable=True)
    format = Column(String, nullable=True)
    style_option = Column(String, nullable=True)
    rects = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    book = relationship("Book")
    chapter = relationship("Chapter")

class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    continent = Column(String, nullable=False, index=True)
    country = Column(String, nullable=False, index=True)
    city = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SuperAdmin(Base):
    __tablename__ = "super_admins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    name = Column(String, nullable=False)
    mobile_number = Column(String)
    address = Column(String)
    profile_image_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="super_admin_profile")

class Admin(Base):
    __tablename__ = "admins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    name = Column(String, nullable=False)
    mobile_number = Column(String)
    address = Column(String)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="admin_profile")
    location = relationship("Location")

class Leader(Base):
    __tablename__ = "leaders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("admins.id"), nullable=False)
    name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=False)
    address = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="leader_profile")
    admin = relationship("Admin", backref="leaders")

class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False)
    selected_choice = Column(Integer, nullable=False)
    awarded_grade = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="assessment_results")
    assessment = relationship("Assessment")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    location_module = Column(String, nullable=False, index=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)
    question_number = Column(String, nullable=True)
    question_text = Column(String, nullable=False)
    seven_tnt = Column(String, nullable=True)
    category = Column(String, nullable=True)
    stage = Column(String, nullable=True)
    
    choice_1 = Column(String, nullable=True)
    grade_1 = Column(String, nullable=True)
    
    choice_2 = Column(String, nullable=True)
    grade_2 = Column(String, nullable=True)
    
    choice_3 = Column(String, nullable=True)
    grade_3 = Column(String, nullable=True)
    
    choice_4 = Column(String, nullable=True)
    grade_4 = Column(String, nullable=True)
    
    choice_5 = Column(String, nullable=True)
    grade_5 = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Book(Base):
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    short_form = Column(String, nullable=True)
    author = Column(String, default="Unknown")
    total_chapters = Column(Integer, default=0)
    total_verses = Column(Integer, default=0)
    total_art = Column(Float, default=0.0)
    ppl = Column(Float, default=0.0)
    book_type = Column(String, nullable=True)

    chapters = relationship("Chapter", back_populates="book", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=False)
    chapter_number = Column(Integer, nullable=False)
    verse_count = Column(Integer, default=0)
    art = Column(Float, default=0.0)

    book = relationship("Book", back_populates="chapters")

class RlltLookup(Base):
    __tablename__ = "rllt_lookup"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module = Column(Integer, nullable=False)
    facet = Column(Integer, nullable=False)
    phase = Column(Integer, nullable=False)
    day = Column(Integer, nullable=False)
    art = Column(String, nullable=False)
    scheduled_value_days = Column(Integer, nullable=False)
    ot_bks = Column(String, nullable=True)
    nt_bks = Column(String, nullable=True)
    we5 = Column(String, nullable=True)
    pro = Column(String, nullable=True)
    psa = Column(String, nullable=True)
    chp = Column(Integer, nullable=True)
    ver = Column(Integer, nullable=True)
    ppl = Column(String, nullable=True)

class ChartMapping(Base):
    __tablename__ = "chart_mappings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module = Column(Integer, nullable=False)
    facet = Column(Integer, nullable=False)
    phase = Column(Integer, nullable=False)
    banner_text = Column(String, nullable=True)
    t_label = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    state_payload = Column(String, nullable=False) # JSON blob stringified
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (UniqueConstraint('module', 'facet', 'phase', name='uq_chart_mapping_mfp'),)

class VCardMapping(Base):
    __tablename__ = "vcard_mappings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module = Column(Integer, nullable=False)
    facet = Column(Integer, nullable=False)
    phase = Column(Integer, nullable=False)
    banner_text = Column(String, nullable=True)
    t_label = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    state_payload = Column(String, nullable=False) # JSON blob stringified
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (UniqueConstraint('module', 'facet', 'phase', name='uq_vcard_mapping_mfp'),)

class OilChartMapping(Base):
    __tablename__ = "oil_chart_mappings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module = Column(Integer, nullable=False)
    facet = Column(Integer, nullable=False)
    phase = Column(Integer, nullable=False)
    banner_text = Column(String, nullable=True)
    t_label = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    state_payload = Column(String, nullable=False) # JSON blob stringified
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (UniqueConstraint('module', 'facet', 'phase', name='uq_oil_chart_mapping_mfp'),)


class Content(Base):
    __tablename__ = "contents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=False)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id"), nullable=False)
    audio_url = Column(String, nullable=True)
    audio_language = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    pdf_url = Column(String, nullable=True)
    ref_link = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    book = relationship("Book", backref="contents")
    chapter = relationship("Chapter", backref="contents")

    __table_args__ = (UniqueConstraint('book_id', 'chapter_id', name='uq_content_book_chapter'),)

class SevenTNTContent(Base):
    __tablename__ = "seven_tnt_contents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=False)
    verses = Column(String, nullable=True)
    audio_url = Column(String, nullable=True)
    audio_language = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    ref_link = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    book = relationship("Book", backref="seven_tnt_contents")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    chart_id = Column(String, nullable=True) # e.g. mapping ID
    chart_type = Column(String, nullable=False) # e.g. "30-Day", "40-Day"
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="assignments")

class StudentGroup(Base):
    __tablename__ = "student_groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    location = relationship("Location")
    members = relationship("User", back_populates="group")

class WordDocument(Base):
    __tablename__ = "word_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True, default="Untitled Document")
    content = Column(String, nullable=True)
    watermark_url = Column(String, nullable=True)
    language = Column(String, nullable=True)
    country_code = Column(String, nullable=True)
    category = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")

class TTOMUser(Base):
    __tablename__ = "ttom_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    mobile_number = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False) # 4-digit password hashed
    plain_password = Column(String(4), nullable=True) # Expose pin to data table mappings
    is_active = Column(Boolean, default=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    location = relationship("Location")

class TTOMAssignment(Base):
    __tablename__ = "ttom_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("ttom_users.id"), nullable=False)
    chart_id = Column(String, nullable=True) # e.g. mapping ID
    chart_type = Column(String, nullable=False) # e.g. "30-Day", "40-Day"
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("TTOMUser", backref="assignments")

class SevenTNTChartMapping(Base):
    __tablename__ = "seven_tnt_chart_mappings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module = Column(Integer, nullable=False)
    facet = Column(Integer, nullable=False)
    phase = Column(Integer, nullable=False)
    banner_text = Column(String, nullable=True)
    t_label = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    state_payload = Column(String, nullable=False) # JSON blob stringified
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (UniqueConstraint('module', 'facet', 'phase', name='uq_seven_tnt_chart_mapping_mfp'),)

class SevenTNTDayCycleChartMapping(Base):
    __tablename__ = "seven_tnt_day_cycle_chart_mappings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module = Column(Integer, nullable=False)
    facet = Column(Integer, nullable=False)
    phase = Column(Integer, nullable=False)
    banner_text = Column(String, nullable=True)
    t_label = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    state_payload = Column(String, nullable=False) # JSON blob stringified
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (UniqueConstraint('module', 'facet', 'phase', name='uq_seven_tnt_day_cycle_chart_mapping_mfp'),)

class ImageGallery(Base):
    __tablename__ = "image_gallery"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ClassroomCourse(Base):
    __tablename__ = "classroom_courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    modules = relationship("ClassroomModule", back_populates="course", cascade="all, delete-orphan")
    location = relationship("Location")

class ClassroomModule(Base):
    __tablename__ = "classroom_modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("classroom_courses.id"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    course = relationship("ClassroomCourse", back_populates="modules")
    lessons = relationship("ClassroomLesson", back_populates="module", cascade="all, delete-orphan")

class ClassroomLesson(Base):
    __tablename__ = "classroom_lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("classroom_modules.id"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    module = relationship("ClassroomModule", back_populates="lessons")

class ClassroomAssignment(Base):
    __tablename__ = "classroom_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("classroom_lessons.id"), nullable=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("classroom_courses.id"), nullable=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    group_id = Column(UUID(as_uuid=True), ForeignKey("student_groups.id"), nullable=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lesson = relationship("ClassroomLesson")
    course = relationship("ClassroomCourse")
    submissions = relationship("ClassroomSubmission", back_populates="assignment", cascade="all, delete-orphan")

class ClassroomSubmission(Base):
    __tablename__ = "classroom_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("classroom_assignments.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    content = Column(String, nullable=True)
    file_url = Column(String, nullable=True)
    status = Column(String, default="submitted")
    grade = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    assignment = relationship("ClassroomAssignment", back_populates="submissions")
    student = relationship("User")

class ClassroomProgress(Base):
    __tablename__ = "classroom_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("classroom_lessons.id"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    student = relationship("User")
    lesson = relationship("ClassroomLesson")

class ClassroomResource(Base):
    __tablename__ = "classroom_resources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)
    title = Column(String, nullable=False)
    resource_type = Column(String, nullable=False) # 'video', 'audio', 'study_material', 'link', 'book'
    url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    location = relationship("Location")


class ClassroomQnA(Base):
    __tablename__ = "classroom_qna"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)
    topic = Column(String, nullable=False, index=True)
    question_number = Column(String, nullable=True)
    question_text = Column(String, nullable=False)
    
    # New fields
    seven_tnt = Column(String, nullable=True)
    category = Column(String, nullable=True)
    stage = Column(String, nullable=True)
    
    # Store choices and grades as a list of dicts: [{"choice": "A", "grade": 10}, ...]
    choices = Column(JSON, nullable=True)
    
    # Optional/deprecated
    answer_text = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    location = relationship("Location")

class AssessmentSummarySetting(Base):
    __tablename__ = "assessment_summary_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False, unique=True)
    settings = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    location = relationship("Location")
