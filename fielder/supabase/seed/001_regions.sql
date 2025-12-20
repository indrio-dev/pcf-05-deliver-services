-- Seed: Growing Regions
-- Source: fielder_project/fielder/models/region.py

INSERT INTO growing_regions (id, name, display_name, state, latitude, longitude, usda_zone, avg_last_frost_doy, avg_first_frost_doy, frost_free_days, annual_gdd_50, avg_chill_hours, viable_crops)
VALUES
-- SOUTHEAST
('indian_river', 'Indian River District', 'Indian River District', 'FL', 27.6, -80.4, '10', 45, 350, 305, 5500, 150,
 ARRAY['navel_orange', 'grapefruit', 'tangerine', 'valencia']),

('central_florida', 'Central Florida', 'Central Florida', 'FL', 28.5, -81.4, '9', 52, 340, 288, 5200, 200,
 ARRAY['navel_orange', 'strawberry', 'blueberry']),

('south_florida', 'South Florida (Miami-Dade/Homestead)', 'South Florida', 'FL', 25.5, -80.4, '10', 15, 365, 350, 7000, 50,
 ARRAY['mango']),

('sweet_valley', 'Sweet Valley (FL Panhandle / S. Alabama / S. Georgia)', 'Sweet Valley', 'FL', 30.5, -86.5, '9', 60, 330, 270, 4200, 450,
 ARRAY['satsuma', 'navel_orange', 'pecan', 'blueberry']),

('georgia_piedmont', 'Georgia Piedmont (Peach Belt)', 'Georgia Piedmont', 'GA', 32.8, -83.6, '8', 90, 310, 220, 3800, 700,
 ARRAY['peach', 'blueberry', 'pecan']),

-- TEXAS/SOUTHWEST
('texas_rgv', 'Texas Rio Grande Valley', 'Texas RGV', 'TX', 26.2, -98.2, '9', 35, 355, 320, 6000, 200,
 ARRAY['grapefruit', 'navel_orange', 'tangerine']),

('texas_hill_country', 'Texas Hill Country', 'Texas Hill Country', 'TX', 30.3, -98.5, '8', 80, 320, 240, 4200, 500,
 ARRAY['peach', 'pecan']),

('texas_pecan_belt', 'Texas Pecan Belt (Central)', 'Texas Pecan Belt', 'TX', 31.5, -97.0, '8', 75, 320, 245, 4500, 600,
 ARRAY['pecan']),

-- CALIFORNIA
('california_central_valley', 'California Central Valley (Fresno/Visalia)', 'CA Central Valley', 'CA', 36.7, -119.8, '9', 60, 335, 275, 5000, 600,
 ARRAY['peach', 'navel_orange', 'pomegranate', 'sweet_cherry', 'apple']),

('california_coastal', 'California Central Coast (Watsonville)', 'CA Central Coast', 'CA', 36.9, -121.8, '9', 45, 355, 310, 2500, 1000,
 ARRAY['strawberry', 'apple']),

('california_southern_desert', 'California Southern Desert (Coachella)', 'Coachella Valley', 'CA', 33.7, -116.2, '10', 30, 350, 320, 6500, 200,
 ARRAY['navel_orange', 'grapefruit']),

-- PACIFIC NORTHWEST
('pacific_nw_yakima', 'Washington Yakima Valley', 'Yakima Valley', 'WA', 46.6, -120.5, '6', 120, 290, 170, 2400, 1200,
 ARRAY['apple', 'sweet_cherry', 'pear']),

('pacific_nw_wenatchee', 'Washington Wenatchee Valley', 'Wenatchee Valley', 'WA', 47.4, -120.3, '6', 115, 285, 170, 2300, 1300,
 ARRAY['apple', 'cherry', 'pear']),

('pacific_nw_hood_river', 'Oregon Hood River Valley', 'Hood River Valley', 'OR', 45.7, -121.5, '7', 110, 290, 180, 2200, 1100,
 ARRAY['pear', 'apple', 'cherry']),

-- MIDWEST
('michigan_west', 'West Michigan (Grand Traverse/Leelanau)', 'West Michigan', 'MI', 44.8, -85.6, '5', 135, 275, 140, 2600, 1400,
 ARRAY['tart_cherry', 'sweet_cherry', 'apple', 'blueberry']),

('michigan_southwest', 'Southwest Michigan (Berrien County)', 'SW Michigan', 'MI', 42.0, -86.5, '6', 130, 280, 150, 2800, 1200,
 ARRAY['blueberry', 'apple', 'peach']),

('wisconsin_door_county', 'Wisconsin Door County', 'Door County', 'WI', 45.0, -87.2, '5', 140, 270, 130, 2400, 1500,
 ARRAY['tart_cherry', 'apple']),

-- NORTHEAST
('new_york_hudson_valley', 'New York Hudson Valley', 'Hudson Valley', 'NY', 41.7, -73.9, '6', 120, 290, 170, 2600, 1100,
 ARRAY['apple', 'blueberry']),

('new_york_finger_lakes', 'New York Finger Lakes', 'Finger Lakes', 'NY', 42.5, -76.5, '6', 125, 280, 155, 2400, 1200,
 ARRAY['apple', 'blueberry', 'tart_cherry']),

('pennsylvania_adams_county', 'Pennsylvania Adams County (Gettysburg)', 'Adams County', 'PA', 39.8, -77.2, '6', 115, 290, 175, 2700, 1000,
 ARRAY['apple', 'peach', 'blueberry']),

('new_jersey_pine_barrens', 'New Jersey Pine Barrens', 'Pine Barrens', 'NJ', 39.8, -74.5, '7', 115, 290, 175, 2800, 1000,
 ARRAY['blueberry']);
