import enum
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func, Enum as SQLEnum, Integer, Float, UniqueConstraint
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
    video_url = Column(String, nullable=True)
    ref_link = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    book = relationship("Book", backref="contents")
    chapter = relationship("Chapter", backref="contents")

    __table_args__ = (UniqueConstraint('book_id', 'chapter_id', name='uq_content_book_chapter'),)

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
