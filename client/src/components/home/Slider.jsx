import React, { useEffect, useState } from 'react';
import api from '../../api';
import './home.css';
import Loader from '../loader/Loader';
import { NavLink } from 'react-router-dom';
import assetUrl from '../../utils/assetUrl';

// Importing swiper and its components
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Pagination, Navigation } from "swiper";

const Slider = (props) => {

  // Loader
  const [isLoading, setIsLoading] = useState(true);

  // Fetching products from API
  const [products, setProducts] = useState([]);

  useEffect(function() {
    async function fetchProducts() {
      try {
        const res = await api.get('/products', { params: { limit: 48 } });
        const list = Array.isArray(res.data) ? res.data : res.data.products || [];
        setProducts(list);
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const arrFrom = parseInt(props.arrFrom, 10) || 0;
  const arrTo = parseInt(props.arrTo, 10) || 0;

  if (products.length > 0) {
    return (
      <div className='slider'>
        <div className='slider-heading'>
          <h5>{props.title}</h5>
          <NavLink to="/products">{props.link_text}</NavLink>
        </div>
        <Swiper
            slidesPerView='auto'
            spaceBetween={10}
            slidesPerGroupAuto={true}
            navigation={true}
            modules={[Pagination, Navigation]}
            className={props.class}
          >
            {
              products.filter((item, index) => index < arrTo && index >= arrFrom).map(function(product) {
                return (
                  <SwiperSlide className='swiper-slide' key={product.id}>
                    <NavLink to={`/product/${product.id}`}>
                      <div className='swiper-slide-img-wrapper'>
                        <img src={assetUrl(product.url)} className="swiper-slide-img" alt="" />
                      </div>
                      <p>{product.price}</p>
                    </NavLink>
                  </SwiperSlide>
                )
              })
            }
  
          </Swiper>
      </div>
    ) 
  }

  return (
    <div className="slider" style={{ height: '332px' }}>
      {isLoading ? <Loader /> : ''}
    </div>
  );
}

export default Slider;