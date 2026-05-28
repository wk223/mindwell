from pydantic import BaseModel, Field


class MoodCheckinRequest(BaseModel):
    mood_score: int = Field(ge=1, le=10)
    mood_label: str | None = None
    journal_text: str | None = Field(default=None, max_length=2000)
    tags: list[str] = Field(default_factory=list)


class MoodEntryResponse(BaseModel):
    id: str
    mood_score: int
    mood_label: str | None
    journal_text: str | None
    tags: list[str]
    recorded_at: str
    created_at: str


class MoodTrendPoint(BaseModel):
    date: str
    score: float
    label: str | None


class MoodTrendsResponse(BaseModel):
    entries: list[MoodTrendPoint]
    average: float
    highest: float
    lowest: float
    total_entries: int


class MoodStatsResponse(BaseModel):
    current_streak: int
    longest_streak: int
    total_checkins: int
    average_score: float
    most_common_label: str | None
    monthly_summary: list[MoodTrendPoint]
