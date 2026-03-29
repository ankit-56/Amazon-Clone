const { formatProductRow } = require('./productMapper');
const { loadOrdersLegacyShape } = require('./ordersPayload');

async function loadUserWithCart(query, userId) {
  const u = await query(
    `SELECT id, name, email, phone FROM users WHERE id = $1`,
    [userId]
  );
  if (!u.rows[0]) return null;

  const rows = await query(
    `SELECT ci.quantity, p.*,
       (SELECT json_agg(json_build_object('image_url', pi.image_url, 'sort_order', pi.sort_order) ORDER BY pi.sort_order)
        FROM product_images pi WHERE pi.product_id = p.id) AS images_json
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1`,
    [userId]
  );

  const cart = rows.rows.map((row) => {
    const qty = row.quantity;
    const images = row.images_json || [];
    const { quantity, images_json, ...prod } = row;
    const cartItem = formatProductRow(prod, images);
    return {
      id: cartItem.id,
      qty,
      cartItem
    };
  });

  const orders = await loadOrdersLegacyShape(query, userId);

  return {
    _id: String(u.rows[0].id),
    id: u.rows[0].id,
    name: u.rows[0].name,
    email: u.rows[0].email,
    number: u.rows[0].phone,
    cart,
    orders
  };
}

module.exports = { loadUserWithCart };
