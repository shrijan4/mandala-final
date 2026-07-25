/* =========================================================
   MANDALA Admin — Orders page
   ========================================================= */

requireAuth();

const STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"];

document.addEventListener("DOMContentLoaded", () => {
  loadOrders();
  document.getElementById("order-modal-close").addEventListener("click", closeOrderModal);
  document.getElementById("order-modal").addEventListener("click", (e) => {
    if (e.target.id === "order-modal") closeOrderModal();
  });
});

async function loadOrders() {
  const tbody = document.getElementById("order-rows");
  const statCards = document.getElementById("stat-cards");
  try {
    const res = await adminFetch("/api/orders");
    const orders = await res.json();

    const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
    const pendingCount = orders.filter(o => o.status === "pending").length;
    statCards.innerHTML = `
      <div class="stat-card"><div class="num">${orders.length}</div><div class="label">Total Orders</div></div>
      <div class="stat-card"><div class="num">${formatPrice(totalRevenue)}</div><div class="label">Revenue</div></div>
      <div class="stat-card"><div class="num">${pendingCount}</div><div class="label">Pending</div></div>
      <div class="stat-card"><div class="num">${orders.filter(o => o.status === "completed").length}</div><div class="label">Completed</div></div>
    `;

    if (!orders.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No orders yet — they'll show up here as soon as a customer checks out.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td>${o.order_number}</td>
        <td>${o.first_name} ${o.last_name}<br><span style="color:var(--color-ink-soft);font-size:0.78rem;">${o.email}</span></td>
        <td>${new Date(o.created_at).toLocaleDateString()}</td>
        <td>${formatPrice(o.total)}</td>
        <td><span class="badge status-${o.status}">${o.status}</span></td>
        <td class="actions"><button class="btn btn-sm" data-view="${o.id}">View</button></td>
      </tr>
    `).join("");

    tbody.querySelectorAll("[data-view]").forEach(btn =>
      btn.addEventListener("click", () => openOrderModal(orders.find(o => o.id == btn.getAttribute("data-view")))));
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Couldn't load orders.</td></tr>`;
  }
}

function openOrderModal(order) {
  document.getElementById("order-modal-title").textContent = `Order ${order.order_number}`;
  document.getElementById("order-modal-body").innerHTML = `
    <div class="field">
      <label>Status</label>
      <select id="status-select">
        ${STATUSES.map(s => `<option value="${s}" ${s === order.status ? "selected" : ""}>${s[0].toUpperCase() + s.slice(1)}</option>`).join("")}
      </select>
    </div>
    <div class="order-addr">
      <strong>${order.first_name} ${order.last_name}</strong><br>
      ${order.email}${order.phone ? " · " + order.phone : ""}<br>
      ${order.address}<br>
      ${order.city}, ${order.postal_code}<br>
      ${order.country}
    </div>
    <div class="order-detail-items">
      ${order.items.map(i => `
        <div class="row"><span>${i.qty} × ${i.product_name}</span><span>${formatPrice(i.price * i.qty)}</span></div>
      `).join("")}
      <div class="row"><span>Subtotal</span><span>${formatPrice(order.subtotal)}</span></div>
      <div class="row"><span>Shipping</span><span>${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span></div>
      <div class="row" style="font-weight:600;border-top:1px solid var(--color-line);padding-top:0.6rem;"><span>Total</span><span>${formatPrice(order.total)}</span></div>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn" id="order-modal-cancel-btn">Close</button>
      <button type="button" class="btn btn-primary" id="save-status-btn">Update Status</button>
    </div>
  `;
  document.getElementById("order-modal-cancel-btn").addEventListener("click", closeOrderModal);
  document.getElementById("save-status-btn").addEventListener("click", async () => {
    const status = document.getElementById("status-select").value;
    const btn = document.getElementById("save-status-btn");
    btn.disabled = true;
    btn.textContent = "Saving...";
    try {
      const res = await adminFetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      showToast("Order status updated");
      closeOrderModal();
      loadOrders();
    } catch (err) {
      showToast(err.message, true);
      btn.disabled = false;
      btn.textContent = "Update Status";
    }
  });
  document.getElementById("order-modal").classList.add("show");
}

function closeOrderModal() {
  document.getElementById("order-modal").classList.remove("show");
}
