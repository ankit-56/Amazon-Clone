import React from 'react';
import './profile.css';

const OrderTop = (props) => {
  const order = props.order;
  const date = order.date;

  const monthArr = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const parts = typeof date === 'string' ? date.split('/') : [];
  const day = parts[0] || '';
  const monthNum = parseInt(parts[1], 10);
  const year = parts[2] || '';
  const month = !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12 ? monthArr[monthNum - 1] : '';
  const fullDate = day + ' ' + month + ' ' + year;

  const paise = Number(order.amount) || 0;
  const rupees = Math.floor(paise / 100);
  const formatted = rupees.toLocaleString('en-IN');

  const orderIdDisplay = order.orderNumber || order.razorpay?.orderId || '—';

  return (
    <div>
      <div className="order-top row">
        <div className="col-6 col-md-3 col-lg-2">
          <h6 className="order-top-details">Order Placed</h6>
          <p>{fullDate}</p>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <h6 className="order-top-details">Total</h6>
          <p>₹{formatted}.00</p>
        </div>
        <div className="col-12 col-md-6 col-lg-4">
          <h6 className="order-top-details">Payment</h6>
          <p>{order.paymentMethod || '—'} {order.paymentStatus ? `(${order.paymentStatus})` : ''}</p>
        </div>
        <div className="col-12 col-md-12 col-lg-4">
          <h6 className="order-id">{orderIdDisplay}</h6>
        </div>
      </div>
    </div>
  );
};

export default OrderTop;
