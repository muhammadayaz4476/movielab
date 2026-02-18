"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { Star, Circle, ChevronLeft, ChevronRight } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Reviews = ({ movieId, type = "movie" }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Ensure these are defined in your .env.local
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL

  const fetchReviews = useCallback(async (page = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      if (!movieId) throw new Error("Movie ID is missing from props");
      if (!API_KEY) throw new Error("NEXT_PUBLIC_TMDB_KEY is not defined in .env");

      // Clean the URL construction
      const cleanBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
      const url = `${cleanBaseUrl}/${type}/${movieId}/reviews?api_key=${API_KEY}&page=${page}`;

      const response = await axios.get(url);

      if (response.data && response.data.results) {
        setReviews(prev => append ? [...prev, ...response.data.results] : response.data.results);
        setTotalPages(response.data.total_pages);
        setCurrentPage(response.data.page);
        setError(null);
      }
    } catch (err) {
      console.error("TMDB Fetch Error:", err.response?.data || err.message);
      setError(`Failed to load reviews: ${err.response?.data?.status_message || err.message}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [movieId, type, API_KEY, BASE_URL]);

  useEffect(() => {
    fetchReviews(1, false);
  }, [fetchReviews]);

  const loadMoreReviews = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchReviews(currentPage + 1, true);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />
      );
    }
    
    // Half star (using a smaller filled star)
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-4 h-4">
          <Star className="w-4 h-4 text-gray-600 fill-current absolute" />
          <Star className="w-4 h-4 text-yellow-400 fill-current absolute" style={{ clipPath: 'inset(0 50% 0 0)' }} />
        </div>
      );
    }
    
    // Empty stars
    const emptyStars = 5 - Math.ceil(rating / 2);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-600 fill-current" />
      );
    }
    
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">User Reviews</h3>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-zinc-900 rounded-lg p-4 animate-pulse">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-zinc-800 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-zinc-800 rounded w-32 mb-2"></div>
                <div className="h-3 bg-zinc-800 rounded w-24"></div>
              </div>
            </div>
            <div className="h-16 bg-zinc-800 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => fetchReviews(1, false)}
          className="mt-4 px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No reviews available for this {type}.</p>
      </div>
    );
  }

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    // arrows: true,
    prevArrow: <ChevronLeft className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center" />,
    nextArrow: <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center" />,
    adaptiveHeight: true,
    className: "mobile-reviews-slider"
  };

  const renderReviewCard = (review) => (
    <div key={review.id} className="bg-white/8 h-[300px] backdrop-blur-md md:h-auto rounded-lg p-6   ">
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0">
          {review.author_details?.avatar_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w45_and_h45_face${review.author_details.avatar_path}`}
              alt={review.author}
              className="md:size-[3vw] w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="md:size-[3vw] w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center">
              <span className="text-zinc-400 text-sm font-medium">
                {review.author.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-white text-lg font-medium">
                {review.author}
              </h4>
              {review.author_details?.username && (
                <p className="text-gray-400 text-sm">
                  @{review.author_details.username}
                </p>
              )}
            </div>
            <div className="text-right">
              {review.author_details?.rating && (
                <div className="mb-1">
                  {renderStars(review.author_details.rating)}
                </div>
              )}
              <p className="text-gray-400 text-sm">
                {formatDate(review.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-zinc-300 text-sm md:text-lg leading-relaxed w-full lg:w-[85%]">
        {/* {review.content.split('\n').map((paragraph, index) => ( */}
          <p className="mb-3 line-clamp-4 md:line-clamp-6 ">
            {/* {paragraph || '\u00A0'} */}
            {review.content}
          </p>
        {/* ))} */}
      </div>
      
      {review.url && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <Link
            href={review.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center gap-1"
          >
            Read full review on TMDB
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pt-[3vw] font-poppins">
      <h3 className="text-2xl font-semibold text-white mb-4">
        User Reviews ({reviews.length})
      </h3>
      
      {/* Mobile Slider View */}
      <div className="block md:hidden">
        <Slider {...sliderSettings}>
          {reviews.map((review) => (
            <div key={review.id} className="px-2">
              {renderReviewCard(review)}
            </div>
          ))}
        </Slider>
      </div>
      
      {/* Desktop Grid View */}
      <div className="hidden md:block space-y-[3vw]">
        {reviews.map((review) => renderReviewCard(review))}
      </div>
      
      {currentPage < totalPages && (
        <div className="text-center mt-8">
          <button
            onClick={loadMoreReviews}
            disabled={loadingMore}
            className="px-6 py-3 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'Loading...' : `Load More Reviews (${totalPages - currentPage} page${totalPages - currentPage > 1 ? 's' : ''} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default Reviews;