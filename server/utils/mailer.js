const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAILS = [process.env.ADMIN_NOTIFY_EMAIL_1, process.env.ADMIN_NOTIFY_EMAIL_2].filter(Boolean);

function money(n) {
  return "$" + Number(n).toFixed(2);
}

function itemsTable(items) {
  const rows = items.map(i =>
    `<tr><td style="padding:6px 0;">${i.product_name} x${i.qty}</td><td style="padding:6px 0;text-align:right;">${money(i.price * i.qty)}</td></tr>`
  ).join("");
  return `<table style="width:100%;border-collapse:collapse;">${rows}</table>`;
}

async function sendMail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — email skipped");
    return;
  }
  const recipients = Array.isArray(to) ? to : [to];
  for (const recipient of recipients) {
    try {
      await resend.emails.send({
        from: "Mandala Orders <onboarding@resend.dev>",
        to: recipient,
        subject,
        html
      });
    } catch (err) {
      console.error(`Email send failed for ${recipient}:`, err.message || err);
    }
  }
}

async function sendNewOrderEmails(order) {
  const customerHtml = `
    <h2>Thank you for your order, ${order.first_name}!</h2>
    <p>We've received your order <strong>${order.order_number}</strong> and our artisans in Nepal are preparing it.</p>
    ${itemsTable(order.items)}
    <p><strong>Total: ${money(order.total)}</strong></p>
    <p>We'll email you again once it ships.</p>
  `;
  await sendMail(order.email, `Order ${order.order_number} received — Mandala`, customerHtml);

  if (ADMIN_EMAILS.length) {
    const adminHtml = `
      <h2>New order received: ${order.order_number}</h2>
      <p>${order.first_name} ${order.last_name} — ${order.email}</p>
      ${itemsTable(order.items)}
      <p><strong>Total: ${money(order.total)}</strong></p>
    `;
    await sendMail(ADMIN_EMAILS, `New order: ${order.order_number}`, adminHtml);
  }
}

const STATUS_TEXT = {
  pending: "is pending review",
  processing: "is now being processed",
  shipped: "has shipped and is on its way",
  completed: "has been completed",
  cancelled: "has been cancelled"
};

async function sendStatusUpdateEmails(order, status) {
  const message = STATUS_TEXT[status] || `is now marked as ${status}`;
  const customerHtml = `<h2>Order ${order.order_number} update</h2><p>Hi ${order.first_name}, your order ${message}.</p>`;
  await sendMail(order.email, `Order ${order.order_number} — ${status}`, customerHtml);

  if (ADMIN_EMAILS.length) {
    const adminHtml = `<h2>Order ${order.order_number} status changed</h2><p>Status is now: ${status}</p>`;
    await sendMail(ADMIN_EMAILS, `Order ${order.order_number} status: ${status}`, adminHtml);
  }
}

module.exports = { sendNewOrderEmails, sendStatusUpdateEmails };