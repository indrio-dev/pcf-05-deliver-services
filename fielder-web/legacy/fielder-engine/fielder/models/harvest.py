"""
Harvest window and seasonal availability models.

Predicts peak quality windows based on GDD accumulation, cultivar,
and regional climate patterns.
"""

from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass
class HarvestWindow:
    """
    A predicted harvest window for a crop in a specific region/year.

    The window represents when the crop is harvestable.
    The PEAK window (middle 50%) is when quality is optimal.
    """
    crop_id: str
    cultivar_id: Optional[str]
    region_id: str
    year: int

    # Full harvest window
    window_start: date
    window_end: date

    # Peak quality window (middle 50% - this is "Ripen" in SHARE)
    peak_start: date
    peak_end: date

    # GDD tracking
    gdd_at_window_start: int
    gdd_at_peak: int

    # Predicted quality at peak
    predicted_peak_brix: Optional[float] = None

    @property
    def window_days(self) -> int:
        return (self.window_end - self.window_start).days

    @property
    def peak_days(self) -> int:
        return (self.peak_end - self.peak_start).days

    @property
    def is_in_peak(self) -> bool:
        """Check if today is within the peak window."""
        today = date.today()
        return self.peak_start <= today <= self.peak_end

    @property
    def is_in_window(self) -> bool:
        """Check if today is within the harvest window."""
        today = date.today()
        return self.window_start <= today <= self.window_end

    @property
    def days_to_peak(self) -> Optional[int]:
        """Days until peak window starts (None if already past)."""
        today = date.today()
        if today >= self.peak_start:
            return None
        return (self.peak_start - today).days


@dataclass
class SeasonalAvailability:
    """
    General seasonal availability pattern for a cultivar in a region.

    This is the "typical" window based on historical patterns.
    Actual HarvestWindow predictions adjust based on current year's weather/GDD.
    """
    cultivar_id: str
    region_id: str

    # Typical months (1-12) for harvest window
    typical_start_month: int
    typical_start_day: int
    typical_end_month: int
    typical_end_day: int

    # Peak quality within window
    peak_start_month: int
    peak_start_day: int
    peak_end_month: int
    peak_end_day: int

    # Historical data
    historical_avg_brix: Optional[float] = None
    historical_peak_brix: Optional[float] = None

    def get_typical_window(self, year: int) -> tuple[date, date]:
        """Get the typical harvest window dates for a given year."""
        start = date(year, self.typical_start_month, self.typical_start_day)
        # Handle year rollover (e.g., Nov-Jan window)
        end_year = year if self.typical_end_month >= self.typical_start_month else year + 1
        end = date(end_year, self.typical_end_month, self.typical_end_day)
        return start, end

    def get_peak_window(self, year: int) -> tuple[date, date]:
        """Get the typical peak window dates for a given year."""
        peak_start = date(year, self.peak_start_month, self.peak_start_day)
        peak_end_year = year if self.peak_end_month >= self.peak_start_month else year + 1
        peak_end = date(peak_end_year, self.peak_end_month, self.peak_end_day)
        return peak_start, peak_end


# Example: Florida Navel Orange seasonal patterns (from your research)
FLORIDA_NAVEL_AVAILABILITY = SeasonalAvailability(
    cultivar_id="washington_navel",
    region_id="indian_river",
    # Harvest window: Nov 1 - Jan 31
    typical_start_month=11,
    typical_start_day=1,
    typical_end_month=1,
    typical_end_day=31,
    # Peak window: Dec 15 - Jan 15
    peak_start_month=12,
    peak_start_day=15,
    peak_end_month=1,
    peak_end_day=15,
    historical_avg_brix=11.5,
    historical_peak_brix=12.5
)
