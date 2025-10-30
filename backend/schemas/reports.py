"""
Pydantic schemas for Reports API responses.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel


class BaseResponse(BaseModel):
    """Base response model for all API responses."""
    success: bool
    message: Optional[str] = None


class MonthlyOverviewData(BaseModel):
    """Monthly overview data model."""
    year: int
    month: int
    month_name: str
    created_cases: int
    completed_cases: int
    active_cases: int
    completion_rate: float


class MonthlyOverviewResponse(BaseResponse):
    """Response model for monthly overview."""
    data: MonthlyOverviewData


class ProjekttypeDistributionItem(BaseModel):
    """Single projekttype distribution item."""
    projekttype: str
    count: int
    percentage: float


class ProjekttypeDistributionData(BaseModel):
    """Projekttype distribution data model."""
    from_date: str
    to_date: str
    total_cases: int
    distribution: List[ProjekttypeDistributionItem]


class ProjekttypeDistributionResponse(BaseResponse):
    """Response model for projekttype distribution."""
    data: ProjekttypeDistributionData


class ProcessingTimeItem(BaseModel):
    """Single processing time item."""
    projekttype: str
    average_days: float


class ProcessingTimesData(BaseModel):
    """Processing times data model."""
    overall_average_days: float
    by_projekttype: List[ProcessingTimeItem]


class ProcessingTimesResponse(BaseResponse):
    """Response model for processing times."""
    data: ProcessingTimesData


class PaabudStatisticsData(BaseModel):
    """Påbud statistics data model."""
    from_date: str
    to_date: str
    total_paabud: int
    active_paabud: int
    completed_paabud: int
    overdue_paabud: int
    completion_rate: float


class PaabudStatisticsResponse(BaseResponse):
    """Response model for påbud statistics."""
    data: PaabudStatisticsData


class MonthlyTrendItem(BaseModel):
    """Single monthly trend item."""
    month: int
    month_name: str
    created: int
    completed: int


class MonthlyTrendsData(BaseModel):
    """Monthly trends data model."""
    year: int
    monthly_trends: List[MonthlyTrendItem]


class MonthlyTrendsResponse(BaseResponse):
    """Response model for monthly trends."""
    data: MonthlyTrendsData


class ExportRequest(BaseModel):
    """Request model for export operations."""
    report_type: str
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    year: Optional[int] = None
    month: Optional[int] = None
    format: str = "excel"  # excel or csv
