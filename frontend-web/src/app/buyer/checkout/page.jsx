'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BuyerHeader from '@/components/buyer_home/buyer_header';
import './checkout.css';

const ALL_PRODUCTS = [];

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [shippingSpeed, setShippingSpeed] = useState('express'); // standard | express
  const [escrowMethod, setEscrowMethod] = useState('wallet'); // wallet | card | upi
  const [checkoutStep, setCheckoutStep] = useState('idle'); // idle | securing | success
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  const [orderSellers, setOrderSellers] = useState([]);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  // Load items from localstorage and backend
  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        let formattedList = [];
        if (data.success) {
          formattedList = data.products.map(p => {
            let mappedCategory = p.category;
            if (p.category === 'Electronics') mappedCategory = 'Tech';
            else if (p.category === 'Fitness' || p.category === 'Furniture') mappedCategory = 'Lifestyle';

            return {
              id: p.id || p._id,
              name: p.name,
              brand: p.brand || p.seller?.name || 'Emahu Seller',
              category: mappedCategory,
              price: p.price,
              original: p.comparePrice || p.price,
              discount: p.comparePrice ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0,
              rating: p.rating || 4.7,
              reviews: p.reviews || 84,
              img: p.image || '📦',
              verified: true,
              isNew: true,
              isHot: false,
              onSale: p.comparePrice ? (p.price < p.comparePrice) : false,
              seller: p.seller || { name: p.brand || 'Emahu Seller', email: 'support@emahu.com', phone: '+91 99999 99999' }
            };
          });
        }

        const storedCart = localStorage.getItem('emahu_cart');
        if (storedCart) {
          const parsed = JSON.parse(storedCart);
          const matched = parsed.map(cItem => {
            const cItemId = typeof cItem === 'object' ? cItem.id : cItem;
            const prod = formattedList.find(p => p.id.toString() === cItemId.toString());
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
      } catch (err) {
        console.error(err);
      }
    };

    loadCheckoutData();
  }, []);

  const subtotal = cartItems.reduce((acc, p) => acc + (p.price * p.quantity), 0);
  const shippingFee = subtotal === 0 ? 0 : (shippingSpeed === 'express' ? (subtotal > 50000 ? 0 : 199) : (subtotal > 50000 ? 0 : 99));
  const taxAmount = Math.round(subtotal * 0.18); // 18% Escrow Tax
  const grandTotal = subtotal + shippingFee + taxAmount;

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    // Validate fields
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !address.trim() ||
      !city.trim() ||
      !stateName.trim() ||
      !pincode.trim()
    ) {
      alert('Please fill out all address and contact fields.');
      return;
    }

    // Save unique sellers for success screen before clearing cartItems
    const sellers = cartItems.map(p => p.seller || { name: p.brand || 'Emahu Seller', email: 'support@emahu.com', phone: '+91 99999 99999' });
    const unique = Array.from(new Map(sellers.map(s => [s.email + s.name, s])).values());
    setOrderSellers(unique);

    // Step 1: Secure Escrow Locking Animation
    setCheckoutStep('securing');

    setTimeout(() => {
      // Step 2: Push to local escrow vault storage
      try {
        const storedOrdersStr = localStorage.getItem('emahu_orders') || '[]';
        const storedOrders = JSON.parse(storedOrdersStr);
        const notifications = JSON.parse(localStorage.getItem('emahu_notifications') || '[]');

        // Group cart items by seller
        const itemsBySeller = {};
        cartItems.forEach(item => {
          // Use all available seller identifiers to build the sellerId key
          const sellerId = item.seller?._id || item.seller?.id || item.seller?.email || 'default_seller';
          if (!itemsBySeller[sellerId]) {
            itemsBySeller[sellerId] = [];
          }
          itemsBySeller[sellerId].push(item);
        });

        const placedOrderIds = [];

        Object.entries(itemsBySeller).forEach(([sellerId, items]) => {
          const orderId = `EMH_${Math.floor(100000 + Math.random() * 900000)}`;
          placedOrderIds.push(orderId);

          const sellerSubtotal = items.reduce((acc, p) => acc + (p.price * p.quantity), 0);
          const sellerShippingFee = sellerSubtotal === 0 ? 0 : (shippingSpeed === 'express' ? (sellerSubtotal > 50000 ? 0 : 199) : (sellerSubtotal > 50000 ? 0 : 99));
          const sellerTaxAmount = Math.round(sellerSubtotal * 0.18);
          const sellerGrandTotal = sellerSubtotal + sellerShippingFee + sellerTaxAmount;

          // Capture the actual seller object from the first item in this group
          const sellerObj = items[0]?.seller || null;

          storedOrders.push({
            orderId: orderId,
            // Store seller identity with all possible ID formats for reliable dashboard matching
            sellerId: sellerObj?._id || sellerObj?.id || sellerId,
            sellerEmail: sellerObj?.email || null,
            userId: localStorage.getItem('emahu_buyer_user') ? JSON.parse(localStorage.getItem('emahu_buyer_user')).id : 'guest_buyer',
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            items: items.map(p => ({
              productId: p.id,        // ← critical: used by seller dashboard to match by product ownership
              name: p.name,
              price: p.price,
              quantity: p.quantity,
              brand: p.brand,
              img: p.img,
              seller: p.seller || { name: p.brand || 'Emahu Seller', email: 'support@emahu.com', phone: '+91 99999 99999' }
            })),
            total: sellerGrandTotal,
            status: 'PENDING_APPROVAL',
            timeline: [
              { status: 'PENDING_APPROVAL', label: 'Payment Completed', desc: '⏳ Waiting for Seller Approval', date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
            ],
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

          // Push Notifications
          notifications.unshift({
            id: `notif_${Date.now()}_buyer_${orderId}`,
            title: 'Payment Success',
            message: `Your payment of ₹${sellerGrandTotal.toLocaleString('en-IN')} has been locked. Waiting for seller approval for Order #${orderId}.`,
            role: 'buyer',
            date: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false
          });
          notifications.unshift({
            id: `notif_${Date.now()}_seller_${orderId}`,
            title: 'New Order Received',
            message: `New order received. Approval required for Order #${orderId}.`,
            role: 'seller',
            date: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false
          });
        });

        setGeneratedOrderId(placedOrderIds.join(', '));
        localStorage.setItem('emahu_orders', JSON.stringify(storedOrders));
        localStorage.setItem('emahu_notifications', JSON.stringify(notifications));
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
              Transaction ID <strong>{generatedOrderId}</strong> has been secured in Emahu&apos;s Smart Escrow Vault. 
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

              {orderSellers.map((seller, sIdx) => (
                <div key={sIdx} className="co-seller-info-block" style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', marginTop: '12px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '600', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.9rem' }}>🚚 Your delivery is handled by:</span>
                    <strong style={{ color: '#4169e1' }}>{seller.name || 'Emahu Seller'}</strong>
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.85rem', paddingLeft: '4px' }}>
                    <span>Email: <strong>{seller.email || 'N/A'}</strong></span>
                  </div>
                </div>
              ))}
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
                    <span><strong>Military-grade Protection:</strong> Funds remain inside your safety locked escrow wallet and will not be transferred to the merchant&apos;s balance until you verify delivery status in your orders pane.</span>
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
