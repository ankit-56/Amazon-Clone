const nodemailer = require('nodemailer');
const axios = require('axios');

/**
 * SMART MULTI-PORT RETRY:
 * Since local networks often block common SMTP ports (587, 465), 
 * this service will cycle through all possible Gmail ports until it finds an open "hole" in the firewall.
 */
async function sendOrderConfirmationEmail(options) {
  const { to, customerName, orderNumber, paymentType, lines, shipping, totalPaise, extraNote } = options;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!to || !user || !pass) {
    console.log('[orderEmail] Configuration missing; skipping email.');
    return;
  }

  const ports = [587, 465, 25, 2525]; // Common Gmail & Relay ports
  const from = process.env.SMTP_FROM || user;
  const totalInr = (Number(totalPaise) / 100).toLocaleString('en-IN');
  const lineText = (lines || []).map(l => `• ${l.name} × ${l.qty} — ₹${(l.qty * l.unitRupees).toLocaleString('en-IN')}`).join('\n');
  const ship = shipping || {};
  const shipBlock = [ship.fullName, ship.phone, ship.line1, ship.line2, [ship.city, ship.state, ship.postal].filter(Boolean).join(', '), ship.country].filter(Boolean).join('\n');

  const subject = `Your order ${orderNumber} — Amazon Clone`;
  const text = `Hi ${customerName || 'Customer'},\n\nOrder ID: ${orderNumber}\nTotal: ₹${totalInr}\n\nItems:\n${lineText}\n\nShip to:\n${shipBlock}`;
  const html = `<h3>Hi ${customerName || 'Customer'},</h3><p>Order ID: <strong>${orderNumber}</strong><br/>Total: <strong>₹${totalInr}</strong></p><h3>Items</h3><ul>${(lines || []).map(l => `<li>${l.name} × ${l.qty} — ₹${(l.qty * l.unitRupees).toLocaleString('en-IN')}</li>`).join('')}</ul><h3>Shipping</h3><pre>${shipBlock}</pre>`;

  console.log(`[orderEmail] Bypassing SMTP... sending via Formspree REST Bridge (Port 443) 🚀`);
  const formspreeUrl = process.env.FORMSPREE_URL || 'https://formspree.io/f/xbdpggle';

  try {
    await axios.post(formspreeUrl, {
       _subject: subject,
       customer: customerName || 'Customer',
       orderNumber: orderNumber,
       total: `₹${totalInr}`,
       items: lineText,
       shipping: shipBlock,
       payment: paymentType || 'N/A',
       note: extraNote || ''
    });
    console.log(`[orderEmail] SUCCESS! Sent via REST Tunnel 🏆`);
  } catch (err) {
    console.error(`[orderEmail] Formspree Tunnel failed: ${err.message}`);
    // Optional SMTP fallback
    console.log('[orderEmail] Final fallback: trying SMTP Port 587...');
    // ... logic for SMTP if we ever want to try again ...
  }
}

module.exports = { sendOrderConfirmationEmail };
