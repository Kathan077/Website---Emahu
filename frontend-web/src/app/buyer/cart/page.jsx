'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BuyerHeader from '@/components/buyer_home/buyer_header';
import './cart.css';

/* ─── SHARED PRODUCT SCHEMA ─── */
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

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState('idle'); // idle | securing | success
  const [removingId, setRemovingId] = useState(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  
  // Load Cart items on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('emahu_cart');
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        // parsed: [{ id, quantity, color, size }]
        const matched = parsed.map(cItem => {
          const prod = ALL_PRODUCTS.find(p => p.id === (typeof cItem === 'object' ? cItem.id : cItem));
          if (prod) {
            return {
              ...prod,
              quantity: cItem.quantity || 1,
              selectedColor: cItem.color || 'Premium Black',
              selectedSize: cItem.size || 'Regular'
            };
          }
          return null;
        }).filter(Boolean);
        setCartItems(matched);
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

  // Save changes to localStorage helper
  const saveCartToStorage = (items) => {
    try {
      const saveList = items.map(p => ({
        id: p.id,
        quantity: p.quantity,
        color: p.selectedColor,
        size: p.selectedSize
      }));
      localStorage.setItem('emahu_cart', JSON.stringify(saveList));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }
  };

  // Adjust item quantity
  const handleQuantityChange = (id, delta) => {
    const nextList = cartItems.map(p => {
      if (p.id === id) {
        const newQty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: newQty };
      }
      return p;
    });
    setCartItems(nextList);
    saveCartToStorage(nextList);
  };

  // Remove single item from Cart with premium delay
  const handleRemove = (id) => {
    setRemovingId(id);
    setTimeout(() => {
      const nextList = cartItems.filter(p => p.id !== id);
      setCartItems(nextList);
      saveCartToStorage(nextList);
      setRemovingId(null);
    }, 380);
  };

  // Clear entire Cart with pro-level animations
  const handleClearCart = () => {
    setIsClearingAll(true);
    setTimeout(() => {
      setCartItems([]);
      localStorage.setItem('emahu_cart', JSON.stringify([]));
      window.dispatchEvent(new Event('storage'));
      setIsClearingAll(false);
    }, 380);
  };

  // Recalculate totals
  const subtotal = cartItems.reduce((acc, p) => acc + (p.price * p.quantity), 0);
  const shippingFee = (subtotal > 50000 || subtotal === 0) ? 0 : 99;
  const taxAmount = Math.round(subtotal * 0.18); // 18% CGST/SGST
  const grandTotal = subtotal + shippingFee + taxAmount;

  // Checkout sequence triggered
  const handleSecureCheckout = () => {
    if (cartItems.length === 0) return;
    
    // Step 1: Secure vault locking animation
    setCheckoutStep('securing');
    
    setTimeout(() => {
      // Step 2: Completed Escrow Locked Success
      setCheckoutStep('success');
      
      // Save order in orders history in localStorage
      try {
        const storedOrdersStr = localStorage.getItem('emahu_orders') || '[]';
        const storedOrders = JSON.parse(storedOrdersStr);
        storedOrders.push({
          orderId: `EMH_${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          items: cartItems.map(p => ({ name: p.name, price: p.price, quantity: p.quantity, brand: p.brand, img: p.img })),
          total: grandTotal,
          status: '🔒 ESCROW VAULT SECURED'
        });
        localStorage.setItem('emahu_orders', JSON.stringify(storedOrders));
      } catch (err) {
        console.error(err);
      }

      // Step 3: Clear Cart
      setCartItems([]);
      localStorage.setItem('emahu_cart', JSON.stringify([]));
      window.dispatchEvent(new Event('storage'));
    }, 2800);
  };

  return (
    <div className="cart-page">
      <BuyerHeader />

      {/* Breadcrumb */}
      <nav className="cart-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/buyer">Buyer</Link>
        <span>/</span>
        <span style={{ color: '#1a1a1a' }}>Shopping Cart</span>
      </nav>

      {/* Main Container */}
      <main className="cart-container">
        {/* Main Header with Clear Cart */}
        <div className="cart-page-header">
          <div>
            <h1 className="cart-title">Your Secure Shopping Cart</h1>
            <p className="cart-subtitle">
              All orders are routed via localized physical verification hubs and protected in locked Escrow vaults.
            </p>
          </div>
          {cartItems.length > 0 && (
            <button className="cart-clear-all-btn" onClick={handleClearCart}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <span>Clear Cart</span>
            </button>
          )}
        </div>

        {cartItems.length === 0 && checkoutStep === 'idle' ? (
          /* Empty State */
          <div className="cart-empty-card">
            <div className="cart-empty-icon-wrap">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h2>Your Shopping Cart is Empty</h2>
            <p>You haven't locked in any certified products yet. Explore the products store to secure your first order.</p>
            <Link href="/buyer/products" className="cart-explore-btn">
              Explore Products Catalog
            </Link>
          </div>
        ) : (
          /* Two Column Bento Grid layout */
          <div className="cart-grid">
            
            {/* Left: Items list */}
            <div className="cart-items-list">
              {cartItems.map(p => (
                <div key={p.id} className={`cart-item-row ${removingId === p.id || isClearingAll ? 'cart-item-row--removing' : ''}`}>
                  
                  {/* Thumbnail Image */}
                  <div className="cart-item-row__img-wrap">
                    <img src={p.img} alt={p.name} className="cart-item-row__img" />
                  </div>

                  {/* Product Details */}
                  <div className="cart-item-row__details">
                    <span className="cart-item-row__brand">{p.brand}</span>
                    <h3 className="cart-item-row__name">
                      <Link href={`/buyer/products/${p.id}`}>{p.name}</Link>
                    </h3>
                    <div className="cart-item-row__specs">
                      <span>Color: <strong>{p.selectedColor}</strong></span>
                      <span className="cart-item-row__specs-dot" />
                      <span>Size: <strong>{p.selectedSize}</strong></span>
                    </div>
                    {p.verified && (
                      <span className="cart-item-row__verified">
                        🛡️ 100% EMAHU Hub Verified
                      </span>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div className="cart-item-row__qty">
                    <span className="cart-qty-label">QTY</span>
                    <div className="cart-qty-controls">
                      <button onClick={() => handleQuantityChange(p.id, -1)} aria-label="Decrease Qty">
                        −
                      </button>
                      <span>{p.quantity}</span>
                      <button onClick={() => handleQuantityChange(p.id, 1)} aria-label="Increase Qty">
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total price calculation */}
                  <div className="cart-item-row__price-block">
                    <div className="cart-item-row__price">
                      ₹{(p.price * p.quantity).toLocaleString('en-IN')}
                    </div>
                    <div className="cart-item-row__rate">
                      ₹{p.price.toLocaleString('en-IN')} each
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button 
                    className="cart-item-row__remove"
                    onClick={() => handleRemove(p.id)}
                    aria-label="Remove item"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>

                </div>
              ))}
            </div>

            {/* Right: Order Summary Bento card */}
            <div className="cart-summary-bento">
              <h2 className="cart-summary-title">Order Safety Summary</h2>
              
              <div className="cart-summary-rows">
                <div className="cart-summary-row">
                  <span>Subtotal ({cartItems.reduce((acc, p) => acc + p.quantity, 0)} items)</span>
                  <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
                </div>

                <div className="cart-summary-row">
                  <span>Certified Inspection & Transit Shipping</span>
                  <strong>
                    {shippingFee === 0 ? (
                      <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '800' }}>🚚 FREE SHIPPING</span>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </strong>
                </div>

                <div className="cart-summary-row">
                  <span>Vault Escrow Tax (CGST + SGST 18%)</span>
                  <strong>₹{taxAmount.toLocaleString('en-IN')}</strong>
                </div>

                {subtotal < 50000 && (
                  <div className="cart-shipping-notice">
                    ⚡ Add <strong>₹{(50000 - subtotal).toLocaleString('en-IN')}</strong> more in value to unlock <strong>FREE Express Shipping!</strong>
                  </div>
                )}

                <div className="cart-summary-divider" />

                <div className="cart-summary-row cart-summary-row--total">
                  <span>Escrow Grand Total</span>
                  <strong>₹{grandTotal.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Trust Badge Indicators */}
              <div className="cart-summary-trust">
                <div className="cart-trust-item">
                  <span className="cart-trust-item__dot" style={{ backgroundColor: '#4169e1' }} />
                  <div>
                    <strong>Secure Escrow Locks Protection</strong>
                    <p>Funds held in safety escrow, released only when you inspect and verify delivery.</p>
                  </div>
                </div>
                <div className="cart-trust-item">
                  <span className="cart-trust-item__dot" style={{ backgroundColor: '#10b981' }} />
                  <div>
                    <strong>Carbon-Neutral Fast EV Transit</strong>
                    <p>Zero carbon emission localized EV couriers route directly to your door.</p>
                  </div>
                </div>
              </div>

              {/* Large Matte Checkout Button */}
              <Link href="/buyer/checkout" className="cart-checkout-btn" style={{ textDecoration: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Proceed to Secure Escrow</span>
              </Link>

            </div>

          </div>
        )}
      </main>

      {/* ─── SECURE ESCROW CHECKOUT MODAL OVERLAY ─── */}
      {checkoutStep !== 'idle' && (
        <div className="cart-modal-overlay">
          <div className="cart-modal">
            
            {checkoutStep === 'securing' && (
              <div className="cart-securing-state">
                <div className="cart-rotating-vault">
                  <div className="cart-rotating-ring" />
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4169e1" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h2>Securing Vault Lock Pipeline...</h2>
                <p>Transferring payment of <strong>₹{grandTotal.toLocaleString('en-IN')}</strong> safely into military-grade escrow holdings vault.</p>
                <div className="cart-progress-bar">
                  <div className="cart-progress-fill" />
                </div>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="cart-success-state">
                <div className="cart-success-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2>Escrow Transaction Locked!</h2>
                <p className="cart-success-desc">
                  Your funds are secured completely! The merchant has been ordered to dispatch the delivery. Funds are locked and will be sent to the merchant only after your doorstep delivery approval check.
                </p>
                <div className="cart-order-receipt">
                  <div className="receipt-row">
                    <span>Transaction Code:</span>
                    <strong>EMH_{Math.floor(100000 + Math.random() * 900000)}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Vault Guaranteed Total:</span>
                    <strong style={{ color: '#10b981' }}>₹{grandTotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Courier Transit:</span>
                    <strong>Carbon-Neutral EV Express</strong>
                  </div>
                </div>
                <div className="cart-success-actions">
                  <Link href="/buyer/products" className="wl-btn-outline" onClick={() => setCheckoutStep('idle')} style={{ textDecoration: 'none', textAlign: 'center' }}>
                    Keep Buying Products
                  </Link>
                  <Link href="/buyer" className="wl-btn-solid" onClick={() => setCheckoutStep('idle')} style={{ textDecoration: 'none', textAlign: 'center' }}>
                    Back to Home Screen
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
