'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import BuyerHeader from '@/components/buyer_home/buyer_header';
import './product-detail.css';

const ALL_PRODUCTS = [];

const REVIEWS = [
  { id:1, name:'Rahul M.',   rating:5, date:'May 2025', text:'Absolutely premium quality! Packaging was immaculate and delivery was super fast. EMAHU verification seal was intact. 100% legit product.', tags:['Fast Delivery','Authentic'], color:'#4169e1', verified:true },
  { id:2, name:'Priya S.',   rating:4, date:'Apr 2025', text:'Great product, looks exactly like the images. Slightly delayed shipping but customer support was very helpful. Would recommend.', tags:['Good Quality','Helpful Support'], color:'#12b7b2', verified:true },
  { id:3, name:'Arjun K.',   rating:5, date:'Apr 2025', text:'Best deal I\'ve ever got! The EMAHU quality inspection report gave me full confidence. No compromise on quality whatsoever.', tags:['Best Deal','Quality Checked'], color:'#f59e0b', verified:false },
  { id:4, name:'Sneha R.',   rating:5, date:'Mar 2025', text:'I was skeptical at first but the verified badge and inspection scores convinced me. Zero regrets — perfect purchase!', tags:['Trusted Platform','Premium Feel'], color:'#10b981', verified:true },
];

