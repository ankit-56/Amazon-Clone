import React, { useState, useEffect } from 'react';
import api from '../../api';
import { NavLink } from 'react-router-dom';
import './cart.css';

const CartProduct = (props) => {
  const product = props.cartItem;
  const path = '/product/' + product.id;
  const [qty, setQty] = useState(props.qty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setQty(props.qty);
  }, [props.qty]);

  async function deleteFromCart() {
    try {
      const res = await api.delete('/delete/' + product.id);
      if (res.data.message === 'Item deleted successfully') {
        props.onChanged();
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function changeQty(delta) {
    const next = qty + delta;
    if (next < 1) return;
    if (product.stockQuantity != null && next > product.stockQuantity) {
      alert('Maximum available stock: ' + product.stockQuantity);
      return;
    }
    setBusy(true);
    try {
      await api.patch('/cart/items/' + product.id, { quantity: next });
      setQty(next);
      props.onChanged();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not update quantity');
    } finally {
      setBusy(false);
    }
  }

  let amount = (product.accValue * qty).toString();
  let lastThree = amount.substring(amount.length - 3);
  let otherNumbers = amount.substring(0, amount.length - 3);
  if (otherNumbers !== '') lastThree = ',' + lastThree;
  amount = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const inStock = product.stockQuantity == null || product.stockQuantity > 0;

  return (
    <div className="cart-product">
      <div className="product-left">
        <div className="product-img-wrapper">
          <img className="product-img" src={product.url} alt="" />
        </div>
        <div className="product-details">
          <NavLink to={path}>
            <h5 className="name">{product.name}</h5>
          </NavLink>
          <p className="in-stock">{inStock ? 'In stock' : 'Out of stock'}</p>
          <p className="shipping">Eligible for FREE Shipping</p>
          <img src="/images/amazon-fulfilled.png" alt="" />
          <div className="product-options" id="product-options">
            <section className="quantity quantity-controls">
              <span>Qty:</span>
              <button type="button" className="qty-btn" disabled={busy || qty <= 1} onClick={() => changeQty(-1)}>
                −
              </button>
              <span className="qty-val">{qty}</span>
              <button
                type="button"
                className="qty-btn"
                disabled={busy || (product.stockQuantity != null && qty >= product.stockQuantity)}
                onClick={() => changeQty(1)}
              >
                +
              </button>
            </section>
            <div className="delete" onClick={deleteFromCart}>
              Delete
            </div>
          </div>
        </div>
      </div>
      <div className="product-right">
        <h5>₹{amount}.00</h5>
      </div>
    </div>
  );
};

export default CartProduct;
