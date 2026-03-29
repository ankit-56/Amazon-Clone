import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api';
import './profile.css';
import Loader from '../loader/Loader';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get('/wishlist');
        setWishlist(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  async function removeWish(productId) {
    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlist(wishlist.filter((it) => it.id !== productId));
    } catch (e) {
      console.error(e);
      alert('Failed to remove from wishlist');
    }
  }

  return (
      <div className="orders-container">
        <div className="orders-header">
          <h1>Your Wishlist</h1>
        </div>

        {loading ? (
          <Loader />
        ) : wishlist.length === 0 ? (
          <div className="orders-empty">
            <p>Your wishlist is empty.</p>
            <NavLink to="/products" className="shop-btn">
              Browse Products
            </NavLink>
          </div>
        ) : (
          <div className="orders-list">
            {wishlist.map((item) => (
              <div key={item.id} className="order-item-wrap" style={{ display: 'flex', padding: '15px' }}>
                <div className="order-item-img" style={{ width: '150px', marginRight: '20px' }}>
                  <img src={item.img} alt={item.name} style={{ width: '100%' }} />
                </div>
                <div className="order-item-content">
                  <h4 style={{ fontSize: '18px', fontWeight: '500' }}>{item.name}</h4>
                  <p className="price" style={{ color: '#B12704', fontSize: '16px', fontWeight: '600' }}>
                    {item.price_rupees ? `₹${item.price_rupees}` : `₹${item.price}`}
                  </p>
                  <div style={{ marginTop: '10px' }}>
                    <NavLink to={`/product/${item.id}`} className="shop-btn" style={{ marginRight: '10px' }}>
                      View Product
                    </NavLink>
                    <button
                      onClick={() => removeWish(item.id)}
                      className="remove-btn"
                      style={{
                        padding: '10px 15px',
                        border: '1px solid #ddd',
                        background: '#fff',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default Wishlist;
