"""
Forecast Analytics API endpoints for predictive insights.
Provides forecasting capabilities for case management and resource planning.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import calendar
import numpy as np
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi_cache.decorator import cache
from sqlalchemy import func, extract, desc, and_, or_, text
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.models.amo import AMOSagsbehandling, AMOProjekt, AMOProjekttype
from backend.schemas.forecasts import (
    ForecastResponse,
    MonthlyForecastResponse,
    CapacityForecastResponse,
    SeasonalAnalysisResponse
)

router = APIRouter(prefix="/api/forecasts", tags=["forecasts"])


def calculate_linear_trend(x_data: List[float], y_data: List[float], periods_ahead: int = 6) -> Dict[str, Any]:
    """
    Calculate linear trend and forecast future values.
    
    Args:
        x_data: Time periods (e.g., months as numbers)
        y_data: Values to forecast
        periods_ahead: Number of periods to forecast
    
    Returns:
        Dictionary with trend info and forecasts
    """
    if len(x_data) < 2 or len(y_data) < 2:
        return {"trend": "insufficient_data", "forecasts": [], "confidence": 0}
    
    # Convert to numpy arrays
    x = np.array(x_data).reshape(-1, 1)
    y = np.array(y_data)
    
    # Fit linear regression
    model = LinearRegression()
    model.fit(x, y)
    
    # Calculate R-squared for confidence
    r_squared = model.score(x, y)
    
    # Generate forecasts
    future_x = np.array([max(x_data) + i + 1 for i in range(periods_ahead)]).reshape(-1, 1)
    forecasts = model.predict(future_x)
    
    # Calculate trend direction
    slope = model.coef_[0]
    if slope > 0.1:
        trend = "increasing"
    elif slope < -0.1:
        trend = "decreasing"
    else:
        trend = "stable"
    
    return {
        "trend": trend,
        "slope": float(slope),
        "r_squared": float(r_squared),
        "forecasts": [max(0, float(f)) for f in forecasts],  # Ensure non-negative
        "confidence": float(r_squared * 100)
    }


def calculate_moving_average(data: List[float], window: int = 3) -> List[float]:
    """Calculate moving average for smoothing."""
    if len(data) < window:
        return data
    
    smoothed = []
    for i in range(len(data)):
        if i < window - 1:
            smoothed.append(data[i])
        else:
            avg = sum(data[i-window+1:i+1]) / window
            smoothed.append(avg)
    
    return smoothed


@router.get("/monthly-cases", response_model=MonthlyForecastResponse)
@cache(expire=3600)  # Cache for 1 hour
async def forecast_monthly_cases(
    projekttype_navn: Optional[str] = Query(None, description="Filter by projekttype name"),
    months_ahead: int = Query(6, ge=1, le=12, description="Months to forecast ahead"),
    db: Session = Depends(get_db)
):
    """
    Forecast monthly case creation based on historical trends.
    
    **Parameters:**
    - projekttype_navn: Optional filter by projekttype
    - months_ahead: Number of months to forecast (1-12)
    
    **Returns:**
    - Historical monthly data
    - Trend analysis
    - Future forecasts with confidence intervals
    """
    # Get historical data for the last 24 months
    start_date = datetime.now() - relativedelta(months=24)
    
    # Build query with optional projekttype filter
    query = db.query(
        extract('year', AMOSagsbehandling.OprettetDato).label('year'),
        extract('month', AMOSagsbehandling.OprettetDato).label('month'),
        func.count(AMOSagsbehandling.Id).label('cases')
    )
    
    if projekttype_navn:
        query = query.join(
            AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id
        ).join(
            AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID
        ).filter(
            AMOProjekttype.ProjektType.ilike(f"%{projekttype_navn}%")
        )
    
    historical_data = query.filter(
        AMOSagsbehandling.OprettetDato >= start_date
    ).group_by(
        extract('year', AMOSagsbehandling.OprettetDato),
        extract('month', AMOSagsbehandling.OprettetDato)
    ).order_by(
        extract('year', AMOSagsbehandling.OprettetDato),
        extract('month', AMOSagsbehandling.OprettetDato)
    ).all()
    
    # Process historical data
    monthly_cases = []
    x_data = []
    y_data = []
    
    for i, row in enumerate(historical_data):
        month_name = calendar.month_abbr[int(row.month)]
        monthly_cases.append({
            "year": int(row.year),
            "month": int(row.month),
            "month_name": month_name,
            "cases": int(row.cases),
            "period": i + 1
        })
        x_data.append(i + 1)
        y_data.append(int(row.cases))
    
    # Calculate trend and forecasts
    trend_analysis = calculate_linear_trend(x_data, y_data, months_ahead)
    
    # Generate forecast periods
    current_date = datetime.now()
    forecast_periods = []
    for i in range(months_ahead):
        future_date = current_date + relativedelta(months=i+1)
        forecast_periods.append({
            "year": future_date.year,
            "month": future_date.month,
            "month_name": calendar.month_abbr[future_date.month],
            "forecasted_cases": int(trend_analysis["forecasts"][i]) if i < len(trend_analysis["forecasts"]) else 0,
            "confidence": trend_analysis["confidence"]
        })
    
    # Calculate seasonal patterns
    if len(y_data) >= 12:
        # Group by month to find seasonal patterns
        monthly_avg = {}
        monthly_counts = {}
        
        for data_point in monthly_cases:
            month = data_point["month"]
            cases = data_point["cases"]
            
            if month not in monthly_avg:
                monthly_avg[month] = 0
                monthly_counts[month] = 0
            
            monthly_avg[month] += cases
            monthly_counts[month] += 1
        
        # Calculate averages
        seasonal_factors = {}
        overall_avg = sum(y_data) / len(y_data)
        
        for month in monthly_avg:
            avg_for_month = monthly_avg[month] / monthly_counts[month]
            seasonal_factors[month] = avg_for_month / overall_avg if overall_avg > 0 else 1.0
    else:
        seasonal_factors = {}
    
    return MonthlyForecastResponse(
        success=True,
        data={
            "historical_data": monthly_cases,
            "forecast_periods": forecast_periods,
            "trend_analysis": {
                "direction": trend_analysis["trend"],
                "slope": trend_analysis["slope"],
                "confidence": trend_analysis["confidence"],
                "r_squared": trend_analysis["r_squared"]
            },
            "seasonal_factors": seasonal_factors,
            "summary": {
                "avg_monthly_cases": sum(y_data) / len(y_data) if y_data else 0,
                "total_historical_cases": sum(y_data),
                "forecasted_total": sum([p["forecasted_cases"] for p in forecast_periods]),
                "data_quality": "good" if len(y_data) >= 12 else "limited"
            }
        }
    )


@router.get("/capacity-planning", response_model=CapacityForecastResponse)
@cache(expire=3600)
async def forecast_capacity_planning(
    projekttype_navn: Optional[str] = Query(None, description="Filter by projekttype name"),
    db: Session = Depends(get_db)
):
    """
    Forecast capacity planning and workload distribution.
    
    **Parameters:**
    - projekttype_navn: Optional filter by projekttype
    
    **Returns:**
    - Current workload analysis
    - Capacity forecasts
    - Resource recommendations
    """
    # Get current active cases
    active_query = db.query(func.count(AMOSagsbehandling.Id))
    if projekttype_navn:
        active_query = active_query.join(
            AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id
        ).join(
            AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID
        ).filter(
            AMOProjekttype.ProjektType.ilike(f"%{projekttype_navn}%")
        )
    
    current_active = active_query.filter(
        and_(
            or_(
                AMOSagsbehandling.FærdigmeldtInt != 1,
                AMOSagsbehandling.FærdigmeldtInt.is_(None)
            ),
            or_(
                AMOSagsbehandling.AfsluttetInt == 0,
                AMOSagsbehandling.AfsluttetInt.is_(None)
            )
        )
    ).scalar() or 0
    
    # Get average processing time - use literal 'day' for SQL Server
    processing_query = db.query(
        func.avg(
            func.datediff(
                text('day'),
                AMOSagsbehandling.OprettetDato,
                func.coalesce(
                    AMOSagsbehandling.FærdigmeldingDato,
                    AMOSagsbehandling.AfsluttetDato
                )
            )
        )
    )
    
    if projekttype_navn:
        processing_query = processing_query.join(
            AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id
        ).join(
            AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID
        ).filter(
            AMOProjekttype.ProjektType.ilike(f"%{projekttype_navn}%")
        )
    
    avg_processing_days = processing_query.filter(
        or_(
            AMOSagsbehandling.FærdigmeldtInt == 1,
            AMOSagsbehandling.AfsluttetInt == 1,
            AMOSagsbehandling.AfsluttetInt == -1
        ),
        or_(
            AMOSagsbehandling.FærdigmeldingDato.is_not(None),
            AMOSagsbehandling.AfsluttetDato.is_not(None)
        ),
        AMOSagsbehandling.OprettetDato >= datetime.now() - timedelta(days=365)
    ).scalar() or 85  # Default to 85 days if no data
    
    # Calculate capacity metrics
    # Assume 20 working days per month, 8 hours per day
    working_hours_per_month = 20 * 8
    estimated_hours_per_case = max(1, float(avg_processing_days) * 0.5)  # Rough estimate
    
    current_workload_hours = current_active * estimated_hours_per_case
    
    # Simple forecast estimate
    forecasted_cases = max(10, int(current_active * 0.1))  # Simple estimate
    
    forecasted_workload_hours = forecasted_cases * estimated_hours_per_case
    
    # Resource recommendations
    current_capacity_utilization = (current_workload_hours / working_hours_per_month) * 100
    
    if current_capacity_utilization > 100:
        recommendation = "overloaded"
        recommended_staff = int(current_capacity_utilization / 100) + 1
    elif current_capacity_utilization > 80:
        recommendation = "near_capacity"
        recommended_staff = 1
    else:
        recommendation = "adequate"
        recommended_staff = 1
    
    return CapacityForecastResponse(
        success=True,
        data={
            "current_metrics": {
                "active_cases": current_active,
                "avg_processing_days": float(avg_processing_days),
                "estimated_workload_hours": current_workload_hours,
                "capacity_utilization": min(current_capacity_utilization, 200)  # Cap at 200%
            },
            "forecast_metrics": {
                "forecasted_new_cases": forecasted_cases,
                "forecasted_workload_hours": forecasted_workload_hours,
                "total_projected_hours": current_workload_hours + forecasted_workload_hours
            },
            "recommendations": {
                "status": recommendation,
                "recommended_staff": recommended_staff,
                "priority_actions": [
                    "Prioriter ældre sager" if current_active > 500 else "Fortsæt nuværende tempo",
                    "Overvej ekstra ressourcer" if current_capacity_utilization > 80 else "Nuværende kapacitet er tilstrækkelig"
                ]
            }
        }
    )


@router.get("/seasonal-analysis", response_model=SeasonalAnalysisResponse)
@cache(expire=3600)
async def analyze_seasonal_patterns(
    projekttype_navn: Optional[str] = Query(None, description="Filter by projekttype name"),
    db: Session = Depends(get_db)
):
    """
    Analyze seasonal patterns in case creation and completion.
    
    **Parameters:**
    - projekttype_navn: Optional filter by projekttype
    
    **Returns:**
    - Monthly patterns
    - Seasonal trends
    - Peak period identification
    """
    # Get 3 years of historical data for better seasonal analysis
    start_date = datetime.now() - relativedelta(years=3)
    
    # Build query
    query = db.query(
        extract('month', AMOSagsbehandling.OprettetDato).label('month'),
        func.count(AMOSagsbehandling.Id).label('cases')
    )
    
    if projekttype_navn:
        query = query.join(
            AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id
        ).join(
            AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID
        ).filter(
            AMOProjekttype.ProjektType.ilike(f"%{projekttype_navn}%")
        )
    
    monthly_data = query.filter(
        AMOSagsbehandling.OprettetDato >= start_date
    ).group_by(
        extract('month', AMOSagsbehandling.OprettetDato)
    ).all()
    
    # Process seasonal data
    monthly_patterns = []
    total_cases = sum([row.cases for row in monthly_data])
    avg_monthly = total_cases / 12 if total_cases > 0 else 0
    
    for month in range(1, 13):
        month_data = next((row for row in monthly_data if row.month == month), None)
        cases = month_data.cases if month_data else 0
        
        seasonal_index = (cases / avg_monthly) if avg_monthly > 0 else 1.0
        
        monthly_patterns.append({
            "month": month,
            "month_name": calendar.month_name[month],
            "total_cases": cases,
            "seasonal_index": seasonal_index,
            "is_peak": seasonal_index > 1.2,
            "is_low": seasonal_index < 0.8
        })
    
    # Identify patterns
    peak_months = [p["month_name"] for p in monthly_patterns if p["is_peak"]]
    low_months = [p["month_name"] for p in monthly_patterns if p["is_low"]]
    
    return SeasonalAnalysisResponse(
        success=True,
        data={
            "monthly_patterns": monthly_patterns,
            "insights": {
                "peak_months": peak_months,
                "low_months": low_months,
                "seasonal_variation": max([p["seasonal_index"] for p in monthly_patterns]) - min([p["seasonal_index"] for p in monthly_patterns]),
                "most_active_quarter": "Q1" if sum([p["total_cases"] for p in monthly_patterns[:3]]) > avg_monthly * 3 else "Q2"
            },
            "recommendations": [
                f"Forbered ekstra kapacitet i {', '.join(peak_months)}" if peak_months else "Jævn arbejdsbyrde året rundt",
                f"Planlæg vedligeholdelse/ferie i {', '.join(low_months)}" if low_months else "Ingen tydelige lavperioder identificeret"
            ]
        }
    )