const RELATED = [
  { id:3,  name:'Sony WH-1000XM5',      brand:'Sony',    price:26999, img:'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80' },
  { id:4,  name:'MacBook Air M3',        brand:'Apple',   price:114999, img:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80' },
  { id:14, name:'Samsung 55" QLED 4K',   brand:'Samsung', price:69999, img:'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400&q=80' },
  { id:6,  name:'Adidas Ultraboost 22',  brand:'Adidas',  price:12499, img:'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80' },
];

function Stars({ rating, size = 14 }) {
  return (
    <div className="pd-stars">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} className={`pd-star ${s <= Math.round(rating) ? '' : 'pd-star--empty'}`} viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

const RATING_DIST = [
  { label:'5★', pct:72 }, { label:'4★', pct:16 }, { label:'3★', pct:7 },
  { label:'2★', pct:3  }, { label:'1★', pct:2  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg,   setActiveImg]   = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [activeSize,  setActiveSize]  = useState('');
  const [qty,         setQty]         = useState(1);
  const [wishlist,    setWishlist]    = useState(false);
  const [added,       setAdded]       = useState(false);
  const [activeTab,   setActiveTab]   = useState('desc');

  // Sync wishlist on mount
  useEffect(() => {
    try {
      const storedWish = localStorage.getItem('emahu_wishlist');
      if (storedWish) {
        const ids = JSON.parse(storedWish);
        setWishlist(ids.includes(id));
      }
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  // Load product details from database
  useEffect(() => {
    const fetchDbProduct = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/products/${id}`);
        const data = await res.json();
        if (data.success && data.product) {
          const p = data.product;

          // Smart category mapping
          let mappedCategory = p.category;
          if (p.category === 'Electronics') mappedCategory = 'Tech';
          else if (p.category === 'Fitness' || p.category === 'Furniture') mappedCategory = 'Lifestyle';

          setProduct({
            id: p.id || p._id,
            name: p.name,
            brand: p.brand || p.seller?.name || 'Emahu Seller',
            category: mappedCategory,
            price: p.price,
            original: p.comparePrice || p.price,
            discount: p.comparePrice ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0,
            rating: p.rating || 4.7,
            reviews: p.reviews || 84,
            imgs: p.image && p.image.startsWith('http') ? [p.image] : [],
            imageEmoji: (!p.image || !p.image.startsWith('http')) ? p.image : null,
            colors: [],
            sizes: [],
            desc: p.description || 'Premium quality product listing verified by EMAHU.',
            specs: [
              ['Category', p.category],
              ['Available Inventory', `${p.stock} units`],
              ['Status', p.status === 'in-stock' ? 'In Stock' : p.status === 'low-stock' ? 'Low Stock' : 'Out of Stock'],
              ['SKU Identifier', p.sku],
              ['Seller Name', p.seller?.name || 'Authorized Merchant']
            ],
            verified: true,
            isHot: false,
            onSale: p.comparePrice ? (p.price < p.comparePrice) : false,
            seller: p.seller
          });
        }
      } catch (err) {
        console.error('Error fetching database product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDbProduct();
  }, [id]);

  const handleAddCart = () => {
    try {
      const storedCartStr = localStorage.getItem('emahu_cart') || '[]';
      const storedCart = JSON.parse(storedCartStr);
      if (!storedCart.some(x => (typeof x === 'object' ? x.id : x) === product.id)) {
        storedCart.push({
          id: product.id,
          quantity: qty,
          color: product.colors[activeColor] || 'Default',
          size: activeSize || 'Default'
        });
        localStorage.setItem('emahu_cart', JSON.stringify(storedCart));
        window.dispatchEvent(new Event('storage'));
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuyNow = () => {
    try {
      const storedCartStr = localStorage.getItem('emahu_cart') || '[]';
      const storedCart = JSON.parse(storedCartStr);
      if (!storedCart.some(x => (typeof x === 'object' ? x.id : x) === product.id)) {
        storedCart.push({
          id: product.id,
          quantity: qty,
          color: product.colors[activeColor] || 'Default',
          size: activeSize || 'Default'
        });
        localStorage.setItem('emahu_cart', JSON.stringify(storedCart));
        window.dispatchEvent(new Event('storage'));
      }
      router.push('/buyer/checkout');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleWishlist = () => {
    try {
      const storedWish = localStorage.getItem('emahu_wishlist') || '[]';
      let ids = JSON.parse(storedWish);
      if (ids.includes(product.id)) {
        ids = ids.filter(x => x !== product.id);
        setWishlist(false);
      } else {
        ids.push(product.id);
        setWishlist(true);
      }
      localStorage.setItem('emahu_wishlist', JSON.stringify(ids));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !product) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#fafafa', color: '#111' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-page">
      <BuyerHeader />

      {/* Breadcrumb */}
      <nav className="pd-breadcrumb">
        <Link href="/">Home</Link> <span>/</span>
        <Link href="/buyer">Buyer</Link> <span>/</span>
        <Link href="/buyer/products">Collection</Link> <span>/</span>
        <span style={{ color:'#0d0d0d' }}>{product.name}</span>
      </nav>

      {/* Main layout: gallery + info */}
      <div className="pd-main">

        {/* ── LEFT: Gallery ── */}
        <div className="pd-gallery">
          {/* Thumbnails */}
          <div className="pd-thumbs">
            {product.imageEmoji ? (
              <div className="pd-thumb pd-thumb--active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', width: '60px', height: '60px', background: '#f4f4f5', borderRadius: '8px' }}>
                {product.imageEmoji}
              </div>
            ) : (
              product.imgs.map((img, i) => (
                <button key={i} className={`pd-thumb ${activeImg === i ? 'pd-thumb--active' : ''}`} onClick={() => setActiveImg(i)}>
                  <img src={img} alt={`View ${i+1}`} />
                </button>
              ))
            )}
          </div>

          {/* Big image */}
          <div className="pd-main-img-wrap">
            {product.imageEmoji ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', minHeight: '350px', fontSize: '8rem', background: '#f4f4f5', borderRadius: '16px' }}>
                {product.imageEmoji}
              </div>
            ) : (
              <img src={product.imgs[activeImg]} alt={product.name} className="pd-main-img" />
            )}
            
            {/* Badges */}
            <div className="pd-img-badges">
              {product.verified && <span className="pd-img-badge pd-img-badge--verified">✓ EMAHU Verified</span>}
              {product.onSale   && <span className="pd-img-badge pd-img-badge--sale">−{product.discount}% OFF</span>}
              {product.isHot    && <span className="pd-img-badge pd-img-badge--hot">🔥 Hot Deal</span>}
            </div>

            <div className="pd-zoom-hint">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              Hover to zoom
            </div>
          </div>
        </div>

        {/* ── RIGHT: Info ── */}
        <div className="pd-info">
          <p className="pd-info__brand">{product.brand}</p>
          <h1 className="pd-info__name">{product.name}</h1>

          {/* Rating */}
          <div className="pd-rating-row">
            <Stars rating={product.rating} />
            <span className="pd-rating-score">{product.rating}</span>
            <span className="pd-rating-sep">·</span>
            <span className="pd-rating-count">{product.reviews.toLocaleString()} reviews</span>
            {product.verified && (
              <span className="pd-verified-tag">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#12b7b2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                EMAHU Verified
              </span>
            )}
          </div>

          {/* Price */}
          <div className="pd-price-block">
            <span className="pd-price">₹{product.price.toLocaleString('en-IN')}</span>
            {product.onSale && <>
              <span className="pd-price-orig">₹{product.original.toLocaleString('en-IN')}</span>
              <span className="pd-price-off">{product.discount}% off</span>
            </>}
          </div>
          <p className="pd-price-note">Inclusive of all taxes · Free delivery</p>

          <div className="pd-divider" />

          {/* Color */}
          {product.colors.length > 0 && <>
            <p className="pd-selector-label">Color — <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,color:'#6b7280'}}>Option {activeColor+1}</span></p>
            <div className="pd-colors">
              {product.colors.map((c, i) => (
                <div key={i} className={`pd-color-dot ${activeColor===i?'pd-color-dot--active':''}`}
                  style={{ background: c }} onClick={() => setActiveColor(i)} title={c} />
              ))}
            </div>
          </>}

          {/* Size */}
          {product.sizes.length > 0 && <>
            <p className="pd-selector-label">Size</p>
            <div className="pd-sizes">
              {product.sizes.map(s => (
                <button key={s} className={`pd-size-btn ${activeSize===s?'pd-size-btn--active':''}`}
                  onClick={() => setActiveSize(s)}>{s}</button>
              ))}
            </div>
            <button className="pd-size-guide">Size guide →</button>
          </>}

          {/* Qty */}
          <div className="pd-qty-row">
            <span className="pd-qty-label">Qty</span>
            <div className="pd-qty-ctrl">
              <button className="pd-qty-btn" onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
              <span className="pd-qty-val">{qty}</span>
              <button className="pd-qty-btn" onClick={() => setQty(q => q+1)}>+</button>
            </div>
            <span style={{fontSize:'0.78rem',color:'#16a34a',fontWeight:600}}>✓ In Stock</span>
          </div>

          {/* CTAs */}
          <div className="pd-cta-row">
            <button className={`pd-btn-cart ${added?'pd-btn-cart--added':''}`} onClick={handleAddCart}>
              {added ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Added!</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Add to Cart</>
              )}
            </button>
            <button className="pd-btn-buy" onClick={handleBuyNow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              Buy Now
            </button>
            <button className={`pd-btn-wishlist ${wishlist?'pd-btn-wishlist--active':''}`} onClick={handleToggleWishlist} aria-label="Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlist?'#ef4444':'none'} stroke={wishlist?'#ef4444':'#374151'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>

          {/* Delivery info */}
          <div className="pd-delivery-cards">
            {[
              { icon:'🚚', title:'Free Express Delivery', sub:'Estimated by Tomorrow, 10 AM', tag:'FREE' },
              { icon:'✅', title:'EMAHU Quality Checked', sub:'Physical inspection completed. Seal verified.', tag:null },
              { icon:'🔄', title:'30-Day Easy Returns', sub:'No questions asked return policy', tag:null },
              { icon:'🔒', title:'Secure Escrow Payment', sub:'Money released only after you confirm receipt', tag:null },
            ].map((item, i) => (
              <div key={i} className="pd-delivery-card">
                <div className="pd-delivery-icon" style={{fontSize:'1.1rem'}}>{item.icon}</div>
                <div className="pd-delivery-info">
                  <div className="pd-delivery-title">{item.title}</div>
                  <div className="pd-delivery-sub">{item.sub}</div>
                </div>
                {item.tag && <span className="pd-delivery-tag">{item.tag}</span>}
              </div>
            ))}
          </div>

          {/* Trust row */}
          <div className="pd-trust-row">
            {['100% Authentic', 'Secure Checkout', 'EMAHU Protected', '24/7 Support'].map(t => (
              <span key={t} className="pd-trust-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#12b7b2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs: Description / Specs / Reviews ── */}
      <section className="pd-tabs-section">
        <div className="pd-tabs">
          {[['desc','Description'],['specs','Specifications'],['reviews','Reviews']].map(([k,l]) => (
            <button key={k} className={`pd-tab ${activeTab===k?'pd-tab--active':''}`} onClick={() => setActiveTab(k)}>{l}</button>
          ))}
        </div>

        {activeTab === 'desc' && (
          <div className="pd-desc">
            <p>{product.desc} Built for people who demand the best — designed, inspected, and delivered with premium care through the EMAHU quality assurance system.</p>
            <p>Every EMAHU-listed product undergoes rigorous 47-point physical inspection at one of our secure hub facilities before reaching your doorstep. Your satisfaction is guaranteed.</p>
            <div className="pd-features-grid">
              {[
                {icon:'🛡️', title:'Quality Assured', sub:'47-point physical inspection'},
                {icon:'📦', title:'Premium Packaging', sub:'Tamper-proof EMAHU seal'},
                {icon:'⚡', title:'Express Delivery', sub:'Next-day delivery available'},
                {icon:'💎', title:'Authentic Product', sub:'Manufacturer warranty included'},
              ].map(f => (
                <div key={f.title} className="pd-feature-item">
                  <div className="pd-feature-icon">{f.icon}</div>
                  <div>
                    <div className="pd-feature-title">{f.title}</div>
                    <div className="pd-feature-sub">{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="pd-specs">
            <table className="pd-specs-table">
              <tbody>
                {product.specs.map(([k,v]) => (
                  <tr key={k}><td>{k}</td><td>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="pd-reviews">
            <div className="pd-reviews-summary">
              <div>
                <div className="pd-reviews-big-score">{product.rating}</div>
                <div><Stars rating={product.rating} size={16}/></div>
                <div className="pd-reviews-big-label">{product.reviews.toLocaleString()} reviews</div>
              </div>
              <div className="pd-bar-rows">
                {RATING_DIST.map(r => (
                  <div key={r.label} className="pd-bar-row">
                    <span className="pd-bar-label">{r.label}</span>
                    <div className="pd-bar-track"><div className="pd-bar-fill" style={{width:`${r.pct}%`}} /></div>
                    <span className="pd-bar-pct">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pd-review-cards">
              {REVIEWS.map(r => (
                <div key={r.id} className="pd-review-card">
                  <div className="pd-review-head">
                    <div className="pd-review-avatar" style={{background:r.color}}>{r.name[0]}</div>
                    <div>
                      <div className="pd-review-name">{r.name}</div>
                      <div className="pd-review-date">{r.date}</div>
                    </div>
                    {r.verified && <span className="pd-review-verified">✓ Verified Purchase</span>}
                  </div>
                  <div className="pd-review-stars">
                    {[1,2,3,4,5].map(s=>(
                      <svg key={s} className="pd-review-rs" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={s<=r.rating?'#f59e0b':'#e5e7eb'}/></svg>
                    ))}
                  </div>
                  <p className="pd-review-text">{r.text}</p>
                  <div className="pd-review-tags">{r.tags.map(t=><span key={t} className="pd-review-tag">{t}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Related Products ── */}
      <section className="pd-related">
        <h2 className="pd-related__title">You Might Also Like</h2>
        <div className="pd-related-grid">
          {RELATED.map(r => (
            <Link key={r.id} href={`/buyer/products/${r.id}`} className="pd-related-card">
              <div className="pd-related-img-wrap">
                <img src={r.img} alt={r.name} className="pd-related-img" loading="lazy" />
              </div>
              <p className="pd-related-brand">{r.brand}</p>
              <p className="pd-related-name">{r.name}</p>
              <p className="pd-related-price">₹{r.price.toLocaleString('en-IN')}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
