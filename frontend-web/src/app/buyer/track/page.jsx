'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BuyerHeader from '@/components/buyer_home/buyer_header';
import './track.css';

// Separate core tracking logic so Suspense boundary works perfectly in Next.js
function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryId = searchParams.get('id') || '';

  const [searchId, setSearchId] = useState(queryId);
  const [activeOrder, setActiveOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Loaded orders list from localStorage
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    try {
      const storedOrders = localStorage.getItem('emahu_orders');
      if (storedOrders) {
        setAllOrders(JSON.parse(storedOrders));
      } else {
        // Fallback seed orders if none exist
        const seedOrders = [
          {
            orderId: 'EMH_772918',
            date: '24 May 2026',
            items: [
              { name: 'Sony WH-1000XM5 Headphones', price: 26999, quantity: 1, brand: 'Sony', img: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80' }
            ],
            total: 31958,
            status: '🔒 ESCROW VAULT SECURED',
            shippingSpeed: 'standard',
            escrowMethod: 'wallet',
            deliveryAddress: {
              fullName: 'Rahul Sharma',
              phone: '+91 98765 43210',
              email: 'rahul@example.com',
              address: 'Block A, Apex Greens, Sector 45',
              city: 'Noida',
              stateName: 'Uttar Pradesh',
              pincode: '201303'
            }
          }
        ];
        localStorage.setItem('emahu_orders', JSON.stringify(seedOrders));
        setAllOrders(seedOrders);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Update tracking view if query param ID changes or if orders loaded
  useEffect(() => {
    if (queryId && allOrders.length > 0) {
      const found = allOrders.find(ord => ord.orderId.toLowerCase() === queryId.trim().toLowerCase());
      if (found) {
        setActiveOrder(found);
        setErrorMsg('');
        setSearchId(queryId);
      } else {
        setActiveOrder(null);
        setErrorMsg(`No active transaction found with Escrow Lock ID "${queryId}". Please verify the code and try again.`);
      }
    } else if (!queryId) {
      // If no ID is passed, default to tracking the most recent order if available
      if (allOrders.length > 0) {
        setActiveOrder(allOrders[allOrders.length - 1]);
        setSearchId(allOrders[allOrders.length - 1].orderId);
      }
    }
  }, [queryId, allOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    router.push(`/buyer/track?id=${searchId.trim().toUpperCase()}`);
  };

  // Determine active tracking steps based on status
  const getTrackingSteps = (status) => {
    const isDisputed = status.includes('DISPUTED');
    const isReleased = status.includes('RELEASED');

    return [
      {
        title: 'Vault Capital Secured 🔒',
        desc: 'Escrow capital is locked inside safe wallet. Verified by Emahu smart contracts.',
        date: 'Day 1 - 10:30 AM',
        state: 'completed'
      },
      {
        title: 'EV Dispatched & Cargo Scan 🚛',
        desc: 'Product packaged, labeled with tracking seals, and loaded onto electric priority delivery fleet.',
        date: 'Day 1 - 04:15 PM',
        state: isDisputed ? 'frozen' : 'completed'
      },
      {
        title: 'Transit Route Active 🌐',
        desc: 'Priority routing active. EV courier en route to recipient transit hub.',
        date: 'Day 2 - 09:00 AM',
        state: isDisputed ? 'frozen' : (isReleased ? 'completed' : 'current')
      },
      {
        title: 'Out for Physical Quality Inspection 📦',
        desc: 'Package reached local dispatch. Delivered to destination. Awaiting buyer quality approval.',
        date: 'Day 2 - 02:30 PM',
        state: isDisputed ? 'disputed' : (isReleased ? 'completed' : 'upcoming')
      },
      {
        title: 'Vault Settled & Released 🔓',
        desc: 'Buyer completed visual inspection. Escrow locked capital unlocked and sent to vendor balance.',
        date: isReleased ? 'Day 2 - 03:00 PM' : 'Awaiting confirmation',
        state: isDisputed ? 'frozen' : (isReleased ? 'completed' : 'upcoming')
      }
    ];
  };

  return (
    <div className="track-container">
      {/* Header Search Dashboard */}
      <div className="track-search-section">
        <h1 className="track-main-title">Direct Escrow Track</h1>
        <p className="track-main-subtitle">Enter your Emahu Escrow Lock ID code to trace secure courier dispatch, inspect status, and verify vault holdings.</p>
        
        <form onSubmit={handleSearchSubmit} className="track-search-form">
          <div className="track-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="e.g., EMH_772918" 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="track-search-input"
            />
          </div>
          <button type="submit" className="track-search-btn">
            Trace Escrow Code
          </button>
        </form>

        {errorMsg && <p className="track-error-message">{errorMsg}</p>}
      </div>

      {activeOrder ? (
        <div className="track-grid-layout">
          
          {/* Left Column: Tracking Timeline */}
          <div className="track-timeline-card">
            <div className="timeline-card-header">
              <h3>📦 LIVE DISPATCH & ESCROW STATUS</h3>
              <span className={`track-status-badge ${
                activeOrder.status.includes('DISPUTED') ? 'badge-disputed' : 
                activeOrder.status.includes('RELEASED') ? 'badge-released' : 'badge-locked'
              }`}>
                {activeOrder.status}
              </span>
            </div>

            {/* Alert if Disputed */}
            {activeOrder.status.includes('DISPUTED') && (
              <div className="track-dispute-alert">
                <div className="dispute-alert-icon">⚠️</div>
                <div>
                  <h4>TRANSACTION HOLD: VAULT DISPUTED</h4>
                  <p>Escrow capital remains completely frozen. The courier has been instructed to hold dispatch/delivery. Emahu claims arbitration will contact both parties within 24 hours to resolve quality claims.</p>
                </div>
              </div>
            )}

            {/* Vertical Steps Timeline */}
            <div className="track-steps-list">
              {getTrackingSteps(activeOrder.status).map((step, idx) => (
                <div key={idx} className={`track-step-item step-item--${step.state}`}>
                  <div className="step-bullet-column">
                    <div className="step-bullet-circle">
                      {step.state === 'completed' && '✓'}
                      {step.state === 'disputed' && '!'}
                      {step.state === 'frozen' && '🔒'}
                      {step.state === 'current' && '●'}
                      {step.state === 'upcoming' && ''}
                    </div>
                    {idx < 4 && <div className="step-connector-line" />}
                  </div>
                  <div className="step-text-content">
                    <div className="step-title-row">
                      <h4>{step.title}</h4>
                      <span className="step-timestamp">{step.date}</span>
                    </div>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Order Info Details */}
          <div className="track-info-sidebar">
            
            {/* Escrow summary details */}
            <div className="sidebar-info-block">
              <h3>🔒 Escrow Agreement</h3>
              <div className="sidebar-metrics-grid">
                <div>
                  <span>Escrow Lock ID</span>
                  <strong>{activeOrder.orderId}</strong>
                </div>
                <div>
                  <span>Date Initiated</span>
                  <strong>{activeOrder.date}</strong>
                </div>
                <div>
                  <span>Transit Speed</span>
                  <strong style={{ textTransform: 'capitalize' }}>
                    {activeOrder.shippingSpeed === 'priority' ? 'EV Priority Courier' : 'EV Standard Routing'}
                  </strong>
                </div>
                <div>
                  <span>Vault Capital</span>
                  <strong style={{ color: '#10b981' }}>₹{activeOrder.total.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            {/* Product items summary list */}
            <div className="sidebar-info-block">
              <h3>📦 Locked Merchandise</h3>
              <div className="sidebar-products-stack">
                {activeOrder.items.map((item, idx) => (
                  <div key={idx} className="sidebar-product-row">
                    <img src={item.img} alt={item.name} />
                    <div>
                      <h4>{item.name}</h4>
                      <span>Qty: {item.quantity} • Brand: {item.brand}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery destination Details */}
            {activeOrder.deliveryAddress && (
              <div className="sidebar-info-block">
                <h3>📍 Destination Route</h3>
                <div className="sidebar-address-block">
                  <strong>{activeOrder.deliveryAddress.fullName}</strong>
                  <p>{activeOrder.deliveryAddress.phone} • {activeOrder.deliveryAddress.email}</p>
                  <div className="address-divider" />
                  <p>{activeOrder.deliveryAddress.address}, {activeOrder.deliveryAddress.city}, {activeOrder.deliveryAddress.stateName} - {activeOrder.deliveryAddress.pincode}</p>
                </div>
              </div>
            )}

            {/* Action CTAs */}
            <div className="sidebar-action-ctas">
              <Link href="/buyer/orders" className="track-link-btn track-link-btn--solid">
                📂 Manage Escrow Locks
              </Link>
              <Link href="/buyer/products" className="track-link-btn track-link-btn--outline">
                Start Buying More
              </Link>
            </div>

          </div>

        </div>
      ) : (
        /* Zero State when search yielded nothing */
        <div className="track-zero-state">
          <div className="zero-icon">🔍</div>
          <h3>Trace Active Orders</h3>
          <p>Please enter an Escrow Lock ID above or visit your active transactions directory to start live tracking.</p>
          <Link href="/buyer/orders" className="track-zero-btn">
            View My Locked Orders
          </Link>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <div className="track-page">
      <BuyerHeader />
      
      {/* Breadcrumbs */}
      <nav className="track-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/buyer">Buyer</Link>
        <span>/</span>
        <span style={{ color: '#1a1a1a' }}>Order Tracking</span>
      </nav>

      {/* Main Container */}
      <main className="track-main-wrapper">
        <Suspense fallback={
          <div className="track-loading-state">
            <div className="spinner" />
            <p>Loading escrow tracking details...</p>
          </div>
        }>
          <TrackOrderContent />
        </Suspense>
      </main>
    </div>
  );
}
