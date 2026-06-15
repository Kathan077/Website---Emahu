'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './dashboard.css';
import { logoutUser, clearAuthSession } from '@/utils/auth';

const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Emahu Smart Luxe Chrono',
    sku: 'EM-CHR-009',
    category: 'Electronics',
    price: 18999,
    comparePrice: 24999,
    stock: 45,
    status: 'in-stock',
    sales: 124,
    image: '⌚'
  },
  {
    id: 'prod-2',
    name: 'SoundAura Pro Headphones',
    sku: 'EM-SND-882',
    category: 'Electronics',
    price: 12500,
    comparePrice: 15999,
    stock: 8,
    status: 'low-stock',
    sales: 340,
    image: '🎧'
  },
  {
    id: 'prod-3',
    name: 'Minimalist Solid Oak Desk',
    sku: 'EM-DSK-310',
    category: 'Furniture',
    price: 28000,
    comparePrice: 35000,
    stock: 12,
    status: 'in-stock',
    sales: 68,
    image: 'Desk'
  },
  {
    id: 'prod-4',
    name: 'AuraRing Smart Health Tracker',
    sku: 'EM-RNG-041',
    category: 'Fitness',
    price: 9500,
    comparePrice: 12000,
    stock: 0,
    status: 'out-of-stock',
    sales: 198,
    image: '💍'
  }
];



