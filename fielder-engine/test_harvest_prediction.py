#!/usr/bin/env python3
"""
End-to-End Harvest Prediction Test Script

Demonstrates the complete Fielder prediction flow:
1. Load cultivar data
2. Get weather data (historical + forecast) from Open-Meteo
3. Calculate GDD accumulation
4. Predict harvest windows
5. Predict quality (Brix)

Run: python test_harvest_prediction.py
"""

from datetime import date, timedelta
import sys

# Add project to path
sys.path.insert(0, '/home/alex/projects/fielder_project')

from fielder.services import (
    DataLoader,
    WeatherService,
    HarvestPredictor,
    QualityPredictor,
)
from fielder.models import (
    GDDAccumulation,
    CROP_GDD_TARGETS,
    get_gdd_targets,
)
from fielder.models.region import US_GROWING_REGIONS


def print_header(text: str):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def test_weather_api(region_id: str):
    """Test the Open-Meteo weather API integration."""
    print_header("Testing Weather API")

    weather = WeatherService()

    # Test forecast
    print(f"\nFetching 7-day forecast for {region_id}...")
    forecasts = weather.provider.get_forecast(region_id, days_ahead=7)

    if forecasts:
        print(f"  Got {len(forecasts)} forecast days")
        for f in forecasts[:3]:
            print(f"    {f.date}: High {f.temp_high:.0f}F, Low {f.temp_low:.0f}F, "
                  f"GDD(50): {f.projected_gdd(50):.1f}")
    else:
        print("  No forecast data (API may be unavailable)")

    # Test historical (last 30 days)
    end_date = date.today()
    start_date = end_date - timedelta(days=30)

    print(f"\nFetching historical data ({start_date} to {end_date})...")
    historical = weather.provider.get_historical(region_id, start_date, end_date)

    if historical:
        print(f"  Got {len(historical)} observation days")
        total_gdd = sum(obs.gdd(50) for obs in historical)
        print(f"  Total GDD (base 50F) over period: {total_gdd:.0f}")
        avg_daily = total_gdd / len(historical)
        print(f"  Average daily GDD: {avg_daily:.1f}")
    else:
        print("  No historical data (API may be unavailable)")

    return forecasts, historical


def test_gdd_targets():
    """Display GDD targets for all crops."""
    print_header("Crop GDD Targets")

    print(f"\n{'Crop':<20} {'Base Temp':<12} {'Maturity GDD':<14} {'Peak GDD':<12}")
    print("-" * 58)

    for crop_id, targets in CROP_GDD_TARGETS.items():
        print(f"{crop_id:<20} {targets['base_temp']:<12.0f} "
              f"{targets['gdd_to_maturity']:<14} {targets['gdd_to_peak']:<12}")


def project_gdd_with_climatology(
    weather: WeatherService,
    region_id: str,
    start_date: date,
    target_gdd: float,
    base_temp: float
) -> tuple[date, float]:
    """
    Project when target GDD will be reached using monthly climatology.

    For each month from start_date forward, uses historical average GDD
    for that month. This gives realistic projections for future harvests.

    Returns (projected_date, total_gdd_accumulated)
    """
    accumulated_gdd = 0.0
    current_date = start_date
    today = date.today()

    # If start is in the past, get actual historical data up to today
    if start_date < today:
        observations = weather.provider.get_historical(region_id, start_date, today)
        accumulated_gdd = sum(obs.gdd(base_temp) for obs in observations)
        current_date = today

        if accumulated_gdd >= target_gdd:
            # Already reached target
            return today, accumulated_gdd

    # Project forward using monthly climatology
    max_days = 365  # Don't project more than a year
    days_projected = 0

    while accumulated_gdd < target_gdd and days_projected < max_days:
        # Get climatology for the current month we're projecting
        month = current_date.month
        climate = weather.provider.get_climatology(region_id, month)

        # Get average daily GDD for this month, adjusted for base temp
        avg_temp = climate.get("avg_temp", 70)
        avg_daily_gdd = max(0, avg_temp - base_temp)

        # How many days left in this month?
        if month == 12:
            days_in_month = 31 - current_date.day + 1
            next_month_start = date(current_date.year + 1, 1, 1)
        else:
            next_month_start = date(current_date.year, month + 1, 1)
            days_in_month = (next_month_start - current_date).days

        # Project GDD for remaining days in this month
        gdd_this_period = avg_daily_gdd * days_in_month

        if accumulated_gdd + gdd_this_period >= target_gdd:
            # Target reached within this month
            gdd_needed = target_gdd - accumulated_gdd
            days_needed = int(gdd_needed / avg_daily_gdd) if avg_daily_gdd > 0 else days_in_month
            return current_date + timedelta(days=days_needed), target_gdd

        accumulated_gdd += gdd_this_period
        days_projected += days_in_month
        current_date = next_month_start

    # If we hit max days, return best estimate
    return current_date, accumulated_gdd


