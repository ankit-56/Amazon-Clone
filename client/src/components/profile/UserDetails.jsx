import React from 'react';
import './profile.css';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';

const UserDetails = (props) => {
  return (
    <div className='user-details'>
      <div className='user-detail'>
        <PersonIcon className='icon' />
        <div className="label-wrap">
          <p>Name</p>
          <h5>{props.user.name}</h5>
        </div>
      </div>
      <div className='user-detail'>
        <EmailIcon className='icon' />
        <div className="label-wrap">
          <p>Email</p>
          <h5>{props.user.email}</h5>
        </div>
      </div>
      <div className='user-detail'>
        <PhoneIphoneIcon className='icon' />
        <div className="label-wrap">
          <p>Phone</p>
          <h5>{props.user.number || <span style={{ color: '#d61c45', fontSize: '14px' }}>Not added yet</span>}</h5>
        </div>
      </div>
    </div>
  )
}

export default UserDetails;