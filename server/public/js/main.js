/* =========================================================
   MANDALA — Storefront behavior (talks to the /api backend)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });

  const navToggle = document.querySelector(".nav-toggle");
  const mainNav = document.querySelector(".main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => mainNav.classList.toggle("open"));
  }

  document.querySelectorAll(".newsletter-form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const input = form.querySelector("input[type='email']");
      if (input) { input.value = ""; input.placeholder = "Thanks — you're on the list!"; }
    });
  });

  const contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", e => {
      e.preventDefault();
      const btn = contactForm.querySelector("button[type='submit']");
      if (btn) { btn.textContent = "Message Sent"; btn.disabled = true; }
    });
  }

  if (document.querySelector("[data-featured-grid]")) renderFeaturedProducts();
  if (document.querySelector("[data-shop-grid]")) initShopPage();
  if (document.querySelector("[data-product-detail]")) renderProductDetail();
  if (document.querySelector("[data-cart-page]")) renderCartPage();
  if (document.querySelector("[data-checkout-page]")) initCheckoutPage();
});

function productCardHTML(p) {
  const img = (p.images && p.images[0]) || "https://images.pexels.com/photos/3543912/pexels-photo-3543912.jpeg?auto=compress&cs=tinysrgb&w=800";
  const badge = p.badge ? `<span class="tag">${p.badge}</span>` : "";
  return `
    <div class="product-card" data-id="${p.id}">
      <a href="product.html?id=${p.id}">
        <div class="thumb">
          ${badge}
          <img src="${img}" alt="${p.name}" loading="lazy">
          <button class="quick-add" data-add="${p.id}" onclick="event.preventDefault()">Add to Cart</button>
        </div>
      </a>
      <a href="product.html?id=${p.id}">
        <div class="p-cat">${p.categoryLabel}</div>
        <div class="p-name">${p.name}</div>
        <div class="p-price">${formatPrice(p.price)}</div>
      </a>
    </div>
  `;
}

function bindQuickAdd(root = document) {
  root.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      addToCart(btn.getAttribute("data-add"), 1);
      showToast("Added to cart");
    });
  });
}

function showToast(message) {
  let toast = document.querySelector(".add-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "add-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ---------------- Homepage ---------------- */
async function renderFeaturedProducts() {
  const grid = document.querySelector("[data-featured-grid]");
  try {
    const all = await apiListProducts({});
    const featured = all.filter(p => p.badge).slice(0, 4);
    const list = featured.length ? featured : all.slice(0, 4);
    grid.innerHTML = list.map(productCardHTML).join("");
    bindQuickAdd(grid);
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--color-ink-soft);">Couldn't load products right now.</p>`;
  }
}

/* ---------------- Shop page ---------------- */
async function initShopPage() {
  const grid = document.querySelector("[data-shop-grid]");
  const params = new URLSearchParams(window.location.search);
  let currentCategory = params.get("category") || "all";
  let currentSort = "default";

  async function render() {
    grid.innerHTML = `<p style="color:var(--color-ink-soft);">Loading...</p>`;
    try {
      const items = await apiListProducts({ category: currentCategory, sort: currentSort });
      grid.innerHTML = items.map(productCardHTML).join("");
      const resultCount = document.querySelector("[data-result-count]");
      if (resultCount) resultCount.textContent = `${items.length} product${items.length === 1 ? "" : "s"}`;
      bindQuickAdd(grid);
    } catch (e) {
      grid.innerHTML = `<p style="color:var(--color-ink-soft);">Couldn't load products right now.</p>`;
    }
  }

  document.querySelectorAll("[data-filter]").forEach(opt => {
    if (opt.getAttribute("data-filter") === currentCategory) opt.classList.add("active");
    opt.addEventListener("click", e => {
      e.preventDefault();
      currentCategory = opt.getAttribute("data-filter");
      document.querySelectorAll("[data-filter]").forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      render();
    });
  });

  const sortSelect = document.querySelector("[data-sort]");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      currentSort = sortSelect.value;
      render();
    });
  }

  render();
}

