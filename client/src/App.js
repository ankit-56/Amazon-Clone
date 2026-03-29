import React, { useEffect } from 'react';
import Navbar from './components/header/Navbar';
import Home from './components/home/Home';
import Footer from './components/footer/Footer';
import { Routes, Route, useLocation } from 'react-router-dom';
import SignUp from './components/login-register/SignUp';
import SignIn from './components/login-register/SignIn';
import ForgotPassword from './components/login-register/ForgotPassword';
import ResetPassword from './components/login-register/ResetPassword';
import Product from './components/product/Product';
import Cart from './components/cart/Cart';
import Profile from './components/profile/Profile';
import Orders from './components/profile/Orders';
import Wishlist from './components/profile/Wishlist';
import ProductsBrowse from './components/catalog/ProductsBrowse';
import Checkout from './components/checkout/Checkout';
import OrderConfirmation from './components/checkout/OrderConfirmation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Component to handle auto-scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <div className="App">
      <ScrollToTop />
      <ToastContainer position="top-center" autoClose={3000} />
      <Routes>
        <Route path="/" element={<> <Navbar /> <Home /> <Footer /> </>} />
        <Route path="/products" element={<ProductsBrowse />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/product/:id" element={<> <Navbar /> <Product /> <Footer /> </>} />
        <Route path="/cart" element={<> <Navbar /> <Cart /> <Footer /> </>} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/profile" element={<> <Navbar /> <Profile /> <Footer /> </>} />
        <Route path="/orders" element={<> <Navbar /> <Orders /> <Footer /> </>} />
        <Route path="/wishlist" element={<> <Navbar /> <Wishlist /> <Footer /> </>} />
      </Routes>
    </div>
  );
}

export default App;
