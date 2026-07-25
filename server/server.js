require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// API
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Uploaded product images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Storefront (public site)
app.use("/", express.static(path.join(__dirname, "..", "public")));

// Admin dashboard
app.use("/admin", express.static(path.join(__dirname, "..", "admin")));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`Mandala server running at http://localhost:${PORT}`);
  console.log(`Storefront:      http://localhost:${PORT}/`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});
