import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db, { initDb } from "./src/db";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "suitecontrol-secret-key";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Seed admin if not exists
const seedAdmin = async () => {
    const adminResult = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: ['admin']
    });
    const admin = adminResult.rows[0];
    if (!admin) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await db.execute({
        sql: 'INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)',
        args: ['admin', hashedPassword, 'admin', 'System Administrator']
      });
      console.log('Admin user seeded: admin / admin123');
    }
  };

  const seedRooms = async () => {
    const existingRoomsResult = await db.execute('SELECT number FROM rooms');
    const existingRooms = existingRoomsResult.rows as unknown as { number: string }[];
    const existingNumbers = new Set(existingRooms.map(r => r.number));
    
    const categories = [
      { prefix: 'A', type: 'Single', price: 2500 },
      { prefix: 'B', type: 'Double', price: 4500 },
      { prefix: 'C', type: 'Suite', price: 8500 }
    ];

    const statements = [];
    categories.forEach(cat => {
      for (let i = 1; i <= 10; i++) {
        const num = `${cat.prefix}${i.toString().padStart(3, '0')}`;
        if (!existingNumbers.has(num)) {
          statements.push({
            sql: 'INSERT INTO rooms (number, type, price) VALUES (?, ?, ?)',
            args: [num, cat.type, cat.price]
          });
        }
      }
    });
    
    if (statements.length > 0) {
      await db.batch(statements, 'write');
    }
  };

  const seedInventory = async () => {
    console.log('Seeding inventory...');
    const existingItemsResult = await db.execute('SELECT name FROM inventory_items');
    const existingItems = existingItemsResult.rows as unknown as { name: string }[];
    const existingNames = new Set(existingItems.map(i => i.name.toLowerCase().trim()));
    console.log(`Found ${existingNames.size} existing items.`);
    
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
    const statements = [];
    items.forEach(item => {
      const name = (item[0] as string).toLowerCase().trim();
      if (!existingNames.has(name)) {
        statements.push({
          sql: 'INSERT INTO inventory_items (name, category, stock_quantity, cost_price, selling_price, min_stock_level) VALUES (?, ?, ?, ?, ?, ?)',
          args: [item[0], item[1], item[2], item[3], item[4], 5]
        });
        insertedCount++;
      }
    });

    if (statements.length > 0) {
      await db.batch(statements, 'write');
    }
    console.log(`Seeded ${insertedCount} new inventory items.`);
  };

