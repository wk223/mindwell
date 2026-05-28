"""enable Row-Level Security on all user-data tables

Revision ID: 003
Revises: 002
Create Date: 2025-07-11
"""
from typing import Sequence, Union

from alembic import op


revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Enable RLS on every table that holds user data ──
    for table in (
        "conversations",
        "messages",
        "mood_entries",
        "assessments",
        "user_memories",
        "posts",
        "comments",
        "safety_events",
    ):
        op.execute(f'ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY')
        op.execute(f"""
            CREATE POLICY "{table}_user_isolation" ON "{table}"
            FOR ALL
            USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
            WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
        """)

    # ── messages linked via conversation (no direct user_id) ──
    op.execute("""
        CREATE POLICY "messages_via_conversation" ON "messages"
        FOR ALL
        USING (
            conversation_id IN (
                SELECT id FROM conversations
                WHERE user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            )
        )
    """)
    # Drop the overly-strict direct policy on messages (messages has no user_id column)
    op.execute('DROP POLICY "messages_user_isolation" ON "messages"')

    # ── Composite indexes for common (user_id, time) queries ──
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_conversations_user_created "
        "ON conversations (user_id, created_at DESC)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_messages_conv_created "
        "ON messages (conversation_id, created_at)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_mood_entries_user_recorded "
        "ON mood_entries (user_id, recorded_at DESC)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_assessments_user_completed "
        "ON assessments (user_id, completed_at DESC)"
    )


def downgrade() -> None:
    for table in (
        "conversations",
        "messages",
        "mood_entries",
        "assessments",
        "user_memories",
        "posts",
        "comments",
        "safety_events",
    ):
        op.execute(f'ALTER TABLE "{table}" DISABLE ROW LEVEL SECURITY')
        op.execute(f'DROP POLICY IF EXISTS "{table}_user_isolation" ON "{table}"')

    op.execute("DROP POLICY IF EXISTS messages_via_conversation ON messages")

    op.execute("DROP INDEX IF EXISTS ix_conversations_user_created")
    op.execute("DROP INDEX IF EXISTS ix_messages_conv_created")
    op.execute("DROP INDEX IF EXISTS ix_mood_entries_user_recorded")
    op.execute("DROP INDEX IF EXISTS ix_assessments_user_completed")
