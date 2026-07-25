/* =========================================================
   MANDALA — API client
   Talks to the Express/SQLite backend under /api
   ========================================================= */

const API_BASE = "/api";

async function apiListProducts({ category, sort } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (sort) params.set("sort", sort);
  const res = await fetch(`${API_BASE}/products?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

async function apiGetProduct(id) {
  const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  return res.json();
}

async function apiCreateOrder(payload) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to place order");
  return data;
}

function formatPrice(n) {
  return "$" + Number(n).toFixed(2).replace(/\.00$/, "");
}
