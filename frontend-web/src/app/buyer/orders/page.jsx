'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BuyerHeader from '@/components/buyer_home/buyer_header';
import './orders.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [disputedOrderId, setDisputedOrderId] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputedOrdersList, setDisputedOrdersList] = useState([]);
  const [releasedOrdersList, setReleasedOrdersList] = useState([]);

  // Load orders history from localStorage on mount
  useEffect(() => {
    const loadRealOrders = () => {
      try {
        const storedOrders = localStorage.getItem('emahu_orders');
        if (storedOrders) {
          setOrders(JSON.parse(storedOrders));
        } else {
          // Mock seed orders if none exist for a professional look
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
              total: 31958, // Price + Tax + Shipping
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
          setOrders(seedOrders);
        }
      } catch(e) {
        console.error(e);
      }
    };

    loadRealOrders();
    window.addEventListener('storage', loadRealOrders);
    return () => window.removeEventListener('storage', loadRealOrders);
  }, []);

  // Action: Release funds from Escrow Vault directly to Merchant
  const handleReleaseFunds = (orderId) => {
    const confirmation = window.confirm("Are you absolutely sure the package has arrived safely and is in perfect condition? Releasing the escrow locks will transfer funds directly to the merchant. This action CANNOT be reversed!");
    if (!confirmation) return;

    setReleasedOrdersList(prev => [...prev, orderId]);
    // Update local state status
    const updated = orders.map(ord => {
      if (ord.orderId === orderId) {
        return { ...ord, status: '🔓 FUNDS RELEASED' };
      }
      return ord;
    });
    setOrders(updated);
    localStorage.setItem('emahu_orders', JSON.stringify(updated));
  };

  // Action: Raise Quality Dispute / Reject Delivery
  const handleRaiseDispute = (e) => {
    e.preventDefault();
    if (!disputeReason) return;
    
    setDisputedOrdersList(prev => [...prev, disputedOrderId]);
    
    const updated = orders.map(ord => {
      if (ord.orderId === disputedOrderId) {
        return { ...ord, status: '⚠️ VAULT DISPUTED / FROZEN' };
      }
      return ord;
    });
    setOrders(updated);
    localStorage.setItem('emahu_orders', JSON.stringify(updated));
    setDisputedOrderId(null);
    setDisputeReason('');
  };

  return (
    <div className="orders-page">
      <BuyerHeader />

      {/* Breadcrumb */}
      <nav className="orders-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/buyer">Buyer</Link>
        <span>/</span>
        <span style={{ color: '#1a1a1a' }}>My Locked Orders</span>
      </nav>

      {/* Container */}
      <main className="orders-container">
        <div className="orders-header-row">
          <div>
            <h1 className="orders-title">Escrow Vault Transactions</h1>
            <p className="orders-subtitle">
              Monitor and control your active escrow transactions. Capital is safely frozen inside military-grade vault holdings and will only be released to the merchant once you physically inspect and approve delivery status.
            </p>
          </div>
          <div className="orders-vault-stats-card">
            <div className="vault-stat-item">
              <span className="vault-stat-dot" style={{ backgroundColor: '#4169e1' }} />
              <div>
                <strong>Active Locks</strong>
                <span>{orders.filter(o => !o.status.includes('RELEASED') && !o.status.includes('DISPUTED')).length} Orders</span>
              </div>
            </div>
            <div className="vault-stat-item">
              <span className="vault-stat-dot" style={{ backgroundColor: '#10b981' }} />
              <div>
                <strong>Released</strong>
                <span>{orders.filter(o => o.status.includes('RELEASED')).length} Orders</span>
              </div>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          /* Empty state */
          <div className="orders-empty-card">
            <div className="orders-empty-icon-wrap">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h2>No Transaction History Found</h2>
            <p>You haven't initiated any locked escrow orders yet. Fill your shopping cart with certified products and check out to start.</p>
            <Link href="/buyer/products" className="orders-explore-btn">
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Orders list */
          <div className="orders-list">
            {orders.map(ord => {
              const isDisputed = disputedOrdersList.includes(ord.orderId) || ord.status.includes('DISPUTED') || ord.sellerRejected;
              const isReleased = releasedOrdersList.includes(ord.orderId) || ord.status.includes('RELEASED');
              const isLocked = !isDisputed && !isReleased;
              
              return (
                <div key={ord.orderId} className={`order-card ${isDisputed ? 'order-card--disputed' : ''} ${isReleased ? 'order-card--released' : ''} ${isLocked ? 'order-card--locked' : ''}`}>
                  
                  {/* Card Header summary */}
                  <div className="order-card-header">
                    <div>
                      <span className="order-card-label">ESCROW LOCK ID</span>
                      <Link href={`/buyer/track?id=${ord.orderId}`} className="order-card-val" style={{ color: '#4169e1', textDecoration: 'underline' }}>
                        {ord.orderId}
                      </Link>
                    </div>
                    <div>
                      <span className="order-card-label">DATE INITIATED</span>
                      <strong className="order-card-val">{ord.date}</strong>
                    </div>
                    <div>
                      <span className="order-card-label">VAULT CAPITAL</span>
                      <strong className="order-card-val" style={{ color: '#0f172a' }}>₹{ord.total.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="order-card-label">LOCK STATE</span>
                      <span className={`order-status-badge ${isDisputed ? 'badge-disputed' : ''} ${isReleased ? 'badge-released' : ''} ${isLocked ? 'badge-locked' : ''}`}>
                        {ord.status}
                      </span>
                    </div>
                  </div>

                  {/* List of ordered products inside */}
                  <div className="order-card-body">
                    <div className="order-card-items">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="order-item-row">
                          <img src={item.img} alt={item.name} className="order-item-img" />
                          <div className="order-item-details">
                            <span className="order-item-brand">{item.brand}</span>
                            <h4 className="order-item-name">{item.name}</h4>
                            <span className="order-item-qty">Qty: <strong>{item.quantity}</strong></span>
                          </div>
                          <div className="order-item-price">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery details if exist */}
                    {ord.deliveryAddress && (
                      <div className="order-card-delivery">
                        <h4 className="delivery-card-title">🔐 Destination & Transit Guarantee</h4>
                        <div className="delivery-info-grid">
                          <div>
                            <span>Recipient</span>
                            <strong>{ord.deliveryAddress.fullName} ({ord.deliveryAddress.phone})</strong>
                          </div>
                          <div>
                            <span>Shipping Route</span>
                            <strong style={{ textTransform: 'capitalize' }}>Emahu EV Priority {ord.shippingSpeed || 'Express'} Speed</strong>
                          </div>
                          <div className="grid-full-width">
                            <span>Secured Address</span>
                            <strong>{ord.deliveryAddress.address}, {ord.deliveryAddress.city}, {ord.deliveryAddress.stateName} - {ord.deliveryAddress.pincode}</strong>
                          </div>
                        </div>

                        <div className="delivery-info-grid" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                          <div className="grid-full-width">
                            <span>Handling Merchant(s)</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                              {Array.from(new Map(ord.items.map(item => {
                                const seller = item.seller || { name: item.brand || 'Emahu Seller', email: 'support@emahu.com', phone: '+91 99999 99999' };
                                return [seller.name + seller.phone, seller];
                              })).values()).map((seller, sIdx) => (
                                <div key={sIdx} style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 8px', alignItems: 'center', fontSize: '0.85rem' }}>
                                  <span style={{ color: '#0f172a', fontWeight: '600' }}>🚚 Your delivery is handled by this seller: {seller.name}</span>
                                  <span style={{ color: '#475569' }}>(Email: {seller.email})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Escrow assurance operations */}
                  <div className="order-card-footer">
                    <div className="order-vault-info">
                      {isReleased ? (
                        <>
                          <svg className="footer-icon-released" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          </svg>
                          <span>Vault released successfully. Merchant has received the checkout funds. Transaction closed in full.</span>
                        </>
                      ) : (disputedOrdersList.includes(ord.orderId) || ord.status.includes('DISPUTED')) ? (
                        <>
                          <svg className="footer-icon-disputed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <span style={{ color: '#ef4444', fontWeight: '600' }}>Transaction disputed! Vault locked indefinitely. Funds will not be sent to seller until inspection dispute resolves.</span>
                        </>
                      ) : ord.sellerRejected ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            <span style={{ color: '#ef4444', fontWeight: '700' }}>❌ Order Rejected by Seller</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '24px' }}>Escrow Vault Locked: The seller rejected this order. Capital will be automatically returned to your wallet.</span>
                        </div>
                      ) : ord.sellerConfirmed ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span style={{ color: '#10b981', fontWeight: '700' }}>✓ Delivery Confirmed by Seller</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '24px' }}>Escrow Protected: Money remains inside safety vault. Seller cannot withdraw balance.</span>
                        </div>
                      ) : (
                        <>
                          <svg className="footer-icon-locked" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4169e1" strokeWidth="2.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <span>Escrow Protected: Money remains inside safety vault. Seller cannot withdraw balance.</span>
                        </>
                      )}
                    </div>

                    <div className="order-actions">
                      <Link href={`/buyer/track?id=${ord.orderId}`} className="orders-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '0.8rem', fontWeight: '750', textDecoration: 'none', border: '1.5px solid #cbd5e1', color: '#475569', borderRadius: '6px' }}>
                        🚛 Track Transit
                      </Link>
                      {!isReleased && !isDisputed && (ord.sellerConfirmed || ['DELIVERY_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(ord.status)) && (
                        <>
                          <button className="orders-btn-outline-danger" onClick={() => setDisputedOrderId(ord.orderId)}>
                            ⚠️ Raise Dispute / Reject
                          </button>
                          <button className="orders-btn-success" onClick={() => handleReleaseFunds(ord.orderId)}>
                            🔓 Release Vault to Merchant
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── RAISE QUALITY DISPUTE MODAL OVERLAY ─── */}
      {disputedOrderId && (
        <div className="orders-modal-overlay">
          <div className="orders-modal">
            <div className="dispute-modal-content">
              <div className="dispute-modal-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2>Raise Quality Dispute / Reject Delivery</h2>
              <p>Locked order funds will be frozen inside the secure Escrow vault. Emahu arbitrates dispute verification, and the merchant will not receive payment until the product has been retrieved, evaluated, or replaced.</p>
              
              <form onSubmit={handleRaiseDispute}>
                <div className="dispute-form-group">
                  <label>Select Dispute Reason</label>
                  <select 
                    value={disputeReason} 
                    onChange={(e) => setDisputeReason(e.target.value)} 
                    required
                  >
                    <option value="">-- Select reason for quality rejection --</option>
                    <option value="fake">Authenticity Issue (Counterfeit item suspected)</option>
                    <option value="broken">Physical damage / Cracked screen / Tear in fabric</option>
                    <option value="missing">Incomplete parts / Missing items inside package</option>
                    <option value="wrong">Wrong product size or color shipped by merchant</option>
                  </select>
                </div>

                <div className="orders-modal-actions">
                  <button type="button" className="orders-btn-outline" onClick={() => setDisputedOrderId(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="orders-btn-danger">
                    Freeze Vault Funds Indefinitely
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