// Initialize DB and seed asynchronously
(async () => {
  try {
    await initDb();
    await seedAdmin();
    await seedRooms();
    await seedInventory();
  } catch (err) {
    console.error('Failed to initialize database or seed data:', err);
  }
})();

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
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    try {
      const userResult = await db.execute({
        sql: 'SELECT * FROM users WHERE username = ?',
        args: [username]
      });
      const user: any = userResult.rows[0];

      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Rooms API ---
  app.get("/api/rooms/:id/active-stay", authenticateToken, async (req, res) => {
    try {
      const stayResult = await db.execute({
        sql: "SELECT * FROM stays WHERE room_id = ? AND status = 'active'",
        args: [req.params.id]
      });
      const stay = stayResult.rows[0];
      if (!stay) return res.status(404).json({ message: "No active stay" });
      res.json({ stay });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/rooms", authenticateToken, async (req, res) => {
    try {
      const roomsResult = await db.execute(`
        SELECT r.*, s.id as stay_id, g.name as guest_name
        FROM rooms r
        LEFT JOIN stays s ON r.id = s.room_id AND s.status = 'active'
        LEFT JOIN guests g ON s.guest_id = g.id
      `);
      res.json(roomsResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/rooms", authenticateToken, authorize(['admin', 'receptionist']), async (req, res) => {
    const { number, type, price } = req.body;
    try {
      const result = await db.execute({
        sql: 'INSERT INTO rooms (number, type, price) VALUES (?, ?, ?)',
        args: [number, type, price]
      });
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/rooms/:id/status", authenticateToken, async (req, res) => {
    const { status } = req.body;
    try {
      await db.execute({
        sql: 'UPDATE rooms SET status = ? WHERE id = ?',
        args: [status, req.params.id]
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // --- Guests API ---
  app.get("/api/guests", authenticateToken, async (req, res) => {
    try {
      const guestsResult = await db.execute('SELECT * FROM guests');
      res.json(guestsResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // --- Check-in API ---
  app.post("/api/check-in", authenticateToken, authorize(['admin', 'receptionist']), async (req, res) => {
    const { guestName, phone, idNumber, roomId, checkInDate, expectedCheckOutDate, deposit, paymentMethod } = req.body;
    
    try {
      const statements = [];
      let guestId;

      // Check if guest exists
      const guestResult = await db.execute({
        sql: 'SELECT id FROM guests WHERE id_number = ?',
        args: [idNumber]
      });
      
      if (guestResult.rows.length > 0) {
        guestId = guestResult.rows[0].id;
      }
      
      const tx = await db.transaction('write');
      try {
        if (!guestId) {
          const insertGuestResult = await tx.execute({
            sql: 'INSERT INTO guests (name, phone, id_number) VALUES (?, ?, ?)',
            args: [guestName, phone, idNumber]
          });
          guestId = insertGuestResult.lastInsertRowid;
        }
        
        const stayResult = await tx.execute({
          sql: 'INSERT INTO stays (guest_id, room_id, check_in_date) VALUES (?, ?, ?)',
          args: [guestId, roomId, checkInDate]
        });
        const stayId = stayResult.lastInsertRowid;

        await tx.execute({
          sql: "UPDATE rooms SET status = 'occupied' WHERE id = ?",
          args: [roomId]
        });

        if (deposit && parseFloat(deposit) > 0) {
          await tx.execute({
            sql: 'INSERT INTO payments (stay_id, amount, method) VALUES (?, ?, ?)',
            args: [stayId, parseFloat(deposit), paymentMethod || 'Cash']
          });
        }
        await tx.commit();
      } catch (e) {
        await tx.rollback();
        throw e;
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error("Check-in error:", e);
      res.status(500).json({ message: e.message });
    }
  });

  // --- POS API ---
  app.get("/api/inventory", authenticateToken, async (req, res) => {
    try {
      const itemsResult = await db.execute('SELECT * FROM inventory_items');
      res.json(itemsResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/inventory/:id/movements", authenticateToken, async (req, res) => {
    try {
      const movementsResult = await db.execute({
        sql: `
          SELECT * FROM stock_movements 
          WHERE inventory_item_id = ? 
          ORDER BY created_at DESC
        `,
        args: [req.params.id]
      });
      res.json(movementsResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/inventory", authenticateToken, authorize(['admin']), async (req, res) => {
    const { name, category, cost_price, selling_price, stock_quantity, min_stock_level } = req.body;
    try {
      const result = await db.execute({
        sql: 'INSERT INTO inventory_items (name, category, cost_price, selling_price, stock_quantity, min_stock_level) VALUES (?, ?, ?, ?, ?, ?)',
        args: [name, category, cost_price, selling_price, stock_quantity, min_stock_level]
      });
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/inventory/:id", authenticateToken, authorize(['admin']), async (req, res) => {
    const { name, category, cost_price, selling_price, stock_quantity, min_stock_level } = req.body;
    try {
      await db.execute({
        sql: `
          UPDATE inventory_items 
          SET name = ?, category = ?, cost_price = ?, selling_price = ?, stock_quantity = ?, min_stock_level = ? 
          WHERE id = ?
        `,
        args: [name, category, cost_price, selling_price, stock_quantity, min_stock_level, req.params.id]
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/orders", authenticateToken, authorize(['admin', 'waiter']), async (req, res) => {
    const { stayId, items, paymentStatus, fulfillmentStatus, paymentMethod } = req.body;
    
    try {
      const tx = await db.transaction('write');
      try {
        let total = 0;
        items.forEach((item: any) => total += item.price * item.quantity);

        const orderResult = await tx.execute({
          sql: 'INSERT INTO orders (stay_id, user_id, total_amount, payment_status, fulfillment_status) VALUES (?, ?, ?, ?, ?)',
          args: [stayId || null, (req as any).user.id, total, paymentStatus, fulfillmentStatus || 'pending']
        });
        const orderId = orderResult.lastInsertRowid;

        for (const item of items) {
          await tx.execute({
            sql: 'INSERT INTO order_items (order_id, inventory_item_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
            args: [orderId, item.id, item.quantity, item.price]
          });
          await tx.execute({
            sql: 'UPDATE inventory_items SET stock_quantity = stock_quantity - ? WHERE id = ?',
            args: [item.quantity, item.id]
          });
          await tx.execute({
            sql: "INSERT INTO stock_movements (inventory_item_id, type, quantity, reason) VALUES (?, 'out', ?, ?)",
            args: [item.id, item.quantity, `Order #${orderId}`]
          });
        }

        if (paymentStatus === 'paid') {
          await tx.execute({
            sql: 'INSERT INTO payments (order_id, amount, method) VALUES (?, ?, ?)',
            args: [orderId, total, paymentMethod || 'Cash']
          });
        }
        await tx.commit();
        res.json({ success: true });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      console.error("Order error:", e);
      res.status(500).json({ message: e.message });
    }
  });

  // --- Billing API ---
  app.get("/api/stays/:id/bill", authenticateToken, async (req, res) => {
    try {
      const stayResult = await db.execute({
        sql: `
          SELECT s.*, r.number as room_number, r.price as room_price, g.name as guest_name
          FROM stays s
          JOIN rooms r ON s.room_id = r.id
          JOIN guests g ON s.guest_id = g.id
          WHERE s.id = ?
        `,
        args: [req.params.id]
      });
      const stay = stayResult.rows[0];

      if (!stay) return res.status(404).json({ message: "Stay not found" });

      const ordersResult = await db.execute({
        sql: `
          SELECT o.*, GROUP_CONCAT(ii.name || ' (x' || oi.quantity || ')') as items_summary
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          JOIN inventory_items ii ON oi.inventory_item_id = ii.id
          WHERE o.stay_id = ?
          GROUP BY o.id
        `,
        args: [req.params.id]
      });

      res.json({ stay, orders: ordersResult.rows });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // --- Checkout API ---
  app.post("/api/stays/:id/check-out", authenticateToken, authorize(['admin', 'receptionist']), async (req, res) => {
    const { totalRoomCharges, paymentMethod } = req.body;
    
    try {
      const tx = await db.transaction('write');
      try {
        const stayResult = await tx.execute({
          sql: 'SELECT room_id FROM stays WHERE id = ?',
          args: [req.params.id]
        });
        const stay: any = stayResult.rows[0];
        
        await tx.execute({
          sql: "UPDATE stays SET status = 'completed', total_room_charges = ?, check_out_date = CURRENT_TIMESTAMP WHERE id = ?",
          args: [totalRoomCharges, req.params.id]
        });
        
        await tx.execute({
          sql: "UPDATE rooms SET status = 'available' WHERE id = ?",
          args: [stay.room_id]
        });

        await tx.execute({
          sql: 'INSERT INTO payments (stay_id, amount, method) VALUES (?, ?, ?)',
          args: [req.params.id, totalRoomCharges, paymentMethod]
        });
        await tx.commit();
        res.json({ success: true });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // --- Reservations API ---
  app.get("/api/reservations", authenticateToken, async (req, res) => {
    try {
      const reservationsResult = await db.execute(`
        SELECT res.*, g.name as guest_name, r.number as room_number
        FROM reservations res
        JOIN guests g ON res.guest_id = g.id
        JOIN rooms r ON res.room_id = r.id
        ORDER BY res.check_in_date DESC
      `);
      res.json(reservationsResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/reservations", authenticateToken, authorize(['admin', 'receptionist']), async (req, res) => {
    const { guestName, phone, idNumber, roomId, checkInDate, checkOutDate, deposit } = req.body;
    
    try {
      const tx = await db.transaction('write');
      try {
        let guestId;
        const guestResult = await tx.execute({
          sql: 'SELECT id FROM guests WHERE id_number = ?',
          args: [idNumber]
        });
        
        if (guestResult.rows.length > 0) {
          guestId = guestResult.rows[0].id;
        } else {
          const insertGuestResult = await tx.execute({
            sql: 'INSERT INTO guests (name, phone, id_number) VALUES (?, ?, ?)',
            args: [guestName, phone, idNumber]
          });
          guestId = insertGuestResult.lastInsertRowid;
        }

        await tx.execute({
          sql: 'INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, deposit) VALUES (?, ?, ?, ?, ?)',
          args: [guestId, roomId, checkInDate, checkOutDate, deposit || 0]
        });
        
        await tx.execute({
          sql: "UPDATE rooms SET status = 'reserved' WHERE id = ?",
          args: [roomId]
        });
        await tx.commit();
        res.json({ success: true });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/reservations/:id/status", authenticateToken, authorize(['admin', 'receptionist']), async (req, res) => {
    const { status } = req.body;
    try {
      const tx = await db.transaction('write');
      try {
        const reservationResult = await tx.execute({
          sql: 'SELECT room_id FROM reservations WHERE id = ?',
          args: [req.params.id]
        });
        const reservation: any = reservationResult.rows[0];

        await tx.execute({
          sql: 'UPDATE reservations SET status = ? WHERE id = ?',
          args: [status, req.params.id]
        });
        
        if (status === 'cancelled' || status === 'completed') {
          await tx.execute({
            sql: "UPDATE rooms SET status = 'available' WHERE id = ?",
            args: [reservation.room_id]
          });
        } else if (status === 'confirmed') {
          await tx.execute({
            sql: "UPDATE rooms SET status = 'reserved' WHERE id = ?",
            args: [reservation.room_id]
          });
        }
        await tx.commit();
        res.json({ success: true });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // --- Users API (Settings) ---
  app.get("/api/users", authenticateToken, authorize(['admin']), async (req, res) => {
    try {
      const usersResult = await db.execute('SELECT id, username, role, name FROM users');
      res.json(usersResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users", authenticateToken, authorize(['admin']), async (req, res) => {
    const { username, password, role, name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      const result = await db.execute({
        sql: 'INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)',
        args: [username, hashedPassword, role, name]
      });
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ message: "Username already exists" });
    }
  });

  // --- Reports API Extensions ---
  app.get("/api/reports/inventory", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      const inventoryResult = await db.execute(`
        SELECT name, stock_quantity, min_stock_level, category
        FROM inventory_items
      `);
      res.json(inventoryResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/reports/rooms", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      const dataResult = await db.execute(`
        SELECT type, COUNT(*) as count, SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_count
        FROM rooms
        GROUP BY type
      `);
      res.json(dataResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/reports/sales", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      const salesResult = await db.execute(`
        SELECT date(created_at) as date, SUM(total_amount) as total
        FROM orders
        GROUP BY date(created_at)
        ORDER BY date DESC
        LIMIT 30
      `);
      res.json(salesResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/reports/revenue-breakdown", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    const date = req.query.date || 'today';
    const dateCondition = date === 'today' ? "date(created_at) = date('now')" : "date(created_at) = ?";
    const params = date === 'today' ? [] : [date];

    try {
      const restaurantResult = await db.execute({
        sql: `
          SELECT SUM(oi.quantity * oi.unit_price) as total
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          JOIN inventory_items ii ON oi.inventory_item_id = ii.id
          WHERE ${dateCondition} AND ii.category = 'food'
        `,
        args: params as any[]
      });
      const restaurant = restaurantResult.rows[0] as unknown as { total: number };

      const barResult = await db.execute({
        sql: `
          SELECT SUM(oi.quantity * oi.unit_price) as total
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          JOIN inventory_items ii ON oi.inventory_item_id = ii.id
          WHERE ${dateCondition} AND ii.category = 'drink'
        `,
        args: params as any[]
      });
      const bar = barResult.rows[0] as unknown as { total: number };

      const roomsResult = await db.execute({
        sql: `
          SELECT SUM(amount) as total
          FROM payments
          WHERE ${dateCondition} AND stay_id IS NOT NULL AND order_id IS NULL
        `,
        args: params as any[]
      });
      const rooms = roomsResult.rows[0] as unknown as { total: number };

      res.json({
        restaurant: restaurant?.total || 0,
        bar: bar?.total || 0,
        rooms: rooms?.total || 0
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/reports/detailed-sales", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      const salesResult = await db.execute(`
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
      `);
      res.json(salesResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const ordersResult = await db.execute(`
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
      `);
      res.json(ordersResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // --- Kitchen Inventory API ---
  app.get("/api/kitchen/inventory", authenticateToken, async (req, res) => {
    try {
      const itemsResult = await db.execute('SELECT * FROM kitchen_inventory');
      res.json(itemsResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/kitchen/inventory", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    const { name, unit, min_stock_level, initialStock } = req.body;
    try {
      const tx = await db.transaction('write');
      try {
        const result = await tx.execute({
          sql: 'INSERT INTO kitchen_inventory (name, unit, current_stock, min_stock_level) VALUES (?, ?, ?, ?)',
          args: [name, unit, initialStock || 0, min_stock_level || 5]
        });
        if (initialStock > 0) {
          await tx.execute({
            sql: 'INSERT INTO kitchen_movements (item_id, type, quantity, staff_id, reason) VALUES (?, ?, ?, ?, ?)',
            args: [result.lastInsertRowid, 'in', initialStock, (req as any).user.id, 'Initial Stock']
          });
        }
        await tx.commit();
        res.json({ id: result.lastInsertRowid });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/kitchen/movements", authenticateToken, async (req, res) => {
    const { itemId, type, quantity, reason } = req.body;
    const staffId = (req as any).user.id;

    try {
      const tx = await db.transaction('write');
      try {
        await tx.execute({
          sql: 'INSERT INTO kitchen_movements (item_id, type, quantity, staff_id, reason) VALUES (?, ?, ?, ?, ?)',
          args: [itemId, type, quantity, staffId, reason]
        });
        
        const adjustment = type === 'in' ? quantity : -quantity;
        await tx.execute({
          sql: 'UPDATE kitchen_inventory SET current_stock = current_stock + ? WHERE id = ?',
          args: [adjustment, itemId]
        });
        await tx.commit();
        res.json({ success: true });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/kitchen/movements", authenticateToken, async (req, res) => {
    try {
      const movementsResult = await db.execute(`
        SELECT km.*, ki.name as item_name, u.name as staff_name
        FROM kitchen_movements km
        JOIN kitchen_inventory ki ON km.item_id = ki.id
        JOIN users u ON km.staff_id = u.id
        ORDER BY km.created_at DESC
      `);
      res.json(movementsResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/orders/:id/status", authenticateToken, async (req, res) => {
    const { paymentStatus, fulfillmentStatus, paymentMethod } = req.body;
    
    try {
      const tx = await db.transaction('write');
      try {
        if (paymentStatus) {
          await tx.execute({
            sql: 'UPDATE orders SET payment_status = ? WHERE id = ?',
            args: [paymentStatus, req.params.id]
          });
          
          if (paymentStatus === 'paid') {
            const orderResult = await tx.execute({
              sql: 'SELECT total_amount FROM orders WHERE id = ?',
              args: [req.params.id]
            });
            const order: any = orderResult.rows[0];
            await tx.execute({
              sql: 'INSERT INTO payments (order_id, amount, method) VALUES (?, ?, ?)',
              args: [req.params.id, order.total_amount, paymentMethod || 'Cash']
            });
          }
        }
        if (fulfillmentStatus) {
          await tx.execute({
            sql: 'UPDATE orders SET fulfillment_status = ? WHERE id = ?',
            args: [fulfillmentStatus, req.params.id]
          });
        }
        await tx.commit();
        res.json({ success: true });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // --- Finances API ---
  app.get("/api/finances/summary", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const paymentsResult = await db.execute('SELECT method, SUM(amount) as total FROM payments GROUP BY method');
      const expensesResult = await db.execute('SELECT method, SUM(amount) as total FROM expenses GROUP BY method');
      
      const balances = { cash: 0, mpesa: 0, card: 0 };
      paymentsResult.rows.forEach((p: any) => {
        const method = p.method.toLowerCase();
        if (method.includes('cash')) balances.cash += p.total;
        else if (method.includes('mpesa')) balances.mpesa += p.total;
        else balances.card += p.total;
      });
      expensesResult.rows.forEach((e: any) => {
        const method = e.method.toLowerCase();
        if (method.includes('cash')) balances.cash -= e.total;
        else if (method.includes('mpesa')) balances.mpesa -= e.total;
        else balances.card -= e.total;
      });

      const ordersSummaryResult = await db.execute({
        sql: `
          SELECT payment_status, SUM(total_amount) as total, COUNT(*) as count
          FROM orders 
          WHERE date(created_at) = date(?)
          GROUP BY payment_status
        `,
        args: [today]
      });

      const todaySalesResult = await db.execute({
        sql: 'SELECT SUM(amount) as total FROM payments WHERE date(created_at) = date(?)',
        args: [today]
      });
      const todaySales = todaySalesResult.rows[0] as any;

      const todayExpensesResult = await db.execute({
        sql: 'SELECT SUM(amount) as total FROM expenses WHERE date(created_at) = date(?)',
        args: [today]
      });
      const todayExpenses = todayExpensesResult.rows[0] as any;

      const roomsSummaryResult = await db.execute(`
        SELECT status, SUM(total_room_charges) as total 
        FROM stays 
        GROUP BY status
      `);

      const totalExpensesResult = await db.execute('SELECT SUM(amount) as total FROM expenses');
      const totalExpenses = totalExpensesResult.rows[0] as any;

      res.json({
        balances,
        orders: ordersSummaryResult.rows,
        todaySales: todaySales?.total || 0,
        todayExpenses: todayExpenses?.total || 0,
        rooms: roomsSummaryResult.rows,
        totalExpenses: totalExpenses?.total || 0
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/finances/expenses", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      const expensesResult = await db.execute(`
        SELECT e.*, u.name as recorded_by_name 
        FROM expenses e 
        JOIN users u ON e.recorded_by = u.id 
        ORDER BY e.created_at DESC
      `);
      res.json(expensesResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/finances/income", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      const incomeResult = await db.execute(`
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
      `);
      res.json(incomeResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/finances/expenses", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    const { amount, category, description, method } = req.body;
    const userId = (req as any).user.id;
    try {
      const result = await db.execute({
        sql: 'INSERT INTO expenses (amount, category, description, method, recorded_by) VALUES (?, ?, ?, ?, ?)',
        args: [amount, category, description, method, userId]
      });
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // --- Staff Management API ---
  app.get("/api/staff", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      const staffResult = await db.execute("SELECT id, username, role, name, salary, allowances, deductions, status FROM users WHERE status = 'active'");
      const staff = staffResult.rows as any[];
      
      // Enrich with pay items
      const enrichedStaff = [];
      for (const s of staff) {
        const itemsResult = await db.execute({
          sql: `
            SELECT upi.*, pit.name, pit.type 
            FROM user_pay_items upi
            JOIN pay_item_types pit ON upi.item_id = pit.id
            WHERE upi.user_id = ?
          `,
          args: [s.id]
        });
        enrichedStaff.push({ ...s, payItems: itemsResult.rows });
      }
      
      res.json(enrichedStaff);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/staff/pay-item-types", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      const typesResult = await db.execute('SELECT * FROM pay_item_types');
      res.json(typesResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/staff/pay-item-types", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    const { name, type } = req.body;
    try {
      const result = await db.execute({
        sql: 'INSERT INTO pay_item_types (name, type) VALUES (?, ?)',
        args: [name, type]
      });
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/staff/pay-item-types/:id", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      const tx = await db.transaction('write');
      try {
        // Delete associations first
        await tx.execute({
          sql: 'DELETE FROM user_pay_items WHERE item_id = ?',
          args: [req.params.id]
        });
        // Then delete the type
        await tx.execute({
          sql: 'DELETE FROM pay_item_types WHERE id = ?',
          args: [req.params.id]
        });
        await tx.commit();
        res.json({ success: true });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/staff", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    const { username, password, role, name, salary, payItems } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const tx = await db.transaction('write');
      try {
        const result = await tx.execute({
          sql: 'INSERT INTO users (username, password, role, name, salary) VALUES (?, ?, ?, ?, ?)',
          args: [username, hashedPassword, role, name, salary || 0]
        });
        const userId = result.lastInsertRowid;

        if (payItems && Array.isArray(payItems)) {
          for (const item of payItems) {
            await tx.execute({
              sql: 'INSERT INTO user_pay_items (user_id, item_id, amount) VALUES (?, ?, ?)',
              args: [userId, item.itemId, item.amount]
            });
          }
        }
        await tx.commit();
        res.json({ success: true });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      console.error("Error adding staff:", e);
      if (e.message.includes('UNIQUE constraint failed: users.username')) {
        res.status(400).json({ message: "Username already exists. Please choose a different username." });
      } else {
        res.status(400).json({ message: "Invalid data or database error: " + e.message });
      }
    }
  });

  app.patch("/api/staff/:id", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    const { role, name, salary, payItems } = req.body;
    
    try {
      const tx = await db.transaction('write');
      try {
        await tx.execute({
          sql: 'UPDATE users SET role = ?, name = ?, salary = ? WHERE id = ?',
          args: [role, name, salary, req.params.id]
        });

        if (payItems && Array.isArray(payItems)) {
          await tx.execute({
            sql: 'DELETE FROM user_pay_items WHERE user_id = ?',
            args: [req.params.id]
          });
          for (const item of payItems) {
            await tx.execute({
              sql: 'INSERT INTO user_pay_items (user_id, item_id, amount) VALUES (?, ?, ?)',
              args: [req.params.id, item.itemId, item.amount]
            });
          }
        }
        await tx.commit();
        res.json({ success: true });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/staff/:id", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      await db.execute({
        sql: "UPDATE users SET status = 'inactive' WHERE id = ?",
        args: [req.params.id]
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // --- Payroll API ---
  app.get("/api/payroll", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      const payrollResult = await db.execute(`
        SELECT p.*, u.name as staff_name, u.role as staff_role
        FROM payroll p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.period_year DESC, p.period_month DESC
      `);
      res.json(payrollResult.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/payroll/run", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    const { month, year } = req.body;
    
    try {
      const tx = await db.transaction('write');
      try {
        // Check if already run
        const existingResult = await tx.execute({
          sql: 'SELECT id FROM payroll WHERE period_month = ? AND period_year = ? LIMIT 1',
          args: [month, year]
        });
        if (existingResult.rows.length > 0) throw new Error("Payroll already run for this period");

        const staffResult = await tx.execute("SELECT id, salary FROM users WHERE status = 'active'");
        const staff = staffResult.rows as any[];
        
        for (const s of staff) {
          const payItemsResult = await tx.execute({
            sql: `
              SELECT upi.amount, pit.name, pit.type 
              FROM user_pay_items upi
              JOIN pay_item_types pit ON upi.item_id = pit.id
              WHERE upi.user_id = ?
            `,
            args: [s.id]
          });
          const payItems = payItemsResult.rows as any[];

          let allowances = 0;
          let deductions = 0;
          payItems.forEach(item => {
            if (item.type === 'allowance') allowances += item.amount;
            else deductions += item.amount;
          });

          const netPay = s.salary + allowances - deductions;
          await tx.execute({
            sql: 'INSERT INTO payroll (user_id, period_month, period_year, basic_salary, allowances, deductions, net_pay, breakdown) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            args: [s.id, month, year, s.salary, allowances, deductions, netPay, JSON.stringify(payItems)]
          });
        }
        await tx.commit();
        res.json({ success: true });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/payroll/record/:id", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      await db.execute({
        sql: 'DELETE FROM payroll WHERE id = ?',
        args: [req.params.id]
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/payroll/:month/:year", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    const { month, year } = req.params;
    try {
      await db.execute({
        sql: 'DELETE FROM payroll WHERE period_month = ? AND period_year = ?',
        args: [month, year]
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/payroll/:id/approve", authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
    try {
      const tx = await db.transaction('write');
      try {
        const recordResult = await tx.execute({
          sql: 'SELECT * FROM payroll WHERE id = ?',
          args: [req.params.id]
        });
        const record = recordResult.rows[0] as any;
        if (!record || record.status !== 'pending') throw new Error("Invalid payroll record");

        await tx.execute({
          sql: "UPDATE payroll SET status = 'approved' WHERE id = ?",
          args: [req.params.id]
        });
        
        // Add to expenses
        const userId = (req as any).user.id;
        await tx.execute({
          sql: 'INSERT INTO expenses (amount, category, description, method, recorded_by) VALUES (?, ?, ?, ?, ?)',
          args: [record.net_pay, 'Payroll', `Payroll for ${record.period_month}/${record.period_year}`, 'Bank Transfer', userId]
        });
        await tx.commit();
        res.json({ success: true });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    (async () => {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })();
  } else if (!process.env.VERCEL) {
    // Serve static files from dist in production (if not on Vercel)
    const distPath = path.resolve(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.error("Production build not found in dist directory. Please run 'npm run build'.");
    }
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;
