"""Add RlltLookup columns

Revision ID: f40791960d57
Revises: f30791960d56
Create Date: 2026-05-05 05:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f40791960d57'
down_revision: Union[str, Sequence[str], None] = 'f30791960d56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('rllt_lookup', sa.Column('ot_bks', sa.String(), nullable=True))
    op.add_column('rllt_lookup', sa.Column('nt_bks', sa.String(), nullable=True))
    op.add_column('rllt_lookup', sa.Column('we5', sa.String(), nullable=True))
    op.add_column('rllt_lookup', sa.Column('pro', sa.String(), nullable=True))
    op.add_column('rllt_lookup', sa.Column('psa', sa.String(), nullable=True))
    op.add_column('rllt_lookup', sa.Column('chp', sa.Integer(), nullable=True))
    op.add_column('rllt_lookup', sa.Column('ver', sa.Integer(), nullable=True))
    op.add_column('rllt_lookup', sa.Column('ppl', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('rllt_lookup', 'ot_bks')
    op.drop_column('rllt_lookup', 'nt_bks')
    op.drop_column('rllt_lookup', 'we5')
    op.drop_column('rllt_lookup', 'pro')
    op.drop_column('rllt_lookup', 'psa')
    op.drop_column('rllt_lookup', 'chp')
    op.drop_column('rllt_lookup', 'ver')
    op.drop_column('rllt_lookup', 'ppl')
