-- Starter menu — loaded automatically ONCE, when the database file is first
-- created (data/rms.db). After that the menu lives in the database and is
-- edited from Manager → Menu; this file is never re-applied, so deleting a dish
-- in the app will not bring it back.
--
-- To start over with a fresh copy of this menu, run `npm run db:reset`.
--
-- image_url points at LoremFlickr, a keyword-based placeholder-photo service
-- (real Creative-Commons photos, free to hotlink, no API key). Each dish has
-- a fixed `lock` value so it always gets the same photo. Swap these for your
-- own photography any time via Manager → Menu → Edit.

INSERT INTO menu_items (name, description, price, category, image_url, is_veg, is_featured, is_available) VALUES
  ('Chicken Biryani', 'Slow-cooked basmati rice with spiced chicken and fried onions', 320.00, 'Main Course', 'https://loremflickr.com/640/480/chicken,biryani/all?lock=101', 0, 1, 1),
  ('Beef Tehari', 'Traditional mustard-oil beef rice, served with boiled egg', 280.00, 'Main Course', 'https://loremflickr.com/640/480/beef,rice/all?lock=102', 0, 0, 1),
  ('Vegetable Fried Rice', 'Wok-tossed rice with seasonal vegetables', 180.00, 'Main Course', 'https://loremflickr.com/640/480/friedrice,vegetables/all?lock=103', 1, 0, 1),
  ('Chicken Grill', 'Char-grilled chicken leg with house spice rub', 350.00, 'Grill', 'https://loremflickr.com/640/480/grilled,chicken/all?lock=104', 0, 1, 1),
  ('Beef Kala Bhuna', 'Slow-braised beef in dark spice gravy', 380.00, 'Main Course', 'https://loremflickr.com/640/480/beef,curry/all?lock=105', 0, 0, 1),
  ('Mixed Vegetable Salad', 'Fresh seasonal vegetables with citrus dressing', 120.00, 'Starter', 'https://loremflickr.com/640/480/vegetable,salad/all?lock=106', 1, 0, 1),
  ('Chicken Corn Soup', 'Shredded chicken and sweet corn in light broth', 140.00, 'Starter', 'https://loremflickr.com/640/480/corn,soup/all?lock=107', 0, 0, 1),
  ('Spring Rolls', 'Crisp fried rolls with vegetable filling, chili sauce', 150.00, 'Starter', 'https://loremflickr.com/640/480/spring,rolls/all?lock=108', 1, 0, 1),
  ('Firni', 'Traditional rice pudding with pistachio', 100.00, 'Dessert', 'https://loremflickr.com/640/480/rice,pudding/all?lock=109', 1, 0, 1),
  ('Chocolate Lava Cake', 'Warm chocolate cake with molten center', 190.00, 'Dessert', 'https://loremflickr.com/640/480/chocolate,cake/all?lock=110', 1, 1, 1),
  ('Borhani', 'Spiced yogurt drink, served chilled', 80.00, 'Beverage', 'https://loremflickr.com/640/480/yogurt,drink/all?lock=111', 1, 0, 1),
  ('Fresh Lime Soda', 'Lime, soda water, mint', 90.00, 'Beverage', 'https://loremflickr.com/640/480/lime,soda/all?lock=112', 1, 0, 1);
