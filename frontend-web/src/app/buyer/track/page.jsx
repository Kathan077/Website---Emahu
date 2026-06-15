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
              {
                name: 'Sony WH-1000XM5 Headphones',
                price: 26999,
                quantity: 1,
                brand: 'Sony',
                img: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80',
                seller: {
                  name: 'Sony India Retail',
                  email: 'retail@sony.co.in',
                  phone: '+91 1800 103 7799'
                }
              }
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
    const isRejected = status === 'REJECTED';
    
    const statusOrder = [
      'PENDING_APPROVAL',
      'APPROVED',
      'DELIVERY_ASSIGNED',
      'LABEL_GENERATED',
      'READY_FOR_PICKUP',
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'COMPLETED'
    ];
    
    const statusVal = status === '🔓 FUNDS RELEASED' ? 'COMPLETED' : (status === '⚠️ VAULT DISPUTED / FROZEN' ? 'COMPLETED' : status);
    const currentIndex = statusOrder.indexOf(statusVal);
    
    const stepsData = [
      {
        title: 'Payment Completed',
        desc: '✅ Checkout lock success. Escrow vault capital secured.',
        status: 'PAYMENT_COMPLETED'
      },
      {
        title: 'Seller Approval Pending',
        desc: '⏳ Awaiting approval from merchant listing owner.',
        status: 'PENDING_APPROVAL'
      },
      {
        title: 'Seller Approved',
        desc: '✅ Order approved by the seller.',
        status: 'APPROVED'
      },
      {
        title: 'Delivery Partner Assigned',
        desc: '🚚 Assigning courier partner and printing package manifest tags.',
        status: 'DELIVERY_ASSIGNED'
      },
      {
        title: 'Shipping Label Generated',
        desc: '📄 Shipping label has been generated successfully.',
        status: 'LABEL_GENERATED'
      },
      {
        title: 'Ready For Pickup',
        desc: '📦 Package is packed and ready for carrier pickup.',
        status: 'READY_FOR_PICKUP'
      },
      {
        title: 'Picked Up',
        desc: '📦 Package picked up by courier partner dispatch agent.',
        status: 'PICKED_UP'
      },
      {
        title: 'In Transit',
        desc: '🚛 Package in transit via EV highway cargo corridor.',
        status: 'IN_TRANSIT'
      },
      {
        title: 'Out For Delivery',
        desc: '🛵 Package is out with local dispatch rider. Arriving today.',
        status: 'OUT_FOR_DELIVERY'
      },
      {
        title: 'Delivered',
        desc: '🎉 Package delivered. Awaiting escrow release.',
        status: 'DELIVERED'
      },
      {
        title: 'Order Completed',
        desc: '✅ Escrow release confirmation received. Transaction completed.',
        status: 'COMPLETED'
      }
    ];

    return stepsData.map((step, idx) => {
      let state = 'upcoming';
      
      if (isRejected) {
        if (idx === 0) state = 'completed';
        else if (idx === 1) state = 'disputed'; // Rejection indicator color
      } else {
        if (idx === 0) {
          state = 'completed';
        } else {
          const statusIdx = idx - 1;
          if (statusIdx < currentIndex) {
            state = 'completed';
          } else if (statusIdx === currentIndex) {
            state = 'current';
          }
        }
      }

      // Read custom dates or descriptions from timeline array if stored
      const matchedLog = activeOrder?.timeline?.find(t => t.status === step.status || (step.status === 'COMPLETED' && t.status === 'DELIVERED'));
      const displayDesc = matchedLog ? matchedLog.desc : step.desc;
      const displayDate = matchedLog ? matchedLog.date : (state === 'completed' || state === 'current' ? 'Processed' : 'Awaiting update');

      return {
        title: step.title,
        desc: displayDesc,
        date: displayDate,
        state
      };
    });
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
                    {idx < 10 && <div className="step-connector-line" />}
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

            {/* Courier Details */}
            {activeOrder.carrier && (
              <div className="sidebar-info-block" style={{ borderLeft: '3px solid #10b981', paddingTop: '16px' }}>
                <h3>🚚 Dispatch Logistics</h3>
                <div className="sidebar-metrics-grid">
                  <div>
                    <span>Delivery Partner</span>
                    <strong>{activeOrder.carrier}</strong>
                  </div>
                  <div>
                    <span>Tracking Number</span>
                    <strong style={{ color: '#4169e1' }}>{activeOrder.trackingId}</strong>
                  </div>
                  <div>
                    <span>Estimated Delivery</span>
                    <strong>{activeOrder.estDays || 'N/A'}</strong>
                  </div>
                  <div>
                    <span>Fulfillment Cost</span>
                    <strong>₹{activeOrder.deliveryCost || '0'}</strong>
                  </div>
                </div>
              </div>
            )}

            {activeOrder.status === 'REJECTED' && activeOrder.rejectionReason && (
              <div className="sidebar-info-block" style={{ borderLeft: '3px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)', paddingTop: '16px' }}>
                <h3 style={{ color: '#ef4444' }}>❌ Order Rejected</h3>
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginBottom: '2px' }}>Reason:</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#0f172a' }}>{activeOrder.rejectionReason}</p>
                </div>
              </div>
            )}

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

            {/* Handling Seller Details */}
            <div className="sidebar-info-block">
              <h3>🚚 Transit Handling Seller</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Array.from(new Map(activeOrder.items.map(item => {
                  const seller = item.seller || { name: item.brand || 'Emahu Seller', email: 'support@emahu.com', phone: '+91 99999 99999' };
                  return [seller.name + seller.phone, seller];
                })).values()).map((seller, sIdx) => (
                  <div key={sIdx} className="sidebar-address-block" style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>Handling Seller</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{seller.name}</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#475569' }}>
                      Email: <strong>{seller.email}</strong>
                    </p>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', marginBottom: '8px' }}>
                      <span>✓ Delivery is handled by this seller</span>
                    </div>
                    {activeOrder.sellerConfirmed ? (
                      <div style={{ padding: '6px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>✓ Delivery Approved by Seller</span>
                      </div>
                    ) : activeOrder.sellerRejected ? (
                      <div style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="4">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        <span>❌ Delivery Rejected by Seller</span>
                      </div>
                    ) : (
                      <div style={{ padding: '6px 10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                        <span>Awaiting Seller Delivery Confirmation</span>
                      </div>
                    )}
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
