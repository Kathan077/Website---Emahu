'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BuyerHeader from '@/components/buyer_home/buyer_header';
import './checkout.css';

/* ─── SHARED PRODUCT SCHEMA (Matches Products listing exactly) ─── */
const ALL_PRODUCTS = [
  { id:1,  name:'iPhone 15 Pro Max 256GB',       brand:'Apple',       category:'Tech',     price:134999, original:159999, discount:16, rating:4.9, reviews:2341, img:'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=600&q=80', verified:true,  isNew:false, isHot:true,  onSale:true  },
  { id:2,  name:'Samsung Galaxy S24 Ultra',       brand:'Samsung',     category:'Tech',     price:109999, original:129999, discount:15, rating:4.8, reviews:1876, img:'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80', verified:true,  isNew:true,  isHot:false, onSale:true  },
  { id:3,  name:'Sony WH-1000XM5 Headphones',    brand:'Sony',        category:'Tech',     price:26999,  original:34990,  discount:23, rating:4.8, reviews:3120, img:'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80', verified:true,  isNew:false, isHot:false, onSale:true  },
  { id:4,  name:'MacBook Air M3 13-inch',         brand:'Apple',       category:'Tech',     price:114999, original:129900, discount:12, rating:4.9, reviews:987,  img:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80', verified:true,  isNew:true,  isHot:true,  onSale:false },
  { id:5,  name:'Nike Air Max 270 React',         brand:'Nike',        category:'Shoes',    price:9995,   original:12995,  discount:23, rating:4.7, reviews:5421, img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', verified:false, isNew:false, isHot:true,  onSale:true  },
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

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [shippingSpeed, setShippingSpeed] = useState('express'); // standard | express
  const [escrowMethod, setEscrowMethod] = useState('wallet'); // wallet | card | upi
  const [checkoutStep, setCheckoutStep] = useState('idle'); // idle | securing | success
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  // Load items from localstorage
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('emahu_cart');
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
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
    } catch (e) {
      console.error(e);
    }
  }, []);

  const subtotal = cartItems.reduce((acc, p) => acc + (p.price * p.quantity), 0);
  const shippingFee = subtotal === 0 ? 0 : (shippingSpeed === 'express' ? (subtotal > 50000 ? 0 : 199) : (subtotal > 50000 ? 0 : 99));
  const taxAmount = Math.round(subtotal * 0.18); // 18% Escrow Tax
  const grandTotal = subtotal + shippingFee + taxAmount;

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    // Validate fields
    if (!fullName || !phone || !email || !address || !city || !stateName || !pincode) {
      alert('Please fill out all address and contact fields.');
      return;
    }

    const orderId = `EMH_${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedOrderId(orderId);

    // Step 1: Secure Escrow Locking Animation
    setCheckoutStep('securing');

    setTimeout(() => {
      // Step 2: Push to local escrow vault storage
      try {
        const storedOrdersStr = localStorage.getItem('emahu_orders') || '[]';
        const storedOrders = JSON.parse(storedOrdersStr);
        storedOrders.push({
          orderId: orderId,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          items: cartItems.map(p => ({
            name: p.name,
            price: p.price,
            quantity: p.quantity,
            brand: p.brand,
            img: p.img
          })),
          total: grandTotal,
          status: '🔒 ESCROW VAULT SECURED',
          deliveryAddress: {
            fullName,
            phone,
            email,
            address,
            city,
            stateName,
            pincode
          },
          shippingSpeed,
          escrowMethod
        });
        localStorage.setItem('emahu_orders', JSON.stringify(storedOrders));
      } catch (err) {
        console.error(err);
      }

      // Step 3: Clear Cart
      setCartItems([]);
      localStorage.setItem('emahu_cart', JSON.stringify([]));
      window.dispatchEvent(new Event('storage'));

      // Move to success step
      setCheckoutStep('success');
    }, 2800);
  };

  return (
    <div className="co-page">
      <BuyerHeader />

      {/* Breadcrumb */}
      <nav className="co-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/buyer">Buyer</Link>
        <span>/</span>
        <Link href="/buyer/cart">Cart</Link>
        <span>/</span>
        <span style={{ color: '#1a1a1a' }}>Checkout Escrow</span>
      </nav>

      <main className="co-container">
        {checkoutStep === 'success' ? (
          /* ESCROW SUCCESSFUL GUARANTEE SCREEN */
          <div className="co-success-card">
            <div className="co-success-badge-pulse">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <path d="M12 15v3" />
                <circle cx="12" cy="15" r="1" />
              </svg>
            </div>
            <h2>Escrow Lock Guaranteed Successfully!</h2>
            <p className="co-success-desc">
              Transaction ID <strong>{generatedOrderId}</strong> has been secured in Emahu's Smart Escrow Vault. 
              The merchant will be notified to package and route your products via our EV Transit grid. 
              Your capital remains locked and protected until you physically inspect and approve delivery!
            </p>
            
            <div className="co-success-summary-box">
              <div className="co-summary-box-row">
                <span>Buyer Account:</span>
                <strong>{fullName}</strong>
              </div>
              <div className="co-summary-box-row">
                <span>Shipping Priority:</span>
                <strong style={{ textTransform: 'uppercase' }}>{shippingSpeed} Delivery</strong>
              </div>
              <div className="co-summary-box-row">
                <span>Locked Amount:</span>
                <strong style={{ color: '#4169e1', fontSize: '1.1rem' }}>₹{grandTotal.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="co-success-actions">
              <Link href="/buyer/products" className="co-btn-outline">
                Continue Shopping
              </Link>
              <Link href="/buyer/orders" className="co-btn-solid">
                Go to Escrow Vault Transactions
              </Link>
            </div>
          </div>
        ) : (
          /* CHECKOUT FORM AND SUMMARY GRID */
          <div className="co-grid">
            
            {/* Left: Secure checkout inputs form */}
            <div className="co-form-section">
              <h1 className="co-section-title">Secure Escrow Lock Setup</h1>
              
              <form onSubmit={handlePlaceOrder} className="co-form">
                
                {/* Section 1: Contact Details */}
                <div className="co-form-bento">
                  <div className="co-bento-header">
                    <span className="co-bento-num">01</span>
                    <h3>Recipient Contact Details</h3>
                  </div>
                  
                  <div className="co-input-group">
                    <label>Full Legal Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rahul Sharma" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="co-input-row">
                    <div className="co-input-group">
                      <label>Active Contact Phone</label>
                      <input 
                        type="tel" 
                        placeholder="e.g. +91 98765 43210" 
                        required 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="co-input-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        placeholder="e.g. rahul@example.com" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Delivery Destination */}
                <div className="co-form-bento">
                  <div className="co-bento-header">
                    <span className="co-bento-num">02</span>
                    <h3>Physical Transit Destination</h3>
                  </div>
                  
                  <div className="co-input-group">
                    <label>Street Address, Building, Floor</label>
                    <input 
                      type="text" 
                      placeholder="House No, Suite, Colony, Sector..." 
                      required 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="co-input-row-three">
                    <div className="co-input-group">
                      <label>City</label>
                      <input 
                        type="text" 
                        placeholder="e.g. New Delhi" 
                        required 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="co-input-group">
                      <label>State</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Delhi" 
                        required 
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                      />
                    </div>
                    <div className="co-input-group">
                      <label>Postal Pincode</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 110001" 
                        required 
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Shipping priority speeds */}
                <div className="co-form-bento">
                  <div className="co-bento-header">
                    <span className="co-bento-num">03</span>
                    <h3>Certified Transit Speed</h3>
                  </div>
                  
                  <div className="co-shipping-options">
                    
                    <div 
                      className={`co-shipping-card ${shippingSpeed === 'standard' ? 'co-shipping-card--selected' : ''}`}
                      onClick={() => setShippingSpeed('standard')}
                    >
                      <div className="co-shipping-radio">
                        <span className="co-shipping-radio-dot" />
                      </div>
                      <div className="co-shipping-details">
                        <div className="co-shipping-title-row">
                          <strong>Standard Secured EV Transit</strong>
                          <span>{subtotal > 50000 ? 'FREE' : '₹99'}</span>
                        </div>
                        <p>Eco-friendly localized delivery in 3 - 5 business days. Full transit insurance included.</p>
                      </div>
                    </div>

                    <div 
                      className={`co-shipping-card ${shippingSpeed === 'express' ? 'co-shipping-card--selected' : ''}`}
                      onClick={() => setShippingSpeed('express')}
                    >
                      <div className="co-shipping-radio">
                        <span className="co-shipping-radio-dot" />
                      </div>
                      <div className="co-shipping-details">
                        <div className="co-shipping-title-row">
                          <strong>Priority Express EV Transit</strong>
                          <span>{subtotal > 50000 ? 'FREE' : '₹199'}</span>
                        </div>
                        <p>High-priority EV courier routing in 1 - 2 business days. Direct door-to-door vault tracking.</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Section 4: Escrow Payment Method */}
                <div className="co-form-bento">
                  <div className="co-bento-header">
                    <span className="co-bento-num">04</span>
                    <h3>Secure Payment Escrow Lock Method</h3>
                  </div>

                  <div className="co-escrow-methods">
                    <div 
                      className={`co-method-tab ${escrowMethod === 'wallet' ? 'co-method-tab--selected' : ''}`}
                      onClick={() => setEscrowMethod('wallet')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                      <strong>Emahu Direct Wallet / UPI</strong>
                    </div>

                    <div 
                      className={`co-method-tab ${escrowMethod === 'card' ? 'co-method-tab--selected' : ''}`}
                      onClick={() => setEscrowMethod('card')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <strong>Certified Credit/Debit Escrow Lock</strong>
                    </div>
                  </div>

                  <div className="co-escrow-guarantee-note">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4169e1" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span><strong>Military-grade Protection:</strong> Funds remain inside your safety locked escrow wallet and will not be transferred to the merchant's balance until you verify delivery status in your orders pane.</span>
                  </div>
                </div>

                {/* Submit button inside mobile viewport, else hidden */}
                <button type="submit" className="co-btn-submit-mobile">
                  Lock & Approve Escrow Purchase (₹{grandTotal.toLocaleString('en-IN')})
                </button>

              </form>
            </div>

            {/* Right Side: Sticky Checkout Cart Summary */}
            <div className="co-summary-section">
              <div className="co-summary-sticky-card">
                <h2 className="co-summary-title">Escrow Capital Details</h2>
                
                {/* Cart items listing */}
                <div className="co-items-list">
                  {cartItems.length === 0 ? (
                    <div className="co-empty-cart-summary">
                      <p>Your cart is empty. Go add some items to lock!</p>
                      <Link href="/buyer/products" className="co-explore-link">Go to Products</Link>
                    </div>
                  ) : (
                    cartItems.map((p, idx) => (
                      <div key={idx} className="co-item-row">
                        <div className="co-item-img-wrap">
                          <img src={p.img} alt={p.name} />
                          <span className="co-item-qty-badge">{p.quantity}</span>
                        </div>
                        <div className="co-item-desc">
                          <span className="co-item-brand">{p.brand}</span>
                          <h4>{p.name}</h4>
                          <span className="co-item-specs">{p.selectedColor} • {p.selectedSize}</span>
                        </div>
                        <div className="co-item-price-block">
                          <strong>₹{(p.price * p.quantity).toLocaleString('en-IN')}</strong>
                          <span>₹{p.price.toLocaleString('en-IN')} each</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="co-summary-divider" />

                {/* Final Breakdown */}
                <div className="co-breakdown">
                  <div className="co-breakdown-row">
                    <span>Products Subtotal</span>
                    <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
                  </div>

                  <div className="co-breakdown-row">
                    <span>Certified Shipping</span>
                    <strong>
                      {shippingFee === 0 ? (
                        <span style={{ color: '#10b981', fontWeight: '800' }}>🚚 FREE</span>
                      ) : (
                        `₹${shippingFee}`
                      )}
                    </strong>
                  </div>

                  <div className="co-breakdown-row">
                    <span>Vault Escrow Tax (GST 18%)</span>
                    <strong>₹{taxAmount.toLocaleString('en-IN')}</strong>
                  </div>

                  <div className="co-summary-divider" style={{ margin: '16px 0' }} />

                  <div className="co-breakdown-row co-breakdown-row--total">
                    <span>Escrow Grand Total</span>
                    <strong>₹{grandTotal.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Big checkout action */}
                {cartItems.length > 0 && (
                  <button 
                    onClick={handlePlaceOrder}
                    className="co-btn-lock-escrow"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Lock & Approve Escrow Purchase</span>
                  </button>
                )}

                {/* Trust badging summary */}
                <div className="co-trust-summary">
                  <div className="co-trust-badge">
                    <span className="co-trust-dot" style={{ backgroundColor: '#4169e1' }} />
                    <p>Locked escrow assurance guarantee</p>
                  </div>
                  <div className="co-trust-badge">
                    <span className="co-trust-dot" style={{ backgroundColor: '#10b981' }} />
                    <p>Carbon-Neutral Fast EV Transit grid</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </main>

      {/* ─── SECURE ESCROW CHECKOUT MODAL OVERLAY ─── */}
      {checkoutStep === 'securing' && (
        <div className="co-modal-overlay">
          <div className="co-modal">
            <div className="co-securing-state">
              <div className="co-rotating-vault">
                <div className="co-rotating-ring" />
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4169e1" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2>Securing Vault Lock Pipeline...</h2>
              <p>Transferring payment of <strong>₹{grandTotal.toLocaleString('en-IN')}</strong> safely into military-grade escrow holdings vault.</p>
              <div className="co-progress-bar">
                <div className="co-progress-fill" />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
