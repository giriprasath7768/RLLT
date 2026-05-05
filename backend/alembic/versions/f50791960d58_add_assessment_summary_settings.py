"""Add AssessmentSummarySetting

Revision ID: f50791960d58
Revises: f40791960d57
Create Date: 2026-05-05 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f50791960d58'
down_revision: Union[str, Sequence[str], None] = 'f40791960d57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('assessment_summary_settings',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('location_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('settings', sa.JSON(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('location_id')
    )

def downgrade() -> None:
    op.drop_table('assessment_summary_settings')
