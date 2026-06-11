'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './dashboard.css';
import { logoutUser, clearAuthSession } from '@/utils/auth';

// Initial Mock Premium Products
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

// Initial Recent Orders
const RECENT_ORDERS = [
  { id: 'ORD-9821', customer: 'Aarav Sharma', product: 'SoundAura Pro Headphones', amount: 12500, status: 'Delivered', time: '12 mins ago' },
  { id: 'ORD-9820', customer: 'Priya Patel', product: 'Emahu Smart Luxe Chrono', amount: 18999, status: 'Processing', time: '45 mins ago' },
  { id: 'ORD-9819', customer: 'Kabir Mehta', product: 'AuraRing Smart Health Tracker', amount: 9500, status: 'Shipped', time: '2 hours ago' },
  { id: 'ORD-9818', customer: 'Ananya Rao', product: 'SoundAura Pro Headphones', amount: 12500, status: 'Delivered', time: '4 hours ago' }
];

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
        setSellerUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored seller user:', e);
      }
    }
    setIsAuthorized(true);
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
  const [products, setProducts] = useState(INITIAL_PRODUCTS);  
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
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Electronics');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductComparePrice, setNewProductComparePrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState('📦');
  const [formError, setFormError] = useState('');

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

  // Utility to push notifications
  const triggerToast = (title, message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
  };

  // Add Product Handler
  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductSku.trim() || !newProductPrice || !newProductStock) {
      setFormError('Please fill in all required fields marked with *');
      return;
    }
    
    // Validate Numeric values
    const priceNum = parseFloat(newProductPrice);
    const stockNum = parseInt(newProductStock);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid price greater than 0.');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError('Please enter a valid non-negative stock count.');
      return;
    }

    // Determine status badge
    let status = 'in-stock';
    if (stockNum === 0) status = 'out-of-stock';
    else if (stockNum <= 10) status = 'low-stock';

    const newProduct = {
      id: `prod-${Date.now()}`,
      name: newProductName.trim(),
      sku: newProductSku.trim().toUpperCase(),
      category: newProductCategory,
      price: priceNum,
      comparePrice: newProductComparePrice ? parseFloat(newProductComparePrice) : null,
      stock: stockNum,
      status,
      sales: 0,
      image: selectedImage
    };

    setProducts((prev) => [newProduct, ...prev]);
    triggerToast(
      'Product Listed Successfully',
      `EMAHU-PRO: "${newProductName}" has been uploaded and is now live.`,
      'success'
    );
    
    // Close Modal and Reset form fields
    setIsAddModalOpen(false);
    resetAddForm();
  };

  const resetAddForm = () => {
    setNewProductName('');
    setNewProductSku('');
    setNewProductCategory('Electronics');
    setNewProductPrice('');
    setNewProductComparePrice('');
    setNewProductStock('');
    setNewProductDescription('');
    setSelectedImage('📦');
    setFormError('');
  };

  // Open Delete Confirmation
  const confirmDeleteProduct = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  // Perform actual deletion
  const handleDeleteProduct = () => {
    if (!productToDelete) return;
    
    setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
    triggerToast(
      'Product Removed',
      `EMAHU-PRO: "${productToDelete.name}" was successfully deleted.`,
      'danger'
    );
    
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
  const totalRevenue = products.reduce((acc, p) => acc + (p.price * p.sales), 0);
  const totalSalesCount = products.reduce((acc, p) => acc + p.sales, 0);
  const lowStockCount = products.filter(p => p.status === 'low-stock').length;
  const outOfStockCount = products.filter(p => p.status === 'out-of-stock').length;

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
              {activeTab !== 'orders' && <span className="sidebar-title-tag" style={{ marginLeft: '10px', background: 'var(--color-danger)' }}>4</span>}
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

          <div className="header-actions">
            <button className="icon-badge-btn" onClick={() => triggerToast('Notification', 'EMAHU-PRO: High payout clearance is successful!', 'success')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="badge-dot"></span>
            </button>

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
                  <div className="stat-value">₹{(totalRevenue + 854000).toLocaleString('en-IN')}</div>
                  <div className="stat-footer">
                    <span className="stat-trend up">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                      18.4%
                    </span>
                    <span>vs last month</span>
                  </div>
                </div>

                <div className="stat-card success-theme">
                  <div className="stat-header">
                    <span className="stat-title">Total Orders Dispatched</span>
                    <div className="stat-icon success">📦</div>
                  </div>
                  <div className="stat-value">{(totalSalesCount + 910).toLocaleString()}</div>
                  <div className="stat-footer">
                    <span className="stat-trend up">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                      12.1%
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
                      <text x="35" y="135" textAnchor="end" className="chart-axis-text">100k</text>
                      <text x="35" y="90" textAnchor="end" className="chart-axis-text">200k</text>
                      <text x="35" y="45" textAnchor="end" className="chart-axis-text">300k</text>

                      {/* X labels */}
                      <text x="70" y="198" textAnchor="middle" className="chart-axis-text">Mon</text>
                      <text x="135" y="198" textAnchor="middle" className="chart-axis-text">Tue</text>
                      <text x="200" y="198" textAnchor="middle" className="chart-axis-text">Wed</text>
                      <text x="265" y="198" textAnchor="middle" className="chart-axis-text">Thu</text>
                      <text x="330" y="198" textAnchor="middle" className="chart-axis-text">Fri</text>
                      <text x="395" y="198" textAnchor="middle" className="chart-axis-text">Sat</text>
                      <text x="460" y="198" textAnchor="middle" className="chart-axis-text">Sun</text>

                      {/* Line Chart Area Fill for Revenue */}
                      <path d="M 70 180 L 70 110 C 100 110, 100 125, 135 125 C 170 125, 170 95, 200 95 C 230 95, 230 80, 265 80 C 300 80, 300 50, 330 50 C 360 50, 360 70, 395 70 C 430 70, 430 30, 460 30 L 460 180 Z" className="chart-area-revenue" />

                      {/* Line Chart Stroke for Revenue (Green) */}
                      <path d="M 70 110 C 100 110, 100 125, 135 125 C 170 125, 170 95, 200 95 C 230 95, 230 80, 265 80 C 300 80, 300 50, 330 50 C 360 50, 360 70, 395 70 C 430 70, 430 30, 460 30" className="chart-path-revenue" />

                      {/* Line Chart Stroke for Orders (Yellow) */}
                      <path d="M 70 150 C 100 150, 100 140, 135 140 C 170 140, 170 135, 200 135 C 230 135, 230 110, 265 110 C 300 110, 300 95, 330 95 C 360 95, 360 105, 395 105 C 430 105, 430 70, 460 70" className="chart-path-orders" />

                      {/* Dotted Vertical Hover Line (Visual effect like screenshot) */}
                      <line x1="330" y1="50" x2="330" y2="180" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" className="chart-hover-line" />
                      <rect x="315" y="50" width="30" height="130" fill="rgba(16, 185, 129, 0.08)" className="chart-hover-bg" />

                      {/* Tooltip Box like Screenshot */}
                      <g className="chart-tooltip">
                        <rect x="250" y="10" width="105" height="42" rx="6" fill="#18181b" />
                        <text x="260" y="26" fill="#fff" fontSize="10" fontFamily="sans-serif">Jun, 2025</text>
                        <circle cx="264" cy="40" r="3" fill="#10b981" />
                        <text x="272" y="43" fill="#fff" fontSize="11" fontFamily="sans-serif" fontWeight="bold">$1.000 <tspan fontWeight="normal" fill="#a1a1aa">Revenue</tspan></text>
                      </g>

                      {/* Interactive Dots for Revenue */}
                      <circle cx="70" cy="110" r="4.5" fill="#fff" stroke="#10b981" strokeWidth="2.5" className="chart-point" />
                      <circle cx="135" cy="125" r="4.5" fill="#fff" stroke="#10b981" strokeWidth="2.5" className="chart-point" />
                      <circle cx="200" cy="95" r="4.5" fill="#fff" stroke="#10b981" strokeWidth="2.5" className="chart-point" />
                      <circle cx="265" cy="80" r="4.5" fill="#fff" stroke="#10b981" strokeWidth="2.5" className="chart-point" />
                      <circle cx="330" cy="50" r="4.5" fill="#10b981" stroke="#fff" strokeWidth="2" className="chart-point" /> {/* Hovered Point */}
                      <circle cx="395" cy="70" r="4.5" fill="#fff" stroke="#10b981" strokeWidth="2.5" className="chart-point" />
                      <circle cx="460" cy="30" r="4.5" fill="#fff" stroke="#10b981" strokeWidth="2.5" className="chart-point" />
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
                    {RECENT_ORDERS.map((order) => (
                      <div key={order.id} className="realtime-item">
                        <div className="realtime-img">
                          {order.product.includes('Headphones') ? '🎧' : order.product.includes('Chrono') ? '⌚' : '💍'}
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
                        <th>Market Status</th>
                        <th>Total Sales</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className="product-cell">
                              <div className="product-img">{product.image}</div>
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
                            <span className={`status-badge ${product.status}`}>
                              {product.status === 'in-stock' ? 'In Stock' :
                               product.status === 'low-stock' ? 'Low Stock' :
                               product.status === 'out-of-stock' ? 'Out of Stock' : 'Draft'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{product.sales} orders</td>
                          <td>
                            <div className="action-buttons-group" style={{ justifyContent: 'center' }}>
                              <button className="action-btn" title="Edit Properties" onClick={() => triggerToast('Feature Unavailable', 'Live database connection is required to sync property updates.', 'danger')}>
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
                      ))}
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
                  <h2>Orders Dispatch Desk</h2>
                  <p>Monitor pending customer transactions, print invoice shipping logs, and manage carrier routes.</p>
                </div>
              </div>

              {/* Table wrapper */}
              <div className="table-wrapper">
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Ordered Item</th>
                      <th>Total Value</th>
                      <th>Fulfillment</th>
                      <th>Timeline</th>
                      <th>Logistics</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_ORDERS.map((order) => (
                      <tr key={order.id}>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{order.id}</td>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{order.customer}</td>
                        <td>{order.product}</td>
                        <td style={{ fontWeight: 700 }}>₹{order.amount.toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`status-badge ${
                            order.status === 'Delivered' ? 'in-stock' :
                            order.status === 'Processing' ? 'low-stock' : 'draft'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{order.time}</td>
                        <td>
                          <button className="btn-secondary" style={{ height: '30px', padding: '0 10px', fontSize: '0.75rem' }} onClick={() => triggerToast('Manifest Printed', `Shipment label for ${order.id} is sent to printer.`, 'success')}>
                            Print Label
                          </button>
                        </td>
                      </tr>
                    ))}
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
                        <span>1. Product Views (92,400 visitors)</span>
                        <span style={{ fontWeight: 'bold' }}>100%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to right, var(--color-primary), #a855f7)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                        <span>2. Add to Cart (18,200 sessions)</span>
                        <span style={{ fontWeight: 'bold' }}>19.7%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '19.7%', height: '100%', background: 'linear-gradient(to right, var(--color-primary), #a855f7)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                        <span>3. Initiated Checkout (4,120 sessions)</span>
                        <span style={{ fontWeight: 'bold' }}>4.4%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '4.4%', height: '100%', background: 'linear-gradient(to right, var(--color-primary), #a855f7)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                        <span>4. Completed Sales (1,034 orders)</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>1.12% Net Conv.</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '1.12%', height: '100%', background: 'var(--color-success)' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card">
                  <span className="glass-card-title" style={{ marginBottom: '16px' }}>Geographic Sales Share</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem' }}>Maharashtra (Mumbai, Pune)</span>
                      <span style={{ fontWeight: 700 }}>38%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem' }}>Karnataka (Bengaluru)</span>
                      <span style={{ fontWeight: 700 }}>24%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem' }}>Delhi NCR</span>
                      <span style={{ fontWeight: 700 }}>18%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem' }}>Tamil Nadu (Chennai)</span>
                      <span style={{ fontWeight: 700 }}>12%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem' }}>Others</span>
                      <span style={{ fontWeight: 700 }}>8%</span>
                    </div>
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
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>List New Merchandise</h3>
                <p>Provide details to index this product instantly on Emahu marketplace.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '12px 24px', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid rgba(239, 68, 68, 0.15)' }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="modal-form">
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
                </div>

                <div className="form-group">
                  <label className="form-label">Merchandise Category</label>
                  <select 
                    className="select-filter" 
                    style={{ height: '42px' }}
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Apparel">Apparel</option>
                  </select>
                </div>
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
                </div>

                <div className="form-group">
                  <label className="form-label">Compare-At Price (INR)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="₹15,000" 
                    value={newProductComparePrice}
                    onChange={(e) => setNewProductComparePrice(e.target.value)}
                  />
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
                </div>

                <div className="form-group">
                  <label className="form-label">Product Icon Placeholder</label>
                  <div className="form-image-grid">
                    {['📦', '⌚', '🎧', '💍'].map((img) => (
                      <div 
                        key={img} 
                        className={`image-option ${selectedImage === img ? 'selected' : ''}`}
                        onClick={() => setSelectedImage(img)}
                      >
                        {img}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Summarize product parameters, size details, and warranty terms..."
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                />
              </div>

              <div className="modal-footer" style={{ borderTop: 'none', padding: '16px 0 0 0' }}>
                <button type="button" className="modal-btn cancel" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="modal-btn confirm">Confirm and List</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <p>Are you sure you want to remove <strong>"{productToDelete?.name}"</strong> from your live index? This cannot be undone.</p>
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
