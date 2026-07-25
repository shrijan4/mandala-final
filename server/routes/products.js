const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safe);
  }
});
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) return cb(new Error("Only JPG, PNG, WEBP, or GIF images are allowed"));
    cb(null, true);
  }
});

function rowToProduct(row) {
  if (!row) return null;
  return { ...row, images: JSON.parse(row.images || "[]"), compareAt: row.compare_at, categoryLabel: row.category_label };
}

// ---------------- Public ----------------

// GET /api/products?category=singing-bowls&sort=price-asc
router.get("/", (req, res) => {
  const { category, sort } = req.query;
  let query = "SELECT * FROM products WHERE active = 1";
  const params = [];
  if (category && category !== "all") {
    query += " AND category = ?";
    params.push(category);
  }
  if (sort === "price-asc") query += " ORDER BY price ASC";
  else if (sort === "price-desc") query += " ORDER BY price DESC";
  else query += " ORDER BY created_at DESC";

  const rows = db.prepare(query).all(...params);
  res.json(rows.map(rowToProduct));
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM products WHERE id = ? AND active = 1").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Product not found" });
  res.json(rowToProduct(row));
});

// ---------------- Admin ----------------

// GET /api/products/admin/all — includes inactive
router.get("/admin/all", requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
  res.json(rows.map(rowToProduct));
});

// POST /api/products/upload — image upload, returns a URL to use in the product's images array
router.post("/upload", requireAdmin, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}

// POST /api/products — create
router.post("/", requireAdmin, (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.category || b.price === undefined) {
    return res.status(400).json({ error: "name, category, and price are required" });
  }
  let id = b.id && String(b.id).trim() ? slugify(b.id) : slugify(b.name);
  if (!id) id = "product-" + Date.now();
  const exists = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
  if (exists) id = `${id}-${Date.now().toString().slice(-5)}`;

  const categoryLabels = {
    "singing-bowls": "Singing Bowls & Spiritual Items",
    "wood-metal": "Wood & Metal Decor"
  };

  db.prepare(`
    INSERT INTO products (id, name, category, category_label, price, compare_at, description, origin, material, dimensions, shipping, badge, images, active)
    VALUES (@id, @name, @category, @category_label, @price, @compare_at, @description, @origin, @material, @dimensions, @shipping, @badge, @images, @active)
  `).run({
    id,
    name: b.name,
    category: b.category,
    category_label: b.categoryLabel || categoryLabels[b.category] || b.category,
    price: Number(b.price),
    compare_at: b.compareAt ? Number(b.compareAt) : null,
    description: b.description || "",
    origin: b.origin || "",
    material: b.material || "",
    dimensions: b.dimensions || "",
    shipping: b.shipping || "Ships direct from Nepal, 8-14 days",
    badge: b.badge || null,
    images: JSON.stringify(Array.isArray(b.images) ? b.images : []),
    active: b.active === false ? 0 : 1
  });

  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  res.status(201).json(rowToProduct(row));
});

// PUT /api/products/:id — update
router.put("/:id", requireAdmin, (req, res) => {
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });
  const b = req.body || {};

  const categoryLabels = {
    "singing-bowls": "Singing Bowls & Spiritual Items",
    "wood-metal": "Wood & Metal Decor"
  };

  db.prepare(`
    UPDATE products SET
      name = @name, category = @category, category_label = @category_label, price = @price,
      compare_at = @compare_at, description = @description, origin = @origin, material = @material,
      dimensions = @dimensions, shipping = @shipping, badge = @badge, images = @images,
      active = @active, updated_at = datetime('now')
    WHERE id = @id
  `).run({
    id: req.params.id,
    name: b.name ?? existing.name,
    category: b.category ?? existing.category,
    category_label: b.categoryLabel || categoryLabels[b.category] || existing.category_label,
    price: b.price !== undefined ? Number(b.price) : existing.price,
    compare_at: b.compareAt !== undefined ? (b.compareAt === null || b.compareAt === "" ? null : Number(b.compareAt)) : existing.compare_at,
    description: b.description ?? existing.description,
    origin: b.origin ?? existing.origin,
    material: b.material ?? existing.material,
    dimensions: b.dimensions ?? existing.dimensions,
    shipping: b.shipping ?? existing.shipping,
    badge: b.badge !== undefined ? (b.badge || null) : existing.badge,
    images: b.images !== undefined ? JSON.stringify(b.images) : existing.images,
    active: b.active !== undefined ? (b.active ? 1 : 0) : existing.active
  });

  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  res.json(rowToProduct(row));
});

// DELETE /api/products/:id
router.delete("/:id", requireAdmin, (req, res) => {
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
