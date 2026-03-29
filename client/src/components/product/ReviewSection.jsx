import React, { useState } from 'react';
import api from '../../api';
import './product.css';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const ReviewSection = ({ productId, reviews, onReviewAdded }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, comment });
      setComment('');
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      alert('Failed to post review. Please sign in first.');
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating = reviews?.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="review-section-container">
      <div className="review-summary">
        <h3>Customer Reviews</h3>
        <div className="avg-stars">
          {[1, 2, 3, 4, 5].map(s => (
            s <= Math.round(avgRating) ? <StarIcon key={s} className="star-filled" /> : <StarBorderIcon key={s} />
          ))}
          <span>{avgRating} out of 5</span>
        </div>
        <p>{reviews?.length || 0} global ratings</p>
      </div>

      <div className="review-list">
        {reviews?.map((r, i) => (
          <div key={i} className="review-item">
            <div className="user-info">
              <div className="avatar">{r.user_name?.[0] || 'U'}</div>
              <strong>{r.user_name}</strong>
            </div>
            <div className="stars">
              {[1, 2, 3, 4, 5].map(s => (
                s <= r.rating ? <StarIcon key={s} className="star-small filled" /> : <StarBorderIcon key={s} className="star-small" />
              ))}
            </div>
            <p className="comment">{r.comment}</p>
          </div>
        ))}
      </div>

      <div className="post-review">
        <h4>Review this product</h4>
        <p>Share your thoughts with other customers</p>
        <form onSubmit={handleSubmit}>
          <div className="rating-select">
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} onClick={() => setRating(s)} className="rating-star">
                {s <= rating ? <StarIcon className="filled" /> : <StarBorderIcon />}
              </span>
            ))}
          </div>
          <textarea 
            placeholder="Write your review..." 
            value={comment} 
            onChange={e => setComment(e.target.value)}
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Posting...' : 'Write a customer review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewSection;
