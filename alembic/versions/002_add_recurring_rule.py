"""Add recurring_rule to tasks

Revision ID: 002
Revises: 001
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # Add recurring_rule column to tasks table
    op.add_column('tasks', sa.Column('recurring_rule', sa.Text(), nullable=True))

def downgrade():
    # Drop recurring_rule column from tasks table
    op.drop_column('tasks', 'recurring_rule')