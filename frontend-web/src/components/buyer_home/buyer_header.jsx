'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './buyer_header.css';
import { logoutUser, clearAuthSession } from '@/utils/auth';

export default function BuyerHeader() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const profileDropdownRef = useRef(null);
  
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);

  // Sync count states on mount & storage changes
  useEffect(() => {
    const updateCounts = () => {
      try {
        const storedCart = localStorage.getItem('emahu_cart');
        if (storedCart) {
          const parsed = JSON.parse(storedCart);
          setCartCount(parsed.length);
        } else {
          setCartCount(0);
        }

        const storedWish = localStorage.getItem('emahu_wishlist');
        if (storedWish) {
          const parsed = JSON.parse(storedWish);
          setWishCount(parsed.length);
        } else {
          setWishCount(0);
        }
      } catch (e) {
        console.error(e);
      }
    };

    updateCounts();
    window.addEventListener('storage', updateCounts);
    return () => window.removeEventListener('storage', updateCounts);
  }, []);

  // Monitor scroll for subtle shadow under header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check login state from localStorage
  useEffect(() => {
    const checkLogin = () => {
      const loggedIn = localStorage.getItem('emahu_buyer_logged_in') === 'true' || 
                        localStorage.getItem('emahu_buyer_registered') === 'true';
      setIsLoggedIn(loggedIn);
      
      const userData = localStorage.getItem('emahu_buyer_user');
      if (userData) {
        try {
          setUserProfile(JSON.parse(userData));
        } catch (e) {
          setUserProfile({ name: 'Buyer User' });
        }
      }
    };
    checkLogin();
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

  // Click outside listener to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Failed to log out from server:', err);
    }
    clearAuthSession('buyer');
    setIsLoggedIn(false);
    setUserProfile(null);
    setProfileDropdownOpen(false);
    router.push('/');
  };

  return (
    <header className={`bh-header ${scrolled ? 'bh-header--scrolled' : ''}`}>
      <div className="bh-header__container">
        
        {/* Left Side: Cashify-Style Circle-Check Logo */}
        <Link href="/buyer" className="bh-logo">
          <div className="bh-logo__icon-wrap">
            <svg className="bh-logo__svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
              {/* Solid thick circular ring */}
              <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="2.8" />
              {/* Bold green checkmark */}
              <path d="M9 14l3.5 3.5 6.5-6.5" stroke="#12b7b2" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="bh-logo__text">EMAHU</span>
        </Link>

        {/* Center Side: Premium "Start Buying Products" Button */}
        <div className="bh-header__center">
          <Link href="/buyer/products" className="bh-start-buying-btn" aria-label="Start Buying Products">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bh-start-buying-btn__icon">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="bh-start-buying-btn__text">Start Buying Products</span>
          </Link>
        </div>

        {/* Right Side: Action Icons & Matte Black Login Button */}
        <div className="bh-header__right">
          
          {/* Stroke-only Wishlist Icon */}
          <Link href="/buyer/wishlist" className="bh-action-icon" aria-label="Wishlist" style={{ position: 'relative' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishCount > 0 && (
              <span className="bh-action-icon__badge">
                {wishCount}
              </span>
            )}
          </Link>

          {/* Stroke-only Shopping Cart Icon */}
          <Link href="/buyer/cart" className="bh-action-icon" aria-label="Cart" style={{ position: 'relative' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="bh-action-icon__badge bh-action-icon__badge--cart">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Login Action or Profile dropdown */}
          <div className="bh-profile" ref={profileDropdownRef}>
            {isLoggedIn ? (
              <>
                <button 
                  className="bh-profile__btn" 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <div className="bh-profile__avatar">
                    {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="bh-profile__name">{userProfile?.name?.split(' ')[0] || 'User'}</span>
                </button>

                {profileDropdownOpen && (
                  <div className="bh-profile__dropdown">
                    <div className="bh-profile__dropdown-header">
                      <strong>{userProfile?.name || 'Buyer User'}</strong>
                      <span>{userProfile?.email}</span>
                    </div>
                    <div className="bh-profile__dropdown-divider" />
                    <Link href="/buyer/orders" className="bh-profile__dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                      📦 My Orders
                    </Link>
                    <Link href="/buyer/wishlist" className="bh-profile__dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                      ❤️ My Wishlist
                    </Link>
                    <div className="bh-profile__dropdown-divider" />
                    <button onClick={handleSignOut} className="bh-profile__dropdown-item bh-profile__dropdown-item--logout">
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link href="/buyer/login" className="bh-login-btn">
                Login
              </Link>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
