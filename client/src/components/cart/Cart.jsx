import React, { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Loader from '../loader/Loader';
import api from '../../api';
import Alert from '@mui/material/Alert';
import './cart.css';
import CartProduct from './CartProduct';
import SubTotal from './SubTotal';

const Cart = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [cartArr, setCartArr] = useState([]);
  const [userData, setUserData] = useState();

  const loadCart = useCallback(() => {
    setIsLoading(true);
    api
      .get('/getAuthUser')
      .then((res) => {
        setUserData(res.data);
        setCartArr(res.data.cart || []);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  let orderAmount = 0;
  for (let i = 0; i < cartArr.length; i++) {
    orderAmount += cartArr[i].qty * cartArr[i].cartItem.accValue;
  }

  if (isLoading) {
    return <Loader />;
  }

  if (cartArr.length === 0) {
    return (
      <Alert
        variant="outlined"
        severity="warning"
        style={{ width: '80%', margin: '30px auto', fontSize: '16px', display: 'flex', justifyContent: 'center' }}
      >
        Cart is empty
      </Alert>
    );
  }

  let totalQty = 0;
  for (let i = 0; i < cartArr.length; i++) {
    totalQty += cartArr[i].qty;
  }

  let amount = orderAmount.toString();
  let lastThree = amount.substring(amount.length - 3);
  let otherNumbers = amount.substring(0, amount.length - 3);
  if (otherNumbers !== '') lastThree = ',' + lastThree;
  amount = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return (
    <div className="cart-section">
      <div className="left">
        <h3>Shopping Cart</h3>
        <p className="price-heading">Price</p>
        {cartArr.map((cart, index) => (
          <CartProduct
            key={cart.id || index}
            cartItem={cart.cartItem}
            qty={cart.qty}
            onChanged={loadCart}
          />
        ))}
        <SubTotal totalQty={totalQty} subTotal={amount} />
      </div>
      <div className="right">
        <SubTotal totalQty={totalQty} subTotal={amount} />
        <NavLink to="/checkout" className="cart-checkout-link">
          Proceed to Buy
        </NavLink>
        <p style={{fontSize: 12, marginTop: 10, color: '#565959'}}>
          Secure and encrypted transactions. 
        </p>
      </div>
    </div>
  );
};

export default Cart;
