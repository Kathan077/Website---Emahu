'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BuyerHeader from '@/components/buyer_home/buyer_header';
import './wishlist.css';

/* ─── SHARED SCHEMAS (Matches Products listing exactly) ─── */
const ALL_PRODUCTS = [
  { id:1,  name:'iPhone 15 Pro Max 256GB',       brand:'Apple',       category:'Tech',     price:134999, original:159999, discount:16, rating:4.9, reviews:2341, img:'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=600&q=80', verified:true,  isNew:false, isHot:true,  onSale:true  },
  { id:2,  name:'Samsung Galaxy S24 Ultra',       brand:'Samsung',     category:'Tech',     price:109999, original:129999, discount:15, rating:4.8, reviews:1876, img:'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80', verified:true,  isNew:true,  isHot:false, onSale:true  },
  { id:3,  name:'Sony WH-1000XM5 Headphones',    brand:'Sony',        category:'Tech',     price:26999,  original:34990,  discount:23, rating:4.8, reviews:3120, img:'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80', verified:true,  isNew:false, isHot:false, onSale:true  },
  { id:4,  name:'MacBook Air M3 13-inch',         brand:'Apple',       category:'Tech',     price:114999, original:129900, discount:12, rating:4.9, reviews:987,  img:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80', verified:true,  isNew:true,  isHot:true,  onSale:false },
  { id:5,  name:'Nike Air Max 270 React',         brand:'Nike',        category:'Shoes',    price:9995,   original:12995,  discount:23, rating:4.7, reviews:5421, img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', verified:false, isNew:false, isHot:true,  onSale:true  },
  { id:6,  name:'Adidas Ultraboost 22 Running',   brand:'Adidas',      category:'Shoes',    price:12499,  original:15999,  discount:22, rating:4.6, reviews:2103, img:'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80', verified:true,  isNew:true,  isHot:false, onSale:true  },
  { id:7,  name:'New Balance 574 Classic',        brand:'New Balance', category:'Shoes',    price:7499,   original:8999,   discount:17, rating:4.5, reviews:1234, img:'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80', verified:false, isNew:false, isHot:false, onSale:true  },
  { id:8,  name:'Jordan 1 Retro High OG Chicago', brand:'Nike',        category:'Shoes',    price:14999,  original:17999,  discount:17, rating:4.9, reviews:3210, img:'https://images.unsplash.com/photo-1556048219-bb6978360b84?w=600&q=80', verified:true,  isNew:false, isHot:true,  onSale:false },
  { id:9,  name:'Eco Bamboo Kitchen Set (8pc)',   brand:'GreenLeaf',   category:'Kitchen',  price:2499,   original:3499,   discount:29, rating:4.7, reviews:876,  img:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80', verified:true,  isNew:false, isHot:false, onSale:true  },
  { id:10, name:'Ceramic Non-Stick Cookware Set', brand:'CeraChef',    category:'Kitchen',  price:4999,   original:6999,   discount:29, rating:4.6, reviews:654,  img:'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80', verified:true,  isNew:true,  isHot:false, onSale:true  },
  { id:11, name:'Stainless Steel Thermal Flask',  brand:'ThermoFlask', category:'Kitchen',  price:1299,   original:1799,   discount:28, rating:4.8, reviews:2890, img:'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80', verified:false, isNew:false, isHot:true,  onSale:true  },
  { id:12, name:'Premium Linen Casual Shirt',     brand:'ThreadCo',    category:'Apparel',  price:1899,   original:2499,   discount:24, rating:4.4, reviews:432,  img:'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80', verified:false, isNew:true,  isHot:false, onSale:true  },
  { id:13, name:'Yoga & Fitness Leggings',        brand:'FlexFit',     category:'Apparel',  price:1299,   original:1799,   discount:28, rating:4.6, reviews:987,  img:'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80', verified:true,  isNew:false, isHot:false, onSale:true  },
  { id:14, name:'Samsung 55" QLED 4K Smart TV',  brand:'Samsung',     category:'Tech',     price:69999,  original:89990,  discount:22, rating:4.7, reviews:543,  img:'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600&q=80', verified:true,  isNew:false, isHot:true,  onSale:true  },
  { id:15, name:'Minimalist Leather Bifold Wallet', brand:'SlimCraft', category:'Lifestyle', price:899,   original:1299,   discount:31, rating:4.5, reviews:1203, img:'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80', verified:false, isNew:false, isHot:false, onSale:true  },
  { id:16, name:'Artisan Soy Scented Candle Set', brand:'LuxGlow',     category:'Lifestyle', price:1599,  original:1999,   discount:20, rating:4.8, reviews:764,  img:'https://images.unsplash.com/photo-1608181831718-c9e37e3b9d70?w=600&q=80', verified:false, isNew:true,  isHot:false, onSale:false },
];

function Stars({ rating }) {
  return (
    <div className="wl-stars">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`wl-star ${s <= Math.round(rating) ? '' : 'wl-star--empty'}`} viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [cartAdded, setCartAdded] = useState([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const storedWish = localStorage.getItem('emahu_wishlist');
      if (storedWish) {
        const ids = JSON.parse(storedWish);
        // Map ids to matching product objects
        const matched = ALL_PRODUCTS.filter(p => ids.includes(p.id));
        setWishlistItems(matched);
      }
      
      const storedCart = localStorage.getItem('emahu_cart');
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        setCartAdded(parsed.map(x => typeof x === 'object' ? x.id : x));
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

  // Remove single item from wishlist
  const removeFromWishlist = (id) => {
    const nextList = wishlistItems.filter(p => p.id !== id);
    setWishlistItems(nextList);
    try {
      localStorage.setItem('emahu_wishlist', JSON.stringify(nextList.map(p => p.id)));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }
  };

  // Clear entire wishlist
  const clearAllWishlist = () => {
    setWishlistItems([]);
    try {
      localStorage.setItem('emahu_wishlist', JSON.stringify([]));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }
  };

  // Add to cart directly from Wishlist
  const handleAddToCart = (e, p) => {
    e.preventDefault();
    if (cartAdded.includes(p.id)) return;

    setCartAdded(prev => [...prev, p.id]);

    try {
      const storedCartStr = localStorage.getItem('emahu_cart') || '[]';
      const storedCart = JSON.parse(storedCartStr);
      if (!storedCart.some(x => (typeof x === 'object' ? x.id : x) === p.id)) {
        storedCart.push({ id: p.id, quantity: 1, color: 'Default', size: 'Default' });
        localStorage.setItem('emahu_cart', JSON.stringify(storedCart));
        window.dispatchEvent(new Event('storage'));
      }
    } catch(err) {
      console.error(err);
    }

    setTimeout(() => {
      setCartAdded(prev => prev.filter(x => x !== p.id));
    }, 2000);
  };

  // Move all wishlist items to cart
  const moveAllToCart = () => {
    if (wishlistItems.length === 0) return;
    
    try {
      const storedCartStr = localStorage.getItem('emahu_cart') || '[]';
      const storedCart = JSON.parse(storedCartStr);
      
      wishlistItems.forEach(p => {
        if (!storedCart.some(x => (typeof x === 'object' ? x.id : x) === p.id)) {
          storedCart.push({ id: p.id, quantity: 1, color: 'Default', size: 'Default' });
        }
      });
      
      localStorage.setItem('emahu_cart', JSON.stringify(storedCart));
      setWishlistItems([]);
      localStorage.setItem('emahu_wishlist', JSON.stringify([]));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="wl-page">
      <BuyerHeader />

      {/* Breadcrumb */}
      <nav className="wl-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/buyer">Buyer</Link>
        <span>/</span>
        <span style={{ color: '#1a1a1a' }}>My Wishlist</span>
      </nav>

      {/* Main Body */}
      <main className="wl-container">
        
        {/* Header Summary */}
        <div className="wl-header">
          <div>
            <h1 className="wl-title">Your Saved Drops</h1>
            <p className="wl-subtitle">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for quick-lock authenticity check checkout.
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <div className="wl-header-actions">
              <button className="wl-btn-outline" onClick={clearAllWishlist}>
                Clear Wishlist
              </button>
              <button className="wl-btn-solid" onClick={moveAllToCart}>
                Move All to Cart
              </button>
            </div>
          )}
        </div>

        {/* Wishlist Grid or Empty state */}
        {wishlistItems.length === 0 ? (
          <div className="wl-empty-card">
            <div className="wl-empty-icon-wrap">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2>Your wishlist is completely empty</h2>
            <p>Save premium laptops, verified sneakers, or dining essentials while exploring the collections.</p>
            <Link href="/buyer/products" className="wl-explore-btn">
              Explore Premium Catalog
            </Link>
          </div>
        ) : (
          <div className="wl-grid">
            {wishlistItems.map(p => (
              <div key={p.id} className="wl-card">
                
                {/* Image Wrap */}
                <div className="wl-card__img-wrap">
                  <img src={p.img} alt={p.name} className="wl-card__img" loading="lazy" />
                  
                  {/* Category Chip */}
                  <span className="wl-card__cat-chip">{p.category}</span>
                  
                  {/* Stock Tag */}
                  <span className="wl-card__stock-tag">IN STOCK</span>

                  {/* Remove Button */}
                  <button 
                    className="wl-card__remove" 
                    onClick={() => removeFromWishlist(p.id)}
                    aria-label="Remove item"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Body Details */}
                <div className="wl-card__body">
                  <span className="wl-card__brand">{p.brand}</span>
                  <h3 className="wl-card__name">
                    <Link href={`/buyer/products/${p.id}`}>{p.name}</Link>
                  </h3>
                  
                  <div className="wl-card__rating-row">
                    <Stars rating={p.rating} />
                    <span>({p.reviews})</span>
                  </div>

                  <div className="wl-card__price-row">
                    <strong className="wl-card__price">₹{p.price.toLocaleString('en-IN')}</strong>
                    {p.onSale && (
                      <>
                        <span className="wl-card__original">₹{p.original.toLocaleString('en-IN')}</span>
                        <span className="wl-card__discount">-{p.discount}% OFF</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action CTA Footer */}
                <div className="wl-card__footer">
                  <button 
                    className={`wl-card__add-btn ${cartAdded.includes(p.id) ? 'wl-card__add-btn--added' : ''}`}
                    onClick={(e) => handleAddToCart(e, p)}
                  >
                    {cartAdded.includes(p.id) ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>✓ Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
