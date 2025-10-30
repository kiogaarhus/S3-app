"""
Pydantic schemas for Forecast API responses.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class BaseResponse(BaseModel):
    """Base response model for all forecast API responses."""
    success: bool
    message: Optional[str] = None


class HistoricalDataPoint(BaseModel):
    """Single historical data point."""
    year: int
    month: int
    month_name: str
    cases: int
    period: int


class ForecastPeriod(BaseModel):
    """Single forecast period."""
    year: int
    month: int
    month_name: str
    forecasted_cases: int
    confidence: float


class TrendAnalysis(BaseModel):
    """Trend analysis results."""
    direction: str  # increasing, decreasing, stable
    slope: float
    confidence: float
    r_squared: float


class ForecastSummary(BaseModel):
    """Summary of forecast analysis."""
    avg_monthly_cases: float
    total_historical_cases: int
    forecasted_total: int
    data_quality: str  # good, limited, insufficient


class MonthlyForecastData(BaseModel):
    """Monthly forecast data model."""
    historical_data: List[HistoricalDataPoint]
    forecast_periods: List[ForecastPeriod]
    trend_analysis: TrendAnalysis
    seasonal_factors: Dict[int, float]
    summary: ForecastSummary


class MonthlyForecastResponse(BaseResponse):
    """Response model for monthly case forecasts."""
    data: MonthlyForecastData


class CurrentMetrics(BaseModel):
    """Current capacity metrics."""
    active_cases: int
    avg_processing_days: float
    estimated_workload_hours: float
    capacity_utilization: float


class ForecastMetrics(BaseModel):
    """Forecasted capacity metrics."""
    forecasted_new_cases: int
    forecasted_workload_hours: float
    total_projected_hours: float


class CapacityRecommendations(BaseModel):
    """Capacity planning recommendations."""
    status: str  # adequate, near_capacity, overloaded
    recommended_staff: int
    priority_actions: List[str]


class CapacityForecastData(BaseModel):
    """Capacity forecast data model."""
    current_metrics: CurrentMetrics
    forecast_metrics: ForecastMetrics
    recommendations: CapacityRecommendations


class CapacityForecastResponse(BaseResponse):
    """Response model for capacity forecasts."""
    data: CapacityForecastData


class MonthlyPattern(BaseModel):
    """Monthly seasonal pattern."""
    month: int
    month_name: str
    total_cases: int
    seasonal_index: float
    is_peak: bool
    is_low: bool


class SeasonalInsights(BaseModel):
    """Seasonal analysis insights."""
    peak_months: List[str]
    low_months: List[str]
    seasonal_variation: float
    most_active_quarter: str


class SeasonalAnalysisData(BaseModel):
    """Seasonal analysis data model."""
    monthly_patterns: List[MonthlyPattern]
    insights: SeasonalInsights
    recommendations: List[str]


class SeasonalAnalysisResponse(BaseResponse):
    """Response model for seasonal analysis."""
    data: SeasonalAnalysisData


class ForecastResponse(BaseResponse):
    """Generic forecast response."""
    data: Dict[str, Any]
