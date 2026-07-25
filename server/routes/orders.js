const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { sendNewOrderEmails, sendStatusUpdateEmails } = require("../utils/mailer");

const router = express.Router();

const SHIPPING_FLAT = 12;
const FREE_SHIPPING_THRESHOLD = 120;
const VALID_STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"];

function generateOrderNumber() {
  return "MND-" + Math.floor(100000 + Math.random() * 900000);
}

// POST /api/orders — create an order from the cart (server computes prices, never trusts client totals)
router.post("/", (req, res) => {
  const b = req.body || {};
  const required = ["firstName", "lastName", "email", "address", "city", "postalCode", "country"];
  for (const field of required) {
    if (!b[field] || !String(b[field]).trim()) {
      return res.status(400).json({ error: `${field} is required` });
    }
  }
  if (!Array.isArray(b.items) || b.items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const lineItems = [];
  let subtotal = 0;
  for (const item of b.items) {
    const product = db.prepare("SELECT * FROM products WHERE id = ? AND active = 1").get(item.id);
    if (!product) return res.status(400).json({ error: `Product ${item.id} is no longer available` });
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    subtotal += product.price * qty;
    lineItems.push({ product_id: product.id, product_name: product.name, price: product.price, qty });
  }
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;
  const orderNumber = generateOrderNumber();

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, first_name, last_name, email, phone, address, city, postal_code, country, subtotal, shipping, total, status)
    VALUES (@order_number, @first_name, @last_name, @email, @phone, @address, @city, @postal_code, @country, @subtotal, @shipping, @total, 'pending')
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, price, qty)
    VALUES (@order_id, @product_id, @product_name, @price, @qty)
  `);

  const tx = db.transaction(() => {
    const info = insertOrder.run({
      order_number: orderNumber,
      first_name: b.firstName, last_name: b.lastName, email: b.email, phone: b.phone || null,
      address: b.address, city: b.city, postal_code: b.postalCode, country: b.country,
      subtotal, shipping, total
    });
    for (const li of lineItems) insertItem.run({ order_id: info.lastInsertRowid, ...li });
    return info.lastInsertRowid;
  });

  const orderId = tx();
  res.status(201).json({ orderNumber, orderId, subtotal, shipping, total, items: lineItems });

  sendNewOrderEmails({
    order_number: orderNumber,
    first_name: b.firstName,
    last_name: b.lastName,
    email: b.email,
    total,
    items: lineItems
  }).catch(err => console.error("New order email error:", err));
});

// ---------------- Admin ----------------

// GET /api/orders — list all orders (admin)
router.get("/", requireAdmin, (req, res) => {
  const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  const itemStmt = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
  const withItems = orders.map(o => ({ ...o, items: itemStmt.all(o.id) }));
  res.json(withItems);
});

// GET /api/orders/:id — order detail (admin)
router.get("/:id", requireAdmin, (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
  res.json({ ...order, items });
});

// PATCH /api/orders/:id/status — update status (admin)
router.patch("/:id/status", requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
  }
  const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Order not found" });
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ ok: true });

  sendStatusUpdateEmails(existing, status).catch(err => console.error("Status email error:", err));
});

module.exports = router;
