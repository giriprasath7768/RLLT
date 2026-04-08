"""Init books and chapters

Revision ID: 66d4e70c45a4
Revises: 
Create Date: 2026-03-27 21:54:09.690911

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '66d4e70c45a4'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'books',
        sa.Column('id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('short_form', sa.String(), nullable=True),
        sa.Column('author', sa.String(), server_default='Unknown', nullable=True),
        sa.Column('total_chapters', sa.Integer(), server_default='0', nullable=True),
        sa.Column('total_verses', sa.Integer(), server_default='0', nullable=True),
        sa.Column('total_art', sa.Float(), server_default='0.0', nullable=True),
        sa.Column('ppl', sa.Float(), server_default='0.0', nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    op.create_table(
        'chapters',
        sa.Column('id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('book_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('chapter_number', sa.Integer(), nullable=False),
        sa.Column('verse_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('art', sa.Float(), server_default='0.0', nullable=True),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('chapters')
    op.drop_table('books')