// Helper functions to keep React rendering functions pure (required by ESLint rules)
const getTimestampString = () => Date.now().toString();
const getRandomNumberStr = (min, max) => Math.floor(min + Math.random() * (max - min)).toString();
const getRandomWeightStr = () => `${(1.5 + Math.random() * 3).toFixed(2)} kg`;
const generateNotificationId = () => `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

export default function EmahuProDashboard() {
  const router = useRouter();
  const [sellerUser, setSellerUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Verification session hook
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('emahu_seller_logged_in') === 'true';
    if (!isLoggedIn) {
      router.replace('/seller/login');
      return;
    }
    
    const storedUser = localStorage.getItem('emahu_seller_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setTimeout(() => {
          setSellerUser(parsedUser);
          setIsAuthorized(true);
        }, 0);
      } catch (e) {
        console.error('Error parsing stored seller user:', e);
        setTimeout(() => setIsAuthorized(true), 0);
      }
    } else {
      setTimeout(() => setIsAuthorized(true), 0);
    }
  }, [router]);

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
    clearAuthSession('seller');
    router.push('/seller/login');
  };
  
  // Ref for GSTIN text selection to match user screenshot
  const gstinRef = useRef(null);

  // Dashboard Tabs: 'overview', 'products', 'orders', 'analytics', 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Settings tab focus helper
  useEffect(() => {
    if (activeTab === 'settings') {
      const timer = setTimeout(() => {
        if (gstinRef.current) {
          gstinRef.current.focus();
          gstinRef.current.select();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);
  
  // Dynamic Product State
  const [products, setProducts] = useState([]);

  // Fetch seller's products from backend API
  useEffect(() => {
    const fetchSellerProducts = async () => {
      try {
        const token = localStorage.getItem('emahu_seller_token');
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/products/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          clearAuthSession('seller');
          router.replace('/seller/login');
          return;
        }
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
        } else {
          console.error('Failed to fetch seller products:', data.error);
        }
      } catch (err) {
        console.error('Error fetching seller products:', err);
      }
    };
    if (isAuthorized) {
      fetchSellerProducts();
    }
  }, [isAuthorized]);

  // Dynamic Orders State
  const [orders, setOrders] = useState([]);

  // Fetch real-time orders from localStorage to sync with buyer checkout
  useEffect(() => {
    const loadRealOrders = () => {
      try {
        let storedOrders = localStorage.getItem('emahu_orders');
        if (!storedOrders) {
          storedOrders = '[]';
          localStorage.setItem('emahu_orders', '[]');
        }
        
        if (sellerUser) {
          const parsed = JSON.parse(storedOrders);
          
          const sellerUserId = (sellerUser._id || sellerUser.id || '').toString();
          const sellerUserEmail = (sellerUser.email || '').toLowerCase().trim();
          const myProductIds = new Set((products || []).map(p => (p._id || p.id || '').toString()).filter(Boolean));
          const myProductNames = new Set((products || []).map(p => (p.name || '').toLowerCase().trim()).filter(Boolean));

          console.group('[Emahu Dashboard] Filtering Orders');
          console.log('Seller ID:', sellerUserId);
          console.log('Seller Email:', sellerUserEmail);
          console.log('Seller Product IDs:', Array.from(myProductIds));
          console.log('Seller Product Names:', Array.from(myProductNames));
          console.log('Total Orders in localStorage:', parsed.length);
          
          // Filter orders to only show those that contain items belonging to this seller
          let myOrders = parsed.filter(o => {
            // Signal 1: Check order-level sellerId
            const orderSellerId = (o.sellerId || '').toString();
            if (orderSellerId && sellerUserId && orderSellerId === sellerUserId) {
              console.log(`Order #${o.orderId} matches on Signal 1 (order.sellerId: ${orderSellerId})`);
              return true;
            }

            // Signal 2: Check order-level sellerEmail
            const orderSellerEmail = (o.sellerEmail || '').toLowerCase().trim();
            if (orderSellerEmail && sellerUserEmail && orderSellerEmail === sellerUserEmail) {
              console.log(`Order #${o.orderId} matches on Signal 2 (order.sellerEmail: ${orderSellerEmail})`);
              return true;
            }

            // Inspect items list
            const itemsList = o.items || [];
            const hasMatchingItem = itemsList.some(item => {
              // Signal 3: Match on item's seller object ID
              if (item.seller) {
                if (typeof item.seller === 'string') {
                  if (sellerUserId && item.seller.toString() === sellerUserId) {
                    console.log(`Order #${o.orderId} item matches on Signal 3 (item.seller ID string: ${item.seller})`);
                    return true;
                  }
                } else {
                  const itemSellerId = (item.seller._id || item.seller.id || '').toString();
                  if (itemSellerId && sellerUserId && itemSellerId === sellerUserId) {
                    console.log(`Order #${o.orderId} item matches on Signal 3 (item.seller._id: ${itemSellerId})`);
                    return true;
                  }
                  
                  // Signal 4: Match on item's seller email
                  const itemSellerEmail = (item.seller.email || '').toLowerCase().trim();
                  if (itemSellerEmail && sellerUserEmail && itemSellerEmail === sellerUserEmail) {
                    console.log(`Order #${o.orderId} item matches on Signal 4 (item.seller.email: ${itemSellerEmail})`);
                    return true;
                  }
                }
              }

              // Signal 5: Match on item's productId
              const itemProductId = (item.productId || '').toString();
              if (itemProductId && myProductIds.has(itemProductId)) {
                console.log(`Order #${o.orderId} item matches on Signal 5 (item.productId: ${itemProductId})`);
                return true;
              }

              // Signal 6: Match on item's name
              const itemName = (item.name || '').toLowerCase().trim();
              if (itemName && myProductNames.has(itemName)) {
                console.log(`Order #${o.orderId} item matches on Signal 6 (item.name: ${itemName})`);
                return true;
              }

              // Fallback for default seed orders / Emahu Brand
              const isDefaultFallback = item.seller && (item.seller.email === 'support@emahu.com' || item.brand === 'Emahu Seller');
              if (isDefaultFallback) {
                console.log(`Order #${o.orderId} item matches on Signal 7 (default fallback)`);
                return true;
              }

              return false;
            });

            if (!hasMatchingItem) {
              console.log(`Order #${o.orderId} did NOT match any seller criteria.`);
            }
            return hasMatchingItem;
          });

          console.log('Filtered Orders count:', myOrders.length);
          console.groupEnd();

          if (myOrders.length === 0) {
            // Seed multiple demo orders with different statuses so sellers can see the full workflow
            const sellerRef = {
              _id: sellerUser._id || sellerUser.id || 'mock_seller_id',
              name: sellerUser.name || 'Pro Seller Inc.',
              email: sellerUser.email || 'seller@emahu.com',
              phone: sellerUser.phone || '+91 99999 99999'
            };
            const baseDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const baseTime = baseDate + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            const seedOrders = [
              {
                orderId: `EMH_${Math.floor(100000 + Math.random() * 900000)}`,
                date: baseDate,
                items: [{ name: 'Emahu Smart Luxe Chrono', price: 18999, quantity: 1, brand: 'Emahu Brand', img: '⌚', seller: sellerRef }],
                total: 22419,
                status: 'PENDING_APPROVAL',
                timeline: [{ status: 'PENDING_APPROVAL', label: 'Payment Completed', desc: '⏳ Waiting for Seller Approval', date: baseTime }],
                deliveryAddress: { fullName: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul@example.com', address: 'Flat 402, Royal Residency, Sector 15', city: 'Gandhinagar', stateName: 'Gujarat', pincode: '382016' },
                shippingSpeed: 'express', escrowMethod: 'wallet'
              },
              {
                orderId: `EMH_${Math.floor(100000 + Math.random() * 900000)}`,
                date: baseDate,
                items: [{ name: 'SoundAura Pro Headphones', price: 12500, quantity: 1, brand: 'SoundAura', img: '🎧', seller: sellerRef }],
                total: 14750,
                status: 'PENDING_APPROVAL',
                timeline: [{ status: 'PENDING_APPROVAL', label: 'Payment Completed', desc: '⏳ Waiting for Seller Approval', date: baseTime }],
                deliveryAddress: { fullName: 'Priya Mehta', phone: '+91 87654 32100', email: 'priya@example.com', address: 'B-204, Sunrise Apartments', city: 'Pune', stateName: 'Maharashtra', pincode: '411001' },
                shippingSpeed: 'standard', escrowMethod: 'upi'
              },
              {
                orderId: `EMH_${Math.floor(100000 + Math.random() * 900000)}`,
                date: baseDate,
                items: [{ name: 'AuraRing Smart Health Tracker', price: 9500, quantity: 2, brand: 'AuraRing', img: '💍', seller: sellerRef }],
                total: 22420,
                status: 'APPROVED',
                sellerConfirmed: true,
                timeline: [
                  { status: 'PENDING_APPROVAL', label: 'Payment Completed', desc: '⏳ Waiting for Seller Approval', date: baseTime },
                  { status: 'APPROVED', label: 'Seller Approved', desc: '✅ Order approved by seller.', date: baseTime }
                ],
                deliveryAddress: { fullName: 'Amit Kumar', phone: '+91 76543 21000', email: 'amit@example.com', address: '12, MG Road', city: 'Bangalore', stateName: 'Karnataka', pincode: '560001' },
                shippingSpeed: 'standard', escrowMethod: 'card'
              },
              {
                orderId: `EMH_${Math.floor(100000 + Math.random() * 900000)}`,
                date: baseDate,
                items: [{ name: 'Minimalist Solid Oak Desk', price: 28000, quantity: 1, brand: 'WoodCraft', img: '🪑', seller: sellerRef }],
                total: 33040,
                status: 'REJECTED',
                sellerRejected: true,
                rejectionReason: 'Out of Stock',
                timeline: [
                  { status: 'PENDING_APPROVAL', label: 'Payment Completed', desc: '⏳ Waiting for Seller Approval', date: baseTime },
                  { status: 'REJECTED', label: 'Seller Rejected', desc: '❌ Rejected: Out of Stock', date: baseTime }
                ],
                deliveryAddress: { fullName: 'Sneha Reddy', phone: '+91 65432 10000', email: 'sneha@example.com', address: '45, Jubilee Hills', city: 'Hyderabad', stateName: 'Telangana', pincode: '500033' },
                shippingSpeed: 'express', escrowMethod: 'wallet'
              }
            ];

            seedOrders.forEach(o => parsed.push(o));
            localStorage.setItem('emahu_orders', JSON.stringify(parsed));
            window.dispatchEvent(new Event('storage'));
            return;
          }

          const formatted = myOrders.map(o => {
            // Only list items in the description that belong to this seller or default fallback
            const itemsList = (o.items || []).filter(item => {
              if (!item.seller) return true;
              
              const sellerUserId = sellerUser._id || sellerUser.id;
              
              // If item.seller is a string
              if (typeof item.seller === 'string') {
                return sellerUserId && item.seller.toString() === sellerUserId.toString();
              }
              
              // If item.seller is an object
              const itemSellerId = item.seller._id || item.seller.id;
              const isIdMatch = itemSellerId && sellerUserId && itemSellerId.toString() === sellerUserId.toString();
              const isEmailMatch = item.seller.email && sellerUser.email && 
                                   item.seller.email.toLowerCase() === sellerUser.email.toLowerCase();
              const isProductMatch = (item.productId && myProductIds.has(item.productId.toString())) || (item.name && myProductNames.has(item.name.toLowerCase().trim()));
              const isDefaultFallback = item.seller.email === 'support@emahu.com' || 
                                        item.brand === 'Emahu Seller';
                                        
              return isIdMatch || isEmailMatch || isProductMatch || isDefaultFallback;
            });
            const productName = itemsList.map(item => `${item.name} (x${item.quantity})`).join(', ') || 'Merchandise Item';
            
            // Sum of this seller's items
            const sellerItemsTotal = itemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const proportionalTotal = o.total ? Math.round(sellerItemsTotal * (o.total / (o.items || []).reduce((s, i) => s + (i.price * i.quantity), 0))) : sellerItemsTotal;

            return {
              id: o.orderId,
              customer: o.deliveryAddress?.fullName || 'Emahu Customer',
              product: productName,
              amount: proportionalTotal,
              status: o.status || 'PENDING_APPROVAL',
              time: o.date || 'Just now',
              raw: o
            };
          });
          // Set real orders only
          setOrders(formatted);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Error loading real orders:', err);
        setOrders([]);
      }
    };

    loadRealOrders();
    window.addEventListener('storage', loadRealOrders);
    return () => window.removeEventListener('storage', loadRealOrders);
  }, [sellerUser, products]);

  // Order Management Modals States
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectionReasonType, setRejectionReasonType] = useState('Out of Stock');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [activeLabelOrder, setActiveLabelOrder] = useState(null);
  const [selectedDetailedOrderId, setSelectedDetailedOrderId] = useState(null);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const selectedDetailedOrder = useMemo(() => {
    if (!selectedDetailedOrderId) return null;
    const found = orders.find(o => o.id === selectedDetailedOrderId);
    return found ? found.raw : null;
  }, [selectedDetailedOrderId, orders]);

  useEffect(() => {
    const loadNotifs = () => {
      try {
        const stored = localStorage.getItem('emahu_notifications');
        if (stored) {
          const parsed = JSON.parse(stored);
          setNotifications(parsed.filter(n => n.role === 'seller'));
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadNotifs();
    window.addEventListener('storage', loadNotifs);
    return () => window.removeEventListener('storage', loadNotifs);
  }, []);

  const handleMarkNotifsRead = () => {
    try {
      const stored = localStorage.getItem('emahu_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map(n => n.role === 'seller' ? { ...n, read: true } : n);
        localStorage.setItem('emahu_notifications', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pushNotification = (title, message, role = 'buyer') => {
    try {
      const existing = JSON.parse(localStorage.getItem('emahu_notifications') || '[]');
      existing.unshift({
        id: generateNotificationId(),
        title,
        message,
        role,
        date: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        read: false
      });
      localStorage.setItem('emahu_notifications', JSON.stringify(existing));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveOrder = (orderId) => {
    try {
      const storedOrders = localStorage.getItem('emahu_orders');
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const updated = parsed.map(o => {
          if (o.orderId === orderId) {
            const timeline = o.timeline || [];
            // Remove any pending timeline item to prevent duplicates
            const filteredTimeline = timeline.filter(t => t.status !== 'APPROVED');
            filteredTimeline.push({
              status: 'APPROVED',
              label: 'Seller Approved',
              desc: '✅ Your order has been approved by the seller.',
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            });
            return {
              ...o,
              status: 'APPROVED',
              timeline: filteredTimeline,
              sellerConfirmed: true,
              sellerRejected: false
            };
          }
          return o;
        });
        localStorage.setItem('emahu_orders', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        pushNotification('Order Approved', `Your Order #${orderId} has been approved by the seller.`, 'buyer');
        triggerToast('Order Approved', `Order #${orderId} approved successfully.`, 'success');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error', 'Failed to approve order.', 'danger');
    }
  };

  const handleRejectOrder = (orderId, reason) => {
    try {
      const storedOrders = localStorage.getItem('emahu_orders');
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const updated = parsed.map(o => {
          if (o.orderId === orderId) {
            const timeline = o.timeline || [];
            const filteredTimeline = timeline.filter(t => t.status !== 'REJECTED');
            filteredTimeline.push({
              status: 'REJECTED',
              label: 'Seller Rejected',
              desc: `❌ Rejected: ${reason || 'Merchant rejected the order listing.'}`,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            });
            return {
              ...o,
              status: 'REJECTED',
              timeline: filteredTimeline,
              sellerConfirmed: false,
              sellerRejected: true,
              rejectionReason: reason
            };
          }
          return o;
        });
        localStorage.setItem('emahu_orders', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        pushNotification('Order Rejected', `Your Order #${orderId} was rejected by the merchant. Reason: ${reason || 'N/A'}`, 'buyer');
        triggerToast('Order Rejected', `Order #${orderId} rejected.`, 'danger');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error', 'Failed to reject order.', 'danger');
    }
  };

  const handleSelectDeliveryPartner = (orderId, partnerName, estDays, cost) => {
    try {
      const storedOrders = localStorage.getItem('emahu_orders');
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const trackingId = `EMH-TRK-${getRandomNumberStr(100000, 999999)}`;
        const updated = parsed.map(o => {
          if (o.orderId === orderId) {
            const timeline = o.timeline || [];
            const filteredTimeline = timeline.filter(t => t.status !== 'DELIVERY_ASSIGNED');
            filteredTimeline.push({
              status: 'DELIVERY_ASSIGNED',
              label: 'Delivery Assigned',
              desc: `🚚 Assigned to ${partnerName}. Tracking ID: ${trackingId}`,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            });
            return {
              ...o,
              status: 'DELIVERY_ASSIGNED',
              timeline: filteredTimeline,
              carrier: partnerName,
              trackingId,
              deliveryCost: cost,
              estDays: estDays
            };
          }
          return o;
        });
        localStorage.setItem('emahu_orders', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        pushNotification('Shipment Assigned', `Your shipment for Order #${orderId} has been assigned to ${partnerName}.`, 'buyer');
        pushNotification('Courier Assigned', `Courier ${partnerName} has been assigned to Order #${orderId}.`, 'seller');
        triggerToast('Delivery Assigned', `Courier ${partnerName} assigned to Order #${orderId}.`, 'success');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error', 'Failed to assign delivery partner.', 'danger');
    }
  };

  const handleGenerateLabel = (orderId) => {
    try {
      const storedOrders = localStorage.getItem('emahu_orders');
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const updated = parsed.map(o => {
          if (o.orderId === orderId) {
            const timeline = o.timeline || [];
            const filteredTimeline = timeline.filter(t => t.status !== 'LABEL_GENERATED');
            filteredTimeline.push({
              status: 'LABEL_GENERATED',
              label: 'Shipping Label Generated',
              desc: `📄 Shipping label has been generated successfully.`,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            });
            return {
              ...o,
              status: 'LABEL_GENERATED',
              timeline: filteredTimeline,
              shipmentId: `EMH-SHIP-${Math.floor(100000 + Math.random() * 900000)}`,
              packageWeight: `${(1.5 + Math.random() * 3).toFixed(2)} kg`
            };
          }
          return o;
        });
        localStorage.setItem('emahu_orders', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        pushNotification('Shipping Label Created', `Shipping label generated for Order #${orderId}.`, 'buyer');
        pushNotification('Label Created', `Shipping label generated successfully for Order #${orderId}.`, 'seller');
        triggerToast('Label Generated', `Label generated for Order #${orderId}.`, 'success');

        const fresh = updated.find(o => o.orderId === orderId);
        setActiveLabelOrder(fresh);
        setIsLabelModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error', 'Failed to generate label.', 'danger');
    }
  };

  const handleAssignAndGenerateLabel = (orderId, carrierName) => {
    try {
      const storedOrders = localStorage.getItem('emahu_orders');
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const trackingId = `EMH-TRK-${getRandomNumberStr(100000, 999999)}`;
        const shipmentId = `EMH-SHIP-${getRandomNumberStr(100000, 999999)}`;
        const packageWeight = getRandomWeightStr();
        const estDays = carrierName === 'Blue Dart' ? '1-3 Days' : (carrierName === 'Delhivery' ? '2-4 Days' : '2-5 Days');
        const cost = carrierName === 'Blue Dart' ? 120 : (carrierName === 'Delhivery' ? 80 : 75);
        
        const updated = parsed.map(o => {
          if (o.orderId === orderId) {
            const timeline = o.timeline || [];
            
            // Add DELIVERY_ASSIGNED timeline
            const filteredTimeline1 = timeline.filter(t => t.status !== 'DELIVERY_ASSIGNED');
            filteredTimeline1.push({
              status: 'DELIVERY_ASSIGNED',
              label: 'Delivery Assigned',
              desc: `🚚 Assigned to ${carrierName}. Tracking ID: ${trackingId}`,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            });
            
            // Add LABEL_GENERATED timeline
            const filteredTimeline2 = filteredTimeline1.filter(t => t.status !== 'LABEL_GENERATED');
            filteredTimeline2.push({
              status: 'LABEL_GENERATED',
              label: 'Shipping Label Generated',
              desc: `📄 Shipping label has been generated successfully.`,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            });

            return {
              ...o,
              status: 'LABEL_GENERATED',
              timeline: filteredTimeline2,
              carrier: carrierName,
              trackingId,
              shipmentId,
              packageWeight,
              deliveryCost: cost,
              estDays: estDays
            };
          }
          return o;
        });
        localStorage.setItem('emahu_orders', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        
        pushNotification('Courier Assigned', `Courier ${carrierName} assigned to Order #${orderId}.`, 'seller');
        pushNotification('Shipping Label Created', `Shipping label generated for Order #${orderId}.`, 'buyer');
        pushNotification('Label Created', `Shipping label generated successfully for Order #${orderId}.`, 'seller');
        triggerToast('Label Generated', `Label generated for Order #${orderId}.`, 'success');
        
        const fresh = updated.find(o => o.orderId === orderId);
        setActiveLabelOrder(fresh);
        setIsLabelModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error', 'Failed to generate shipping label.', 'danger');
    }
  };

  const handleMarkReadyForPickup = (orderId) => {
    try {
      const storedOrders = localStorage.getItem('emahu_orders');
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const updated = parsed.map(o => {
          if (o.orderId === orderId) {
            const timeline = o.timeline || [];
            const filteredTimeline = timeline.filter(t => t.status !== 'READY_FOR_PICKUP');
            filteredTimeline.push({
              status: 'READY_FOR_PICKUP',
              label: 'Ready for Pickup',
              desc: `📦 Package is packed and ready for carrier pickup.`,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            });
            return {
              ...o,
              status: 'READY_FOR_PICKUP',
              timeline: filteredTimeline
            };
          }
          return o;
        });
        localStorage.setItem('emahu_orders', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        pushNotification('Ready for Pickup', `Order #${orderId} is packed and ready for courier pickup.`, 'buyer');
        pushNotification('Pickup Confirmed', `Pickup request sent for Order #${orderId}.`, 'seller');
        triggerToast('Status Updated', `Order #${orderId} marked ready for pickup.`, 'success');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error', 'Failed to mark ready for pickup.', 'danger');
    }
  };

  const handleAdvanceStatus = (orderId, nextStatus) => {
    try {
      const storedOrders = localStorage.getItem('emahu_orders');
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const updated = parsed.map(o => {
          if (o.orderId === orderId) {
            const timeline = o.timeline || [];
            const filteredTimeline = timeline.filter(t => t.status !== nextStatus);
            
            let label = nextStatus;
            let desc = `Order state shifted to ${nextStatus}.`;
            if (nextStatus === 'PICKED_UP') {
              label = 'Shipment Picked Up';
              desc = `📦 Courier partner ${o.carrier || 'Delhivery'} has picked up the package.`;
            } else if (nextStatus === 'IN_TRANSIT') {
              label = 'In Transit';
              desc = `🚚 Order package is in transit via national EV highway corridor.`;
            } else if (nextStatus === 'OUT_FOR_DELIVERY') {
              label = 'Out For Delivery';
              desc = `🛵 Package is out for delivery with the local dispatch rider.`;
            } else if (nextStatus === 'DELIVERED') {
              label = 'Delivered';
              desc = `✅ Order delivered successfully. Transaction completed.`;
            }

            filteredTimeline.push({
              status: nextStatus,
              label,
              desc,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            });

            return {
              ...o,
              status: nextStatus === 'DELIVERED' ? 'COMPLETED' : nextStatus,
              timeline: filteredTimeline,
              sellerConfirmed: nextStatus === 'DELIVERED' ? true : o.sellerConfirmed
            };
          }
          return o;
        });
        localStorage.setItem('emahu_orders', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));

        // Push status change notifications
        let customerMsg = `Your Order #${orderId} state is now ${nextStatus}.`;
        let sellerMsg = `Order #${orderId} advanced to ${nextStatus}.`;
        if (nextStatus === 'PICKED_UP') {
          customerMsg = `Your shipment has been picked up.`;
        } else if (nextStatus === 'OUT_FOR_DELIVERY') {
          customerMsg = `Your package is out for delivery.`;
        } else if (nextStatus === 'DELIVERED') {
          customerMsg = `Your order has been delivered successfully.`;
          sellerMsg = `Order #${orderId} delivered successfully.`;
        }

        pushNotification(nextStatus, customerMsg, 'buyer');
        pushNotification(nextStatus, sellerMsg, 'seller');
        triggerToast('Status Advanced', `Order #${orderId} is now ${nextStatus}.`, 'success');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error', 'Failed to advance order status.', 'danger');
    }
  };

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  
  // Add Product Modal Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Electronics');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductComparePrice, setNewProductComparePrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [formError, setFormError] = useState('');
  const [verifyCodes, setVerifyCodes] = useState({});
  const [resubmitProductId, setResubmitProductId] = useState(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);



  // Utility to push notifications
  const triggerToast = (title, message, type = 'success') => {
    const id = getTimestampString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
  };

  // Add Product Handler
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (isSubmittingProduct) return;
    if (
      !newProductName.trim() ||
      !newProductBrand.trim() ||
      !newProductSku.trim() ||
      !newProductCategory.trim() ||
      !newProductPrice ||
      !newProductComparePrice ||
      !newProductStock ||
      !newProductImage.trim() ||
      !newProductDescription.trim()
    ) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    // Validate Numeric values
    const priceNum = parseFloat(newProductPrice);
    const comparePriceNum = parseFloat(newProductComparePrice);
    const stockNum = parseInt(newProductStock);

    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid price greater than 0.');
      return;
    }
    if (isNaN(comparePriceNum) || comparePriceNum <= 0) {
      setFormError('Please enter a valid compare-at price greater than 0.');
      return;
    }
    if (comparePriceNum <= priceNum) {
      setFormError('Compare-at price must be greater than listing price.');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError('Please enter a valid non-negative stock count.');
      return;
    }

    try {
      setIsSubmittingProduct(true);
      const token = localStorage.getItem('emahu_seller_token');
      const url = resubmitProductId 
        ? `http://localhost:5000/api/products/${resubmitProductId}/resubmit`
        : 'http://localhost:5000/api/products';
      const method = resubmitProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProductName.trim(),
          brand: newProductBrand.trim(),
          sku: newProductSku.trim().toUpperCase(),
          category: newProductCategory,
          price: priceNum,
          comparePrice: comparePriceNum,
          stock: stockNum,
          image: newProductImage.trim(),
          description: newProductDescription.trim()
        })
      });

      if (res.status === 401) {
        clearAuthSession('seller');
        router.replace('/seller/login');
        return;
      }

      const data = await res.json();
      if (!data.success) {
        setFormError(data.error || 'Failed to submit product');
        return;
      }

      if (resubmitProductId) {
        setProducts((prev) => prev.map(p => (p.id || p._id) === resubmitProductId ? data.product : p));
        triggerToast(
          'Product Updated',
          `EMAHU-PRO: "${newProductName}" has been updated successfully and is live.`,
          'success'
        );
      } else {
        setProducts((prev) => [data.product, ...prev]);
        triggerToast(
          'Product Created',
          `EMAHU-PRO: "${newProductName}" is now live.`,
          'success'
        );
      }
      
      // Close Modal and Reset form fields
      setIsAddModalOpen(false);
      resetAddForm();
    } catch (err) {
      console.error('Error adding/resubmitting product:', err);
      setFormError('Network error submitting product. Please try again.');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const resetAddForm = () => {
    setNewProductName('');
    setNewProductBrand('');
    setNewProductSku('');
    setNewProductCategory('Electronics');
    setNewProductPrice('');
    setNewProductComparePrice('');
    setNewProductStock('');
    setNewProductDescription('');
    setNewProductImage('');
    setFormError('');
    setResubmitProductId(null);
  };



  // Pre-populate form and open resubmit modal
  const handleOpenResubmitModal = (product) => {
    setResubmitProductId(product.id || product._id);
    setNewProductName(product.name);
    setNewProductBrand(product.brand || '');
    setNewProductSku(product.sku);
    setNewProductCategory(product.category);
    setNewProductPrice(product.price.toString());
    setNewProductComparePrice(product.comparePrice ? product.comparePrice.toString() : '');
    setNewProductStock(product.stock.toString());
    setNewProductDescription(product.description || '');
    setNewProductImage(product.image || '');
    setIsAddModalOpen(true);
  };

  // Open Delete Confirmation
  const confirmDeleteProduct = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  // Perform actual deletion
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      const token = localStorage.getItem('emahu_seller_token');
      const productId = productToDelete.id || productToDelete._id;
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        clearAuthSession('seller');
        router.replace('/seller/login');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => (p.id || p._id) !== productId));
        triggerToast(
          'Product Removed',
          `EMAHU-PRO: "${productToDelete.name}" was successfully deleted.`,
          'danger'
        );
      } else {
        triggerToast('Deletion Failed', data.error || 'Could not delete product listing', 'danger');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      triggerToast('Deletion Error', 'Network error during product deletion', 'danger');
    }
    
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  // Process sorting & filtering products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'stock') return b.stock - a.stock;
      if (sortBy === 'sales') return b.sales - a.sales;
      return 0;
    });

  // Analytics totals calculation
  const totalRevenue = orders.reduce((acc, o) => acc + o.amount, 0);
  const totalSalesCount = orders.length;
  const lowStockCount = products.filter(p => p.status === 'low-stock').length;
  const outOfStockCount = products.filter(p => p.status === 'out-of-stock').length;

  // Dynamic Weekly Chart Calculations
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const revenueByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const dispatchesByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    orders.forEach(o => {
      let dayName = 'Mon';
      if (o.raw && o.raw.date) {
        try {
          const date = new Date(o.raw.date);
          const dayIndex = date.getDay();
          dayName = days[dayIndex];
        } catch (e) {
          dayName = 'Mon';
        }
      }
      if (revenueByDay[dayName] !== undefined) {
        revenueByDay[dayName] += o.amount;
        dispatchesByDay[dayName] += 1;
      }
    });

    return orderedDays.map(day => ({
      day,
      revenue: revenueByDay[day],
      dispatches: dispatchesByDay[day]
    }));
  }, [orders]);

  const maxRevenue = useMemo(() => {
    return Math.max(...chartData.map(d => d.revenue), 10000);
  }, [chartData]);

  const maxDispatches = useMemo(() => {
    return Math.max(...chartData.map(d => d.dispatches), 1);
  }, [chartData]);

  const chartPoints = useMemo(() => {
    return chartData.map((d, i) => {
      const x = 70 + i * 65;
      const y = 180 - (d.revenue / maxRevenue) * 140;
      return { x, y };
    });
  }, [chartData, maxRevenue]);

  const dispatchPoints = useMemo(() => {
    return chartData.map((d, i) => {
      const x = 70 + i * 65;
      const y = 180 - (d.dispatches / maxDispatches) * 110;
      return { x, y };
    });
  }, [chartData, maxDispatches]);

  const revenuePath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return `M ${chartPoints[0].x} ${chartPoints[0].y} ` + chartPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  }, [chartPoints]);

  const revenueAreaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return `${revenuePath} L ${chartPoints[chartPoints.length - 1].x} 180 L ${chartPoints[0].x} 180 Z`;
  }, [chartPoints, revenuePath]);

  const dispatchPath = useMemo(() => {
    if (dispatchPoints.length === 0) return '';
    return `M ${dispatchPoints[0].x} ${dispatchPoints[0].y} ` + dispatchPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  }, [dispatchPoints]);

  // Dynamic Chart Interactive Tooltip Parameters
  const peakDayIndex = useMemo(() => {
    let maxIdx = 0;
    let maxRev = -1;
    chartData.forEach((d, idx) => {
      if (d.revenue > maxRev) {
        maxRev = d.revenue;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [chartData]);

  const hoverX = useMemo(() => {
    return chartPoints[peakDayIndex]?.x ?? 70;
  }, [chartPoints, peakDayIndex]);

  const hoverY = useMemo(() => {
    return chartPoints[peakDayIndex]?.y ?? 180;
  }, [chartPoints, peakDayIndex]);

  // Dynamic Geographic Shares Calculation
  const stateShares = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      let state = 'Others';
      if (o.raw && o.raw.deliveryAddress && o.raw.deliveryAddress.stateName) {
        state = o.raw.deliveryAddress.stateName;
      }
      counts[state] = (counts[state] || 0) + 1;
    });

    const total = orders.length || 1;
    return Object.entries(counts)
      .map(([state, count]) => ({
        state,
        pct: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [orders]);

  // Dynamic Conversion Funnel Metrics
  const funnelViews = totalSalesCount * 12 + 120;
  const funnelCart = totalSalesCount * 4 + 40;
  const funnelCheckout = totalSalesCount * 1.5 + 15;
  const funnelSales = totalSalesCount;

  const cartPct = funnelViews > 0 ? Math.round((funnelCart / funnelViews) * 100) : 0;
  const checkoutPct = funnelViews > 0 ? Math.round((funnelCheckout / funnelViews) * 100) : 0;
  const salesPct = funnelViews > 0 ? (funnelSales / funnelViews * 100).toFixed(2) : '0.00';

  // Orders tab computed values — recalculated on every render when orders/filter state changes
  const pendingOrdersCount = orders.filter(o => o.status === 'PENDING_APPROVAL').length;
  const filteredOrdersDisplay = orderStatusFilter === 'all'
    ? orders
    : orderStatusFilter === 'DELIVERED'
      ? orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED')
      : orders.filter(o => o.status === orderStatusFilter);

  // Render high-end loading display during verification to prevent DOM flash
  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0a0b10', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #1f2937', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Verifying merchant session credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <div className="toast-content">
              <span className="toast-title">{toast.title}</span>
              <span className="toast-message">{toast.message}</span>
            </div>
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <Link href="/" className="sidebar-brand">
          <div className="sidebar-logo">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#6366f1" />
              <path d="M8 12h16M8 16h12M8 20h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="sidebar-title">EMAHU</span>
          <span className="sidebar-title-tag">Pro</span>
        </Link>

        <ul className="sidebar-menu">
          <li>
            <button 
              className={`sidebar-item-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              <span>Overview</span>
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-item-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Products</span>
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-item-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Orders</span>
              {activeTab !== 'orders' && pendingOrdersCount > 0 && (
                <span className="sidebar-title-tag" style={{ marginLeft: '10px', background: 'var(--color-danger)' }}>
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-item-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Analytics</span>
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-item-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Settings</span>
            </button>
          </li>
        </ul>

        <div className="sidebar-profile">
          <div className="avatar-wrapper">
            <div className="sidebar-avatar">
              {sellerUser && sellerUser.name ? sellerUser.name.substring(0, 2).toUpperCase() : 'PS'}
            </div>
            <span className="avatar-badge"></span>
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-username">{sellerUser ? sellerUser.name : 'Pro Seller Inc.'}</span>
            <span className="sidebar-usertag">{sellerUser ? sellerUser.email : 'Premium Account'}</span>
          </div>
          <button className="logout-btn" onClick={handleSignOut} title="Log Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="main-wrapper">
        {/* --- HEADER --- */}
        <header className="header">
          <button className="mobile-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="header-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search across analytics & products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-actions" style={{ position: 'relative' }}>
            <button className="icon-badge-btn" onClick={() => { setIsNotifOpen(!isNotifOpen); handleMarkNotifsRead(); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {notifications.some(n => !n.read) && <span className="badge-dot"></span>}
            </button>

            {isNotifOpen && (
              <div className="notif-popover" style={{
                position: 'absolute',
                top: '50px',
                right: '10px',
                width: '320px',
                maxHeight: '400px',
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                textAlign: 'left'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #27272a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Notifications Center</strong>
                  <button 
                    onClick={() => {
                      try {
                        const stored = localStorage.getItem('emahu_notifications') || '[]';
                        const parsed = JSON.parse(stored);
                        const updated = parsed.filter(n => n.role !== 'seller');
                        localStorage.setItem('emahu_notifications', JSON.stringify(updated));
                        window.dispatchEvent(new Event('storage'));
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#a1a1aa', fontSize: '0.8rem' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        backgroundColor: n.read ? 'transparent' : 'rgba(65, 105, 225, 0.08)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#fff' }}>{n.title}</span>
                          <span style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>{n.date}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.3' }}>{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="header-divider"></div>

            <button className="company-portal-btn" onClick={() => setIsAddModalOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add New Product</span>
            </button>
          </div>
        </header>

        {/* --- DYNAMIC VIEWPORT CONTROLLER --- */}
        <main className="view-container">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className="view-header">
                <div className="view-title-group">
                  <h2>Overview Dashboard</h2>
                  <p>Real-time analytics, company sales volumes, and core inventory alerts.</p>
                </div>
              </div>

              {/* STATS SUMMARY GRID */}
              <div className="stats-grid">
                <div className="stat-card primary-theme">
                  <div className="stat-header">
                    <span className="stat-title">Total Sales Revenue</span>
                    <div className="stat-icon primary">₹</div>
                  </div>
                  <div className="stat-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
                  <div className="stat-footer">
                    <span className="stat-trend up">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                      {totalRevenue > 0 ? 'Active' : '0%'}
                    </span>
                    <span>vs last month</span>
                  </div>
                </div>

                <div className="stat-card success-theme">
                  <div className="stat-header">
                    <span className="stat-title">Total Orders Dispatched</span>
                    <div className="stat-icon success">📦</div>
                  </div>
                  <div className="stat-value">{totalSalesCount.toLocaleString()}</div>
                  <div className="stat-footer">
                    <span className="stat-trend up">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                      {totalSalesCount > 0 ? 'Active' : '0%'}
                    </span>
                    <span>monthly growth</span>
                  </div>
                </div>

                <div className="stat-card warning-theme">
                  <div className="stat-header">
                    <span className="stat-title">Low Stock SKUs</span>
                    <div className="stat-icon warning">⚠️</div>
                  </div>
                  <div className="stat-value">{lowStockCount}</div>
                  <div className="stat-footer">
                    <span>{products.filter(p => p.status === 'in-stock').length} Healthy list items</span>
                  </div>
                </div>

                <div className="stat-card danger-theme">
                  <div className="stat-header">
                    <span className="stat-title">Out of Stock items</span>
                    <div className="stat-icon danger">⛔</div>
                  </div>
                  <div className="stat-value">{outOfStockCount}</div>
                  <div className="stat-footer">
                    <span style={{ color: 'var(--color-danger)' }}>Requires instant re-order</span>
                  </div>
                </div>
              </div>

              {/* TWO COLS GRID: SALES GRAPH & RECENT TRANSACTIONS */}
              <div className="dashboard-grid-two-cols">
                {/* SVG Graph area */}
                <div className="glass-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title">Weekly Revenue Breakdown (INR)</span>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <span className="legend-color revenue"></span>
                        <span>Revenue</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color orders"></span>
                        <span>Dispatches</span>
                      </div>
                    </div>
                  </div>

                  <div className="chart-container">
                    <svg className="chart-svg" viewBox="0 0 500 220">
                      <defs>
                        <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="40" y1="20" x2="480" y2="20" className="chart-grid-line" />
                      <line x1="40" y1="65" x2="480" y2="65" className="chart-grid-line" />
                      <line x1="40" y1="110" x2="480" y2="110" className="chart-grid-line" />
                      <line x1="40" y1="155" x2="480" y2="155" className="chart-grid-line" />
                      
                      {/* Axes */}
                      <line x1="40" y1="20" x2="40" y2="180" className="chart-axis-line" />
                      <line x1="40" y1="180" x2="480" y2="180" className="chart-axis-line" />
                      
                      {/* Axis Labels */}
                      <text x="35" y="180" textAnchor="end" className="chart-axis-text">0</text>
                      <text x="35" y="135" textAnchor="end" className="chart-axis-text">₹{Math.round(maxRevenue / 3).toLocaleString()}</text>
                      <text x="35" y="90" textAnchor="end" className="chart-axis-text">₹{Math.round((maxRevenue / 3) * 2).toLocaleString()}</text>
                      <text x="35" y="45" textAnchor="end" className="chart-axis-text">₹{Math.round(maxRevenue).toLocaleString()}</text>

                      {/* X labels */}
                      <text x="70" y="198" textAnchor="middle" className="chart-axis-text">Mon</text>
                      <text x="135" y="198" textAnchor="middle" className="chart-axis-text">Tue</text>
                      <text x="200" y="198" textAnchor="middle" className="chart-axis-text">Wed</text>
                      <text x="265" y="198" textAnchor="middle" className="chart-axis-text">Thu</text>
                      <text x="330" y="198" textAnchor="middle" className="chart-axis-text">Fri</text>
                      <text x="395" y="198" textAnchor="middle" className="chart-axis-text">Sat</text>
                      <text x="460" y="198" textAnchor="middle" className="chart-axis-text">Sun</text>

                      {/* Line Chart Area Fill for Revenue */}
                      {revenueAreaPath && <path d={revenueAreaPath} className="chart-area-revenue" />}

                      {/* Line Chart Stroke for Revenue (Green) */}
                      {revenuePath && <path d={revenuePath} className="chart-path-revenue" />}

                      {/* Line Chart Stroke for Orders (Yellow) */}
                      {dispatchPath && <path d={dispatchPath} className="chart-path-orders" />}

                      {/* Dotted Vertical Hover Line */}
                      <line x1={hoverX} y1={hoverY} x2={hoverX} y2="180" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" className="chart-hover-line" />
                      <rect x={hoverX - 15} y={hoverY} width="30" height={180 - hoverY} fill="rgba(16, 185, 129, 0.08)" className="chart-hover-bg" />

                      {/* Tooltip Box */}
                      <g className="chart-tooltip">
                        <rect x={hoverX - 52} y={hoverY - 50 < 10 ? 10 : hoverY - 50} width="115" height="42" rx="6" fill="#18181b" />
                        <text x={hoverX - 42} y={hoverY - 50 < 10 ? 26 : hoverY - 34} fill="#fff" fontSize="10" fontFamily="sans-serif">Peak Day: {chartData[peakDayIndex].day}</text>
                        <circle cx={hoverX - 38} cy={hoverY - 50 < 10 ? 40 : hoverY - 20} r="3" fill="#10b981" />
                        <text x={hoverX - 30} y={hoverY - 50 < 10 ? 43 : hoverY - 17} fill="#fff" fontSize="11" fontFamily="sans-serif" fontWeight="bold">₹{chartData[peakDayIndex].revenue.toLocaleString('en-IN')} <tspan fontWeight="normal" fill="#a1a1aa">Sales</tspan></text>
                      </g>

                      {/* Interactive Dots for Revenue */}
                      {chartPoints.map((pt, idx) => (
                        <circle 
                          key={idx} 
                          cx={pt.x} 
                          cy={pt.y} 
                          r={idx === peakDayIndex ? 5 : 4} 
                          fill={idx === peakDayIndex ? "#10b981" : "#fff"} 
                          stroke={idx === peakDayIndex ? "#fff" : "#10b981"} 
                          strokeWidth={idx === peakDayIndex ? 2 : 2.5} 
                          className="chart-point" 
                        />
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Recent Transactions List */}
                <div className="glass-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title">Real-Time Transactions</span>
                    <span className="sidebar-title-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>Live Orders</span>
                  </div>

                  <div className="realtime-list">
                    {orders.slice(0, 4).map((order) => (
                      <div key={order.id} className="realtime-item">
                        <div className="realtime-img">
                          {order.product.includes('Headphones') ? '🎧' : 
                           order.product.includes('Chrono') ? '⌚' : 
                           order.product.includes('Desk') ? '🖥️' : 
                           (order.product.includes('Tracker') || order.product.includes('Ring')) ? '💍' : '📦'}
                        </div>
                        <div className="realtime-details">
                          <span className="realtime-title">{order.customer}</span>
                          <span className="realtime-subtitle">{order.product}</span>
                        </div>
                        <div className="realtime-meta">
                          <div className="realtime-value">₹{order.amount.toLocaleString('en-IN')}</div>
                          <span className="realtime-time">{order.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS (CRUD PORTAL) */}
          {activeTab === 'products' && (
            <div>
              <div className="view-header">
                <div className="view-title-group">
                  <h2>Product Inventory</h2>
                  <p>Complete listing catalog: create new offerings, monitor current stock, and edit properties.</p>
                </div>
              </div>

              {/* Search, filters, actions */}
              <div className="table-controls">
                <div className="search-filter-row">
                  <div className="inline-search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input 
                      type="text" 
                      className="inline-search-input" 
                      placeholder="Search by name or SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select 
                    className="select-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Tech">Tech & Gadgets</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Lifestyle">Lifestyle</option>
                  </select>

                  <select 
                    className="select-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>

                  <select 
                    className="select-filter"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="stock">Stock Quantity</option>
                    <option value="sales">Sales volume</option>
                  </select>
                </div>

                <button className="add-product-btn" onClick={() => setIsAddModalOpen(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add Product</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="table-wrapper">
                {filteredProducts.length > 0 ? (
                  <table className="pro-table">
                    <thead>
                      <tr>
                        <th>Product Info</th>
                        <th>Category</th>
                        <th>Retail Price</th>
                        <th>Stock Qty</th>
                        <th>Listing Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const isApproved = product.approvalStatus === 'approved';
                        const isPending = product.approvalStatus === 'pending';
                        const isRejected = product.approvalStatus === 'rejected';

                        return (
                          <tr key={product.id || product._id}>
                            <td>
                              <div className="product-cell">
                                <div className="product-img">
                                  {(!product.image || !product.image.startsWith('http')) ? (
                                    product.image || '📦'
                                  ) : (
                                    <img src={product.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  )}
                                </div>
                                <div className="product-meta-details">
                                  <span className="product-name">{product.name}</span>
                                  <span className="product-sku">{product.sku}</span>
                                </div>
                              </div>
                            </td>
                            <td>{product.category}</td>
                            <td>
                              <span className="price-text">₹{product.price.toLocaleString('en-IN')}</span>
                              {product.comparePrice && (
                                <span className="compare-price">₹{product.comparePrice.toLocaleString('en-IN')}</span>
                              )}
                            </td>
                            <td style={{ fontWeight: 600 }}>{product.stock} units</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span className={`status-badge ${
                                  isApproved ? 'in-stock' :
                                  isPending ? 'low-stock' : 'out-of-stock'
                                }`}>
                                  {isApproved ? 'Approved & Live' :
                                   isPending ? 'Pending Approval' : 'Rejected'}
                                </span>
                                {isRejected && product.rejectionReason && (
                                  <span style={{ fontSize: '0.75rem', color: '#ef4444', maxWidth: '200px', wordBreak: 'break-word', display: 'inline-block' }}>
                                    Reason: {product.rejectionReason}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="action-buttons-group" style={{ justifyContent: 'center' }}>
                                <button className="action-btn" title="Edit Properties" onClick={() => {
                                  handleOpenResubmitModal(product);
                                }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button className="action-btn delete" title="Delete Product" onClick={() => confirmDeleteProduct(product)}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📂</div>
                    <h3>No products found</h3>
                    <p>Try refining your search queries or adding new list items to the directory.</p>
                    <button className="add-product-btn" onClick={() => setIsAddModalOpen(true)}>Add Product</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <div className="view-header">
                <div className="view-title-group">
                  <h2>Orders Management</h2>
                  <p>Process incoming orders, assign couriers, and track all fulfillments in real-time.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {pendingOrdersCount > 0 && (
                    <span className="order-stat-pill pending">⏳ {pendingOrdersCount} Pending</span>
                  )}
                  {orders.filter(o => o.status === 'APPROVED').length > 0 && (
                    <span className="order-stat-pill approved">✅ {orders.filter(o => o.status === 'APPROVED').length} Approved</span>
                  )}
                  <span className="order-stat-pill total">📦 {orders.length} Total Orders</span>
                </div>
              </div>

              {/* Order Status Filter Tabs */}
              <div className="order-filter-tabs">
                {[
                  { key: 'all', label: 'All Orders' },
                  { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
                  { key: 'APPROVED', label: 'Approved' },
                  { key: 'REJECTED', label: 'Rejected' },
                  { key: 'READY_FOR_PICKUP', label: 'Ready For Pickup' },
                  { key: 'IN_TRANSIT', label: 'In Transit' },
                  { key: 'DELIVERED', label: 'Delivered' },
                ].map(tab => {
                  const cnt = tab.key === 'all'
                    ? orders.length
                    : tab.key === 'DELIVERED'
                      ? orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length
                      : orders.filter(o => o.status === tab.key).length;
                  return (
                    <button
                      key={tab.key}
                      className={`order-tab-btn ${orderStatusFilter === tab.key ? 'active' : ''}`}
                      onClick={() => setOrderStatusFilter(tab.key)}
                    >
                      {tab.label}
                      {cnt > 0 && (
                        <span className={`order-tab-count${tab.key === 'PENDING_APPROVAL' ? ' danger' : ''}`}>
                          {cnt}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Filtered Orders Table */}
              <div className="table-wrapper" style={{ marginTop: '0', borderTop: 'none', borderTopLeftRadius: '0', borderTopRightRadius: '0' }}>
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrdersDisplay.length > 0 ? (
                      filteredOrdersDisplay.map((order) => (
                        <tr key={order.id}>
                          <td
                            style={{ fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => setSelectedDetailedOrderId(order.id)}
                            title="Click to open Order Details"
                          >
                            #{order.id}
                          </td>
                          <td style={{ fontWeight: 600 }}>{order.customer}</td>
                          <td>
                            <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                              {order.product}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>₹{order.amount.toLocaleString('en-IN')}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span className={`status-badge ${
                                order.status === 'COMPLETED' || order.status === 'DELIVERED' ? 'in-stock' :
                                order.status === 'REJECTED' ? 'out-of-stock' :
                                order.status === 'PENDING_APPROVAL' ? 'draft' : 'low-stock'
                              }`}>
                                {order.status === 'PENDING_APPROVAL' ? 'Pending Approval' :
                                 order.status === 'APPROVED' ? 'Approved' :
                                 order.status === 'REJECTED' ? 'Rejected' :
                                 order.status === 'DELIVERY_ASSIGNED' ? 'Delivery Assigned' :
                                 order.status === 'LABEL_GENERATED' ? 'Label Generated' :
                                 order.status === 'READY_FOR_PICKUP' ? 'Ready For Pickup' :
                                 order.status === 'PICKED_UP' ? 'Picked Up' :
                                 order.status === 'IN_TRANSIT' ? 'In Transit' :
                                 order.status === 'OUT_FOR_DELIVERY' ? 'Out For Delivery' :
                                 order.status === 'COMPLETED' || order.status === 'DELIVERED' ? 'Delivered' : order.status}
                              </span>
                              {order.raw?.rejectionReason && order.status === 'REJECTED' && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)' }}>
                                  ↳ {order.raw.rejectionReason}
                                </span>
                              )}
                              {order.raw?.carrier && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {order.raw.carrier}{order.raw.trackingId ? ` · ${order.raw.trackingId}` : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{order.time}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                className="btn-secondary"
                                style={{ height: '30px', padding: '0 10px', fontSize: '0.75rem' }}
                                onClick={() => setSelectedDetailedOrderId(order.id)}
                              >
                                Details
                              </button>

                              {order.status === 'PENDING_APPROVAL' && (
                                <>
                                  <button
                                    className="order-action-btn approve"
                                    onClick={() => handleApproveOrder(order.id)}
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    className="order-action-btn reject"
                                    onClick={() => {
                                      setSelectedOrderId(order.id);
                                      setRejectionReasonType('Out of Stock');
                                      setCustomRejectReason('');
                                      setIsRejectModalOpen(true);
                                    }}
                                  >
                                    ✕ Reject
                                  </button>
                                </>
                              )}

                              {order.status === 'APPROVED' && (
                                <button
                                  className="order-action-btn carrier"
                                  onClick={() => { setSelectedOrderId(order.id); setIsDeliveryModalOpen(true); }}
                                >
                                  🚚 Assign Carrier
                                </button>
                              )}

                              {order.status === 'DELIVERY_ASSIGNED' && (
                                <button
                                  className="order-action-btn label"
                                  onClick={() => handleGenerateLabel(order.id)}
                                >
                                  🏷️ Gen. Label
                                </button>
                              )}

                              {order.status === 'LABEL_GENERATED' && (
                                <>
                                  <button
                                    className="order-action-btn carrier"
                                    onClick={() => { setActiveLabelOrder(order.raw); setIsLabelModalOpen(true); }}
                                  >
                                    🖨️ Print
                                  </button>
                                  <button
                                    className="order-action-btn approve"
                                    onClick={() => handleMarkReadyForPickup(order.id)}
                                  >
                                    📦 Mark Ready
                                  </button>
                                </>
                              )}

                              {order.status === 'READY_FOR_PICKUP' && (
                                <button
                                  className="order-action-btn carrier"
                                  onClick={() => handleAdvanceStatus(order.id, 'PICKED_UP')}
                                >
                                  📤 Ship
                                </button>
                              )}

                              {order.status === 'PICKED_UP' && (
                                <button
                                  className="order-action-btn label"
                                  onClick={() => handleAdvanceStatus(order.id, 'IN_TRANSIT')}
                                >
                                  🔄 In Transit
                                </button>
                              )}

                              {order.status === 'IN_TRANSIT' && (
                                <button
                                  className="order-action-btn label"
                                  onClick={() => handleAdvanceStatus(order.id, 'OUT_FOR_DELIVERY')}
                                >
                                  🛵 Out For Delivery
                                </button>
                              )}

                              {order.status === 'OUT_FOR_DELIVERY' && (
                                <button
                                  className="order-action-btn approve"
                                  onClick={() => handleAdvanceStatus(order.id, 'DELIVERED')}
                                >
                                  ✓ Delivered
                                </button>
                              )}

                              {['LABEL_GENERATED', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(order.status) && order.raw?.trackingId && (
                                <button
                                  className="btn-secondary"
                                  style={{ height: '30px', padding: '0 8px', fontSize: '0.75rem' }}
                                  onClick={() => { setActiveLabelOrder(order.raw); setIsLabelModalOpen(true); }}
                                >
                                  📄 Label
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '60px 24px' }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
                            {orderStatusFilter === 'PENDING_APPROVAL' ? '⏳' :
                             orderStatusFilter === 'APPROVED' ? '✅' :
                             orderStatusFilter === 'REJECTED' ? '❌' :
                             orderStatusFilter === 'DELIVERED' ? '🎉' : '📦'}
                          </div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                            {orderStatusFilter === 'all' ? 'No Orders Yet' :
                             `No ${orderStatusFilter.replace(/_/g, ' ').toLowerCase()} orders`}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto' }}>
                            {orderStatusFilter === 'PENDING_APPROVAL'
                              ? 'All caught up! No orders are waiting for your approval.'
                              : orderStatusFilter === 'all'
                                ? 'Once buyers complete checkout, their orders will appear here for review.'
                                : 'No orders match this status filter yet.'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div>
              <div className="view-header">
                <div className="view-title-group">
                  <h2>Enterprise Analytics</h2>
                  <p>Comprehensive store performance metrics, customer behavior indicators, and traffic graphs.</p>
                </div>
              </div>

              {/* Advanced metrics graphs and stats */}
              <div className="dashboard-grid-two-cols">
                <div className="glass-card">
                  <span className="glass-card-title" style={{ marginBottom: '16px' }}>Monthly Conversion Funnel</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                        <span>1. Product Views ({funnelViews.toLocaleString()} visitors)</span>
                        <span style={{ fontWeight: 'bold' }}>100%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to right, var(--color-primary), #a855f7)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                        <span>2. Add to Cart ({funnelCart.toLocaleString()} sessions)</span>
                        <span style={{ fontWeight: 'bold' }}>{cartPct}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${cartPct}%`, height: '100%', background: 'linear-gradient(to right, var(--color-primary), #a855f7)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                        <span>3. Initiated Checkout ({funnelCheckout.toLocaleString()} sessions)</span>
                        <span style={{ fontWeight: 'bold' }}>{checkoutPct}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${checkoutPct}%`, height: '100%', background: 'linear-gradient(to right, var(--color-primary), #a855f7)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                        <span>4. Completed Sales ({funnelSales.toLocaleString()} orders)</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>{salesPct}% Net Conv.</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${parseFloat(salesPct) > 100 ? 100 : salesPct}%`, height: '100%', background: 'var(--color-success)' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card">
                  <span className="glass-card-title" style={{ marginBottom: '16px' }}>Geographic Sales Share</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                    {stateShares.map((share, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem' }}>{share.state}</span>
                        <span style={{ fontWeight: 700 }}>{share.pct}%</span>
                      </div>
                    ))}
                    {stateShares.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>
                        No geographic transaction records
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <div className="view-header">
                <div className="view-title-group">
                  <h2>Store configuration</h2>
                  <p>Admin profile management, notifications frequencies, payment payouts, and billing configs.</p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="settings-nav-sidebar">
                  <button className="settings-nav-btn active">General Information</button>
                  <button className="settings-nav-btn" onClick={() => triggerToast('Config Locked', 'Settings subpages are managed by corporate dashboard controls.', 'danger')}>Payout Methods</button>
                  <button className="settings-nav-btn" onClick={() => triggerToast('Config Locked', 'Settings subpages are managed by corporate dashboard controls.', 'danger')}>Shipping Tiers</button>
                  <button className="settings-nav-btn" onClick={() => triggerToast('Config Locked', 'Settings subpages are managed by corporate dashboard controls.', 'danger')}>API Access keys</button>
                </div>

                <div className="glass-card settings-card">
                  <div>
                    <h4 className="settings-section-title">Public profile details</h4>
                    <div className="avatar-upload-area" style={{ marginTop: '20px' }}>
                      <div className="settings-avatar-preview">PS</div>
                      <div className="avatar-upload-actions">
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Brand Logo / Identity</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNG or JPEG formats. Size up to 2MB.</span>
                        <button className="btn-secondary" style={{ width: 'max-content' }} onClick={() => triggerToast('Select Image', 'Native browser file browser selected.', 'success')}>Upload Image</button>
                      </div>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Vendor Store Name</label>
                      <input type="text" className="form-input" defaultValue="Pro Seller Inc." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Support Help Email</label>
                      <input type="email" className="form-input" defaultValue="support@proseller.in" />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Registered GSTIN Number</label>
                      <input 
                        ref={gstinRef} 
                        type="text" 
                        className="form-input gstin-input" 
                        defaultValue="27AAAAA1111A1Z1" 
                        readOnly 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Default Fulfillment Partner</label>
                      <select className="select-filter" style={{ height: '44px' }} defaultValue="Delhivery">
                        <option value="Delhivery">Delhivery Logistics</option>
                        <option value="BlueDart">BlueDart Premium</option>
                        <option value="EmahuXpress">Emahu Xpress Direct</option>
                      </select>
                    </div>
                  </div>

                  <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '24px 0 0 0', marginTop: '8px' }}>
                    <button className="save-btn" onClick={() => triggerToast('Store Settings Saved', 'Vendor configuration updated and propagated to Emahu CDN.', 'success')}>
                      Save Profiles Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}



        </main>
      </div>

      {/* --- ADD PRODUCT MODAL --- */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card wide">
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>{resubmitProductId ? 'Fix & Resubmit Product Listing' : 'List New Merchandise'}</h3>
                <p>{resubmitProductId ? 'Update rejected values to resubmit for admin approval.' : 'Provide details to submit this product request for approval.'}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {resubmitProductId && products.find(p => (p.id || p._id) === resubmitProductId)?.rejectionReason && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-danger)', padding: '12px 24px', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid rgba(239, 68, 68, 0.12)' }}>
                ⚠️ <strong>Admin Rejection Reason:</strong> {products.find(p => (p.id || p._id) === resubmitProductId)?.rejectionReason}
              </div>
            )}

            {formError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '12px 24px', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid rgba(239, 68, 68, 0.15)' }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="modal-form">
              <div className="modal-form-body">
                {/* --- SECTION 1: GENERAL INFORMATION --- */}
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '8px',
                  marginTop: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>📝</span> General Product Details
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Product Title *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Minimalist Walnut Coffee Table" 
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Enter a customer-friendly, search-optimized title.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Brand Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Apple, Sony, Nike" 
                      value={newProductBrand}
                      onChange={(e) => setNewProductBrand(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Manufactured brand or your vendor store name.
                    </span>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">SKU Identifier *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. EM-TBL-409" 
                      value={newProductSku}
                      onChange={(e) => setNewProductSku(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Unique inventory code (only letters, numbers, hyphens).
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Merchandise Category *</label>
                    <select 
                      className="select-filter" 
                      style={{ height: '42px', width: '100%' }}
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      required
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Fitness">Fitness</option>
                      <option value="Apparel">Apparel</option>
                      <option value="Tech">Tech &amp; Gadgets</option>
                      <option value="Shoes">Shoes</option>
                      <option value="Kitchen">Kitchen</option>
                      <option value="Lifestyle">Lifestyle</option>
                    </select>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Helps buyers filter and discover your items.
                    </span>
                  </div>
                </div>

                {/* --- SECTION 2: PRICING & INVENTORY --- */}
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '8px',
                  marginTop: '20px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>💰</span> Pricing and Stock Levels
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Listing Price (INR) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="₹12,499" 
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      The actual amount the customer is charged.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Compare-At Price (INR) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="₹15,000" 
                      value={newProductComparePrice}
                      onChange={(e) => setNewProductComparePrice(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Original strike-through price (shows discount rate).
                    </span>
                    {newProductComparePrice && newProductPrice && parseFloat(newProductComparePrice) <= parseFloat(newProductPrice) && (
                      <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                        ⚠️ Compare-at price must be greater than Listing Price.
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Available Inventory *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 50" 
                      value={newProductStock}
                      onChange={(e) => setNewProductStock(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Units in stock. Set to 0 to show Out-Of-Stock.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Product Image URL *</label>
                    <input 
                      type="url" 
                      className="form-input" 
                      placeholder="e.g. https://images.unsplash.com/photo-..." 
                      value={newProductImage}
                      onChange={(e) => setNewProductImage(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Web URL to a clear picture of the item.
                    </span>
                  </div>
                </div>

                {newProductImage && (
                  <div className="form-group">
                    <label className="form-label">Image Preview</label>
                    <div style={{
                      marginTop: '8px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      height: '120px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0, 0, 0, 0.05)'
                    }}>
                      <img 
                        src={newProductImage} 
                        alt="Product Preview" 
                        style={{ height: '100%', width: 'auto', objectFit: 'contain', padding: '10px' }} 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}

                {/* --- SECTION 3: MEDIA & SPECIFICATIONS --- */}
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '8px',
                  marginTop: '20px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>🖼️</span> Product Copy and Specifications
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea 
                    className="form-textarea" 
                    style={{ minHeight: '100px' }}
                    placeholder="Summarize product parameters, size details, materials, warranty terms, and special care instructions..."
                    value={newProductDescription}
                    onChange={(e) => setNewProductDescription(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    A clear, detailed description boosts sales conversions.
                  </span>
                </div>
              </div>

              <div className="modal-footer" style={{ flexShrink: 0 }}>
                <button 
                  type="button" 
                  className="modal-btn cancel" 
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmittingProduct}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn confirm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: isSubmittingProduct ? 0.7 : 1,
                    cursor: isSubmittingProduct ? 'not-allowed' : 'pointer'
                  }}
                  disabled={isSubmittingProduct || (newProductComparePrice && newProductPrice && parseFloat(newProductComparePrice) <= parseFloat(newProductPrice))}
                >
                  {isSubmittingProduct ? (
                    <>
                      <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    resubmitProductId ? 'Resubmit for Approval' : 'Confirm and Submit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELIVERY PARTNER SELECTION MODAL --- */}
      {isDeliveryModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Assign Delivery Partner</h3>
                <p>Select a verified carrier grid partner for Order #{selectedOrderId}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsDeliveryModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
              {[
                { name: 'Delhivery', time: '2-4 Days', cost: 80, rating: 4.8 },
                { name: 'Blue Dart', time: '1-3 Days', cost: 120, rating: 4.9 },
                { name: 'XpressBees', time: '2-5 Days', cost: 75, rating: 4.6 },
                { name: 'Ecom Express', time: '3-5 Days', cost: 70, rating: 4.5 }
              ].map((partner) => (
                <div 
                  key={partner.name} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '16px', 
                    borderRadius: '10px', 
                    backgroundColor: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    handleSelectDeliveryPartner(selectedOrderId, partner.name, partner.time, partner.cost);
                    setIsDeliveryModalOpen(false);
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1rem' }}>{partner.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🕒 Est. delivery: {partner.time} | ⭐ {partner.rating} Rating</span>
                  </div>
                  <strong style={{ color: 'var(--color-success)', fontSize: '1.1rem' }}>₹{partner.cost}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- REJECTION REASON MODAL --- */}
      {isRejectModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Reject Order Request</h3>
                <p>Provide a rejection reason feedback to the customer for Order #{selectedOrderId}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsRejectModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ color: '#fff' }}>Select Reason *</label>
                <select 
                  className="select-filter"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e1e24', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  value={rejectionReasonType}
                  onChange={(e) => setRejectionReasonType(e.target.value)}
                >
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Product Damaged">Product Damaged</option>
                  <option value="Invalid Address">Invalid Address</option>
                  <option value="Pricing Error">Pricing Error</option>
                  <option value="Seller Unable to Fulfill">Seller Unable to Fulfill</option>
                  <option value="Other">Other (Write Custom Reason Below)</option>
                </select>
              </div>

              {rejectionReasonType === 'Other' && (
                <div className="form-group">
                  <label className="form-label" style={{ color: '#fff' }}>Custom Reason *</label>
                  <textarea 
                    className="form-textarea" 
                    style={{ height: '80px', width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px' }}
                    placeholder="Describe custom reason..."
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setIsRejectModalOpen(false)}>Cancel</button>
              <button 
                className="modal-btn delete" 
                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={() => {
                  const finalReason = rejectionReasonType === 'Other' ? customRejectReason.trim() : rejectionReasonType;
                  if (rejectionReasonType === 'Other' && !finalReason) {
                    triggerToast('Error', 'Please enter a custom rejection reason.', 'danger');
                    return;
                  }
                  handleRejectOrder(selectedOrderId, finalReason);
                  setIsRejectModalOpen(false);
                }}
              >
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SHIPPING LABEL PRINT MODAL --- */}
      {isLabelModalOpen && activeLabelOrder && (
        <div className="modal-overlay" style={{ zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-card" style={{ maxWidth: '600px', backgroundColor: '#fff', color: '#000', padding: '24px', borderRadius: '12px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div className="modal-title-group">
                <h3 style={{ color: '#0f172a', margin: 0 }}>Shipping Label</h3>
                <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Print or download dispatch manifest for Order #{activeLabelOrder.orderId}</p>
              </div>
              <button className="modal-close-btn" style={{ color: '#64748b' }} onClick={() => setIsLabelModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Printable Label Sheet */}
            <div id="printable-shipping-label" style={{ border: '2px solid #000', padding: '16px', marginTop: '20px', fontFamily: 'monospace' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '8px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{activeLabelOrder.carrier || 'COURIER'}</h2>
                  <span>PRIORITY ELECTRIC SHIELD</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>SHIPMENT ID:</strong>
                  <div>{activeLabelOrder.shipmentId || 'EMH-SHIP-XXXXXX'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '8px' }}>
                <div style={{ borderRight: '1px solid #000', paddingRight: '8px' }}>
                  <strong>FROM (SELLER):</strong>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    <strong>{sellerUser?.name || 'Authorized Merchant'}</strong><br />
                    {sellerUser?.address || 'Emahu Transit Corridor Hub'}<br />
                    Phone: {sellerUser?.phone || 'N/A'}
                  </div>
                </div>
                <div>
                  <strong>TO (BUYER):</strong>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    <strong>{activeLabelOrder.deliveryAddress?.fullName}</strong><br />
                    {activeLabelOrder.deliveryAddress?.address}<br />
                    {activeLabelOrder.deliveryAddress?.city}, {activeLabelOrder.deliveryAddress?.stateName} - {activeLabelOrder.deliveryAddress?.pincode}<br />
                    Phone: {activeLabelOrder.deliveryAddress?.phone}
                  </div>
                </div>
              </div>

              <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '8px' }}>
                <strong>PRODUCT INFORMATION:</strong>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  {activeLabelOrder.items?.map((item, idx) => (
                    <div key={idx}>• {item.name} (Qty: {item.quantity})</div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                <div>
                  <strong>ORDER ID:</strong> {activeLabelOrder.orderId}<br />
                  <strong>WEIGHT:</strong> {activeLabelOrder.packageWeight || '2.10 kg'}<br />
                  <strong>TRACKING ID:</strong> {activeLabelOrder.trackingId || 'EMH-TRK-XXXXXX'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  {/* Barcode/QR Code generator mock */}
                  <div style={{ letterSpacing: '3px', fontWeight: 'bold', fontSize: '1.2rem', margin: '4px 0' }}>
                    ||||| | |||| ||| || |||
                  </div>
                  <span style={{ fontSize: '0.7rem' }}>*{activeLabelOrder.trackingId}*</span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', marginTop: '20px', paddingTop: '12px' }}>
              <button className="modal-btn cancel" style={{ border: '1px solid #e2e8f0', color: '#000' }} onClick={() => setIsLabelModalOpen(false)}>Close</button>
              <button 
                className="modal-btn confirm" 
                style={{ background: '#4f46e5', borderColor: '#4f46e5', color: '#fff' }}
                onClick={() => {
                  const printContent = document.getElementById('printable-shipping-label').innerHTML;
                  const originalContent = document.body.innerHTML;
                  document.body.innerHTML = printContent;
                  window.print();
                  document.body.innerHTML = originalContent;
                  window.location.reload();
                }}
              >
                🖨️ Print Label
              </button>
              <button 
                className="modal-btn confirm" 
                style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }}
                onClick={() => {
                  // Mock download by saving string representation
                  const printContent = document.getElementById('printable-shipping-label').innerText;
                  const blob = new Blob([printContent], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `shipping-label-${activeLabelOrder.orderId}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  triggerToast('Downloaded', 'Shipping label downloaded as TXT manifest.', 'success');
                }}
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ORDER DETAILS & ACTION PANEL MODAL --- */}
      {selectedDetailedOrderId && selectedDetailedOrder && (() => {
        const isSeller = sellerUser && (sellerUser.role === 'seller' || localStorage.getItem('emahu_seller_logged_in') === 'true');
        const ownsOrder = selectedDetailedOrder.items?.some(item => {
          const sellerUserId = sellerUser?._id || sellerUser?.id;
          if (typeof item.seller === 'string') {
            return sellerUserId && item.seller.toString() === sellerUserId.toString();
          }
          const itemSellerId = item.seller?._id || item.seller?.id;
          return (itemSellerId && sellerUserId && itemSellerId.toString() === sellerUserId.toString()) ||
                 (item.seller?.email && sellerUser?.email && item.seller.email === sellerUser.email);
        });

        return (
          <div className="modal-overlay" style={{ zIndex: 9998, backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="modal-card" style={{ maxWidth: '800px', backgroundColor: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '20px' }}>
                <div className="modal-title-group">
                  <h3 style={{ color: '#0f172a', margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>Order Details & Action Panel</h3>
                  <p style={{ color: '#475569', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Verify buyer checkout escrow lock & execute logistics stages</p>
                </div>
                <button className="modal-close-btn" style={{ color: '#475569' }} onClick={() => { setSelectedDetailedOrderId(null); setSelectedCarrier(''); }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '6px' }}>
                {/* Left Column: Order details info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>📦 Order Information</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#475569' }}>Order ID:</span><strong style={{ color: '#0f172a' }}>{selectedDetailedOrder.orderId}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#475569' }}>Date:</span><span style={{ color: '#0f172a' }}>{selectedDetailedOrder.date}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#475569' }}>Payment Status:</span><span style={{ color: '#16a34a', fontWeight: '600' }}>Paid (Secured in Escrow Lock)</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#475569' }}>Order Total:</span><strong style={{ color: '#16a34a', fontSize: '1rem', fontWeight: '700' }}>₹{selectedDetailedOrder.total?.toLocaleString('en-IN')}</strong></div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>👤 Customer Information</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem' }}>
                      <div><strong style={{ color: '#0f172a' }}>{selectedDetailedOrder.deliveryAddress?.fullName}</strong></div>
                      <div style={{ color: '#475569' }}>Phone: {selectedDetailedOrder.deliveryAddress?.phone}</div>
                      <div style={{ color: '#475569' }}>Email: {selectedDetailedOrder.deliveryAddress?.email || 'N/A'}</div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>📍 Shipping Address</h4>
                    <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.4' }}>
                      {selectedDetailedOrder.deliveryAddress?.address}<br />
                      {selectedDetailedOrder.deliveryAddress?.city}, {selectedDetailedOrder.deliveryAddress?.stateName} - {selectedDetailedOrder.deliveryAddress?.pincode}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>🛍️ Product Lines</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedDetailedOrder.items?.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ fontSize: '1.8rem', padding: '6px', background: '#f1f5f9', borderRadius: '6px' }}>{item.img || '📦'}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#0f172a' }}>{item.name}</div>
                            <span style={{ fontSize: '0.75rem', color: '#475569' }}>Brand: {item.brand} | Qty: {item.quantity}</span>
                          </div>
                          <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>₹{item.price?.toLocaleString('en-IN')}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Order Actions Panel */}
                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfe0ff', padding: '20px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#0055ff', fontWeight: '700' }}>Order Action Panel</span>
                    <h3 style={{ margin: '4px 0 14px 0', fontSize: '1.2rem', color: '#1e3a8a', fontWeight: '700' }}>
                      Status: {selectedDetailedOrder.status === 'PENDING_APPROVAL' ? 'Pending Approval' :
                               selectedDetailedOrder.status === 'APPROVED' ? 'Approved' :
                               selectedDetailedOrder.status === 'DELIVERY_ASSIGNED' ? 'Delivery Partner Assigned' :
                               selectedDetailedOrder.status === 'LABEL_GENERATED' ? 'Label Generated' :
                               selectedDetailedOrder.status === 'READY_FOR_PICKUP' ? 'Ready For Pickup' :
                               selectedDetailedOrder.status === 'PICKED_UP' ? 'Picked Up' :
                               selectedDetailedOrder.status === 'IN_TRANSIT' ? 'In Transit' :
                               selectedDetailedOrder.status === 'OUT_FOR_DELIVERY' ? 'Out For Delivery' :
                               selectedDetailedOrder.status === 'COMPLETED' || selectedDetailedOrder.status === 'DELIVERED' ? 'Completed' : selectedDetailedOrder.status}
                    </h3>

                    {/* Check role & ownership permissions */}
                    {(!isSeller || !ownsOrder) ? (
                      <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', padding: '10px 0' }}>
                        ⚠️ You do not have permissions to execute actions on this order.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {selectedDetailedOrder.status === 'PENDING_APPROVAL' && (
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                              className="company-portal-btn"
                              style={{ flex: 1, height: '40px', background: '#16a34a', borderColor: '#16a34a', color: '#fff', fontWeight: '700' }}
                              onClick={() => {
                                handleApproveOrder(selectedDetailedOrder.orderId);
                              }}
                            >
                              Approve Order
                            </button>
                            <button
                              className="company-portal-btn"
                              style={{ flex: 1, height: '40px', background: '#dc2626', borderColor: '#dc2626', color: '#fff', fontWeight: '700' }}
                              onClick={() => {
                                setSelectedOrderId(selectedDetailedOrder.orderId);
                                setRejectionReasonType('Out of Stock');
                                setCustomRejectReason('');
                                setIsRejectModalOpen(true);
                              }}
                            >
                              Reject Order
                            </button>
                          </div>
                        )}

                        {selectedDetailedOrder.status === 'APPROVED' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 'bold' }}>Order Approved ✅</span>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '0.8rem', color: '#475569' }}>Select Delivery Partner:</label>
                              <select 
                                className="select-filter"
                                style={{ width: '100%', height: '40px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
                                value={selectedCarrier}
                                onChange={(e) => setSelectedCarrier(e.target.value)}
                              >
                                <option value="">-- Choose Courier Partner --</option>
                                <option value="Delhivery">Delhivery</option>
                                <option value="Blue Dart">Blue Dart</option>
                                <option value="XpressBees">XpressBees</option>
                                <option value="DTDC">DTDC</option>
                              </select>
                            </div>

                            <button
                              className="company-portal-btn"
                              style={{ 
                                height: '42px', 
                                background: selectedCarrier ? '#4f46e5' : '#e2e8f0', 
                                borderColor: selectedCarrier ? '#4f46e5' : '#cbd5e1', 
                                color: selectedCarrier ? '#fff' : '#94a3b8',
                                cursor: selectedCarrier ? 'pointer' : 'not-allowed',
                                fontWeight: '700'
                              }}
                              disabled={!selectedCarrier}
                              onClick={() => {
                                handleAssignAndGenerateLabel(selectedDetailedOrder.orderId, selectedCarrier);
                              }}
                            >
                              Generate Shipping Label
                            </button>
                          </div>
                        )}

                        {selectedDetailedOrder.status === 'LABEL_GENERATED' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 'bold' }}>✅ Payment Completed</span>
                              <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 'bold' }}>✅ Seller Approved</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 'bold' }}>✅ Delivery Partner Assigned</span>
                              <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 'bold' }}>✅ Label Generated</span>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                              <button
                                className="company-portal-btn"
                                style={{ flex: 1, height: '40px', background: '#3b82f6', borderColor: '#3b82f6', color: '#fff' }}
                                onClick={() => {
                                  setActiveLabelOrder(selectedDetailedOrder);
                                  setIsLabelModalOpen(true);
                                }}
                              >
                                Print Label
                              </button>
                              <button
                                className="company-portal-btn"
                                style={{ flex: 1, height: '40px', background: '#10b981', borderColor: '#10b981', color: '#fff' }}
                                onClick={() => {
                                  handleMarkReadyForPickup(selectedDetailedOrder.orderId);
                                }}
                              >
                                Mark Ready
                              </button>
                            </div>
                          </div>
                        )}

                        {selectedDetailedOrder.status === 'READY_FOR_PICKUP' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: '600' }}>⏳ Awaiting pickup by carrier partner agent</span>
                            <button
                              className="company-portal-btn"
                              style={{ height: '40px', background: '#d97706', borderColor: '#d97706', color: '#fff', fontWeight: '700' }}
                              onClick={() => {
                                handleAdvanceStatus(selectedDetailedOrder.orderId, 'PICKED_UP');
                              }}
                            >
                              Ship Package (Pickup)
                            </button>
                          </div>
                        )}

                        {/* Simulator Controls for Testing */}
                        {['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(selectedDetailedOrder.status) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px dashed #cbd5e1', paddingTop: '14px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '600' }}>Debug Simulator Tools:</span>
                            
                            {selectedDetailedOrder.status === 'PICKED_UP' && (
                              <button
                                className="company-portal-btn"
                                style={{ height: '38px', background: '#3b82f6', borderColor: '#3b82f6', color: '#fff' }}
                                onClick={() => handleAdvanceStatus(selectedDetailedOrder.orderId, 'IN_TRANSIT')}
                              >
                                Mark In Transit
                              </button>
                            )}

                            {selectedDetailedOrder.status === 'IN_TRANSIT' && (
                              <button
                                className="company-portal-btn"
                                style={{ height: '38px', background: '#a855f7', borderColor: '#a855f7', color: '#fff' }}
                                onClick={() => handleAdvanceStatus(selectedDetailedOrder.orderId, 'OUT_FOR_DELIVERY')}
                              >
                                Mark Out For Delivery
                              </button>
                            )}

                            {selectedDetailedOrder.status === 'OUT_FOR_DELIVERY' && (
                              <button
                                className="company-portal-btn"
                                style={{ height: '38px', background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                                onClick={() => handleAdvanceStatus(selectedDetailedOrder.orderId, 'DELIVERED')}
                              >
                                Mark Delivered
                              </button>
                            )}
                          </div>
                        )}

                        {(selectedDetailedOrder.status === 'COMPLETED' || selectedDetailedOrder.status === 'DELIVERED') && (
                          <span style={{ color: '#16a34a', fontSize: '1rem', fontWeight: '700', textAlign: 'center', padding: '10px 0' }}>
                            ✓ Transaction Completed
                          </span>
                        )}

                        {selectedDetailedOrder.status === 'REJECTED' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 0' }}>
                            <span style={{ color: '#dc2626', fontSize: '1rem', fontWeight: '700' }}>
                              ❌ Order Rejected
                            </span>
                            {selectedDetailedOrder.rejectionReason && (
                              <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                                Reason: {selectedDetailedOrder.rejectionReason}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* History / Log Timeline logs inside Details panel */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', fontWeight: '700' }}>Log History</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      {selectedDetailedOrder.timeline?.map((t, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '10px', fontSize: '0.75rem' }}>
                          <span style={{ color: '#16a34a' }}>●</span>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: '#0f172a' }}>{t.label}</strong>
                            <p style={{ margin: '2px 0 0 0', color: '#475569' }}>{t.desc}</p>
                          </div>
                          <span style={{ color: '#64748b' }}>{t.date?.split(' ')[1] || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', marginTop: '20px', paddingTop: '12px' }}>
                <button className="modal-btn cancel" style={{ border: '1px solid #cbd5e1', color: '#475569' }} onClick={() => { setSelectedDetailedOrderId(null); setSelectedCarrier(''); }}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="confirm-body">
              <div className="confirm-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h4>Delete listed merchandise?</h4>
              <p>Are you sure you want to remove <strong>&ldquo;{productToDelete?.name}&rdquo;</strong> from your live index? This cannot be undone.</p>
            </div>
            
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setIsDeleteModalOpen(false)}>Abort</button>
              <button className="modal-btn delete" onClick={handleDeleteProduct}>Delete Listing</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function AdminSimulationHub({ products, triggerToast, onRefreshProducts }) {
  const [rejectionReasonMap, setRejectionReasonMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  const handleDecision = async (productId, decision) => {
    setLoadingMap(prev => ({ ...prev, [productId]: true }));
    const reason = rejectionReasonMap[productId] || '';
    
    if (decision === 'reject' && !reason.trim()) {
      triggerToast('Error', 'Please enter a rejection reason first.', 'danger');
      setLoadingMap(prev => ({ ...prev, [productId]: false }));
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}/admin-decision`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision, reason })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(
          decision === 'approve' ? 'Approval Code Generated' : 'Product Rejected',
          decision === 'approve' 
            ? `Admin code generated: ${data.product.adminCode}. Give this code to the seller.` 
            : `Listing rejected. Feedback sent to vendor.`,
          decision === 'approve' ? 'success' : 'danger'
        );
        // Reset reason field
        setRejectionReasonMap(prev => ({ ...prev, [productId]: '' }));
        onRefreshProducts();
      } else {
        triggerToast('Error', data.error || 'Request failed', 'danger');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error', 'Network error', 'danger');
    } finally {
      setLoadingMap(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Filter pending / rejected products for verification simulation
  const pendingProducts = products.filter(p => p.approvalStatus !== 'approved');

  return (
    <div>
      <div className="view-header">
        <div className="view-title-group">
          <h2>Admin Approval Simulation Hub</h2>
          <p style={{ color: '#ef4444' }}>⚠️ DEBUG MODE: Simulate marketplace admin operations. Approve or reject vendor product listings below.</p>
        </div>
      </div>

      <div className="table-wrapper" style={{ marginTop: '20px' }}>
        {pendingProducts.length > 0 ? (
          <table className="pro-table">
            <thead>
              <tr>
                <th>Product Request</th>
                <th>Brand & SKU</th>
                <th>Listing Details</th>
                <th>Status / Attempts</th>
                <th>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingProducts.map((p) => {
                const isRejected = p.approvalStatus === 'rejected';
                return (
                  <tr key={p.id || p._id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-img">
                          {(!p.image || !p.image.startsWith('http')) ? (
                            p.image || '📦'
                          ) : (
                            <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                        <div className="product-meta-details">
                          <span className="product-name">{p.name}</span>
                          <span className="product-sku" style={{ textTransform: 'capitalize' }}>Category: {p.category}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{p.brand || 'No Brand'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="price-text">₹{p.price.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stock: {p.stock} units</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className={`status-badge ${isRejected ? 'out-of-stock' : 'low-stock'}`}>
                          {p.approvalStatus === 'pending' ? 'Pending Admin' : 'Rejected'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Attempt {p.approvalAttempts || 1} of 3
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            className="company-portal-btn"
                            style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)', height: '32px', fontSize: '0.8rem' }}
                            onClick={() => handleDecision(p.id || p._id, 'approve')}
                            disabled={loadingMap[p.id || p._id]}
                          >
                            Approve & Get Code
                          </button>
                          
                          <button
                            className="company-portal-btn"
                            style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)', height: '32px', fontSize: '0.8rem' }}
                            onClick={() => handleDecision(p.id || p._id, 'reject')}
                            disabled={loadingMap[p.id || p._id] || p.approvalAttempts >= 3}
                          >
                            Reject Listing
                          </button>
                        </div>
                        
                        {!isRejected && p.approvalAttempts < 3 && (
                          <input
                            type="text"
                            className="form-input"
                            style={{ height: '32px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}
                            placeholder="Rejection reason (required to reject)..."
                            value={rejectionReasonMap[p.id || p._id] || ''}
                            onChange={(e) => setRejectionReasonMap(prev => ({ ...prev, [p.id || p._id]: e.target.value }))}
                          />
                        )}

                        {p.adminCode && p.approvalStatus === 'pending' && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 'bold', border: '1px dashed var(--color-success)', padding: '6px', borderRadius: '4px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)' }}>
                            Generated Admin Code: {p.adminCode}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-icon" style={{ color: 'var(--color-success)' }}>✓</div>
            <h3>No pending product requests</h3>
            <p>All listings have been approved or verified. Check back when vendors add new items.</p>
          </div>
        )}
      </div>
    </div>
  );
}
