function parsePoints(specs) {
  if (Array.isArray(specs)) return specs;
  if (typeof specs === 'string') {
    try {
      return JSON.parse(specs);
    } catch (e) {
      return [];
    }
  }
  return [];
}

function ensureSlash(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return '/' + url;
}

function formatProductRow(row, images) {
  const sorted = (images || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const main = ensureSlash(sorted[0]?.image_url || '');
  const secondary = ensureSlash(sorted[1]?.image_url || main);
  const points = parsePoints(row.specifications);

  const pr = Number(row.price_rupees);
  const mrp = row.mrp_rupees != null ? Number(row.mrp_rupees) : null;

  return {
    id: String(row.id),
    url: main,
    resUrl: secondary,
    images: sorted.map((i) => ensureSlash(i.image_url)),
    price: `₹${pr.toLocaleString('en-IN')}.00`,
    value: row.value_display || String(pr),
    accValue: pr,
    discount: row.discount_label || '',
    mrp: mrp != null ? `₹${mrp.toLocaleString('en-IN')}.00` : null,
    name: row.name,
    description: row.description || '',
    points,
    stockQuantity: row.stock_quantity,
    categoryId: row.category_id
  };
}

async function fetchProductById(query, id) {
  const pr = await query(
    `SELECT p.*, c.slug AS category_slug, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1`,
    [id]
  );
  if (!pr.rows[0]) return null;
  const imgs = await query(
    `SELECT image_url, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order`,
    [id]
  );
  const revs = await query(
    `SELECT r.*, u.name AS user_name 
     FROM reviews r 
     JOIN users u ON u.id = r.user_id 
     WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
    [id]
  );
  const product = formatProductRow(pr.rows[0], imgs.rows);
  product.reviews = revs.rows;
  return product;
}

module.exports = { formatProductRow, fetchProductById };
