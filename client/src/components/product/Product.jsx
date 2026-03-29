import React, { useEffect, useState } from 'react';
import api from '../../api';
import './product.css';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../loader/Loader';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import ReviewSection from './ReviewSection';
import { toast } from 'react-toastify';
import assetUrl from '../../utils/assetUrl';

const Product = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState();

  useEffect(
    function () {
      setIsLoading(true);
      setLoadError(null);
      async function fetchSingleProduct() {
        try {
          const res = await api.get('/product/' + id);
          setProduct(res.data);
        } catch (error) {
          console.log(error);
          setLoadError(error.response?.data?.message || 'Could not load product.');
        } finally {
          setIsLoading(false);
        }
      }
      fetchSingleProduct();
    },
    [id]
  );

  async function addToCart() {
    try {
      await api.post('/addtocart/' + product.id, { quantity: 1 });
      toast.success('Added to Cart!');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add to cart');
    }
  }

  function buyNowCheckout() {
    navigate('/checkout', { state: { buyNowProductId: product.id } });
  }

  async function addToWishlist() {
    try {
      await api.post('/wishlist/' + product.id);
      toast.success('Added to Wishlist!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add to wishlist');
    }
  }

  const today = new Date();
  today.setDate(today.getDate() + 3);
  const dayArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthArr = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const day = dayArr[today.getDay()];
  const date = today.getDate();
  const month = monthArr[today.getMonth()];
  const deliveryDate = day + ', ' + date + ' ' + month;

  if (product) {
    const raw = product.images && product.images.length ? product.images : [product.url, product.resUrl];
    const normalized = raw.map(assetUrl).filter(Boolean);
    const uniqueImgs = [...new Set(normalized)];
    if (uniqueImgs.length === 0 && id) {
      uniqueImgs.push(assetUrl(`images/products/${id}.jpg`));
    }
    const inStock = product.stockQuantity > 0;

    return (
      <>
        <div className="product-section">
          <div className="left product-carousel-wrap">
            <Swiper
              modules={[Pagination, Navigation]}
              pagination={{ clickable: true }}
              navigation
              className="product-detail-swiper"
            >
              {uniqueImgs.map((src, i) => (
              <SwiperSlide key={src + i}>
                <div className="product-slide-img">
                  <img src={src} alt="" decoding="async" />
                </div>
              </SwiperSlide>
            ))}
            </Swiper>
          </div>
          <div className="middle">
            <div className="product-details">
              <h4>{product.name}</h4>
              <div className="divider"></div>
              <p className={`product-stock-banner ${inStock ? 'in-stock' : 'out-stock'}`}>
                {inStock ? `${product.stockQuantity} left in stock.` : 'Currently unavailable.'}
              </p>
              <div className="price">
                {product.discount}
                <span>
                  <span className="sup"> ₹</span>
                  {product.value}
                  <span className="sup">00</span>
                </span>
              </div>
              <div className="mrp">
                M.R.P.: <strike>{product.mrp}</strike>
              </div>
              <p className="taxes">Inclusive of all taxes</p>
            </div>
            {product.description ? (
              <div className="about-product product-description-block">
                <h6>Product description</h6>
                <p className="description-text">{product.description}</p>
              </div>
            ) : null}
            <div className="about-product">
              <h6>About this item</h6>
              <ul>
                {(product.points || []).map(function (point, index) {
                  return <li key={index}>{point}</li>;
                })}
              </ul>
            </div>
          </div>
          <div className="right">
            <h3>
              <span>
                <span className="sup">₹</span>
                {product.value}
                <span className="sup">00</span>
              </span>
            </h3>
            <p>
              <span>FREE delivery:</span> {deliveryDate}
            </p>
            <button id="addtocart-btn" disabled={!inStock} onClick={addToCart}>
              Add to Cart
            </button>
            <button id="buynow-btn" type="button" disabled={!inStock} onClick={buyNowCheckout}>
              Buy Now
            </button>
            <button id="wishlist-btn" type="button" onClick={addToWishlist}>
              Add to Wishlist
            </button>
          </div>
        </div>

        <ReviewSection 
          productId={product.id} 
          reviews={product.reviews} 
          onReviewAdded={() => {
            // Re-fetch product to show new review
            api.get('/product/' + id).then(res => setProduct(res.data));
          }} 
        />
      </>
    );
  }

  if (loadError) {
    return (
      <div className="product-section" style={{ padding: '40px', maxWidth: 720, margin: '0 auto' }}>
        <p style={{ color: '#c45500' }}>{loadError}</p>
        <p style={{ fontSize: 14, color: '#565959' }}>Make sure the API is running and the product exists.</p>
      </div>
    );
  }

  return <div>{isLoading ? <Loader /> : null}</div>;
};

export default Product;
