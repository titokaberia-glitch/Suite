import express from "express";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db, { initDb } from "./src/db";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "suitecontrol-secret-key";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  try {
    initDb();
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  // Seed admin if not exists
  const seedAdmin = () => {
    const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (!admin) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)').run(
        'admin', hashedPassword, 'admin', 'System Administrator'
      );
      console.log('Admin user seeded: admin / admin123');
    }
  };

  const seedRooms = () => {
    const existingRooms = db.prepare('SELECT number FROM rooms').all() as { number: string }[];
    const existingNumbers = new Set(existingRooms.map(r => r.number));
    
    const categories = [
      { prefix: 'A', type: 'Single', price: 2500 },
      { prefix: 'B', type: 'Double', price: 4500 },
      { prefix: 'C', type: 'Suite', price: 8500 }
    ];

    const insert = db.prepare('INSERT INTO rooms (number, type, price) VALUES (?, ?, ?)');
    
    db.transaction(() => {
      categories.forEach(cat => {
        for (let i = 1; i <= 10; i++) {
          const num = `${cat.prefix}${i.toString().padStart(3, '0')}`;
          if (!existingNumbers.has(num)) {
            insert.run(num, cat.type, cat.price);
          }
        }
      });
    })();
  };

  const seedInventory = () => {
    console.log('Seeding inventory...');
    const existingItems = db.prepare('SELECT name FROM inventory_items').all() as { name: string }[];
    const existingNames = new Set(existingItems.map(i => i.name.toLowerCase().trim()));
    console.log(`Found ${existingNames.size} existing items.`);
    
    const insert = db.prepare('INSERT INTO inventory_items (name, category, stock_quantity, cost_price, selling_price, min_stock_level) VALUES (?, ?, ?, ?, ?, ?)');
    const items = [
      ['Chicken (Whole)', 'food', 50, 650, 1200],
      ['Chicken Breast (kg)', 'food', 30, 700, 1300],
      ['Beef (kg)', 'food', 40, 650, 1200],
      ['Goat Meat (kg)', 'food', 25, 750, 1400],
      ['Tilapia (Piece)', 'food', 40, 350, 800],
      ['Sausages (Packet)', 'food', 60, 350, 700],
      ['Eggs (Tray)', 'food', 40, 420, 650],
      ['Rice (kg)', 'food', 100, 160, 350],
      ['Maize Flour 2kg', 'food', 80, 180, 350],
      ['Cooking Oil 20L', 'other', 10, 5000, 0],
      ['Tomatoes (Crate)', 'food', 20, 2000, 0],
      ['Onions (Net)', 'food', 25, 1800, 0],
      ['Potatoes (Bag)', 'food', 30, 3500, 300],
      ['Ndengu (kg)', 'food', 25, 180, 350],
      ['Beans (kg)', 'food', 30, 170, 350],
      ['Chapati (Piece)', 'food', 200, 15, 40],
      ['Mandazi (Piece)', 'food', 150, 10, 30],
      ['Pilau Masala (kg)', 'other', 10, 900, 0],
      ['Cabbage (Piece)', 'food', 40, 80, 200],
      ['Sukuma Wiki (Bundle)', 'food', 100, 30, 150],
      ['Chips Masala (Plate)', 'food', 80, 180, 400],
      ['Chips Plain (Plate)', 'food', 100, 120, 300],
      ['Chicken Stew (Plate)', 'food', 70, 350, 700],
      ['Beef Stew (Plate)', 'food', 80, 300, 650],
      ['Goat Fry (Plate)', 'food', 50, 450, 900],
      ['Ugali + Beef', 'food', 60, 250, 600],
      ['Ugali + Chicken', 'food', 60, 300, 700],
      ['Mukimo + Beef', 'food', 40, 280, 650],
      ['Fish + Ugali', 'food', 50, 400, 900],
      ['Breakfast Combo', 'food', 40, 250, 600],
      ['Tusker Beer (Bottle)', 'drink', 200, 180, 350],
      ['White Cap (Bottle)', 'drink', 150, 170, 330],
      ['Guinness (Bottle)', 'drink', 120, 200, 380],
      ['Pilsner (Bottle)', 'drink', 150, 175, 340],
      ['Smirnoff Ice', 'drink', 100, 210, 400],
      ['Soda 500ml', 'drink', 200, 50, 100],
      ['Mineral Water 500ml', 'drink', 200, 40, 100],
      ['Fresh Juice (Glass)', 'drink', 80, 80, 250],
      ['Tea (Cup)', 'drink', 100, 20, 80],
      ['Coffee (Cup)', 'drink', 100, 30, 120]
    ];

    let insertedCount = 0;
    db.transaction(() => {
      items.forEach(item => {
        const name = (item[0] as string).toLowerCase().trim();
        if (!existingNames.has(name)) {
          insert.run(item[0], item[1], item[2], item[3], item[4], 5);
          insertedCount++;
        }
      });
    })();
    console.log(`Seeded ${insertedCount} new inventory items.`);
  };

  try {
    seedAdmin();
    seedRooms();
    seedInventory();
  } catch (err) {
    console.error('Failed to seed data:', err);
  }

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const authorize = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      next();
    };
  };

  // --- Auth Routes ---
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  });

  // --- Rooms API ---
  app.get("/api/rooms/:id/active-stay", authenticateToken, (req, res) => {
    const stay = db.prepare("SELECT * FROM stays WHERE room_id = ? AND status = 'active'").get(req.params.id);
    if (!stay) return res.status(404).json({ message: "No active stay" });
    res.json({ stay });
  });

  app.get("/api/rooms", authenticateToken, (req, res) => {
    const rooms = db.prepare(`
      SELECT r.*, s.id as stay_id, g.name as guest_name
      FROM rooms r
      LEFT JOIN stays s ON r.id = s.room_id AND s.status = 'active'
      LEFT JOIN guests g ON s.guest_id = g.id
    `).all();
    res.json(rooms);
  });

  app.post("/api/rooms", authenticateToken, authorize(['admin', 'receptionist']), (req, res) => {
    const { number, type, price } = req.body;
    try {
      const result = db.prepare('INSERT INTO rooms (number, type, price) VALUES (?, ?, ?)').run(number, type, price);
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/rooms/:id/status", authenticateToken, (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE rooms SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  });

  // --- Guests API ---
  app.get("/api/guests", authenticateToken, (req, res) => {
    const guests = db.prepare('SELECT * FROM guests').all();
    res.json(guests);
  });

  // --- Check-in API ---
  app.post("/api/check-in", authenticateToken, authorize(['admin', 'receptionist']), (req, res) => {
    const { guestName, phone, idNumber, roomId, checkInDate, expectedCheckOutDate, deposit, paymentMethod } = req.body;
    
    db.transaction(() => {
      // Create guest if not exists (simplified for demo)
      let guest: any = db.prepare('SELECT id FROM guests WHERE id_number = ?').get(idNumber);
      if (!guest) {
        const result = db.prepare('INSERT INTO guests (name, phone, id_number) VALUES (?, ?, ?)').run(guestName, phone, idNumber);
        guest = { id: result.lastInsertRowid };
      }

      // Create stay
      const stayResult = db.prepare('INSERT INTO stays (guest_id, room_id, check_in_date) VALUES (?, ?, ?)').run(guest.id, roomId, checkInDate);
      const stayId = stayResult.lastInsertRowid;
      
      // Update room status
      db.prepare("UPDATE rooms SET status = 'occupied' WHERE id = ?").run(roomId);

      // Record deposit if any
      if (deposit && parseFloat(deposit) > 0) {
        db.prepare('INSERT INTO payments (stay_id, amount, method) VALUES (?, ?, ?)').run(
          stayId, parseFloat(deposit), paymentMethod || 'Cash'
        );
      }
    })();

    res.json({ success: true });
  });

  // --- POS API ---
  app.get("/api/inventory", authenticateToken, (req, res) => {
    const items = db.prepare('SELECT * FROM inventory_items').all();
    res.json(items);
  });

  app.get("/api/inventory/:id/movements", authenticateToken, (req, res) => {
    const movements = db.prepare(`
      SELECT * FROM stock_movements 
      WHERE inventory_item_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);
    res.json(movements);
  });

  app.post("/api/inventory", authenticateToken, authorize(['admin']), (req, res) => {
    const { name, category, cost_price, selling_price, stock_quantity, min_stock_level } = req.body;
    const result = db.prepare('INSERT INTO inventory_items (name, category, cost_price, selling_price, stock_quantity, min_stock_level) VALUES (?, ?, ?, ?, ?, ?)').run(
      name, category, cost_price, selling_price, stock_quantity, min_stock_level
    );
    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/inventory/:id", authenticateToken, authorize(['admin']), (req, res) => {
    const { name, category, cost_price, selling_price, stock_quantity, min_stock_level } = req.body;
    db.prepare(`
      UPDATE inventory_items 
      SET name = ?, category = ?, cost_price = ?, selling_price = ?, stock_quantity = ?, min_stock_level = ? 
      WHERE id = ?
    `).run(name, category, cost_price, selling_price, stock_quantity, min_stock_level, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/orders", authenticateToken, authorize(['admin', 'waiter']), (req, res) => {
    const { stayId, items, paymentStatus, fulfillmentStatus, paymentMethod } = req.body; // items: [{id, quantity, price}]
    
    db.transaction(() => {
      let total = 0;
      items.forEach((item: any) => total += item.price * item.quantity);

      const orderResult = db.prepare('INSERT INTO orders (stay_id, user_id, total_amount, payment_status, fulfillment_status) VALUES (?, ?, ?, ?, ?)').run(
        stayId || null, (req as any).user.id, total, paymentStatus, fulfillmentStatus || 'pending'
      );
      const orderId = orderResult.lastInsertRowid;

      items.forEach((item: any) => {
        db.prepare('INSERT INTO order_items (order_id, inventory_item_id, quantity, unit_price) VALUES (?, ?, ?, ?)').run(
          orderId, item.id, item.quantity, item.price
        );
        // Reduce inventory
        db.prepare('UPDATE inventory_items SET stock_quantity = stock_quantity - ? WHERE id = ?').run(item.quantity, item.id);
        // Record movement
        db.prepare("INSERT INTO stock_movements (inventory_item_id, type, quantity, reason) VALUES (?, 'out', ?, ?)").run(
          item.id, item.quantity, `Order #${orderId}`
        );
      });

      // If paid immediately, record in payments
      if (paymentStatus === 'paid') {
        db.prepare('INSERT INTO payments (order_id, amount, method) VALUES (?, ?, ?)').run(
          orderId, total, paymentMethod || 'Cash'
        );
      }
    })();

    res.json({ success: true });
  });

  // --- Billing API ---
  app.get("/api/stays/:id/bill", authenticateToken, (req, res) => {
    const stay: any = db.prepare(`
      SELECT s.*, r.number as room_number, r.price as room_price, g.name as guest_name
      FROM stays s
      JOIN rooms r ON s.room_id = r.id
      JOIN guests g ON s.guest_id = g.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!stay) return res.status(404).json({ message: "Stay not found" });

    const orders = db.prepare(`
      SELECT o.*, GROUP_CONCAT(ii.name || ' (x' || oi.quantity || ')') as items_summary
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN inventory_items ii ON oi.inventory_item_id = ii.id
      WHERE o.stay_id = ?
      GROUP BY o.id
    `).all(req.params.id);

    res.json({ stay, orders });
  });

  // --- Checkout API ---
  app.post("/api/stays/:id/check-out", authenticateToken, authorize(['admin', 'receptionist']), (req, res) => {
    const { totalRoomCharges, paymentMethod } = req.body;
    
    db.transaction(() => {
      const stay: any = db.prepare('SELECT room_id FROM stays WHERE id = ?').get(req.params.id);
      
      // Update stay
      db.prepare("UPDATE stays SET status = 'completed', total_room_charges = ?, check_out_date = CURRENT_TIMESTAMP WHERE id = ?").run(
        totalRoomCharges, req.params.id
      );
      
      // Update room status
      db.prepare("UPDATE rooms SET status = 'available' WHERE id = ?").run(stay.room_id);

      // Record payment
      db.prepare('INSERT INTO payments (stay_id, amount, method) VALUES (?, ?, ?)').run(
        req.params.id, totalRoomCharges, paymentMethod
      );
    })();

    res.json({ success: true });
  });

  // --- Reservations API ---
  app.get("/api/reservations", authenticateToken, (req, res) => {
    const reservations = db.prepare(`
      SELECT res.*, g.name as guest_name, r.number as room_number
      FROM reservations res
      JOIN guests g ON res.guest_id = g.id
      JOIN rooms r ON res.room_id = r.id
      ORDER BY res.check_in_date DESC
    `).all();
    res.json(reservations);
  });

  app.post("/api/reservations", authenticateToken, authorize(['admin', 'receptionist']), (req, res) => {
    const { guestName, phone, idNumber, roomId, checkInDate, checkOutDate, deposit } = req.body;
    
    db.transaction(() => {
      let guest: any = db.prepare('SELECT id FROM guests WHERE id_number = ?').get(idNumber);
      if (!guest) {
        const result = db.prepare('INSERT INTO guests (name, phone, id_number) VALUES (?, ?, ?)').run(guestName, phone, idNumber);
        guest = { id: result.lastInsertRowid };
      }

      db.prepare('INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, deposit) VALUES (?, ?, ?, ?, ?)').run(
        guest.id, roomId, checkInDate, checkOutDate, deposit || 0
      );
      
      db.prepare("UPDATE rooms SET status = 'reserved' WHERE id = ?").run(roomId);
    })();

    res.json({ success: true });
  });

  app.patch("/api/reservations/:id/status", authenticateToken, authorize(['admin', 'receptionist']), (req, res) => {
    const { status } = req.body;
    db.transaction(() => {
      const reservation: any = db.prepare('SELECT room_id FROM reservations WHERE id = ?').get(req.params.id);
      db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, req.params.id);
      
      if (status === 'cancelled' || status === 'completed') {
        db.prepare("UPDATE rooms SET status = 'available' WHERE id = ?").run(reservation.room_id);
      } else if (status === 'confirmed') {
        db.prepare("UPDATE rooms SET status = 'reserved' WHERE id = ?").run(reservation.room_id);
      }
    })();
    res.json({ success: true });
  });

  // --- Users API (Settings) ---
  app.get("/api/users", authenticateToken, authorize(['admin']), (req, res) => {
    const users = db.prepare('SELECT id, username, role, name FROM users').all();
    res.json(users);
  });

  app.post("/api/users", authenticateToken, authorize(['admin']), (req, res) => {
    const { username, password, role, name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      const result = db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)').run(
        username, hashedPassword, role, name
      );
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ message: "Username already exists" });
    }
  });

  // --- Reports API Extensions ---
  app.get("/api/reports/inventory", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const inventory = db.prepare(`
      SELECT name, stock_quantity, min_stock_level, category
      FROM inventory_items
    `).all();
    res.json(inventory);
  });

  app.get("/api/reports/rooms", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const data = db.prepare(`
      SELECT type, COUNT(*) as count, SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_count
      FROM rooms
      GROUP BY type
    `).all();
    res.json(data);
  });

  app.get("/api/reports/sales", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const sales = db.prepare(`
      SELECT date(created_at) as date, SUM(total_amount) as total
      FROM orders
      GROUP BY date(created_at)
      ORDER BY date DESC
      LIMIT 30
    `).all();
    res.json(sales);
  });

  app.get("/api/reports/revenue-breakdown", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const date = req.query.date || 'today';
    const dateCondition = date === 'today' ? "date(created_at) = date('now')" : "date(created_at) = ?";
    const params = date === 'today' ? [] : [date];

    const restaurant = db.prepare(`
      SELECT SUM(oi.quantity * oi.unit_price) as total
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN inventory_items ii ON oi.inventory_item_id = ii.id
      WHERE ${dateCondition} AND ii.category = 'food'
    `).get(...params) as { total: number };

    const bar = db.prepare(`
      SELECT SUM(oi.quantity * oi.unit_price) as total
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN inventory_items ii ON oi.inventory_item_id = ii.id
      WHERE ${dateCondition} AND ii.category = 'drink'
    `).get(...params) as { total: number };

    const rooms = db.prepare(`
      SELECT SUM(amount) as total
      FROM payments
      WHERE ${dateCondition} AND stay_id IS NOT NULL AND order_id IS NULL
    `).get(...params) as { total: number };

    res.json({
      restaurant: restaurant.total || 0,
      bar: bar.total || 0,
      rooms: rooms.total || 0
    });
  });

  app.get("/api/reports/detailed-sales", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const sales = db.prepare(`
      SELECT 
        ii.name,
        ii.category,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.unit_price) as total_sales,
        SUM(oi.quantity * (oi.unit_price - ii.cost_price)) as total_profit
      FROM order_items oi
      JOIN inventory_items ii ON oi.inventory_item_id = ii.id
      JOIN orders o ON oi.order_id = o.id
      GROUP BY ii.id
      ORDER BY total_sales DESC
    `).all();
    res.json(sales);
  });

  app.get("/api/orders", authenticateToken, (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, u.name as waiter_name, r.number as room_number, g.name as guest_name,
             GROUP_CONCAT(ii.name || ' (x' || oi.quantity || ')') as items_summary
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN stays s ON o.stay_id = s.id
      LEFT JOIN rooms r ON s.room_id = r.id
      LEFT JOIN guests g ON s.guest_id = g.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN inventory_items ii ON oi.inventory_item_id = ii.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all();
    res.json(orders);
  });

  // --- Kitchen Inventory API ---
  app.get("/api/kitchen/inventory", authenticateToken, (req, res) => {
    const items = db.prepare('SELECT * FROM kitchen_inventory').all();
    res.json(items);
  });

  app.post("/api/kitchen/inventory", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const { name, unit, min_stock_level, initialStock } = req.body;
    try {
      db.transaction(() => {
        const result = db.prepare('INSERT INTO kitchen_inventory (name, unit, current_stock, min_stock_level) VALUES (?, ?, ?, ?)').run(
          name, unit, initialStock || 0, min_stock_level || 5
        );
        if (initialStock > 0) {
          db.prepare('INSERT INTO kitchen_movements (item_id, type, quantity, staff_id, reason) VALUES (?, ?, ?, ?, ?)').run(
            result.lastInsertRowid, 'in', initialStock, (req as any).user.id, 'Initial Stock'
          );
        }
        res.json({ id: result.lastInsertRowid });
      })();
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/kitchen/movements", authenticateToken, (req, res) => {
    const { itemId, type, quantity, reason } = req.body;
    const staffId = (req as any).user.id;

    db.transaction(() => {
      db.prepare('INSERT INTO kitchen_movements (item_id, type, quantity, staff_id, reason) VALUES (?, ?, ?, ?, ?)').run(
        itemId, type, quantity, staffId, reason
      );
      
      const adjustment = type === 'in' ? quantity : -quantity;
      db.prepare('UPDATE kitchen_inventory SET current_stock = current_stock + ? WHERE id = ?').run(adjustment, itemId);
    })();

    res.json({ success: true });
  });

  app.get("/api/kitchen/movements", authenticateToken, (req, res) => {
    const movements = db.prepare(`
      SELECT km.*, ki.name as item_name, u.name as staff_name
      FROM kitchen_movements km
      JOIN kitchen_inventory ki ON km.item_id = ki.id
      JOIN users u ON km.staff_id = u.id
      ORDER BY km.created_at DESC
    `).all();
    res.json(movements);
  });

  app.patch("/api/orders/:id/status", authenticateToken, (req, res) => {
    const { paymentStatus, fulfillmentStatus, paymentMethod } = req.body;
    
    db.transaction(() => {
      if (paymentStatus) {
        db.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').run(paymentStatus, req.params.id);
        
        // If paid, record in payments table
        if (paymentStatus === 'paid') {
          const order: any = db.prepare('SELECT total_amount FROM orders WHERE id = ?').get(req.params.id);
          db.prepare('INSERT INTO payments (order_id, amount, method) VALUES (?, ?, ?)').run(
            req.params.id, order.total_amount, paymentMethod || 'Cash'
          );
        }
      }
      if (fulfillmentStatus) {
        db.prepare('UPDATE orders SET fulfillment_status = ? WHERE id = ?').run(fulfillmentStatus, req.params.id);
      }
    })();
    
    res.json({ success: true });
  });

  // --- Finances API ---
  app.get("/api/finances/summary", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Balances from payments
    const payments = db.prepare('SELECT method, SUM(amount) as total FROM payments GROUP BY method').all() as any[];
    const expenses = db.prepare('SELECT method, SUM(amount) as total FROM expenses GROUP BY method').all() as any[];
    
    const balances = { cash: 0, mpesa: 0, card: 0 };
    payments.forEach(p => {
      const method = p.method.toLowerCase();
      if (method.includes('cash')) balances.cash += p.total;
      else if (method.includes('mpesa')) balances.mpesa += p.total;
      else balances.card += p.total;
    });
    expenses.forEach(e => {
      const method = e.method.toLowerCase();
      if (method.includes('cash')) balances.cash -= e.total;
      else if (method.includes('mpesa')) balances.mpesa -= e.total;
      else balances.card -= e.total;
    });

    const ordersSummary = db.prepare(`
      SELECT payment_status, SUM(total_amount) as total, COUNT(*) as count
      FROM orders 
      WHERE date(created_at) = date(?)
      GROUP BY payment_status
    `).all(today);

    const todaySales = db.prepare('SELECT SUM(amount) as total FROM payments WHERE date(created_at) = date(?)').get(today) as any;
    const todayExpenses = db.prepare('SELECT SUM(amount) as total FROM expenses WHERE date(created_at) = date(?)').get(today) as any;

    const roomsSummary = db.prepare(`
      SELECT status, SUM(total_room_charges) as total 
      FROM stays 
      GROUP BY status
    `).all();

    const totalExpenses = db.prepare('SELECT SUM(amount) as total FROM expenses').get() as any;

    res.json({
      balances,
      orders: ordersSummary,
      todaySales: todaySales?.total || 0,
      todayExpenses: todayExpenses?.total || 0,
      rooms: roomsSummary,
      totalExpenses: totalExpenses.total || 0
    });
  });

  app.get("/api/finances/expenses", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const expenses = db.prepare(`
      SELECT e.*, u.name as recorded_by_name 
      FROM expenses e 
      JOIN users u ON e.recorded_by = u.id 
      ORDER BY e.created_at DESC
    `).all();
    res.json(expenses);
  });

  app.get("/api/finances/income", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const income = db.prepare(`
      SELECT p.*, 
             g.name as guest_name, 
             r.number as room_number,
             o.id as order_id_ref
      FROM payments p
      LEFT JOIN stays s ON p.stay_id = s.id
      LEFT JOIN guests g ON s.guest_id = g.id
      LEFT JOIN rooms r ON s.room_id = r.id
      LEFT JOIN orders o ON p.order_id = o.id
      ORDER BY p.created_at DESC
    `).all();
    res.json(income);
  });

  app.post("/api/finances/expenses", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const { amount, category, description, method } = req.body;
    const userId = (req as any).user.id;
    const result = db.prepare('INSERT INTO expenses (amount, category, description, method, recorded_by) VALUES (?, ?, ?, ?, ?)').run(
      amount, category, description, method, userId
    );
    res.json({ id: result.lastInsertRowid });
  });

  // --- Staff Management API ---
  app.get("/api/staff", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const staff = db.prepare("SELECT id, username, role, name, salary, allowances, deductions, status FROM users WHERE status = 'active'").all() as any[];
    
    // Enrich with pay items
    const enrichedStaff = staff.map(s => {
      const items = db.prepare(`
        SELECT upi.*, pit.name, pit.type 
        FROM user_pay_items upi
        JOIN pay_item_types pit ON upi.item_id = pit.id
        WHERE upi.user_id = ?
      `).all(s.id);
      return { ...s, payItems: items };
    });
    
    res.json(enrichedStaff);
  });

  app.get("/api/staff/pay-item-types", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const types = db.prepare('SELECT * FROM pay_item_types').all();
    res.json(types);
  });

  app.post("/api/staff/pay-item-types", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const { name, type } = req.body;
    const result = db.prepare('INSERT INTO pay_item_types (name, type) VALUES (?, ?)').run(name, type);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/staff/pay-item-types/:id", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    try {
      db.transaction(() => {
        // Delete associations first
        db.prepare('DELETE FROM user_pay_items WHERE item_id = ?').run(req.params.id);
        // Then delete the type
        db.prepare('DELETE FROM pay_item_types WHERE id = ?').run(req.params.id);
      })();
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/staff", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const { username, password, role, name, salary, payItems } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    try {
      db.transaction(() => {
        const result = db.prepare('INSERT INTO users (username, password, role, name, salary) VALUES (?, ?, ?, ?, ?)').run(
          username, hashedPassword, role, name, salary || 0
        );
        const userId = result.lastInsertRowid;

        if (payItems && Array.isArray(payItems)) {
          const insertItem = db.prepare('INSERT INTO user_pay_items (user_id, item_id, amount) VALUES (?, ?, ?)');
          payItems.forEach((item: any) => {
            insertItem.run(userId, item.itemId, item.amount);
          });
        }
      })();
      res.json({ success: true });
    } catch (e: any) {
      console.error("Error adding staff:", e);
      if (e.message.includes('UNIQUE constraint failed: users.username')) {
        res.status(400).json({ message: "Username already exists. Please choose a different username." });
      } else {
        res.status(400).json({ message: "Invalid data or database error: " + e.message });
      }
    }
  });

  app.patch("/api/staff/:id", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const { role, name, salary, payItems } = req.body;
    
    db.transaction(() => {
      db.prepare('UPDATE users SET role = ?, name = ?, salary = ? WHERE id = ?').run(
        role, name, salary, req.params.id
      );

      if (payItems && Array.isArray(payItems)) {
        db.prepare('DELETE FROM user_pay_items WHERE user_id = ?').run(req.params.id);
        const insertItem = db.prepare('INSERT INTO user_pay_items (user_id, item_id, amount) VALUES (?, ?, ?)');
        payItems.forEach((item: any) => {
          insertItem.run(req.params.id, item.itemId, item.amount);
        });
      }
    })();
    res.json({ success: true });
  });

  app.delete("/api/staff/:id", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    db.prepare("UPDATE users SET status = 'inactive' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- Payroll API ---
  app.get("/api/payroll", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const payroll = db.prepare(`
      SELECT p.*, u.name as staff_name, u.role as staff_role
      FROM payroll p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.period_year DESC, p.period_month DESC
    `).all();
    res.json(payroll);
  });

  app.post("/api/payroll/run", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const { month, year } = req.body;
    
    try {
      db.transaction(() => {
        // Check if already run
        const existing = db.prepare('SELECT id FROM payroll WHERE period_month = ? AND period_year = ? LIMIT 1').get(month, year);
        if (existing) throw new Error("Payroll already run for this period");

        const staff = db.prepare("SELECT id, salary FROM users WHERE status = 'active'").all() as any[];
        
        const insert = db.prepare('INSERT INTO payroll (user_id, period_month, period_year, basic_salary, allowances, deductions, net_pay, breakdown) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        
        staff.forEach(s => {
          const payItems = db.prepare(`
            SELECT upi.amount, pit.name, pit.type 
            FROM user_pay_items upi
            JOIN pay_item_types pit ON upi.item_id = pit.id
            WHERE upi.user_id = ?
          `).all(s.id) as any[];

          let allowances = 0;
          let deductions = 0;
          payItems.forEach(item => {
            if (item.type === 'allowance') allowances += item.amount;
            else deductions += item.amount;
          });

          const netPay = s.salary + allowances - deductions;
          insert.run(s.id, month, year, s.salary, allowances, deductions, netPay, JSON.stringify(payItems));
        });
      })();
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/payroll/record/:id", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    try {
      db.prepare('DELETE FROM payroll WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/payroll/:month/:year", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    const { month, year } = req.params;
    try {
      db.prepare('DELETE FROM payroll WHERE period_month = ? AND period_year = ?').run(month, year);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/payroll/:id/approve", authenticateToken, authorize(['admin', 'manager']), (req, res) => {
    try {
      db.transaction(() => {
        const record = db.prepare('SELECT * FROM payroll WHERE id = ?').get(req.params.id) as any;
        if (!record || record.status !== 'pending') throw new Error("Invalid payroll record");

        db.prepare("UPDATE payroll SET status = 'approved' WHERE id = ?").run(req.params.id);
        
        // Add to expenses
        const userId = (req as any).user.id;
        db.prepare('INSERT INTO expenses (amount, category, description, method, recorded_by) VALUES (?, ?, ?, ?, ?)').run(
          record.net_pay, 'Payroll', `Payroll for ${record.period_month}/${record.period_year}`, 'Bank Transfer', userId
        );
      })();
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist in production
    const distPath = path.resolve(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.error("Production build not found in dist directory. Please run 'npm run build'.");
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
