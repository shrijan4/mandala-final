/* =========================================================
   MANDALA Admin — Products page
   ========================================================= */

requireAuth();

let currentImages = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  document.getElementById("add-product-btn").addEventListener("click", () => openModal());
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("product-modal").addEventListener("click", (e) => {
    if (e.target.id === "product-modal") closeModal();
  });

  document.getElementById("upload-drop").addEventListener("click", () => {
    document.getElementById("image-input").click();
  });
  document.getElementById("image-input").addEventListener("change", handleImageUpload);

  document.getElementById("product-form").addEventListener("submit", handleSave);
});

async function loadProducts() {
  const tbody = document.getElementById("product-rows");
  try {
    const res = await adminFetch("/api/products/admin/all");
    const products = await res.json();
    if (!products.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No products yet — click "Add Product" to create your first one.</td></tr>`;
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img class="thumb-sm" src="${(p.images && p.images[0]) || ""}" alt=""></td>
        <td>${p.name}</td>
        <td>${p.categoryLabel}</td>
        <td>${formatPrice(p.price)}</td>
        <td><span class="badge" style="${p.active ? '' : 'opacity:0.6;'}">${p.active ? "Visible" : "Hidden"}</span></td>
        <td class="actions">
          <button class="btn btn-sm" data-edit="${p.id}">Edit</button>
          <button class="btn btn-sm btn-danger" data-delete="${p.id}" data-name="${p.name}">Delete</button>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll("[data-edit]").forEach(btn =>
      btn.addEventListener("click", () => openModal(products.find(p => p.id === btn.getAttribute("data-edit")))));
    tbody.querySelectorAll("[data-delete]").forEach(btn =>
      btn.addEventListener("click", () => deleteProduct(btn.getAttribute("data-delete"), btn.getAttribute("data-name"))));
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Couldn't load products.</td></tr>`;
  }
}

function openModal(product = null) {
  editingId = product ? product.id : null;
  document.getElementById("modal-title").textContent = product ? "Edit Product" : "Add Product";
  const form = document.getElementById("product-form");
  form.reset();
  currentImages = product && product.images ? [...product.images] : [];
  renderImageManager();

  if (product) {
    form.id.value = product.id;
    form.name.value = product.name;
    form.category.value = product.category;
    form.badge.value = product.badge || "";
    form.price.value = product.price;
    form.compareAt.value = product.compareAt || "";
    form.description.value = product.description || "";
    form.origin.value = product.origin || "";
    form.material.value = product.material || "";
    form.dimensions.value = product.dimensions || "";
    form.active.checked = !!product.active;
  } else {
    form.id.value = "";
    form.active.checked = true;
  }

  document.getElementById("product-modal").classList.add("show");
}

function closeModal() {
  document.getElementById("product-modal").classList.remove("show");
}

function renderImageManager() {
  const root = document.getElementById("image-manager");
  root.innerHTML = currentImages.map((url, i) => `
    <div class="img-item">
      <img src="${url}" alt="">
      <button type="button" data-remove-img="${i}" title="Remove">&times;</button>
    </div>
  `).join("");
  root.querySelectorAll("[data-remove-img]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentImages.splice(Number(btn.getAttribute("data-remove-img")), 1);
      renderImageManager();
    });
  });
}

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const uploadLabel = document.getElementById("upload-drop");
  const originalText = uploadLabel.firstChild.textContent;
  uploadLabel.firstChild.textContent = "Uploading...";
  try {
    const fd = new FormData();
    fd.append("image", file);
    const res = await adminFetch("/api/products/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    currentImages.push(data.url);
    renderImageManager();
  } catch (err) {
    showToast(err.message || "Image upload failed", true);
  } finally {
    uploadLabel.firstChild.textContent = originalText;
    e.target.value = "";
  }
}

async function handleSave(e) {
  e.preventDefault();
  const form = e.target;
  const saveBtn = document.getElementById("save-btn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  const payload = {
    id: form.id.value || undefined,
    name: form.name.value,
    category: form.category.value,
    badge: form.badge.value || null,
    price: parseFloat(form.price.value),
    compareAt: form.compareAt.value ? parseFloat(form.compareAt.value) : null,
    description: form.description.value,
    origin: form.origin.value,
    material: form.material.value,
    dimensions: form.dimensions.value,
    images: currentImages,
    active: form.active.checked
  };

  try {
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";
    const res = await adminFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save product");
    showToast(editingId ? "Product updated" : "Product created");
    closeModal();
    loadProducts();
  } catch (err) {
    showToast(err.message || "Failed to save product", true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Product";
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    const res = await adminFetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete product");
    showToast("Product deleted");
    loadProducts();
  } catch (err) {
    showToast(err.message || "Failed to delete product", true);
  }
}
