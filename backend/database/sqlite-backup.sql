PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO menu_items VALUES(1,'Burger Classique','Steak juteux de bœuf avec laitue, tomate, oignons et sauce spéciale',90.0,'Burgers',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(2,'Burger au Fromage','Burger classique garni de cheddar fondu',95.0,'Burgers',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(3,'Double Burger','Deux steaks de bœuf empilés avec tous les accompagnements',130.0,'Burgers',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(4,'Burger au Bacon','Garni de bacon croustillant et sauce BBQ',115.0,'Burgers',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(5,'Burger Végétarien','Steak végétal avec légumes frais',95.0,'Burgers',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(6,'Burger Poulet Épicé','Poulet croustillant avec mayo épicée et jalapeños',110.0,'Burgers',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(8,'Rondelles d''Oignon','Rondelles d''oignon panées et croustillantes',45.0,'Accompagnements',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(11,'Frites de Patate Douce','Frites de patate douce croustillantes avec sauce',49.92999999999999972,'Accompagnements',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:44:26');
INSERT INTO menu_items VALUES(12,'Salade César','Laitue romaine fraîche avec vinaigrette César',70.0,'Accompagnements',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(13,'Coca-Cola','Coca classique (Moyen)',25.0,'Boissons',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(14,'Sprite','Soda citron-lime (Moyen)',25.0,'Boissons',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(15,'Jus d''Orange','Jus d''orange fraîchement pressé',35.0,'Boissons',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(16,'Thé Glacé','Thé glacé rafraîchissant',30.0,'Boissons',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(17,'Milkshake Vanille','Milkshake crémeux à la vanille',50.0,'Boissons',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(18,'Milkshake Chocolat','Milkshake riche au chocolat',50.0,'Boissons',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(19,'Café','Café chaud infusé',23.0,'Boissons',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(20,'Eau Minérale','Eau minérale en bouteille',20.0,'Boissons',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(21,'Tarte aux Pommes','Tarte aux pommes chaude à la cannelle',40.0,'Desserts',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(22,'Coupe Glacée','Glace vanille avec sauce chocolat et cerise',45.0,'Desserts',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(23,'Brownie au Chocolat','Brownie riche au chocolat avec noix',35.0,'Desserts',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
INSERT INTO menu_items VALUES(24,'Cookies (3pc)','Cookies aux pépites de chocolat',30.0,'Desserts',NULL,1,'2025-10-11 00:36:05','2025-10-11 00:36:05');
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount REAL NOT NULL DEFAULT 0,
    customer_name TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, user_id INTEGER, approved_by INTEGER REFERENCES users(id), approved_at DATETIME, rejection_reason TEXT, caissier_name TEXT, cuisinier_name TEXT, client_name TEXT NOT NULL DEFAULT 'guest', order_id TEXT);
INSERT INTO orders VALUES(1,'ko-85805585','completed',49.92999999999999972,NULL,NULL,'2025-10-12 10:16:24','2025-10-12 16:36:44',4,2,'2025-10-12 10:16:55',NULL,NULL,'Bilal','client','ko-85805585');
INSERT INTO orders VALUES(2,'ko-38199170','completed',23.0,NULL,NULL,'2025-10-12 10:17:08','2025-10-12 16:43:02',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-38199170');
INSERT INTO orders VALUES(3,'ko-38246759','completed',45.0,NULL,NULL,'2025-10-12 10:17:21','2025-10-12 16:43:01',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-38246759');
INSERT INTO orders VALUES(4,'ko-78637500','completed',70.0,NULL,NULL,'2025-10-12 16:36:29','2025-10-12 16:43:01',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-78637500');
INSERT INTO orders VALUES(5,'ko-50466003','completed',49.92999999999999972,NULL,';vbnvjhgjh ,jgjhgkugbkhj jk:hbkjbv hjk n','2025-10-12 16:37:39','2025-10-12 16:43:01',4,2,'2025-10-12 16:38:15',NULL,NULL,'Bilal','client','ko-50466003');
INSERT INTO orders VALUES(6,'ko-76736118','completed',23.0,NULL,NULL,'2025-10-12 16:40:06','2025-10-12 16:43:01',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-76736118');
INSERT INTO orders VALUES(7,'ko-69953694','completed',70.0,NULL,NULL,'2025-10-12 16:40:16','2025-10-12 16:43:00',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-69953694');
INSERT INTO orders VALUES(8,'ko-20563955','completed',49.92999999999999972,NULL,'please essay red las kd d iz Sid inzkndnkzjnd,ndjn djndznkdskn','2025-10-12 16:42:05','2025-10-12 16:43:03',4,2,'2025-10-12 16:42:28',NULL,NULL,'Bilal','client','ko-20563955');
INSERT INTO orders VALUES(9,'ko-43924498','completed',49.92999999999999972,NULL,NULL,'2025-10-12 16:59:50','2025-10-12 22:01:46',4,2,'2025-10-12 17:00:02',NULL,NULL,'Bilal','client','ko-43924498');
INSERT INTO orders VALUES(10,'ko-23740546','completed',45.0,NULL,NULL,'2025-10-12 17:02:00','2025-10-12 22:02:18',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-23740546');
INSERT INTO orders VALUES(11,'ko-17772852','completed',70.0,NULL,NULL,'2025-10-12 17:02:13','2025-10-12 22:02:17',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-17772852');
INSERT INTO orders VALUES(12,'ko-28694718','completed',23.0,NULL,NULL,'2025-10-12 17:02:25','2025-10-12 22:02:15',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-28694718');
INSERT INTO orders VALUES(13,'ko-91020498','completed',70.0,NULL,NULL,'2025-10-12 17:02:35','2025-10-12 22:02:45',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-91020498');
INSERT INTO orders VALUES(14,'ko-59600979','completed',70.0,NULL,NULL,'2025-10-12 22:01:32','2025-10-12 22:02:43',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-59600979');
INSERT INTO orders VALUES(15,'ko-90426064','completed',70.0,NULL,NULL,'2025-10-12 22:01:40','2025-10-12 22:02:41',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-90426064');
INSERT INTO orders VALUES(16,'ko-73282943','completed',70.0,NULL,NULL,'2025-10-12 22:03:59','2025-10-12 22:04:35',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-73282943');
INSERT INTO orders VALUES(17,'ko-36909799','ready',49.92999999999999972,NULL,'Salam 3afak madirch lia souce algerien dir lia souce maison','2025-10-12 22:05:59','2025-10-12 22:08:09',4,2,'2025-10-12 22:07:14',NULL,NULL,'Bilal','client','ko-36909799');
INSERT INTO orders VALUES(18,'ko-41922971','ready',45.0,NULL,NULL,'2025-10-12 22:06:27','2025-10-12 22:08:08',4,2,'2025-10-12 22:07:12',NULL,NULL,'Bilal','client','ko-41922971');
INSERT INTO orders VALUES(19,'ko-75749189','ready',45.0,NULL,NULL,'2025-10-12 22:06:50','2025-10-12 22:08:06',4,2,'2025-10-12 22:07:09',NULL,NULL,'Bilal','client','ko-75749189');
INSERT INTO orders VALUES(20,'ko-35803726','ready',49.92999999999999972,NULL,NULL,'2025-10-12 22:42:29','2025-10-12 22:44:01',4,2,'2025-10-12 22:42:47',NULL,NULL,'Bilal','client','ko-35803726');
INSERT INTO orders VALUES(21,'ko-23156780','ready',49.92999999999999972,NULL,NULL,'2025-10-12 22:43:30','2025-10-12 22:44:00',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-23156780');
INSERT INTO orders VALUES(22,'ko-38918968','ready',45.0,NULL,NULL,'2025-10-12 22:43:48','2025-10-12 22:44:00',2,NULL,NULL,NULL,'mehdi','Bilal','guest','ko-38918968');
INSERT INTO orders VALUES(23,'ko-18870799','ready',92.9300000000000069,NULL,NULL,'2025-10-12 22:46:35','2025-10-12 22:47:17',4,2,'2025-10-12 22:46:47',NULL,NULL,'Bilal','client','ko-18870799');
INSERT INTO orders VALUES(24,'ko-72511214','ready',49.92999999999999972,NULL,NULL,'2025-10-12 23:32:12','2025-10-12 23:32:40',4,2,'2025-10-12 23:32:17',NULL,NULL,'Bilal','client','ko-72511214');
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    special_instructions TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);
INSERT INTO order_items VALUES(1,1,11,1,49.92999999999999972,49.92999999999999972,'hello am client from casablanca');
INSERT INTO order_items VALUES(2,2,19,1,23.0,23.0,NULL);
INSERT INTO order_items VALUES(3,3,8,1,45.0,45.0,NULL);
INSERT INTO order_items VALUES(4,4,12,1,70.0,70.0,NULL);
INSERT INTO order_items VALUES(5,5,11,1,49.92999999999999972,49.92999999999999972,NULL);
INSERT INTO order_items VALUES(6,6,19,1,23.0,23.0,NULL);
INSERT INTO order_items VALUES(7,7,12,1,70.0,70.0,NULL);
INSERT INTO order_items VALUES(8,8,11,1,49.92999999999999972,49.92999999999999972,NULL);
INSERT INTO order_items VALUES(9,9,11,1,49.92999999999999972,49.92999999999999972,NULL);
INSERT INTO order_items VALUES(10,10,8,1,45.0,45.0,NULL);
INSERT INTO order_items VALUES(11,11,12,1,70.0,70.0,NULL);
INSERT INTO order_items VALUES(12,12,19,1,23.0,23.0,NULL);
INSERT INTO order_items VALUES(13,13,12,1,70.0,70.0,NULL);
INSERT INTO order_items VALUES(14,14,12,1,70.0,70.0,NULL);
INSERT INTO order_items VALUES(15,15,12,1,70.0,70.0,NULL);
INSERT INTO order_items VALUES(16,16,12,1,70.0,70.0,NULL);
INSERT INTO order_items VALUES(17,17,11,1,49.92999999999999972,49.92999999999999972,NULL);
INSERT INTO order_items VALUES(18,18,8,1,45.0,45.0,NULL);
INSERT INTO order_items VALUES(19,19,8,1,45.0,45.0,NULL);
INSERT INTO order_items VALUES(20,20,11,1,49.92999999999999972,49.92999999999999972,NULL);
INSERT INTO order_items VALUES(21,21,11,1,49.92999999999999972,49.92999999999999972,NULL);
INSERT INTO order_items VALUES(22,22,8,1,45.0,45.0,NULL);
INSERT INTO order_items VALUES(23,23,19,1,23.0,23.0,NULL);
INSERT INTO order_items VALUES(24,23,20,1,20.0,20.0,NULL);
INSERT INTO order_items VALUES(25,23,11,1,49.92999999999999972,49.92999999999999972,NULL);
INSERT INTO order_items VALUES(26,24,11,1,49.92999999999999972,49.92999999999999972,NULL);
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('manager', 'cashier', 'cook', 'client')),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    last_login DATETIME,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
INSERT INTO users VALUES(1,'admin','$2b$10$Bfdm2RUIeZQiCfo7lVsSlOJEBcFpZwwmLJJdZOKndzdHKEoeynytS','manager','Administrateur',NULL,NULL,'active','2025-10-12 00:13:14',NULL,'2025-10-12 23:13:37');
INSERT INTO users VALUES(2,'mehdi','$2b$10$sWwlkt1XglJU2bwIuO5PRO683GN6el4e3Elgw4W6SFfKGHuOYle6y','cashier','mehdi',NULL,NULL,'active','2025-10-12 00:35:43',1,'2025-10-12 09:31:15');
INSERT INTO users VALUES(3,'bilal','$2b$10$fr4IiQzBLMfzWXlEzyDFr.s0ZaLpARmnlIA1zzaDmeYMtISAjMOae','cook','Bilal',NULL,NULL,'active','2025-10-12 00:36:51',1,'2025-10-12 23:31:36');
INSERT INTO users VALUES(4,'client','$2b$10$57UH/peywhYIbqmjjnSMpOyOOGHty439yo13sX1gyEs6PTAqfJwB2','client','client',NULL,NULL,'active','2025-10-12 00:38:30',1,'2025-10-12 23:28:36');
INSERT INTO sqlite_sequence VALUES('menu_items',25);
INSERT INTO sqlite_sequence VALUES('users',4);
INSERT INTO sqlite_sequence VALUES('orders',24);
INSERT INTO sqlite_sequence VALUES('order_items',26);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_approved_by ON orders(approved_by);
CREATE INDEX idx_orders_approved_at ON orders(approved_at);
CREATE UNIQUE INDEX idx_order_id ON orders(order_id);
COMMIT;
