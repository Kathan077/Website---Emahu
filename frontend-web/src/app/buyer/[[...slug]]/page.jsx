'use client';

import { useState, useEffect } from 'react';
import BuyerHeader from '@/components/buyer_home/buyer_header';
import BuyerCategories from '@/components/buyer_home/buyer_categories';
import BuyerAbout from '@/components/buyer_home/buyer_about';
import { BuyerHowWeWork, BuyerReviews, BuyerFaqs, BuyerStartBuying, BuyerEscrowAssurance } from '@/components/buyer_home/buyer_extra_sections';
import './buyer_home.css';

const slides = [
  {
    badge: 'EMAHU EXCLUSIVE',
    title: 'The New Standard of Smart Living',
    desc: 'Upgrade your lifestyle with our premium, certified tech devices. Get up to 45% flat cashback and free express home delivery.',
    cta: 'Discover Tech Drops',
    type: 'tech',
  },
  {
    badge: 'LIMITED TIME ONLY',
    title: 'Premium Culinary Bamboo Craft',
    desc: 'Crafted for elegant modern dining. Beautiful sustainable kitchenware with food-safe sealants, thermal flasks, and non-stick utensils.',
    cta: 'Shop Eco-Kitchen',
    type: 'kitchen',
  },
  {
    badge: 'SUMMER SPECIAL',
    title: 'AeroCloud Athletic Gear',
    desc: 'Engineered mesh running shoes, ultra-responsive shock absorbing foam, and extreme durability soles. Unleash your full limits.',
    cta: 'Explore Sportswear',
    type: 'shoes',
  }
];

export default function BuyerDashboardCatchAll() {
  const [activeSlide, setActiveSlide] = useState(0);

  // Autoplay slider logic - every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="bh-home-wrapper">
      {/* 1. Cashify-Style Pro-Level Header */}
      <BuyerHeader />
      
      {/* 2. Full-Width Premium Hero Section */}
      <section className="bh-hero-section" aria-label="Main Banner Promotion">
        <div className="bh-hero-slider">
          
          {/* Arrow Navigation (Left) */}
          <button 
            className="bh-hero-arrow bh-hero-arrow--left" 
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Slides loop */}
          {slides.map((slide, idx) => (
            <div 
              key={idx} 
              className={`bh-hero-slide ${activeSlide === idx ? 'bh-hero-slide--active' : ''}`}
            >
              <div className="bh-hero-container">
                
                {/* Left Side: Bold Text Information */}
                <div className="bh-hero-info">
                  <span className="bh-hero-badge">{slide.badge}</span>
                  <h1 className="bh-hero-title">{slide.title}</h1>
                  <p className="bh-hero-desc">{slide.desc}</p>
                  <button className="bh-hero-cta">
                    <span>{slide.cta}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                </div>

                {/* Right Side: High-End CSS Mockups (No placeholders) */}
                <div className="bh-hero-visual">
                  
                  {/* Tech/Smartphone Mockup */}
                  {slide.type === 'tech' && (
                    <div style={{ position: 'relative' }}>
                      {/* Floating checklist badge 1 */}
                      <div className="bh-floating-badge bh-floating-badge--1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#12b7b2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>100% Certified</span>
                      </div>
                      
                      {/* Floating checklist badge 2 */}
                      <div className="bh-floating-badge bh-floating-badge--2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#12b7b2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Free Shipping</span>
                      </div>

                      {/* Phone Chassis */}
                      <div className="bh-phone-mockup">
                        <div className="bh-phone-camera"></div>
                        <div className="bh-phone-screen">
                          <div className="bh-phone-glow"></div>
                          <div className="bh-phone-content">
                            <span className="bh-phone-logo">EMAHU</span>
                            <p className="bh-phone-tagline">Premium Tech Hub</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kitchenware Glassmorphism Mockup */}
                  {slide.type === 'kitchen' && (
                    <div className="bh-glass-mockup">
                      <div className="bh-glass-glow"></div>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85, marginBottom: '12px' }}>
                        <path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2M3 8h11v10H3zM3 4h11v4H3z" />
                      </svg>
                      <strong style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>ECO CRAFT</strong>
                      <span style={{ fontSize: '0.65rem', color: '#1e3a8a', opacity: 0.8, marginTop: '4px' }}>Premium Dining</span>
                    </div>
                  )}

                  {/* Shoes/Sportswear Streak Mockup */}
                  {slide.type === 'shoes' && (
                    <div className="bh-sport-card">
                      <div className="bh-sport-streak"></div>
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-15deg)', marginBottom: '12px' }}>
                        <path d="M18.8 20.3a30 30 0 0 0-14.7-6.2c-1.3-.2-2.1-1.3-1.9-2.6l1-5.7a3 3 0 0 1 4.5-2.2l4.8 2.7" />
                      </svg>
                      <strong style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#d97706' }}>AEROCLOUD</strong>
                      <span style={{ fontSize: '0.65rem', color: '#d97706', opacity: 0.8, marginTop: '4px' }}>Ultralight Gear</span>
                    </div>
                  )}

                </div>

              </div>
            </div>
          ))}

          {/* Arrow Navigation (Right) */}
          <button 
            className="bh-hero-arrow bh-hero-arrow--right" 
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l6 6-6 6" />
            </svg>
          </button>

          {/* Dots Indicator Panel */}
          <div className="bh-hero-dots">
            {slides.map((_, idx) => (
              <button 
                key={idx}
                className={`bh-hero-dot ${activeSlide === idx ? 'bh-hero-dot--active' : ''}`}
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* 3. Curated Premium Categories Grid */}
      <BuyerCategories />

      {/* 4. Pro-Level Retail Buyer Assurance (About Section) */}
      <BuyerAbout />

      {/* 5. Sleek Interactive How We Work Pipeline */}
      <BuyerHowWeWork />

      {/* 6. Premium Verified Customer Reviews Bento */}
      <BuyerReviews />

      {/* 7. Accordion-driven Trust FAQs Accordion */}
      <BuyerFaqs />

      {/* 7.5 Interactive Safe Escrow Guarantee Simulation */}
      <BuyerEscrowAssurance />

      {/* 8. High-Impact 'Start Buying' Bottom Call to Action Banner */}
      <BuyerStartBuying />
    </div>
  );
}
