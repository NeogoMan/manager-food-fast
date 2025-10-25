-- Articles du Menu - Restaurant Fast Food (Prix en Dirhams Marocains)

-- Burgers
INSERT INTO menu_items (name, description, price, category, is_available) VALUES
('Burger Classique', 'Steak juteux de bœuf avec laitue, tomate, oignons et sauce spéciale', 90.00, 'Burgers', 1),
('Burger au Fromage', 'Burger classique garni de cheddar fondu', 95.00, 'Burgers', 1),
('Double Burger', 'Deux steaks de bœuf empilés avec tous les accompagnements', 130.00, 'Burgers', 1),
('Burger au Bacon', 'Garni de bacon croustillant et sauce BBQ', 115.00, 'Burgers', 1),
('Burger Végétarien', 'Steak végétal avec légumes frais', 95.00, 'Burgers', 1),
('Burger Poulet Épicé', 'Poulet croustillant avec mayo épicée et jalapeños', 110.00, 'Burgers', 1);

-- Accompagnements
INSERT INTO menu_items (name, description, price, category, is_available) VALUES
('Frites', 'Frites croustillantes dorées, légèrement salées', 40.00, 'Accompagnements', 1),
('Rondelles d''Oignon', 'Rondelles d''oignon panées et croustillantes', 45.00, 'Accompagnements', 1),
('Nuggets de Poulet', '6 pièces de nuggets de poulet croustillants', 60.00, 'Accompagnements', 1),
('Bâtonnets de Mozzarella', '5 pièces avec sauce marinara', 55.00, 'Accompagnements', 1),
('Frites de Patate Douce', 'Frites de patate douce croustillantes avec sauce', 50.00, 'Accompagnements', 1),
('Salade César', 'Laitue romaine fraîche avec vinaigrette César', 70.00, 'Accompagnements', 1);

-- Boissons
INSERT INTO menu_items (name, description, price, category, is_available) VALUES
('Coca-Cola', 'Coca classique (Moyen)', 25.00, 'Boissons', 1),
('Sprite', 'Soda citron-lime (Moyen)', 25.00, 'Boissons', 1),
('Jus d''Orange', 'Jus d''orange fraîchement pressé', 35.00, 'Boissons', 1),
('Thé Glacé', 'Thé glacé rafraîchissant', 30.00, 'Boissons', 1),
('Milkshake Vanille', 'Milkshake crémeux à la vanille', 50.00, 'Boissons', 1),
('Milkshake Chocolat', 'Milkshake riche au chocolat', 50.00, 'Boissons', 1),
('Café', 'Café chaud infusé', 23.00, 'Boissons', 1),
('Eau Minérale', 'Eau minérale en bouteille', 20.00, 'Boissons', 1);

-- Desserts
INSERT INTO menu_items (name, description, price, category, is_available) VALUES
('Tarte aux Pommes', 'Tarte aux pommes chaude à la cannelle', 40.00, 'Desserts', 1),
('Coupe Glacée', 'Glace vanille avec sauce chocolat et cerise', 45.00, 'Desserts', 1),
('Brownie au Chocolat', 'Brownie riche au chocolat avec noix', 35.00, 'Desserts', 1),
('Cookies (3pc)', 'Cookies aux pépites de chocolat', 30.00, 'Desserts', 1);