/* ---------------- Product detail page ---------------- */
async function renderProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const root = document.querySelector("[data-product-detail]");
  const product = await apiGetProduct(id);

  if (!product) {
    root.innerHTML = `<p style="grid-column:1/-1;color:var(--color-ink-soft);">Product not found. <a href="shop.html">Back to shop</a>.</p>`;
    return;
  }

  document.title = `${product.name} — Mandala`;
  const images = product.images && product.images.length ? product.images : ["https://images.pexels.com/photos/3543912/pexels-photo-3543912.jpeg?auto=compress&cs=tinysrgb&w=1200"];

  root.innerHTML = `
    <div class="pd-gallery">
      <div class="pd-gallery-main"><img src="${images[0]}" alt="${product.name}" id="pd-main-img"></div>
      <div class="pd-thumbs">
        ${images.map((img, i) => `<button class="${i === 0 ? "active" : ""}" data-img="${img}"><img src="${img}" alt=""></button>`).join("")}
      </div>
    </div>
    <div class="pd-info">
      <div class="p-cat">${product.categoryLabel}</div>
      <h1>${product.name}</h1>
      <div class="pd-price">${formatPrice(product.price)}${product.compareAt ? `<span class="origin" style="text-decoration:line-through;">${formatPrice(product.compareAt)}</span>` : ""}</div>
      <p class="pd-desc">${product.description}</p>
      <div class="qty-row">
        <div class="qty-stepper">
          <button type="button" data-qty-down>−</button>
          <span data-qty-val>1</span>
          <button type="button" data-qty-up>+</button>
        </div>
        <span style="font-size:0.85rem;color:var(--color-ink-soft);">In stock, ships from Nepal</span>
      </div>
      <div class="pd-actions">
        <button class="btn btn-primary" style="flex:1;" data-add-detail="${product.id}">Add to Cart</button>
        <a href="cart.html" class="btn btn-ghost">View Cart</a>
      </div>
      <div class="pd-meta-list">
        <div><span>Origin</span><span>${product.origin || "Nepal"}</span></div>
        <div><span>Material</span><span>${product.material || "—"}</span></div>
        <div><span>Dimensions</span><span>${product.dimensions || "—"}</span></div>
        <div><span>Shipping</span><span>${product.shipping || "Ships direct from Nepal, 8-14 days"}</span></div>
      </div>
    </div>
  `;

  let qty = 1;
  const qtyVal = root.querySelector("[data-qty-val]");
  root.querySelector("[data-qty-up]").addEventListener("click", () => { qty++; qtyVal.textContent = qty; });
  root.querySelector("[data-qty-down]").addEventListener("click", () => { if (qty > 1) qty--; qtyVal.textContent = qty; });
  root.querySelector("[data-add-detail]").addEventListener("click", () => {
    addToCart(product.id, qty);
    showToast(`Added ${qty} to cart`);
  });
  root.querySelectorAll("[data-img]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("pd-main-img").src = btn.getAttribute("data-img");
      root.querySelectorAll("[data-img]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  const relatedRoot = document.querySelector("[data-related-grid]");
  if (relatedRoot) {
    const sameCategory = await apiListProducts({ category: product.category });
    const related = sameCategory.filter(p => p.id !== product.id).slice(0, 4);
    relatedRoot.innerHTML = related.map(productCardHTML).join("");
    bindQuickAdd(relatedRoot);
  }
}

/* ---------------- Shared: resolve cart ids -> product data ---------------- */
async function resolveCartItems() {
  const cart = getCart();
  if (!cart.length) return [];
  const all = await apiListProducts({});
  const byId = Object.fromEntries(all.map(p => [p.id, p]));
  return cart
    .map(item => (byId[item.id] ? { ...item, product: byId[item.id] } : null))
    .filter(Boolean);
}

function computeTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const shipping = subtotal === 0 ? 0 : (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT);
  return { subtotal, shipping, total: subtotal + shipping };
}

