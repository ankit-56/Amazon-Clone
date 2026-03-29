import React from 'react';
import Carousel from 'react-bootstrap/Carousel';

const slides = [
  { src: '/images/banner1.jpg', alt: 'Shop deals' },
  { src: '/images/banner2.jpg', alt: 'Electronics' },
  { src: '/images/banner3.jpg', alt: 'Fashion' },
  { src: '/images/banner4.jpg', alt: 'Home' },
  { src: '/images/banner5.jpg', alt: 'More deals' }
];

const Banner = () => {
  return (
    <div className="banner">
      <Carousel variant="dark" indicators interval={4000} pause="hover">
        {slides.map((s) => (
          <Carousel.Item key={s.src}>
            <div className="carousel-img-wrapper">
              <img className="carousel-img" src={s.src} alt={s.alt} loading="lazy" />
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
};

export default Banner;
