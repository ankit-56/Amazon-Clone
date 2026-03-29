import React, { useEffect, useState } from 'react';
import './Navbar.css';
import api from '../../api';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PersonIcon from '@mui/icons-material/Person';
import Badge from '@mui/material/Badge';
import SubNavbar from './SubNavbar';
import { NavLink, useNavigate } from 'react-router-dom';
import $ from 'jquery';
import logo from './logo.png';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

const Navbar = () => {
  const navigate = useNavigate();

  useEffect(function() {
    function onScroll() {
      if ($(window).scrollTop() > 60) {
        $('nav').css({ 'position': 'fixed' });
        $('.sub-nav').css({ 'margin-top': '60px' });
      }
      if ($(window).scrollTop() === 0) {
        $('nav').css({ 'position': 'relative' });
        $('.sub-nav').css({ 'margin-top': '0px' });
      }
    }
    $(window).on('scroll', onScroll);
    return function() {
      $(window).off('scroll', onScroll);
    };
  }, []);

  const [loginMsg, setLoginMsg] = useState(localStorage.getItem('user_fname') || "");
  const [cartValue, setCartValue] = useState(localStorage.getItem('cart_val') || '0');
  const [profilePhoto, setProfilePhoto] = useState(<NavLink to="/login" className='profile'><PersonIcon id="profile-icon" /></NavLink>);
  const [loggedIn, setLoggedIn] = useState(false);

    useEffect(function() {
      let cancelled = false;
      let pollTimer = null;

      async function fetchUser() {
        if (cancelled) return;
        try {
          const res = await api.get('/getAuthUser');

          if (res?.data && !cancelled) {
            const name = res.data.name;
            const space = name.indexOf(' ');
            const fname = space === -1 ? name : name.substring(0, space);
            const fletter = name.substring(0, 1);

            const cartArr = res.data.cart || [];
            let totalQty = 0;
            for (let i = 0; i < cartArr.length; i++) {
              totalQty += cartArr[i].qty;
            }

            setLoginMsg(fname);
            setCartValue(totalQty);

            // SAVE FOR PRE-RENDER (Stops Flickering!)
            localStorage.setItem('user_fname', fname);
            localStorage.setItem('cart_val', totalQty);

            setProfilePhoto(<div onClick={toggleDrawer(true)} className="profile"><div id='profile-letter'>{fletter}</div></div>);
            setLoggedIn(true);
          }
        } catch (error) {
          if (error.response?.data?.message === "No token provided") {
            setLoggedIn(false);
            setLoginMsg("Sign in");
            setCartValue("0");
            setProfilePhoto(<NavLink to="/login" className='profile'><PersonIcon id="profile-icon" /></NavLink>);
          } else {
            console.log(error);
          }
        }
      }

      fetchUser();

      const handleUpdate = () => fetchUser();
      window.addEventListener('cartUpdated', handleUpdate);

      return function() {
        cancelled = true;
        window.removeEventListener('cartUpdated', handleUpdate);
        if (pollTimer) clearTimeout(pollTimer);
      };
    }, []);

    // Logout
      async function logout() {
        try {
          await api.get('/logout');
          navigate("/");
          setLoginMsg("Sign in");
          setCartValue("0");
          setProfilePhoto(<NavLink to="/login" className='profile'><PersonIcon id="profile-icon" /></NavLink>);
          setLoggedIn(false);
        } catch (error) {
          console.log(error);
        }
      }

    // Profile button
    const anchor = "right";
    
    const [state, setState] = React.useState({
      right: false
    });
  
    const toggleDrawer = (open) => (event) => {
      if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
        return;
      }
      setState({ ...state, [anchor]: open });
    };
  
    const list = (anchor) => (
      <Box
        sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250 }}
        role="presentation"
        onClick={toggleDrawer(false)}
        onKeyDown={toggleDrawer(false)}
      >
        <div className='profile-options'>
          <h5>Hello, {loginMsg}</h5>
          <a href='/profile'>
            <div className='profile-option'>
              <PersonOutlineOutlinedIcon className='profile-icon' /> Your Account
            </div>
          </a>
          <a href='/orders'>
            <div className='profile-option'>
              <ShoppingCartOutlinedIcon className='profile-icon' /> Your Orders
            </div>
          </a>
          <a href='/wishlist'>
            <div className='profile-option'>
              <PersonOutlineOutlinedIcon className='profile-icon' /> Your Wishlist
            </div>
          </a>
          <div>
            <div className='profile-option' onClick={ logout }>
              <LogoutOutlinedIcon className='profile-icon' /> Sign Out
            </div>
          </div>
        </div>
      </Box>
    );

    const [searchText, setSearchText] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [listHidden, setListHidden] = useState(true);

    async function searchChange(e) {
      const val = e.target.value;
      setSearchText(val);
      if (val.trim()) {
        try {
          const res = await api.get(`/products/suggestions?q=${encodeURIComponent(val)}`);
          setSuggestions(res.data);
          setListHidden(false);
        } catch (err) {
          console.error(err);
        }
      } else {
        setSuggestions([]);
        setListHidden(true);
      }
    }
    
  return (
    <header>
      <nav>

        <div className="logo">
          <NavLink to="/">
            <img src={logo} alt="logo" />
          </NavLink>
        </div>

        <div className="search">
          <input 
            type="text" 
            name="search" 
            className="searchbar" 
            onChange={searchChange} 
            value={searchText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setListHidden(true);
                navigate(`/products?search=${encodeURIComponent(searchText)}`);
              }
            }}
          />
          <button 
            className="search-icon" 
            onClick={() => {
              setListHidden(true);
              navigate(`/products?search=${encodeURIComponent(searchText)}`);
            }}
          >
            <SearchIcon />
          </button>
        </div>

        <List className='search-list' hidden={ listHidden }>
          {
            suggestions.map((product, index) => {
              return (
                <ListItem key={index} className='list-item'>
                  <NavLink to={`/product/${product.id}`} onClick={() => setListHidden(true)}>
                    {product.name}
                  </NavLink>
                </ListItem>
              )
            })
          }
        </List>

        <div className="buttons">
          <a href={ loggedIn ? "/profile" : "/login" } className="login">
            <div className="button-text">
              Hello, {loginMsg}
            </div>
          </a>
          <NavLink to="/cart" className="cart">
            <Badge badgeContent={cartValue} color="primary">
              <ShoppingCartOutlinedIcon id="cart-icon" />
            </Badge>
            
            <div className="button-text">
              Cart
            </div>
          </NavLink>

          {profilePhoto}

        </div>
        
      </nav>

      <SubNavbar />

      <React.Fragment key={anchor}>
        <Drawer
          anchor={anchor}
          open={state[anchor]}
          onClose={toggleDrawer(false)}
        >
          {list(anchor)}
        </Drawer>
      </React.Fragment>
      
    </header>
  )
}

export default Navbar;