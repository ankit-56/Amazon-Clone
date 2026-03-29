import React, { useState, useEffect } from 'react';
import api from '../../api';
import './profile.css';
import HomeIcon from '@mui/icons-material/Home';

const AddressManager = () => {
    const [addresses, setAddresses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '', phone: '', line1: '', city: '', state: '', postal: '', country: 'India'
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    async function fetchAddresses() {
        try {
            const res = await api.get('/addresses');
            setAddresses(res.data);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            await api.post('/addresses', { ...formData, isDefault: false });
            setShowForm(false);
            fetchAddresses();
        } catch (err) {
            alert('Error adding address');
        }
    }

    return (
        <div className="address-manager">
            <div className="address-cards">
                <div className="add-address-card" onClick={() => setShowForm(true)}>
                    <div className="plus-icon">+</div>
                    <p>Add Address</p>
                </div>
                {addresses.map(addr => (
                    <div key={addr.id} className="address-card">
                        <div className="card-top">
                            <HomeIcon className="icon" />
                            <strong>{addr.full_name}</strong>
                        </div>
                        <p>{addr.line1}</p>
                        <p>{addr.city}, {addr.state} - {addr.postal}</p>
                        <p>Phone: {addr.phone}</p>
                        {addr.is_default && <span className="default-badge">Default</span>}
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="address-modal">
                        <h4>Enter a new address</h4>
                        <form onSubmit={handleSubmit}>
                            <input placeholder="Full Name" required onChange={e => setFormData({...formData, fullName: e.target.value})} />
                            <input placeholder="Phone" required onChange={e => setFormData({...formData, phone: e.target.value})} />
                            <input placeholder="Address Line 1" required onChange={e => setFormData({...formData, line1: e.target.value})} />
                            <input placeholder="City" required onChange={e => setFormData({...formData, city: e.target.value})} />
                            <input placeholder="State" required onChange={e => setFormData({...formData, state: e.target.value})} />
                            <input placeholder="Postal Code" required onChange={e => setFormData({...formData, postal: e.target.value})} />
                            <div className="form-btns">
                                <button type="submit" className="save-btn">Add address</button>
                                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AddressManager;
