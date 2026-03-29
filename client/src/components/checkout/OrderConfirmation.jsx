import React, { useEffect, useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import api from '../../api';
import Navbar from '../header/Navbar';
import Footer from '../footer/Footer';
import './checkout.css';
import assetUrl from '../../utils/assetUrl';
import Loader from '../loader/Loader';

const OrderConfirmation = () => {
  const location = useLocation();
  const state = location.state || {};
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.orderNumber) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .get(`/orders/confirmation/${encodeURIComponent(state.orderNumber)}`)
      .then((res) => {
        if (!cancelled) setDetail(res.data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [state.orderNumber]);

  const orderNumber = state.orderNumber || detail?.order?.order_number;
  const order = detail?.order;
  const items = detail?.items || [];

  if (!orderNumber && !loading) {
    return (
      <>
        <Navbar />
        <div className="checkout-wrap order-confirm">
          <div className="confirm-card">
            <h1>Order confirmation</h1>
            <p className="confirm-msg">Open this page from checkout after placing an order, or view past orders in your account.</p>
            <div className="confirm-actions">
              <NavLink to="/orders" className="confirm-link">
                Your orders
              </NavLink>
              <NavLink to="/products" className="confirm-link secondary">
                Continue shopping
              </NavLink>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Loader />
        <Footer />
      </>
    );
  }

  const totalRupees = order?.total_paise != null ? Math.floor(Number(order.total_paise) / 100) : null;

  return (
    <>
      <Navbar />
      <div className="checkout-wrap order-confirm">
        <div className="confirm-card confirm-card-wide">
          <h1>Thank you — order placed</h1>
          <p className="confirm-id">
            Order ID: <strong>{orderNumber || '—'}</strong>
          </p>
          {order ? (
            <div className="confirm-detail-block">
              <p>
                <strong>Status:</strong> {order.status}
              </p>
              {order.payment_method ? (
                <p>
                  <strong>Payment:</strong> {order.payment_method} ({order.payment_status || '—'})
                </p>
              ) : null}
              {totalRupees != null ? (
                <p>
                  <strong>Total:</strong> ₹{totalRupees.toLocaleString('en-IN')}.00
                </p>
              ) : null}
              {order.expected_delivery_at ? (
                <p>
                  <strong>Estimated delivery:</strong> {new Date(order.expected_delivery_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              ) : null}
              <div className="confirm-ship">
                <strong>Deliver to</strong>
                <p>
                  {order.shipping_full_name}, {order.shipping_phone}
                  <br />
                  {order.shipping_line1}
                  {order.shipping_line2 ? `, ${order.shipping_line2}` : ''}
                  <br />
                  {order.shipping_city}, {order.shipping_state} {order.shipping_postal}, {order.shipping_country}
                </p>
              </div>
            </div>
          ) : null}

          {items.length > 0 ? (
            <ul className="confirm-items">
              {items.map((line) => (
                <li key={line.id || line.product_id}>
                  {line.product_name} × {line.quantity} — ₹{(line.unit_price_rupees * line.quantity).toLocaleString('en-IN')}
                  {line.image_url ? <img src={assetUrl(line.image_url)} alt="" className="confirm-line-thumb" /> : null}
                </li>
              ))}
            </ul>
          ) : null}

          <p className="confirm-msg">A confirmation email is sent when SMTP is configured on the server.</p>
          <div className="confirm-actions">
            <NavLink to="/orders" className="confirm-link">
              Track your order
            </NavLink>
            <NavLink to="/products" className="confirm-link secondary">
              Continue shopping
            </NavLink>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OrderConfirmation;
