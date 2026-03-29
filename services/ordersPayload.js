function formatDateDMY(d) {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
}

async function loadOrdersLegacyShape(query, userId) {
  const or = await query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  const out = [];
  for (const o of or.rows) {
    const items = await query(
      `SELECT product_id, product_name, quantity, unit_price_rupees, image_url FROM order_items WHERE order_id = $1`,
      [o.id]
    );
    const products = items.rows.map((it) => ({
      id: String(it.product_id),
      name: it.product_name,
      qty: it.quantity,
      img: it.image_url
    }));

    const totalPaise = Number(o.total_paise) || 0;
    let status = o.status || 'Placed';
    if (status === 'paid') status = 'Delivered';
    const paymentMethod = o.payment_method || '—';
    const paymentStatus = o.payment_status || 'Pending';

    out.push({
      orderInfo: {
        id: o.id,
        date: formatDateDMY(o.created_at),
        amount: totalPaise,
        status,
        paymentMethod,
        paymentStatus,
        expectedDeliveryAt: o.expected_delivery_at,
        products,
        isPaid: paymentStatus === 'Success' || status === 'paid',
        razorpay: { orderId: o.order_number },
        orderNumber: o.order_number,
        shipping: {
          fullName: o.shipping_full_name,
          phone: o.shipping_phone,
          line1: o.shipping_line1,
          line2: o.shipping_line2,
          city: o.shipping_city,
          state: o.shipping_state,
          postal: o.shipping_postal,
          country: o.shipping_country
        }
      }
    });
  }
  return out;
}

module.exports = { loadOrdersLegacyShape, formatDateDMY };
