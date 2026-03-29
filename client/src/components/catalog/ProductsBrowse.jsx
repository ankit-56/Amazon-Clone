import React, { useEffect, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import api from '../../api';
import Navbar from '../header/Navbar';
import Footer from '../footer/Footer';
import Loader from '../loader/Loader';
import './catalog.css';
import assetUrl from '../../utils/assetUrl';
import { toast } from 'react-toastify';

const ProductsBrowse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const categoryId = searchParams.get('categoryId') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const initialSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState({});
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 24 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products', {
            params: {
              search: search.trim() || undefined,
              categoryId: categoryId || undefined,
              page,
              limit: 24
            }
          })
        ]);
        if (!cancelled) {
          setCategories(catRes.data);
          const raw = prodRes.data;
          const list = Array.isArray(raw) ? raw : raw.products || [];
          setProducts(list);
          if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            setMeta({
              total: raw.total ?? list.length,
              totalPages: raw.totalPages ?? 1,
              limit: raw.limit ?? 24
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const t = setTimeout(load, search ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, categoryId, page]);

  async function addToCart(e, productId) {
    e.preventDefault();
    e.stopPropagation();
    setAdding((a) => ({ ...a, [productId]: true }));
    try {
      await api.post(`/addtocart/${productId}`, { quantity: 1 });
      toast.success('Added to Cart!');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Could not add to cart');
    } finally {
      setAdding((a) => ({ ...a, [productId]: false }));
    }
  }

  function goToPage(p) {
    const next = new URLSearchParams(searchParams);
    if (p <= 1) next.delete('page');
    else next.set('page', String(p));
    setSearchParams(next);
  }

  return (
    <>
      <Navbar />
      <div className="catalog-page">
        <div className="catalog-toolbar">
          <h1>All products</h1>
          <div className="catalog-filters">
            <input
              type="search"
              className="catalog-search"
              placeholder="Search Amazon Clone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="catalog-category"
              value={categoryId}
              onChange={(e) => {
                const v = e.target.value;
                const next = new URLSearchParams(searchParams);
                if (v) next.set('categoryId', v);
                else next.delete('categoryId');
                next.delete('page');
                setSearchParams(next);
              }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!loading && meta.total > 0 ? (
          <p className="catalog-meta">
            {meta.total} result{meta.total === 1 ? '' : 's'}
            {meta.totalPages > 1 ? ` · Page ${page} of ${meta.totalPages}` : ''}
          </p>
        ) : null}

        {loading ? (
          <Loader />
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <div key={p.id} className="product-card-amz">
                <NavLink to={`/product/${p.id}`} className="product-card-link">
                  <div className="product-card-img-wrap">
                    <img src={assetUrl(p.url)} alt="" />
                  </div>
                  <h2 className="product-card-title">{p.name}</h2>
                  <div className="product-card-price-row">
                    <span className="product-card-price">{p.price}</span>
                    {p.discount ? <span className="product-card-disc">{p.discount}</span> : null}
                  </div>
                  <p className="product-card-stock">
                    {p.stockQuantity > 0 ? <span className="in-stock">In Stock</span> : <span className="out-stock">Out of Stock</span>}
                  </p>
                </NavLink>
                <button
                  type="button"
                  className="product-card-add-btn"
                  disabled={p.stockQuantity < 1 || adding[p.id]}
                  onClick={(e) => addToCart(e, p.id)}
                >
                  {adding[p.id] ? 'Adding…' : 'Add to Cart'}
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && meta.totalPages > 1 ? (
          <div className="catalog-pagination">
            <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              Previous
            </button>
            <span>
              Page {page} / {meta.totalPages}
            </span>
            <button type="button" disabled={page >= meta.totalPages} onClick={() => goToPage(page + 1)}>
              Next
            </button>
          </div>
        ) : null}

        {!loading && products.length === 0 && <p className="catalog-empty">No products match your filters.</p>}
      </div>
      <Footer />
    </>
  );
};

export default ProductsBrowse;
