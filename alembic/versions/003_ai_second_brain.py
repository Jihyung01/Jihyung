"""Create AI Second Brain tables

Revision ID: 003_ai_second_brain
Revises: 002_add_recurring_rule
Create Date: 2024-01-01 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_ai_second_brain'
down_revision: Union[str, None] = '002_add_recurring_rule'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create note table
    op.create_table('note',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('tags', sa.Text(), nullable=True),
        sa.Column('source_type', sa.String(length=50), nullable=True),
        sa.Column('source_meta', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create task table
    op.create_table('task',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('assignee', sa.String(length=100), nullable=True),
        sa.Column('note_id', sa.Integer(), nullable=True),
        sa.Column('recurring_rule', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['note_id'], ['note.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create calendar_event table
    op.create_table('calendar_event',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('all_day', sa.Boolean(), nullable=True),
        sa.Column('recurring_rule', sa.Text(), nullable=True),
        sa.Column('task_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['task.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for better performance
    op.create_index(op.f('ix_note_created_at'), 'note', ['created_at'], unique=False)
    op.create_index(op.f('ix_note_updated_at'), 'note', ['updated_at'], unique=False)
    op.create_index(op.f('ix_note_source_type'), 'note', ['source_type'], unique=False)
    
    op.create_index(op.f('ix_task_due_date'), 'task', ['due_date'], unique=False)
    op.create_index(op.f('ix_task_priority'), 'task', ['priority'], unique=False)
    op.create_index(op.f('ix_task_status'), 'task', ['status'], unique=False)
    op.create_index(op.f('ix_task_created_at'), 'task', ['created_at'], unique=False)
    
    op.create_index(op.f('ix_calendar_event_start_time'), 'calendar_event', ['start_time'], unique=False)
    op.create_index(op.f('ix_calendar_event_end_time'), 'calendar_event', ['end_time'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_calendar_event_end_time'), table_name='calendar_event')
    op.drop_index(op.f('ix_calendar_event_start_time'), table_name='calendar_event')
    op.drop_index(op.f('ix_task_created_at'), table_name='task')
    op.drop_index(op.f('ix_task_status'), table_name='task')
    op.drop_index(op.f('ix_task_priority'), table_name='task')
    op.drop_index(op.f('ix_task_due_date'), table_name='task')
    op.drop_index(op.f('ix_note_source_type'), table_name='note')
    op.drop_index(op.f('ix_note_updated_at'), table_name='note')
    op.drop_index(op.f('ix_note_created_at'), table_name='note')
    
    # Drop tables
    op.drop_table('calendar_event')
    op.drop_table('task')
    op.drop_table('note')