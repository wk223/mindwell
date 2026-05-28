"""initial migration — all tables

Revision ID: 001
Revises:
Create Date: 2026-05-26

Create all 8 tables: users, conversations, messages, safety_events,
mood_entries, assessments, posts, comments.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ──
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("nickname", sa.String(50), nullable=False),
        sa.Column("email_hash", sa.String(64), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("avatar_seed", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("timezone", sa.String(50), nullable=False, server_default=sa.text("'UTC'")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email_hash"),
        sa.UniqueConstraint("nickname"),
    )
    op.create_index("ix_users_nickname", "users", ["nickname"])

    # ── conversations ──
    op.create_table(
        "conversations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(200), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'active'")),
        sa.Column("crisis_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_conversations_user_id", "conversations", ["user_id"])

    # ── messages ──
    op.create_table(
        "messages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("conversation_id", sa.Uuid(), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("agent_id", sa.String(50), nullable=True),
        sa.Column("safety_flags", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("meta_info", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])

    # ── safety_events ──
    op.create_table(
        "safety_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("message_id", sa.Uuid(), nullable=True),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("rule_id", sa.String(100), nullable=True),
        sa.Column("triggered_text", sa.Text(), nullable=True),
        sa.Column("action_taken", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["message_id"], ["messages.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_safety_events_user_id", "safety_events", ["user_id"])

    # ── mood_entries ──
    op.create_table(
        "mood_entries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("mood_score", sa.Integer(), nullable=False),
        sa.Column("mood_label", sa.String(30), nullable=True),
        sa.Column("journal_text", sa.Text(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("recorded_at", sa.Date(), nullable=False, server_default=sa.text("CURRENT_DATE")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_mood_entries_user_id", "mood_entries", ["user_id"])

    # ── assessments ──
    op.create_table(
        "assessments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("scale_type", sa.String(30), nullable=False),
        sa.Column("total_score", sa.Integer(), nullable=False),
        sa.Column("severity_level", sa.String(30), nullable=True),
        sa.Column("interpretation", sa.Text(), nullable=True),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_assessments_user_id", "assessments", ["user_id"])

    # ── posts ──
    op.create_table(
        "posts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("display_name", sa.String(50), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("content_labels", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("moderation_status", sa.String(20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── comments ──
    op.create_table(
        "comments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("post_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("display_name", sa.String(50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("moderation_status", sa.String(20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_comments_post_id", "comments", ["post_id"])


def downgrade() -> None:
    op.drop_table("comments")
    op.drop_table("posts")
    op.drop_table("assessments")
    op.drop_table("mood_entries")
    op.drop_table("safety_events")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("users")
