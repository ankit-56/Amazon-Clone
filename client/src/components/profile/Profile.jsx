import React, { useEffect, useState } from 'react';
import NameBanner from './NameBanner';
import UserDetails from './UserDetails';
import { useNavigate } from 'react-router-dom';
import './profile.css';
import api from '../../api';
import Loader from '../loader/Loader';
import AddressManager from './AddressManager';

const Profile = () => {

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
    const fname = first + "'s Account";

    return (
      <div className='profile'>
        <NameBanner name={fname} />
        <UserDetails user={userData} />
        
        <div className="profile-section">
          <h3>Your Addresses</h3>
          <p className="section-desc">Manage your delivery locations for faster checkout.</p>
          <div className="address-grid">
            <AddressManager />
          </div>
        </div>
      </div>
    );
  }

  return <Loader />;
}

export default Profile;