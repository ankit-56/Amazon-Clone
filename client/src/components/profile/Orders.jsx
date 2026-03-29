import React, { useEffect, useState } from 'react';
import NameBanner from './NameBanner';
import { useNavigate } from 'react-router-dom';
import './profile.css';
import api from '../../api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import OrderTop from './OrderTop';
import OrderedProduct from './OrderedProduct';
import Loader from '../loader/Loader';

const Orders = () => {

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState();

  const navigate = useNavigate();

  useEffect(function() {
    async function fetchUser() {
      try {
        const res = await api.get('/getAuthUser')
  
        if (res) {
          setUserData(res.data);
          setIsLoading(false);
        }
      } catch (error) {
        if (error.response?.data?.message === "No token provided") {
          navigate('/login');
        } else {
          console.log(error);
        }
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  if (userData) {
    const name = userData.name;
    const space = name.indexOf(' ');
    const first = space === -1 ? name : name.substring(0, space);
    const fname = first + "'s Orders";

    const orders = [...(userData.orders || [])].reverse();

    return (
      <div className='profile'>
        <NameBanner name={fname} />
        <div className='order-list'>
          {orders.map((order) => {
            const orderItem = order.orderInfo;
            const orderedProducts = orderItem.products;

            const OrderTracker = ({ status }) => {
              const stages = ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
              let idx = stages.indexOf(status);
              if (idx < 0) idx = 0;
              const progress = (idx / (stages.length - 1)) * 100;

              return (
                <div className="order-tracker-wrap">
                  <div className="status-label">Status: <strong>{status}</strong></div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="stages-labels">
                    {stages.map((s, i) => (
                      <div key={s} className={`stage ${i <= idx ? 'done' : ''}`}>{s}</div>
                    ))}
                  </div>
                </div>
              );
            };

            const simulateTracking = async (orderId) => {
              try {
                await api.patch(`/orders/${orderId}/simulate-tracking`);
                window.location.reload();
              } catch (e) {
                console.error(e);
              }
            };

            return (
              <div className="order" key={orderItem.id || orderItem.orderNumber}>
                <OrderTop order={orderItem} />
                <OrderTracker status={orderItem.status || 'Placed'} />
                <div className="order-bottom">
                  {(Array.isArray(orderedProducts) ? orderedProducts : orderedProducts ? [orderedProducts] : []).map((product, index) => (
                    <OrderedProduct key={index} product={product} />
                  ))}
                </div>
                {orderItem.status !== 'Delivered' && orderItem.id ? (
                  <div className="order-actions">
                    <button type="button" className="simulate-btn" onClick={() => simulateTracking(orderItem.id)}>
                      Simulate next delivery step
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return <Loader />;
}

export default Orders;