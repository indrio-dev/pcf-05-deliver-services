-- Seed: Crops with GDD targets
-- Source: fielder_project/fielder/models/weather.py

INSERT INTO crops (id, name, display_name, category, base_temp, gdd_to_maturity, gdd_to_peak, gdd_window, chill_hours_required, is_climacteric, notes)
VALUES
-- CITRUS
('navel_orange', 'navel_orange', 'Navel Orange', 'citrus', 55.0, 5100, 6100, 2000, NULL, FALSE,
 'Quality holds well on tree, entire Nov-Jan window is optimal'),

('valencia', 'valencia', 'Valencia Orange', 'citrus', 55.0, 8000, 9000, 2200, NULL, FALSE,
 'Late season (Mar-Jun), peak Apr-May, can regreen if left too long'),

('grapefruit', 'grapefruit', 'Grapefruit', 'citrus', 55.0, 5500, 7100, 4000, NULL, FALSE,
 'Very long harvest window, holds well on tree'),

('tangerine', 'tangerine', 'Tangerine', 'citrus', 55.0, 5300, 5700, 900, NULL, FALSE,
 'Shorter season than oranges, peak for holidays'),

('satsuma', 'satsuma', 'Satsuma Mandarin', 'citrus', 55.0, 4600, 5100, 700, NULL, FALSE,
 'Early season, cold-tolerant, seedless'),

-- STONE FRUIT
('peach', 'peach', 'Peach', 'stone_fruit', 45.0, 1800, 2000, 150, 650, TRUE,
 'Climacteric, continue ripening after harvest'),

('sweet_cherry', 'sweet_cherry', 'Sweet Cherry', 'stone_fruit', 40.0, 1400, 1550, 100, 1100, FALSE,
 'Non-climacteric, must pick at peak'),

('tart_cherry', 'tart_cherry', 'Tart Cherry', 'stone_fruit', 39.2, 1000, 1100, 80, 954, FALSE,
 'Primarily for processing. Model R²=0.992 phenology'),

-- POME FRUIT
('apple', 'apple', 'Apple', 'pome_fruit', 43.0, 2200, 2500, 200, 1000, TRUE,
 'Climacteric, starch converts to sugar post-harvest'),

('pear', 'pear', 'Pear', 'pome_fruit', 40.0, 2400, 2700, 800, 800, TRUE,
 'MUST ripen OFF tree, unique among tree fruits'),

-- BERRIES
('strawberry', 'strawberry', 'Strawberry', 'berry', 50.0, 700, 1300, 1100, NULL, FALSE,
 'Non-climacteric, must harvest at full color'),

('blueberry', 'blueberry', 'Blueberry', 'berry', 45.0, 1200, 1400, 100, 800, FALSE,
 'Non-climacteric, multiple picks over 4-6 weeks'),

-- TROPICAL
('mango', 'mango', 'Mango', 'tropical', 60.0, 2800, 3200, 300, 0, TRUE,
 'Climacteric, chill injury below 55F'),

('pomegranate', 'pomegranate', 'Pomegranate', 'tropical', 50.0, 3800, 4500, 1000, 150, FALSE,
 'Non-climacteric, stores well'),

-- NUTS
('pecan', 'pecan', 'Pecan', 'nut', 65.0, 2600, 2900, 400, 500, FALSE,
 'Quality = oil content not Brix, alternate bearing');