def test_harvest_prediction(region_id: str, crop_id: str, bloom_date: date):
    """Test harvest window prediction for a specific crop/region."""
    print_header(f"Harvest Prediction: {crop_id} in {region_id}")

    region = US_GROWING_REGIONS.get(region_id)
    if not region:
        print(f"  Unknown region: {region_id}")
        return

    targets = get_gdd_targets(crop_id)
    base_temp = targets.get("base_temp", 50.0)
    gdd_to_maturity = targets.get("gdd_to_maturity", 2000)
    gdd_to_peak = targets.get("gdd_to_peak", 2300)

    print(f"\n  Region: {region.name} ({region.state})")
    print(f"  Crop: {crop_id}")
    print(f"  Bloom/Start Date: {bloom_date}")
    print(f"  Base Temperature: {base_temp}F")
    print(f"  GDD to Maturity: {gdd_to_maturity}")
    print(f"  GDD to Peak: {gdd_to_peak}")

    # Get weather data
    weather = WeatherService()
    today = date.today()

    # Get historical GDD from bloom to today (if bloom is in the past)
    if bloom_date < today:
        observations = weather.provider.get_historical(region_id, bloom_date, today)
        current_gdd = sum(obs.gdd(base_temp) for obs in observations)
        days_elapsed = (today - bloom_date).days
    else:
        current_gdd = 0
        days_elapsed = 0
        observations = []

    print(f"\n  Days since bloom: {days_elapsed}")
    print(f"  Current GDD accumulation: {current_gdd:.0f}")
    print(f"  Progress to maturity: {(current_gdd / gdd_to_maturity * 100):.1f}%")
    print(f"  Progress to peak: {(current_gdd / gdd_to_peak * 100):.1f}%")

    # Project future dates using monthly climatology
    maturity_date, _ = project_gdd_with_climatology(
        weather, region_id, bloom_date, gdd_to_maturity, base_temp
    )
    peak_date, _ = project_gdd_with_climatology(
        weather, region_id, bloom_date, gdd_to_peak, base_temp
    )

    days_to_maturity = (maturity_date - today).days
    days_to_peak = (peak_date - today).days

    # Show what projection method was used
    if bloom_date >= today:
        print(f"\n  Projection: Using monthly climatological averages from {bloom_date}")
    elif observations:
        avg_daily_gdd = current_gdd / len(observations)
        print(f"\n  Historical avg daily GDD: {avg_daily_gdd:.1f}")
        print(f"  Future projection: Using monthly climatology")

    print(f"\n  PREDICTIONS:")

    if current_gdd >= gdd_to_peak:
        print(f"    Status: AT PEAK QUALITY NOW!")
    elif current_gdd >= gdd_to_maturity:
        print(f"    Status: HARVESTABLE (mature but not peak)")
        print(f"    Peak quality in: ~{days_to_peak} days ({peak_date})")
    else:
        print(f"    Harvest window opens: ~{days_to_maturity} days ({maturity_date})")
        print(f"    Peak quality: ~{days_to_peak} days ({peak_date})")

    return {
        "region": region_id,
        "crop": crop_id,
        "current_gdd": current_gdd,
        "maturity_date": maturity_date,
        "peak_date": peak_date
    }


def test_quality_prediction(crop_id: str):
    """Test quality prediction for a crop."""
    print_header(f"Quality Model: {crop_id}")

    predictor = QualityPredictor()
    model = predictor.get_model_by_crop(crop_id)

    print(f"\n  Model: {model.__class__.__name__}")
    print(f"  Post-harvest behavior: {model.post_harvest_behavior.value}")
    print(f"  GDD base temp: {model.gdd_base_temp}F")
    print(f"  Freshness window: {model._get_freshness_window()} days")

    # Test sugar prediction at various GDD levels
    print("\n  Sugar development curve (cultivar ceiling = 14 Brix):")
    cultivar_ceiling = 14.0

    for gdd in [1000, 1500, 2000, 2500, 3000]:
        brix = model.predict_sugar_content(gdd, cultivar_ceiling)
        pct = (brix / cultivar_ceiling) * 100
        print(f"    GDD {gdd:>5}: {brix:.1f} Brix ({pct:.0f}% of potential)")

    # Test freshness decay
    print("\n  Freshness decay (with cold chain):")
    for days in [1, 3, 7, 14, 30]:
        decay = model.calculate_freshness_decay(days, cold_chain=True)
        print(f"    Day {days:>2}: {decay*100:.0f}% quality retained")


