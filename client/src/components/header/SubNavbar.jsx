import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import subnav from './subnav.jpg';

const SubNavbar = () => {
  return (
    <div className="sub-nav">
      <div className="left">
        <NavLink to="/products" className="left-item all">
          <MenuOutlinedIcon id="hamburger" /> All
        </NavLink>
        <NavLink to="/products" className="left-item">
          Best Sellers
        </NavLink>
        <NavLink to="/products?categoryId=1" className="left-item">
          Electronics
        </NavLink>
        <NavLink to="/products" className="left-item">
          Customer Services
        </NavLink>
        <NavLink to="/" className="left-item">
          Today&apos;s Deals
        </NavLink>
        <NavLink to="/products?categoryId=2" className="left-item">
          Fashion
        </NavLink>
        <NavLink to="/products?categoryId=1" className="left-item">
          Mobiles
        </NavLink>
        <NavLink to="/products?categoryId=3" className="left-item">
          Home & Kitchen
        </NavLink>
        <NavLink to="/products" className="left-item">
          New Releases
        </NavLink>
      </div>

      <div className="right">
        <NavLink to="/products" className="download">
          <img src={subnav} alt="Download App" />
        </NavLink>
      </div>
    </div>
  );
};

export default SubNavbar;
