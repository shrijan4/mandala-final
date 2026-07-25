/* =========================================================
   MANDALA Admin — shared auth helpers
   ========================================================= */

const TOKEN_KEY = "mandala_admin_token";
const EMAIL_KEY = "mandala_admin_email";

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function getAdminEmail() { return localStorage.getItem(EMAIL_KEY) || ""; }

function setSession(token, email) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

function logout() {
  clearSession();
  window.location.href = "index.html";
}

// Redirect to login if not authenticated. Call at the top of protected pages.
function requireAuth() {
  if (!getToken()) {
    window.location.href = "index.html";
  }
}

// Wrapper around fetch that attaches the admin Bearer token and
// bounces to login on a 401.
async function adminFetch(url, options = {}) {
  const headers = Object.assign({}, options.headers || {}, {
    Authorization: `Bearer ${getToken()}`
  });
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearSession();
    window.location.href = "index.html";
    throw new Error("Session expired");
  }
  return res;
}

function showToast(message, isError = false) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(window._adminToastTimer);
  window._adminToastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function formatPrice(n) {
  return "$" + Number(n).toFixed(2).replace(/\.00$/, "");
}

document.addEventListener("DOMContentLoaded", () => {
  const emailEl = document.querySelector("[data-admin-email]");
  if (emailEl) emailEl.textContent = getAdminEmail();
  const logoutBtn = document.querySelector("[data-logout]");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
});