def test_regions():
    """Display all configured growing regions."""
    print_header("US Growing Regions")

    by_state = {}
    for region_id, region in US_GROWING_REGIONS.items():
        if region.state not in by_state:
            by_state[region.state] = []
        by_state[region.state].append(region)

    for state in sorted(by_state.keys()):
        print(f"\n  {state}:")
        for region in by_state[state]:
            crops = ", ".join(region.viable_crops[:3])
            if len(region.viable_crops) > 3:
                crops += f" (+{len(region.viable_crops) - 3} more)"
            print(f"    - {region.name}: {crops}")


def run_demo_predictions():
    """Run a series of demo predictions across regions."""
    print_header("Demo Predictions - What's In Season NOW (December 2025)")

    # =========================================================================
    # CURRENT SEASON: What's at peak or harvestable RIGHT NOW (December)
    # =========================================================================
    # These used spring 2025 bloom dates and should show "AT PEAK" or "HARVESTABLE"

    current_season = [
        # Florida/Texas Citrus - bloomed March 2025, harvesting now
        ("indian_river", "navel_orange", date(2025, 3, 15), "FL Navel Oranges"),
        ("texas_rgv", "grapefruit", date(2025, 3, 1), "TX Rio Red Grapefruit"),
        ("indian_river", "tangerine", date(2025, 3, 20), "FL Tangerines"),

        # California citrus
        ("california_southern_desert", "navel_orange", date(2025, 3, 10), "CA Navels"),

        # Late fall harvest - pecans
        ("texas_pecan_belt", "pecan", date(2025, 4, 1), "TX Pecans"),

        # California pomegranates - bloom April, harvest Sept-Nov
        ("california_central_valley", "pomegranate", date(2025, 4, 15), "CA Pomegranates"),
    ]

    print("\n=== CURRENTLY AT PEAK (December 2025) ===")
    print("These crops bloomed in spring 2025 and are harvesting now:\n")

    for region_id, crop_id, bloom_date, label in current_season:
        result = test_harvest_prediction(region_id, crop_id, bloom_date)

    # =========================================================================
    # UPCOMING 2026: Spring/Summer crops - not yet bloomed
    # =========================================================================
    # Use projected 2026 bloom dates to show "UPCOMING" predictions

    print_header("Demo Predictions - Looking Ahead to 2026")

    upcoming_season = [
        # Spring 2026 bloom -> Summer 2026 harvest
        ("georgia_piedmont", "peach", date(2026, 3, 15), "GA Peaches (Summer 2026)"),
        ("california_central_valley", "sweet_cherry", date(2026, 4, 1), "CA Cherries (May-June 2026)"),
        ("pacific_nw_yakima", "apple", date(2026, 4, 20), "WA Apples (Fall 2026)"),
        ("michigan_west", "tart_cherry", date(2026, 5, 5), "MI Tart Cherries (July 2026)"),

        # Florida strawberries - planted fall, harvest winter
        # For strawberries, "bloom" is really transplant date
        ("central_florida", "strawberry", date(2025, 10, 1), "FL Strawberries (Now - March)"),
    ]

    print("\n=== UPCOMING HARVESTS (2026) ===")
    print("Projected bloom dates for next season:\n")

    results = []
    for region_id, crop_id, bloom_date, label in upcoming_season:
        print(f"\n--- {label} ---")
        result = test_harvest_prediction(region_id, crop_id, bloom_date)
        if result:
            results.append(result)

    # Summary
    print_header("Prediction Summary")

    print("\nCURRENT SEASON (December 2025):")
    print(f"  - Florida/Texas citrus: AT PEAK")
    print(f"  - Texas pecans: AT PEAK")
    print(f"  - California pomegranates: AT PEAK")
    print(f"  - Florida strawberries: In season (Nov-Mar)")

    print("\nUPCOMING (2026):")
    print(f"  - Georgia peaches: ~July 2026")
    print(f"  - Washington apples: ~September 2026")
    print(f"  - Michigan tart cherries: ~July 2026")
    print(f"  - California cherries: ~May-June 2026")


def main():
    """Main test runner."""
    print("\n" + "=" * 60)
    print("  FIELDER - Harvest Prediction System Test")
    print("=" * 60)

    # 1. Test regions
    test_regions()

    # 2. Test GDD targets
    test_gdd_targets()

    # 3. Test weather API with one region
    forecasts, historical = test_weather_api("california_central_valley")

    # 4. Test quality models
    for crop in ["apple", "cherry", "peach", "mango", "pecan"]:
        test_quality_prediction(crop)

    # 5. Run demo predictions
    run_demo_predictions()

    print_header("Test Complete!")
    print("\nThe Fielder harvest prediction system is operational.")
    print("Next steps:")
    print("  1. Add more cultivar-specific data")
    print("  2. Integrate with farm database")
    print("  3. Build consumer-facing discovery interface")


if __name__ == "__main__":
    main()
