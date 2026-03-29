import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import Navbar from '../header/Navbar';
import Footer from '../footer/Footer';
import Loader from '../loader/Loader';
import { toast } from 'react-toastify';
import assetUrl from '../../utils/assetUrl';
import CloseIcon from '@mui/icons-material/Close';
import './checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowProductId = location.state?.buyNowProductId;

  const [userData, setUserData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1); 
  
  const [onlinePaymentOk, setOnlinePaymentOk] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [payModalBusy, setPayModalBusy] = useState(false);

  const [savedCards, setSavedCards] = useState([
    { id: 'c1', nickname: 'Ankit Raut', last4: '4321', brand: 'Visa', exp: '05/2026' }
  ]);
  const [selectedCardId, setSelectedCardId] = useState('c1');

  const [cardData, setCardData] = useState({ number: '', nickname: 'Ankit Raut', expiryMonth: '01', expiryYear: '2026' });
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);

  const [newAddress, setNewAddress] = useState({
    fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postal: '', country: 'India'
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, addrRes] = await Promise.all([api.get('/getAuthUser'), api.get('/addresses')]);
      setUserData(userRes.data);
      setAddresses(addrRes.data);
      if (addrRes.data.length > 0) {
        const def = addrRes.data.find((a) => a.is_default) || addrRes.data[0];
        setSelectedAddressId(def.id);
      } else {
        setShowAddressForm(true);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      toast.error('Could not load checkout data.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (buyNowProductId) {
          await api.post(`/buy-now/${buyNowProductId}`, { quantity: 1 });
          window.dispatchEvent(new Event('cartUpdated')); 
        }
        if (!cancelled) await fetchData();
      } catch (err) {
        console.error('Initial Load Error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [buyNowProductId, fetchData]);

  async function handleAddAddress(e) {
    if (e) e.preventDefault();
    if (!newAddress.fullName || !newAddress.phone || !newAddress.line1 || !newAddress.city) {
      toast.warning('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        fullName: newAddress.fullName, phone: newAddress.phone,
        line1: newAddress.line1, line2: newAddress.line2 || '',
        city: newAddress.city, state: newAddress.state,
        postal: newAddress.postal, country: 'India',
        isDefault: addresses.length === 0
      };
      const res = await api.post('/addresses', payload);
      setAddresses([...addresses, res.data.address]);
      setSelectedAddressId(res.data.address.id);
      setShowAddressForm(false);
      setActiveStep(2);
      toast.success('Address added!');
    } catch (err) {
      toast.error('Failed to save address');
    } finally {
      setSubmitting(false);
    }
  }

  const subtotal = (userData?.cart || []).reduce((acc, item) => {
    const val = item.cartItem?.accValue || item.cartItem?.price_rupees || 0;
    const unitPrice = typeof val === 'string' ? parseFloat(val.replace(/[^\d.]/g, '')) : parseFloat(val);
    const q = parseInt(item.qty || 0, 10);
    return acc + (unitPrice * q);
  }, 0);

  function simulatePaymentStep() {
    setPayModalBusy(true);
    setTimeout(() => {
      setPayModalBusy(false);
      setOnlinePaymentOk(true);
      setShowCardModal(false);
      setShowUpiModal(false);
      setActiveStep(3);
      toast.success('Payment verified successfully');
    }, 1500);
  }

  async function handlePlaceOrder() {
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        addressId: selectedAddressId,
        paymentMethod,
        paymentSuccess: paymentMethod === 'COD' || onlinePaymentOk
      });
      window.dispatchEvent(new Event('cartUpdated')); 
      navigate('/order-confirmation', {
        state: { orderNumber: res.data.orderNumber, orderId: res.data.orderId }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleMainAction() {
    if (activeStep === 1) {
      if (showAddressForm) handleAddAddress();
      else if (selectedAddressId) setActiveStep(2);
      else toast.warning('Select an address first');
    } else if (activeStep === 2) {
      if (paymentMethod === 'COD') setActiveStep(3);
      else if (paymentMethod === 'CARD') {
         if (selectedCardId === 'new') setShowCardModal(true);
         else {
            setOnlinePaymentOk(true);
            setActiveStep(3);
         }
      }
      else if (paymentMethod === 'UPI') setShowUpiModal(true);
    } else if (activeStep === 3) {
      handlePlaceOrder();
    }
  }

  if (loading) return <> <Navbar /> <Loader /> <Footer /> </>;
  const selectedAddr = addresses.find(a => a.id === selectedAddressId);
  const cart = userData?.cart || [];

  return (
    <>
      <Navbar />
      
      {/* PROFESSIONAL CARD MODAL */}
      {showCardModal && (
        <div className="payment-modal-overlay">
          <div className="card-modal">
            <div className="modal-head">
              <h4>Add a new credit or debit card</h4>
              <CloseIcon className="modal-close" onClick={() => setShowCardModal(false)} />
            </div>
            <div className="modal-body">
              <div className="card-form-left">
                <div className="form-group row">
                  <label>Card number</label>
                  <input value={cardData.number} onChange={e => setCardData({...cardData, number: e.target.value})} maxLength="16" placeholder="Enter card number" />
                </div>
                <div className="form-group row">
                  <label>Nickname</label>
                  <input value={cardData.nickname} disabled />
                </div>
                <div className="form-group row">
                  <label>Expiry date</label>
                  <div className="expiry-row">
                    <select value={cardData.expiryMonth} onChange={e=>setCardData({...cardData, expiryMonth: e.target.value})}>
                      {Array.from({length:12}, (_,i)=> (i+1).toString().padStart(2,'0')).map(m=><option key={m}>{m}</option>)}
                    </select>
                    <select value={cardData.expiryYear} onChange={e=>setCardData({...cardData, expiryYear: e.target.value})}>
                      {['2024','2025','2026','2027','2028','2029','2030'].map(y=><option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-form-right">
                <p>Please ensure that you enable your card for online payments from your bank's app.</p>
                <div className="card-logos-row">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MC" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PP" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png" alt="RuPay" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
               <button className="cancel-btn" onClick={() => setShowCardModal(false)}>Cancel</button>
               <button className="sidebar-btn" disabled={payModalBusy} onClick={simulatePaymentStep}>
                 {payModalBusy ? 'Verifying...' : 'Add card'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* UPI MODAL */}
      {showUpiModal && (
        <div className="payment-modal-overlay">
          <div className="card-modal" style={{maxWidth: 500}}>
             <div className="modal-head">
               <h4>Verify your UPI ID</h4>
               <CloseIcon className="modal-close" onClick={() => setShowUpiModal(false)} />
             </div>
             <div className="modal-body" style={{flexDirection:'column'}}>
                <p style={{fontSize: 14, marginBottom: 10, color:'#555'}}>Enter your UPI ID (e.g. 9876543210@upi)</p>
                <div className="upi-input-row">
                  <input placeholder="Enter UPI ID" value={upiId} onChange={e=>setUpiId(e.target.value)} />
                  <button className="sidebar-btn" style={{width: 100}} onClick={() => { setPayModalBusy(true); setTimeout(() => { setPayModalBusy(false); setUpiVerified(true); }, 1000); }}>
                    {payModalBusy ? '...' : 'Verify'}
                  </button>
                </div>
                {upiVerified && <p style={{color:'green', fontSize: 13, marginTop: 5}}>✓ Verified: Ankit Raut</p>}
             </div>
             <div className="modal-footer">
                <button className="sidebar-btn" disabled={!upiVerified} onClick={simulatePaymentStep}>Continue</button>
             </div>
          </div>
        </div>
      )}

      <div className="checkout-container">
        <div className="checkout-main">
          <div className={`checkout-section ${activeStep === 1 ? 'active' : 'inactive'}`}>
            <div className="section-header">
              <h3><span>1</span> {activeStep === 1 ? 'Choose a delivery address' : 'Delivery address'}</h3>
              {activeStep !== 1 && selectedAddr && (
                <div className="section-summary">
                  <div className="summary-text">{selectedAddr.full_name}, {selectedAddr.city}</div>
                  <span className="change-link" onClick={() => setActiveStep(1)}>Change</span>
                </div>
              )}
            </div>
            {activeStep === 1 && (
              <div className="section-content">
                <div className="address-list">
                  {addresses.map(addr => (
                    <div key={addr.id} className={`address-item ${selectedAddressId === addr.id ? 'selected' : ''}`} onClick={() => setSelectedAddressId(addr.id)}>
                      <input type="radio" checked={selectedAddressId === addr.id} readOnly />
                      <div className="addr-info"><strong>{addr.full_name}</strong><p>{addr.line1}, {addr.city}</p></div>
                    </div>
                  ))}
                  <button className="add-btn" onClick={() => setShowAddressForm(!showAddressForm)}>+ Add a new delivery address</button>
                </div>
                {showAddressForm && (
                  <form className="address-form" onSubmit={handleAddAddress}>
                    <input className="full-width" placeholder="Full Name" required onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} />
                    <input className="full-width" placeholder="Phone" required onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
                    <input className="full-width" placeholder="Address Line 1" required onChange={e => setNewAddress({...newAddress, line1: e.target.value})} />
                    <input placeholder="City" required onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                    <input placeholder="State" required onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                    <input className="full-width" placeholder="Postal Code" required onChange={e => setNewAddress({...newAddress, postal: e.target.value})} />
                    <button type="submit" className="sidebar-btn" style={{marginTop: 16}} disabled={submitting}>{submitting ? 'Saving...' : 'Add Address and Continue'}</button>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className={`checkout-section ${activeStep === 2 ? 'active' : 'pending'}`}>
            <div className="section-header"><h3><span>2</span> Payment method</h3></div>
            {activeStep === 2 && (
              <div className="section-content">
                
                {/* SAVED CARDS SECTION */}
                <div className="saved-payments">
                  <h5>Your saved cards</h5>
                  {savedCards.map(card => (
                    <div key={card.id} className={`pay-opt card-opt ${selectedCardId === card.id ? 'selected' : ''}`} onClick={() => { setPaymentMethod('CARD'); setSelectedCardId(card.id); }}>
                      <input type="radio" checked={paymentMethod === 'CARD' && selectedCardId === card.id} readOnly />
                      <div className="card-brand">{card.brand}</div>
                      <div className="card-details">
                         <b>{card.nickname}</b> ending in {card.last4}
                         <span>Expires {card.exp}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="other-payment-options">
                   <h5>Other payment options</h5>
                   <div className="pay-opt" onClick={() => { setPaymentMethod('CARD'); setSelectedCardId('new'); }}>
                      <input type="radio" checked={paymentMethod === 'CARD' && selectedCardId === 'new'} readOnly />
                      <span>Add Debit/Credit Card</span>
                   </div>
                   <div className="pay-opt" onClick={() => setPaymentMethod('UPI')}>
                      <input type="radio" checked={paymentMethod === 'UPI'} readOnly />
                      <span>UPI / Other UPI Apps</span>
                   </div>
                   <div className="pay-opt" onClick={() => setPaymentMethod('COD')}>
                      <input type="radio" checked={paymentMethod === 'COD'} readOnly />
                      <span>Cash on Delivery/Pay on Delivery</span>
                   </div>
                </div>

                <button className="sidebar-btn" style={{marginTop: 20, width: 'auto', padding: '10px 40px'}} onClick={handleMainAction}>Use this payment method</button>
              </div>
            )}
          </div>

          <div className={`checkout-section ${activeStep === 3 ? 'active' : 'pending'}`}>
            <div className="section-header"><h3><span>3</span> Review items and delivery</h3></div>
            {activeStep === 3 && (
              <div className="section-content">
                {cart.map(item => (
                  <div key={item.id} className="review-item">
                    <img src={assetUrl(item.cartItem.url)} alt="" style={{width: 80, objectFit:'contain'}} />
                    <div><strong style={{fontSize: 14}}>{item.cartItem.name}</strong><p style={{color:'green', fontSize: 13, fontWeight:'bold'}}>In Stock</p><p style={{fontSize: 13}}>Qty: {item.qty}</p></div>
                  </div>
                ))}
                <div className="place-order-footer">
                  <button className="sidebar-btn" style={{width: 'auto', padding: '10px 40px'}} onClick={handlePlaceOrder} disabled={submitting}>Place your order</button>
                  <p style={{fontSize: 12, marginTop: 10, color: '#555'}}>By placing your order, you agree to Amazon's conditions of use and sale.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="checkout-sidebar">
          <div className="summary-card">
            <button className="sidebar-btn" onClick={handleMainAction} disabled={submitting || (activeStep === 1 && !selectedAddressId && !showAddressForm) || (activeStep === 1 && showAddressForm)}>
              {activeStep === 1 ? 'Use this address' : (activeStep === 2 ? 'Use this payment' : 'Place your order')}
            </button>
            <div className="summary-details">
              <h4>Order Summary</h4>
              <div className="summary-row"><span>Items:</span><span>₹{subtotal.toLocaleString('en-IN')}.00</span></div>
              <div className="summary-row"><span>Shipping:</span><span>₹{subtotal > 1000 ? '0.00' : '40.00'}</span></div>
              <div className="summary-total"><span>Order Total:</span><span>₹{(subtotal + (subtotal > 1000 ? 0 : 40)).toLocaleString('en-IN')}.00</span></div>
            </div>
            <p style={{fontSize: 10, color: '#888', textAlign: 'center'}}>Verified Account: {(userData?.name || 'Guest')}</p>
          </div>
        </aside>
      </div>
      <Footer />
    </>
  );
};

export default Checkout;