/* ---------------- Cart page ---------------- */
async function renderCartPage() {
  const root = document.querySelector("[data-cart-page]");
  const items = await resolveCartItems();

  if (!items.length) {
    root.innerHTML = `
      <div class="empty-state">
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything from Nepal yet.</p>
        <a href="shop.html" class="btn btn-primary" style="margin-top:1.5rem;">Continue Shopping</a>
      </div>`;
    return;
  }

  const { subtotal, shipping, total } = computeTotals(items);

  root.innerHTML = `
    <div class="cart-layout">
      <div class="cart-lines">
        ${items.map(i => `
          <div class="cart-line" data-line="${i.id}">
            <img src="${i.product.images[0]}" alt="${i.product.name}">
            <div>
              <div class="name">${i.product.name}</div>
              <div class="cat">${i.product.categoryLabel}</div>
              <button class="remove" data-remove="${i.id}">Remove</button>
            </div>
            <div class="qty-stepper">
              <button type="button" data-line-down="${i.id}">−</button>
              <span>${i.qty}</span>
              <button type="button" data-line-up="${i.id}">+</button>
            </div>
            <div class="line-price">${formatPrice(i.product.price * i.qty)}</div>
          </div>
        `).join("")}
      </div>
      <div class="summary-card">
        <h3 style="margin-bottom:1.2rem;">Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
        <a href="checkout.html" class="btn btn-primary btn-full" style="margin-top:1.2rem;">Proceed to Checkout</a>
        <a href="shop.html" class="btn btn-ghost btn-full" style="margin-top:0.6rem;">Continue Shopping</a>
        ${shipping > 0 ? `<p style="font-size:0.78rem;color:var(--color-ink-soft);margin-top:1rem;">Add ${formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping.</p>` : ""}
      </div>
    </div>
  `;

  root.querySelectorAll("[data-remove]").forEach(btn =>
    btn.addEventListener("click", () => { removeFromCart(btn.getAttribute("data-remove")); renderCartPage(); }));
  root.querySelectorAll("[data-line-up]").forEach(btn =>
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-line-up");
      const item = getCart().find(i => i.id === id);
      updateCartQty(id, (item ? item.qty : 0) + 1);
      renderCartPage();
    }));
  root.querySelectorAll("[data-line-down]").forEach(btn =>
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-line-down");
      const item = getCart().find(i => i.id === id);
      updateCartQty(id, (item ? item.qty : 1) - 1);
      renderCartPage();
    }));
}

/* ---------------- Checkout page ---------------- */
async function initCheckoutPage() {
  const items = await resolveCartItems();
  const summaryRoot = document.querySelector("[data-checkout-summary]");
  const form = document.querySelector("#checkout-form");
  const pageRoot = document.querySelector("[data-checkout-page]");

  if (!items.length) {
    pageRoot.innerHTML = `
      <div class="empty-state">
        <h2>Your cart is empty</h2>
        <p>Add something beautiful before checking out.</p>
        <a href="shop.html" class="btn btn-primary" style="margin-top:1.5rem;">Go to Shop</a>
      </div>`;
    return;
  }

  const { subtotal, shipping, total } = computeTotals(items);

  if (summaryRoot) {
    summaryRoot.innerHTML = `
      ${items.map(i => `
        <div class="mini-cart-item">
          <img src="${i.product.images[0]}" alt="${i.product.name}">
          <div>
            <div class="name">${i.product.name}</div>
            <div class="qty">Qty ${i.qty}</div>
          </div>
          <div class="price">${formatPrice(i.product.price * i.qty)}</div>
        </div>
      `).join("")}
      <div class="summary-row" style="margin-top:1.2rem;"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
    `;
  }

  document.querySelectorAll(".pay-method").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll(".pay-method").forEach(e => e.classList.remove("active"));
      el.classList.add("active");
    });
  });

  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const submitBtn = form.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.textContent = "Placing Order...";

      const fd = new FormData(form);
      const payload = {
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        address: fd.get("address"),
        city: fd.get("city"),
        postalCode: fd.get("postalCode"),
        country: fd.get("country"),
        items: items.map(i => ({ id: i.id, qty: i.qty }))
      };

      try {
        const order = await apiCreateOrder(payload);
        pageRoot.innerHTML = `
          <div class="order-success">
            <div class="mark-big">✓</div>
            <h2>Thank you — your order is confirmed</h2>
            <p style="color:var(--color-ink-soft);max-width:460px;margin:0.8rem auto 1.6rem;">
              Order <strong>${order.orderNumber}</strong> is being prepared by our artisans and partners in Nepal.
              You'll receive a shipping confirmation with tracking once it leaves Kathmandu.
            </p>
            <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
          </div>
        `;
        clearCart();
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Place Order";
        showToast(err.message || "Couldn't place order — please try again");
      }
    });
  }
}
