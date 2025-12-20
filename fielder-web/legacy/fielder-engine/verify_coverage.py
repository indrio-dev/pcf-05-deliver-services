#!/usr/bin/env python3
"""
Verify all 20 crop/region/season combinations work correctly.
"""

from datetime import date
import sys
sys.path.insert(0, '/home/alex/projects/fielder_project')

from fielder.models.region import US_GROWING_REGIONS
from fielder.models import CROP_GDD_TARGETS, get_gdd_targets
from fielder.services import QualityPredictor
from fielder.services.weather_service import WeatherService, REGION_COORDINATES

# Target 20 combinations from plan
TARGET_COMBINATIONS = [
    # Southeast (FL/GA/Gulf)
    ("indian_river", "navel_orange", "Winter"),
    ("central_florida", "strawberry", "Spring"),
    ("south_florida", "mango", "Summer"),
    ("sweet_valley", "satsuma", "Fall"),  # Sweet Valley - N. FL / S. GA
    
    # Texas/Southwest
    ("texas_rgv", "grapefruit", "Winter"),
    ("texas_hill_country", "peach", "Summer"),
    ("texas_pecan_belt", "pecan", "Fall"),
    
    # Pacific West (CA)
    ("california_southern_desert", "navel_orange", "Winter"),
    ("california_central_valley", "sweet_cherry", "Spring"),
    ("california_central_valley", "peach", "Summer"),
    ("california_central_valley", "pomegranate", "Fall"),
    
    # Pacific NW (WA/OR)
    ("pacific_nw_hood_river", "pear", "Winter"),
    ("pacific_nw_yakima", "sweet_cherry", "Summer"),
    ("pacific_nw_yakima", "apple", "Fall"),
    
    # Midwest (MI/WI)
    ("michigan_west", "tart_cherry", "Summer"),
    ("michigan_west", "apple", "Fall"),
    
    # Northeast (NY/PA)
    ("new_york_finger_lakes", "blueberry", "Summer"),
    ("pennsylvania_adams_county", "apple", "Fall"),
]

def verify_combination(region_id: str, crop_id: str, season: str) -> dict:
    """Verify a single crop/region combination works."""
    result = {
        "region": region_id,
        "crop": crop_id,
        "season": season,
        "region_ok": False,
        "crop_gdd_ok": False,
        "quality_model_ok": False,
        "coords_ok": False,
        "errors": []
    }
    
    # Check region exists
    if region_id in US_GROWING_REGIONS:
        result["region_ok"] = True
        region = US_GROWING_REGIONS[region_id]
        # Check if crop is viable for region
        if crop_id not in region.viable_crops:
            result["errors"].append(f"Crop {crop_id} not in region's viable_crops")
    else:
        result["errors"].append(f"Region {region_id} not found")
    
    # Check GDD targets exist
    targets = get_gdd_targets(crop_id)
    if "base_temp" in targets and "gdd_to_maturity" in targets:
        result["crop_gdd_ok"] = True
    else:
        result["errors"].append(f"Missing GDD targets for {crop_id}")
    
    # Check quality model exists
    predictor = QualityPredictor()
    model = predictor.get_model_by_crop(crop_id)
    if model is not None:
        result["quality_model_ok"] = True
        result["model_name"] = model.__class__.__name__
    else:
        result["errors"].append(f"No quality model for {crop_id}")
    
    # Check coordinates exist for weather
    if region_id in REGION_COORDINATES:
        result["coords_ok"] = True
    else:
        result["errors"].append(f"No coordinates for {region_id}")
    
    result["all_ok"] = all([
        result["region_ok"],
        result["crop_gdd_ok"],
        result["quality_model_ok"],
        result["coords_ok"]
    ]) and len(result["errors"]) == 0
    
    return result

def main():
    print("=" * 70)
    print("  FIELDER - Coverage Verification")
    print("=" * 70)
    
    all_results = []
    passed = 0
    failed = 0
    
    for region_id, crop_id, season in TARGET_COMBINATIONS:
        result = verify_combination(region_id, crop_id, season)
        all_results.append(result)
        
        status = "✓" if result["all_ok"] else "✗"
        model = result.get("model_name", "N/A")[:15]
        
        if result["all_ok"]:
            passed += 1
            print(f"  {status} {region_id[:25]:<25} {crop_id:<15} {season:<8} [{model}]")
        else:
            failed += 1
            print(f"  {status} {region_id[:25]:<25} {crop_id:<15} {season:<8}")
            for err in result["errors"]:
                print(f"      ⚠ {err}")
    
    print("=" * 70)
    print(f"  PASSED: {passed}/{len(TARGET_COMBINATIONS)}")
    if failed > 0:
        print(f"  FAILED: {failed}")
    print("=" * 70)
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
