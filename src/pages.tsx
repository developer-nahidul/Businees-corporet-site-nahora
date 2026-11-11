import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Check, ChevronDown, CircleHelp,
  Clock3, Eye, FileText, Filter, Heart, MapPin, MessageCircle, Package, Plus, Search, ShieldCheck,
  ShoppingBag, SlidersHorizontal, Sparkles, Star, Store, Truck, Users, Wallet,
  X,
} from 'lucide-react'
import {
  Breadcrumbs, Button, DateLabel, EmptyState, Footer, Header, MiniStatTrend,
  PageHeader, Pagination, Pill, ProductCard, SectionTitle, Sidebar,
} from './components'
import { categories, demoRows, pageDescriptions, portalNavigation, productImage, products, stores, workspaces, type RecordRow } from './data'
import { useAppStore } from './store'
import { AccessibilitySettings, CustomerAdvancedFeature, MerchantAdvancedModule, MerchantOverviewExtras, WorkspaceAdvancedModule } from './advanced'

const salesData = [
  { day: 'Mon', sales: 22400, orders: 18 }, { day: 'Tue', sales: 27800, orders: 22 },
  { day: 'Wed', sales: 19500, orders: 16 }, { day: 'Thu', sales: 36200, orders: 29 },
  { day: 'Fri', sales: 31800, orders: 25 }, { day: 'Sat', sales: 48700, orders: 39 },
  { day: 'Sun', sales: 42700, orders: 34 },
]

const statIcons = [Wallet, ShoppingBag, Store, Clock3]
const statTones = ['stat-green', 'stat-gold', 'stat-blue', 'stat-violet']
const customerHubs = [
  { label: 'Orders & delivery', detail: 'Track, review and manage your marketplace purchases.', icon: Package, path: '/orders' },
  { label: 'Your saved finds', detail: 'Wishlist products, followed stores and collections.', icon: Heart, path: '/wishlist' },
  { label: 'Reviews & questions', detail: 'Your product reviews, seller replies and Q&A.', icon: Star, path: '/reviews' },
  { label: 'Rewards & referrals', detail: 'Points, coupons, membership and referral previews.', icon: Sparkles, path: '/rewards' },
  { label: 'Recently viewed', detail: 'Pick up where you left off in product discovery.', icon: Eye, path: '/recently-viewed' },
  { label: 'Privacy & preferences', detail: 'Language, theme, notifications and accessibility.', icon: ShieldCheck, path: '/notifications' },
]
type CustomerAddress = { id: string; label: string; name: string; street: string; city: string; phone: string; isDefault: boolean }
type CustomerProfile = { name: string; email: string; phone: string; language: string }
const initialCustomerProfile: CustomerProfile = { name: 'Samira Ahmed', email: 'samira@example.com', phone: '01712 345 678', language: 'English' }
const readCustomerProfile = (): CustomerProfile => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('nahora-customer-profile') || 'null')
    if (saved && typeof saved === 'object' && 'name' in saved && typeof saved.name === 'string' && 'email' in saved && typeof saved.email === 'string' && 'phone' in saved && typeof saved.phone === 'string' && 'language' in saved && typeof saved.language === 'string') return { name: saved.name, email: saved.email, phone: saved.phone, language: saved.language }
  } catch {
    return initialCustomerProfile
  }
  return initialCustomerProfile
}
const readCustomerOrders = (): RecordRow[] => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('nahora-customer-orders') || 'null')
    if (Array.isArray(saved) && saved.every((item) => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.subtitle === 'string' && typeof item.status === 'string' && typeof item.amount === 'number' && typeof item.date === 'string' && typeof item.avatar === 'string')) return saved
  } catch {
    return demoRows
  }
  return demoRows
}
const readCartCoupon = () => {
  try {
    return localStorage.getItem('nahora-cart-coupon') === 'NAHORA10'
  } catch {
    return false
  }
}
const initialCustomerAddresses: CustomerAddress[] = [
  { id: 'home', label: 'Home', name: 'Samira Ahmed', street: 'House 18, Road 7, Mirpur DOHS', city: 'Dhaka 1216', phone: '01712 345 678', isDefault: true },
  { id: 'family', label: 'Family', name: 'Samira Ahmed', street: 'Flat 3B, 22 GEC Circle', city: 'Chattogram 4000', phone: '01712 345 678', isDefault: false },
]
const readCustomerAddresses = (): CustomerAddress[] => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('nahora-customer-addresses') || 'null')
    if (Array.isArray(saved) && saved.every((item) => item && typeof item.id === 'string' && typeof item.label === 'string' && typeof item.name === 'string' && typeof item.street === 'string' && typeof item.city === 'string' && typeof item.phone === 'string' && typeof item.isDefault === 'boolean')) return saved
  } catch {
    return initialCustomerAddresses
  }
  return initialCustomerAddresses
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><Header /><main>{children}</main><Footer /></>
}

export function MarketplaceHome() {
  const { t, i18n } = useTranslation()
  const { notify } = useAppStore()
  const [activeCategory, setActiveCategory] = useState('All')
  const shownProducts = activeCategory === 'All' ? products.slice(0, 4) : products.filter((p) => p.category === activeCategory).slice(0, 4)
  return <div className="market-home">
    <div className="announcement"><Sparkles size={14} /><span>Celebrating local makers — discover 1,200+ independent Bangladeshi stores</span><Link to="/stores">Meet our sellers <ArrowRight size={13} /></Link><button aria-label="Dismiss announcement" onClick={(e) => e.currentTarget.parentElement?.remove()}>×</button></div>
    <section className="hero-section">
      <motion.div className="hero-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="hero-kicker"><span className="hero-kicker-dot" /> MADE WITH CARE. FOUND ON NAHORA.</div>
        <h1>Good things,<br /><em>from closer</em> to home.</h1>
        <p>Discover thoughtfully made products from the people and small businesses that make Bangladesh extraordinary.</p>
        <div className="hero-actions"><Link to="/search" className="button button-primary">Explore the marketplace <ArrowRight size={17} /></Link><Link to="/stores" className="button button-text">Meet our local stores <ArrowUpRight size={15} /></Link></div>
        <div className="hero-proof"><div className="proof-avatars"><span>RB</span><span>MK</span><span>SH</span><b>+</b></div><div><strong>1,200+ local makers</strong><small>and counting across Bangladesh</small></div><span className="proof-divider" /><div className="proof-rating"><span>★★★★★</span><small>4.9/5 buyer love</small></div></div>
      </motion.div>
      <div className="hero-art">
        <div className="hero-photo-main"><img src={productImage('photo-1509358271058-acd22cc93898', 1000)} alt="Bangladeshi artisan workshop" /></div>
        <div className="hero-photo-small"><img src={productImage('photo-1490312278390-ab64016e0aa9', 400)} alt="Artisan crafted ceramics" /></div>
        <div className="hero-note"><span className="hero-note-mark">✳</span><span><b>Made by hand</b><small>Rooted in Bangladesh</small></span></div>
        <div className="hero-product-tag"><span>JUST DISCOVERED</span><b>Stories woven<br />into every thread</b><Link to="/product/p-1001">Explore the edit <ArrowRight size={13} /></Link></div>
        <div className="hero-stamp">LOCAL<br />LOOKS<br />GOOD <span>✦</span></div>
      </div>
      <div className="hero-vertical-label">A MARKETPLACE WITH MEANING · EST. 2026</div>
    </section>

    <section className="category-section content-wrap">
      <SectionTitle overline="A LITTLE BIT OF EVERYTHING" title={t('categories')} description="From heirloom textiles to everyday essentials, meet the makers behind it all." to="/search" linkLabel="Browse all categories" />
      <div className="category-grid">{categories.map((category, index) => <Link className={`category-card ${category.tint}`} to={`/search?category=${encodeURIComponent(category.name.split(' &')[0])}`} key={category.name}>
        <span className="category-illustration">{category.icon}</span><span className="category-number">0{index + 1}</span><b>{category.name}</b><small>{category.count}</small><span className="category-arrow"><ArrowUpRight size={16} /></span>
      </Link>)}</div>
    </section>

    <section className="featured-section content-wrap">
      <SectionTitle overline="GOOD FINDS, GREAT STORIES" title={t('featured')} description="Thoughtful picks from sellers who put care into every detail." to="/search" linkLabel="View all products" />
      <div className="home-filter-row">{['All', 'Fashion', 'Home & Living', 'Accessories', 'Food & Grocery'].map((item) => <button key={item} className={activeCategory === item ? 'home-filter active' : 'home-filter'} onClick={() => setActiveCategory(item)}>{item}</button>)}</div>
      <div className="product-grid">{shownProducts.length ? shownProducts.map((product) => <ProductCard key={product.id} product={product} />) : <EmptyState title="More lovely finds are on the way" description="Try another category to explore independent sellers." />}</div>
      <div className="centered-button"><Link className="button button-outline" to="/search">Explore all products <ArrowRight size={16} /></Link></div>
    </section>

    <section className="story-banner content-wrap">
      <div className="story-image"><img src={productImage('photo-1509358271058-acd22cc93898', 1100)} alt="Bangladesh artisan workshop" /><span className="story-image-caption">Dhamrai, Dhaka · Est. 2018</span></div>
      <div className="story-copy"><div className="eyebrow"><span className="eyebrow-line" /> OUR KIND OF COMMERCE</div><h2>Every purchase<br />has a <em>person</em><br />behind it.</h2><p>We bring you closer to the makers, family shops and independent businesses shaping a more thoughtful way to shop in Bangladesh.</p><Link className="button button-light" to="/community">Get to know our community <ArrowRight size={16} /></Link><div className="story-signoff">Small business. Big heart. <span>✳</span></div></div>
    </section>

    <section className="store-section content-wrap">
      <SectionTitle overline="PEOPLE MAKE THE PLACE" title={t('topStores')} description="A few of the passionate people bringing good things to your door." to="/stores" linkLabel="Meet all stores" />
      <div className="store-grid">{stores.map((store, index) => <Link to={`/stores/${index + 1}`} className="store-card" key={store.name}>
        <div className="store-cover"><img src={productImage(store.image, 600)} alt="" /><span className="store-open-pill"><i /> OPEN TODAY</span><button aria-label={`Follow ${store.name}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); notify(`Following ${store.name} in this demo.`) }}><Heart size={16} /></button></div>
        <div className="store-card-info"><div className="store-logo">{store.name.slice(0, 1)}</div><div className="store-title"><b>{store.name}</b><small>{store.type}</small></div><span className="rating"><span>★</span> {store.rating}</span><div className="store-location"><MapPin size={13} />{store.location}</div></div>
      </Link>)}</div>
    </section>

    <section className="seasonal-banner content-wrap">
      <div><Pill tone="gold">THE FESTIVE EDIT · 2026</Pill><h2>Little rituals.<br /><em>Lovely gifts.</em></h2><p>Thoughtful finds for the people who make every day a little brighter.</p><Link to="/deals" className="button button-primary">Explore the festive edit <ArrowRight size={16} /></Link></div>
      <div className="seasonal-image"><img src={productImage('photo-1602143407151-7111542de6e8', 900)} alt="Festive gift collection" /><span>GIVE A LITTLE<br />LOCAL LOVE <b>✳</b></span></div>
    </section>

    <section className="trending-section content-wrap">
      <div className="trending-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> THE NEIGHBOURHOOD IS TALKING</div><h2>{t('trending')}</h2><p>Good finds finding their people.</p></div><Link to="/search" className="text-link">See what's loved <ArrowRight size={16} /></Link></div>
      <div className="trending-row">{products.slice(4, 8).map((product, index) => <Link to={`/product/${product.id}`} className="trending-card" key={product.id}><span className="trending-num">0{index + 1}</span><img src={productImage(product.image, 180)} alt="" /><span><b>{i18n.language === 'bn' ? product.bn : product.name}</b><small>{product.store}</small></span><span className="trending-price">৳{product.price.toLocaleString('en-BD')} <ArrowUpRight size={14} /></span></Link>)}</div>
    </section>

    <section className="newsletter content-wrap"><div className="newsletter-copy"><span className="newsletter-icon">✳</span><div><span className="eyebrow">A GOOD THING IN YOUR INBOX</span><h2>Notes from the neighbourhood.</h2><p>New finds, maker stories and little reasons to feel good about shopping local.</p></div></div><NewsletterForm /></section>
  </div>
}

function NewsletterForm() {
  const { notify } = useAppStore()
  const [email, setEmail] = useState('')
  return <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); notify(`Newsletter preview saved for ${email}. No email was sent.`); setEmail('') }}>
    <label htmlFor="newsletter-email">Your email address</label><div><input id="newsletter-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /><button className="button button-primary" type="submit">Count me in <ArrowRight size={15} /></button></div><small>By subscribing, you agree to our privacy policy. Unsubscribe any time.</small>
  </form>
}

export function SearchPage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [query, setQuery] = useState(params.get('q') || '')
  const [category, setCategory] = useState(params.get('category') || 'All')
  const [page, setPage] = useState(1)
  const [listView, setListView] = useState(false)
  const [sortBy, setSortBy] = useState('Featured')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [saleOnly, setSaleOnly] = useState(false)
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const { t } = useTranslation()
  const filtered = products.filter((product) => {
    const matchesQuery = !query || `${product.name} ${product.bn} ${product.store} ${product.category}`.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'All' || product.category.toLowerCase().includes(category.toLowerCase())
    const matchesPrice = (!minPrice || product.price >= Number(minPrice)) && (!maxPrice || product.price <= Number(maxPrice))
    const matchesRating = product.rating >= minRating
    const matchesSale = !saleOnly || Boolean(product.oldPrice)
    const matchesStore = !selectedStores.length || selectedStores.includes(product.store)
    const matchesLocation = !selectedLocations.length || selectedLocations.some((locationName) => product.location.includes(locationName))
    return matchesQuery && matchesCategory && matchesPrice && matchesRating && matchesSale && matchesStore && matchesLocation
  }).sort((a, b) => sortBy === 'Price: low to high' ? a.price - b.price : sortBy === 'Price: high to low' ? b.price - a.price : sortBy === 'Top rated' ? b.rating - a.rating : sortBy === 'Popular' ? b.reviews - a.reviews : sortBy === 'Newest' ? b.id.localeCompare(a.id) : 0)
  const clearFilters = () => { setCategory('All'); setQuery(''); setMinPrice(''); setMaxPrice(''); setMinRating(0); setSaleOnly(false); setSelectedStores([]); setSelectedLocations([]); setPage(1) }
  return <div className="public-page content-wrap">
    <Breadcrumbs parts={['Discover']} />
    <PageHeader eyebrow="THE NAHORA MARKETPLACE" title={query ? `Find your next favourite` : 'Shop thoughtfully, live beautifully.'} description={query ? `Showing independent finds matching “${query}”.` : 'A considered collection of products from Bangladesh’s independent sellers.'} actions={<Pill tone="demo">{t('demo')}</Pill>} />
    <div className="discover-search"><Search size={18} /><input placeholder="What are you looking for today?" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} /><button className="button button-primary" onClick={() => setPage(1)}>Search</button></div>
    <div className="listing-layout">
      <aside className="filter-panel"><div className="filter-panel-heading"><b>Filters</b><button onClick={clearFilters}>Clear all</button></div><div className="filter-group"><b>Category</b>{['All', 'Fashion', 'Home & Living', 'Food & Grocery', 'Accessories'].map((item) => <label key={item}><input type="radio" name="category" checked={category === item} onChange={() => { setCategory(item); setPage(1) }} />{item}<span>{item === 'All' ? products.length : products.filter((product) => product.category === item).length}</span></label>)}</div><div className="filter-group"><b>Price range</b><div className="price-inputs"><input type="number" min="0" placeholder="৳ Min" aria-label="Minimum price" value={minPrice} onChange={(event) => { setMinPrice(event.target.value); setPage(1) }} /><span>—</span><input type="number" min="0" placeholder="৳ Max" aria-label="Maximum price" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setPage(1) }} /></div></div><div className="filter-group"><b>Customer rating</b>{[4, 3].map((value) => <label key={value}><input type="radio" name="rating" checked={minRating === value} onChange={() => { setMinRating(value); setPage(1) }} /> <span className="filter-stars">★★★★★</span><span>{value} stars & up</span></label>)}<label><input type="radio" name="rating" checked={minRating === 0} onChange={() => setMinRating(0)} /> Any rating</label></div><div className="filter-group"><b>Store</b>{stores.map((store) => <label key={store.name}><input type="checkbox" checked={selectedStores.includes(store.name)} onChange={() => setSelectedStores(selectedStores.includes(store.name) ? selectedStores.filter((name) => name !== store.name) : [...selectedStores, store.name])} />{store.name}</label>)}</div><div className="filter-group"><b>Seller location</b>{['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna'].map((locationName) => <label key={locationName}><input type="checkbox" checked={selectedLocations.includes(locationName)} onChange={() => setSelectedLocations(selectedLocations.includes(locationName) ? selectedLocations.filter((name) => name !== locationName) : [...selectedLocations, locationName])} />{locationName}</label>)}</div><div className="filter-group"><b>Availability</b><label><input type="checkbox" checked={saleOnly} onChange={(event) => { setSaleOnly(event.target.checked); setPage(1) }} /> On sale</label><label><input type="checkbox" onChange={() => useAppStore.getState().notify('Availability is illustrative sample inventory; stock filtering is not represented in this demo data.')} /> In stock</label></div></aside>
      <div className="listing-main"><div className="listing-toolbar"><span><b>{filtered.length} products</b> from independent stores</span><div><label className="sort-button">Sort: <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort products"><option>Featured</option><option>Popular</option><option>Top rated</option><option>Price: low to high</option><option>Price: high to low</option><option>Newest</option></select></label><button className="icon-button grid-toggle" aria-label={listView ? 'Switch to grid view' : 'Switch to list view'} title={listView ? 'Grid view' : 'List view'} onClick={() => setListView(!listView)}><SlidersHorizontal size={17} /></button></div></div>
        {filtered.length ? <div className={`product-grid listing-grid ${listView ? 'list-mode' : ''}`}>{filtered.slice((page - 1) * 8, page * 8).map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title="No products found just yet" description="Try a different search or clear some filters." action={<Button onClick={clearFilters}>Clear filters</Button>} />}
        {filtered.length > 4 && <Pagination page={page} setPage={setPage} total={filtered.length} />}
      </div>
    </div>
    <div className="honest-demo-note"><Sparkles size={16} /><span>Shopping preview · Product availability, stock and seller details are sample content.</span></div>
  </div>
}

export function ProductDetails() {
  const { productId } = useParams()
  const product = products.find((item) => item.id === productId) || products[0]
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState('rust')
  const { addCart, notify, wishlist, toggleWishlist, recordProductView } = useAppStore()
  useEffect(() => recordProductView(product.id), [product.id, recordProductView])
  const isWishlisted = wishlist.includes(product.id)
  const { t, i18n } = useTranslation()
  const productName = i18n.language === 'bn' ? product.bn : product.name
  const images = [product.image, 'photo-1584917865442-de89df76afd3', 'photo-1509358271058-acd22cc93898']
  return <div className="public-page content-wrap">
    <Breadcrumbs parts={['Discover', product.category, product.name]} />
    <div className="product-detail-layout">
      <div className="product-gallery"><div className="gallery-main"><img src={productImage(images[selectedImage], 1000)} alt={product.name} /><Pill tone="verified"><BadgeCheck size={13} /> Verified maker</Pill><button className="gallery-heart" onClick={() => { toggleWishlist(product.id); notify(isWishlisted ? 'Removed from your wishlist.' : 'Saved to your wishlist.') }} aria-label={isWishlisted ? 'Remove from wishlist' : 'Save product'}><Heart size={19} fill={isWishlisted ? 'currentColor' : 'none'} /></button></div><div className="gallery-thumbs">{images.map((image, index) => <button key={image} className={selectedImage === index ? 'selected' : ''} onClick={() => setSelectedImage(index)}><img src={productImage(image, 150)} alt={`Product view ${index + 1}`} /></button>)}</div><div className="detail-extra-note"><ShieldCheck size={16} /> This listing is preview content. Product claims have not been independently verified.</div></div>
      <div className="product-detail-copy"><div className="product-detail-tags"><Pill tone="green">MADE IN BANGLADESH</Pill><Pill tone="neutral">HANDCRAFTED</Pill></div><div className="product-detail-rating"><span>★★★★★</span> {product.rating} <a href="#reviews">({product.reviews} reviews)</a><i /> SKU: NH-{product.id.slice(-4)}</div><h1>{productName}</h1>{i18n.language !== 'bn' && <p className="product-bengali">{product.bn}</p>}<p className="detail-description">Thoughtfully made by skilled local artisans with beautiful, lasting materials. Each piece carries a little story and a whole lot of care.</p><div className="detail-price">৳{product.price.toLocaleString(i18n.language === 'bn' ? 'bn-BD' : 'en-BD')} {product.oldPrice && <><del>৳{product.oldPrice.toLocaleString(i18n.language === 'bn' ? 'bn-BD' : 'en-BD')}</del><Pill tone="sale">SAVE {Math.round((1 - product.price / product.oldPrice) * 100)}%</Pill></>}</div><div className="detail-stock"><i /> In stock · Ships from {product.location}</div><div className="product-utility-actions"><button onClick={() => notify('Product share preview: copy-link and share-sheet options.')}>Share <ArrowUpRight size={13} /></button><Link to="/compare">Compare <ArrowRight size={13} /></Link><button onClick={() => notify('Merchant contact is a messaging preview. No message was sent.')}>Contact merchant <MessageCircle size={13} /></button></div><div className="detail-option"><b>Size</b><div className="option-chips"><button className="selected" onClick={() => notify('One size selected.')}>One size</button><button onClick={() => notify('Size guide preview opened.')}>View size guide</button></div></div><div className="detail-option"><b>Color</b><div className="color-options"><button className={`color-swatch swatch-rust ${selectedColor === 'rust' ? 'selected' : ''}`} aria-label="Rust" onClick={() => setSelectedColor('rust')} /><button className={`color-swatch swatch-green ${selectedColor === 'green' ? 'selected' : ''}`} aria-label="Green" onClick={() => setSelectedColor('green')} /><button className={`color-swatch swatch-cream ${selectedColor === 'cream' ? 'selected' : ''}`} aria-label="Cream" onClick={() => setSelectedColor('cream')} /></div></div><div className="detail-buy-row"><div className="quantity-stepper"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity">+</button></div><Button onClick={() => { for (let i = 0; i < quantity; i++) addCart(product.id); notify(`${quantity} × ${product.name} added to your demo cart.`) }}><ShoppingBag size={17} />{t('addToCart')}</Button><button className="buy-now-button" onClick={() => { addCart(product.id); notify('Checkout is a preview. No payment will be collected.') }}>Buy now</button></div><div className="seller-card"><div className="seller-card-logo">{product.store.slice(0, 1)}</div><div><small>MADE & SOLD BY</small><b>{product.store} <BadgeCheck size={14} /></b><span><MapPin size={13} />{product.location}</span></div><Link to="/stores/1">Visit store <ArrowRight size={14} /></Link></div><div className="delivery-preview"><div><Truck size={17} /><span><b>Delivery estimate</b><small>2–4 business days · Preview only</small></span></div><button onClick={() => notify('Enter a delivery district at checkout to preview options.')}>Change</button></div><div className="detail-policy-row"><span><Check size={15} /> 7-day return window</span><span><ShieldCheck size={15} /> Seller quality promise</span></div></div>
    </div>
    <div className="detail-tabs"><a href="#description">Description</a><a href="#specifications">Specifications</a><a href="#reviews">Reviews ({product.reviews})</a><a href="#questions">Q&A</a></div>
    <div className="detail-description-grid" id="description"><div><span className="section-overline">THE DETAILS</span><h2>Made for keeping.</h2><p>Created in small batches with care in Bangladesh. Natural variation is part of the charm—each item may have its own unique character.</p><ul><li>Made and shipped by an independent local seller</li><li>Product details provided by the merchant</li><li>Contact the store for custom orders and care guidance</li></ul></div><div className="spec-card" id="specifications"><b>Product details</b><span>Category <strong>{product.category}</strong></span><span>Maker <strong>{product.store}</strong></span><span>Location <strong>{product.location}</strong></span><span>Condition <strong>New</strong></span><span>Warranty <strong>Contact seller</strong></span></div></div>
    <section id="reviews" className="detail-reviews"><SectionTitle overline="REAL PEOPLE, REAL NOTES" title="What customers are saying" /><div className="review-preview"><div className="review-score"><strong>{product.rating}</strong><span>★★★★★</span><small>Based on {product.reviews} demo reviews</small></div><div className="review-sample"><span>★★★★★</span><b>Beautifully made, arrived with care</b><p>Really lovely quality and the packaging felt thoughtful. Happy to support a local maker.</p><small>Farzana R. · Dhaka · Verified purchase · 3 days ago</small><p className="merchant-reply"><b>Seller reply:</b> Thank you for supporting our work!</p><button className="review-helpful" onClick={() => notify('Helpful vote saved in this local demo.')}>Helpful? Yes</button><button className="review-helpful" onClick={() => notify('Review report preview opened.')}>Report</button></div><Button variant="outline" onClick={() => notify('Review submission is available to signed-in buyers in this demo.')}>Write a review</Button></div></section>
    <section id="questions" className="question-preview"><div><span className="section-overline">ASK THE MAKER</span><h2>Questions about this product?</h2><p>Answers are shared by the independent store. This is sample Q&A content.</p><div className="question-card"><b>Is this made locally?</b><p>Yes, this product is made by our artisan team in Bangladesh.</p><small>Answered by {product.store} · 2 days ago</small></div></div><Button variant="outline" onClick={() => notify('Question form preview opened. No question was sent.')}>Ask a question <MessageCircle size={14} /></Button></section>
    <section className="related-section"><SectionTitle overline="MORE FROM THE MARKETPLACE" title="You might also love" to="/search" /><div className="product-grid">{products.filter((item) => item.id !== product.id).slice(0, 4).map((item) => <ProductCard product={item} key={item.id} />)}</div></section>
  </div>
}

export function StoreDirectory() {
  const { notify } = useAppStore()
  return <div className="public-page content-wrap"><Breadcrumbs parts={['Stores']} /><PageHeader eyebrow="INDEPENDENT BY NATURE" title="Good people. Great little shops." description="Meet the makers and local businesses behind your next favourite find." actions={<Pill tone="demo">Directory preview</Pill>} /><div className="store-directory-grid">{stores.map((store, index) => <article className="directory-store-card" key={store.name}><div className="directory-cover"><img src={productImage(store.image, 800)} alt="" /><div className="directory-logo">{store.name[0]}</div></div><div className="directory-content"><div className="directory-heading"><div><h3>{store.name}</h3><span>{store.type}</span></div><span className="rating"><span>★</span>{store.rating}</span></div><p><MapPin size={14} />{store.location} · Bangladesh</p><p>Thoughtful local goods, made with care and a story worth sharing.</p><div className="directory-actions"><Link to={`/stores/${index + 1}`} className="button button-outline">Visit storefront <ArrowRight size={15} /></Link><button className="icon-button" onClick={() => notify(`Following ${store.name} in this demo.`)} aria-label={`Follow ${store.name}`}><Heart size={17} /></button></div></div></article>)}</div><div className="store-directory-info"><Store size={20} /><span><b>Have a shop of your own?</b><small>Set up a storefront and meet a community of thoughtful shoppers.</small></span><Link to="/merchant" className="button button-primary">Explore selling on NAHORA</Link></div></div>
}

export function Storefront() {
  const { storeId } = useParams()
  const store = stores[(Math.max(1, Number(storeId) || 1) - 1) % stores.length]
  const { notify } = useAppStore()
  const [following, setFollowing] = useState(false)
  return <div className="public-page storefront-page"><div className="storefront-cover"><img src={productImage(store.image, 1600)} alt="" /><div className="storefront-cover-inner content-wrap"><Pill tone="gold">NAHORA VERIFIED STORE</Pill><h1>{store.name}</h1><p>{store.type} · {store.location}, Bangladesh</p><div><span className="rating"><span>★</span> {store.rating}</span><span>·</span><span>128 store reviews</span><span>·</span><span><i className="online-dot" /> Open today</span></div></div></div><div className="storefront-bar content-wrap"><div className="storefront-tabs"><a className="active" href="#store-products">Products</a><a href="#store-story">Our story</a><a href="#store-reviews">Reviews</a><a href="#store-policies">Policies</a></div><div><Button variant={following ? 'secondary' : 'primary'} onClick={() => { setFollowing(!following); notify(following ? 'Store unfollowed.' : `Following ${store.name} in this demo.`) }}><Heart size={15} />{following ? 'Following' : 'Follow store'}</Button><Button variant="outline" onClick={() => notify('Share preview: copy this storefront link to share.')}>Share <ArrowUpRight size={15} /></Button></div></div><div className="storefront-body content-wrap"><div className="storefront-aside" id="store-story"><span className="section-overline">A NOTE FROM THE MAKER</span><h2>Made thoughtfully,<br />shared with love.</h2><p>We are an independent Bangladesh business committed to beautiful craft, fair work and the details that make everyday living feel special.</p><div className="store-info-list"><span><MapPin size={15} />{store.location}, Bangladesh</span><span><Clock3 size={15} />Sat–Thu · 10:00 AM–8:00 PM</span><span><Star size={15} />{store.rating} seller rating</span></div><Button variant="outline" onClick={() => notify('Messaging preview opened. No message was sent.') }><MessageCircle size={15} />Contact this store</Button><div className="contact-options"><b>Connect with the maker</b><div><button onClick={() => notify('WhatsApp contact is a preview.')}>WhatsApp</button><button onClick={() => notify('Instagram profile preview.')}>Instagram</button><button onClick={() => notify('Phone contact is a preview.')}>Phone</button></div></div></div><div className="storefront-products" id="store-products"><SectionTitle overline="THE STORE EDIT" title="Shop this store" description="A few favourites, made with care." /><div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div></div></div></div>
}

export function CartPage() {
  const { cartCount, cartItems, removeCart, setCartQuantity, toggleWishlist, notify } = useAppStore()
  const [couponInput, setCouponInput] = useState('')
  const [couponApplied, setCouponApplied] = useState(readCartCoupon)
  const items = cartItems.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId)
    return product ? [{ ...product, qty: item.quantity }] : []
  })
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const merchantGroups = Array.from(items.reduce((groups, item) => {
    const group = groups.get(item.store) || []
    group.push(item)
    groups.set(item.store, group)
    return groups
  }, new Map<string, typeof items>()))
  const deliveryEstimate = merchantGroups.length * 120
  const discount = couponApplied ? Math.round(total * 0.1) : 0
  const remove = (id: string) => { removeCart(id); notify('Item removed from demo cart.') }
  const applyCoupon = () => {
    if (couponInput.trim().toUpperCase() === 'NAHORA10') {
      setCouponApplied(true)
      try {
        localStorage.setItem('nahora-cart-coupon', 'NAHORA10')
      } catch {
        notify('Coupon preview is active on this page, but browser storage is unavailable.')
      }
      notify('NAHORA10 applied in the demo: 10% off product subtotal. No real discount is issued.')
    } else {
      setCouponApplied(false)
      try {
        localStorage.removeItem('nahora-cart-coupon')
      } catch {
        notify('Coupon could not be cleared from browser storage.')
      }
      notify('Coupon not recognized. Try NAHORA10 for the sample discount preview.')
    }
  }
  return <div className="public-page content-wrap">
    <Breadcrumbs parts={['Your cart']} />
    <PageHeader eyebrow="YOUR PICKS, TOGETHER" title="Your shopping bag" description={`${cartCount} items from ${merchantGroups.length} independent stores.`} />
    <div className="cart-layout">
      <div className="cart-vendors">
        {items.length ? merchantGroups.map(([merchant, merchantItems]) => {
          const firstItem = merchantItems[0]
          const merchantSubtotal = merchantItems.reduce((sum, item) => sum + item.price * item.qty, 0)
          return <section className="cart-vendor-card" key={merchant}>
            <div className="cart-vendor-heading"><div className="store-mini-mark">{merchant[0]}</div><span><b>{merchant}</b><small><MapPin size={12} />Ships from {firstItem.location}</small></span><Pill tone="active">Independent seller</Pill></div>
            {merchantItems.map((item) => <div className="cart-item" key={item.id}>
              <Link to={`/product/${item.id}`}><img src={productImage(item.image, 220)} alt={item.name} /></Link>
              <div className="cart-item-info"><Link to={`/product/${item.id}`}><b>{item.name}</b></Link><small>Color: Natural · SKU: {item.id.toUpperCase()}</small><span className="cart-item-actions"><button onClick={() => { toggleWishlist(item.id); remove(item.id); notify(`${item.name} saved to wishlist and removed from cart.`) }}>Save for later</button><span>·</span><button onClick={() => remove(item.id)}>Remove</button></span></div>
              <div className="cart-item-quantity"><button aria-label={`Decrease ${item.name} quantity`} disabled={item.qty <= 1} onClick={() => setCartQuantity(item.id, item.qty - 1)}>−</button><span>{item.qty}</span><button aria-label={`Increase ${item.name} quantity`} onClick={() => setCartQuantity(item.id, item.qty + 1)}>+</button></div>
              <b className="cart-item-price">৳{(item.price * item.qty).toLocaleString('en-BD')}</b>
            </div>)}
            <div className="cart-vendor-subtotal"><span>Seller subtotal</span><b>৳{merchantSubtotal.toLocaleString('en-BD')}</b></div>
            <div className="cart-shipping"><Truck size={15} /> Estimated delivery 2–4 business days <span>৳120 delivery estimate</span></div>
          </section>
        }) : <EmptyState title="Your bag is ready for something lovely" description="Explore independent stores and add a thoughtful find." action={<Link className="button button-primary" to="/search">Explore marketplace</Link>} />}
      </div>
      <aside className="order-summary"><span className="section-overline">ORDER PREVIEW</span><h3>Order summary</h3>
        {merchantGroups.map(([merchant, merchantItems]) => <div className="summary-line" key={merchant}><span>{merchant}</span><b>৳{merchantItems.reduce((sum, item) => sum + item.price * item.qty, 0).toLocaleString('en-BD')}</b></div>)}
        <div className="summary-line"><span>Product subtotal ({cartCount} items)</span><b>৳{total.toLocaleString('en-BD')}</b></div>
        <div className="summary-line"><span>Delivery estimate</span><span>৳{deliveryEstimate.toLocaleString('en-BD')}</span></div>
        <div className="coupon-entry"><input aria-label="Coupon code" placeholder="Try NAHORA10" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} /><button onClick={applyCoupon}>Apply</button></div>
        {couponApplied && <div className="summary-line"><span>Sample discount · NAHORA10</span><span>−৳{discount.toLocaleString('en-BD')}</span></div>}
        <div className="summary-line total"><b>Estimated total</b><strong>৳{Math.max(0, total + deliveryEstimate - discount).toLocaleString('en-BD')}</strong></div>
        <Pill tone="demo">Checkout preview · No payment</Pill><Link to="/checkout" className="button button-primary checkout-button" onClick={(event) => { if (!items.length) { event.preventDefault(); notify('Add an item before continuing.') } }}>Continue to checkout <ArrowRight size={16} /></Link>
        <div className="secure-note"><ShieldCheck size={15} /> Secure checkout preview</div><p className="summary-note">Seller orders and delivery estimates are separated. Coupon and prices are sample data.</p>
      </aside>
    </div>
    <div className="cart-bottom-products"><SectionTitle overline="WHILE YOU'RE HERE" title="A few more good finds" /><div className="product-grid">{products.slice(3, 7).map((product) => <ProductCard product={product} key={product.id} compact />)}</div></div>
  </div>
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { notify, cartItems } = useAppStore()
  const checkoutItems = cartItems.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId)
    return product ? [{ ...product, qty: item.quantity }] : []
  })
  const checkoutSubtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  const checkoutMerchants = new Set(checkoutItems.map((item) => item.store)).size
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'priority'>('standard')
  const couponApplied = readCartCoupon()
  const checkoutDelivery = checkoutMerchants * (deliverySpeed === 'standard' ? 120 : 220)
  const checkoutDiscount = couponApplied ? Math.round(checkoutSubtotal * 0.1) : 0
  const schema = z.object({ name: z.string().min(2, 'Please enter your full name.'), phone: z.string().regex(/^(?:\+?88)?01[3-9]\d{8}$/, 'Enter a valid Bangladesh mobile number.'), address: z.string().min(8, 'Please enter a complete delivery address.'), district: z.string().min(1, 'Choose a district.') })
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
  const onSubmit = handleSubmit(() => {
    if (!checkoutItems.length) {
      notify('Your cart is empty. Add a product before checkout.')
      return
    }
    notify('Order confirmation preview ready. No order or payment was submitted.')
    navigate('/orders')
  })
  return <div className="public-page content-wrap"><Breadcrumbs parts={['Your cart', 'Checkout preview']} /><PageHeader eyebrow="ALMOST THERE" title="Delivery details" description="This is a checkout preview. Nothing will be ordered or charged." actions={<Pill tone="demo">DEMO CHECKOUT</Pill>} /><div className="checkout-layout"><form className="checkout-form" onSubmit={(e) => void onSubmit(e)}><section className="form-section"><div className="form-section-heading"><span>01</span><div><h3>Where should we deliver?</h3><p>Your details stay in this local demo session.</p></div></div><div className="form-grid"><label>Full name<input {...register('name')} placeholder="e.g. Samira Ahmed" />{errors.name && <small className="field-error">{errors.name.message}</small>}</label><label>Mobile number<input {...register('phone')} placeholder="01XXXXXXXXX" />{errors.phone && <small className="field-error">{errors.phone.message}</small>}</label><label className="span-two">Delivery address<input {...register('address')} placeholder="House, road, area" />{errors.address && <small className="field-error">{errors.address.message}</small>}</label><label>District<select {...register('district')} defaultValue=""><option value="" disabled>Select district</option>{['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh'].map((district) => <option key={district}>{district}</option>)}</select>{errors.district && <small className="field-error">{errors.district.message}</small>}</label><label>Postal code<input placeholder="1207" /></label><label className="span-two">Delivery instructions <textarea placeholder="Optional notes for your delivery partner" rows={3} /></label></div></section><section className="form-section"><div className="form-section-heading"><span>02</span><div><h3>Choose a delivery option</h3><p>Options are shown as a preview and may vary by seller.</p></div></div><label className="delivery-choice"><input type="radio" name="delivery" checked={deliverySpeed === 'standard'} onChange={() => setDeliverySpeed('standard')} /><span><Truck size={18} /><span><b>Standard delivery</b><small>2–4 business days · Multiple parcels may arrive separately</small></span></span><b>৳{(checkoutMerchants * 120).toLocaleString('en-BD')}</b></label><label className="delivery-choice"><input type="radio" name="delivery" checked={deliverySpeed === 'priority'} onChange={() => setDeliverySpeed('priority')} /><span><Sparkles size={18} /><span><b>Priority delivery</b><small>1–2 business days · Preview only</small></span></span><b>৳{(checkoutMerchants * 220).toLocaleString('en-BD')}</b></label></section><section className="form-section payment-preview"><div className="form-section-heading"><span>03</span><div><h3>Payment method</h3><p>Payment is not connected in this preview.</p></div></div><div className="payment-options"><label><input type="radio" name="payment" defaultChecked /><span><b>Cash on delivery</b><small>Shown for experience preview</small></span></label><label><input type="radio" name="payment" /><span><b>Mobile financial service</b><small>Demo option · Not connected</small></span></label></div><Pill tone="demo">Payment preview only · No payment will be collected</Pill></section><Button type="submit" className="place-order-button">Review order preview <ArrowRight size={16} /></Button></form><aside className="order-summary checkout-summary"><span className="section-overline">MULTI-SELLER ORDER</span><h3>Your order</h3>{checkoutItems.map((item) => <div className="checkout-item" key={item.id}><img src={productImage(item.image, 120)} alt="" /><span><b>{item.name}</b><small>{item.store} · Qty {item.qty}</small></span><b>৳{(item.price * item.qty).toLocaleString('en-BD')}</b></div>)}<div className="summary-line"><span>Product subtotal</span><b>৳{checkoutSubtotal.toLocaleString('en-BD')}</b></div><div className="summary-line"><span>Delivery estimate · {deliverySpeed}</span><span>৳{checkoutDelivery.toLocaleString('en-BD')}</span></div>{couponApplied && <div className="summary-line"><span>Sample discount · NAHORA10</span><span>−৳{checkoutDiscount.toLocaleString('en-BD')}</span></div>}<div className="summary-line total"><b>Total preview</b><strong>৳{Math.max(0, checkoutSubtotal + checkoutDelivery - checkoutDiscount).toLocaleString('en-BD')}</strong></div>{couponApplied && <Pill tone="demo">NAHORA10 · Sample discount</Pill>}<div className="merchant-order-note"><Package size={16} /><span><b>{checkoutMerchants} separate seller orders</b><small>Each merchant fulfills and ships independently.</small></span></div></aside></div></div>
}

export function PublicFeaturePage({ title, description }: { title: string; description: string }) {
  const { notify, addCart } = useAppStore()
  const isOrders = title.toLowerCase().includes('order')
  const isInbox = title.toLowerCase().includes('inbox') || title.toLowerCase().includes('message')
  const [tab, setTab] = useState('All orders')
  const [customerOrders, setCustomerOrders] = useState<RecordRow[]>(readCustomerOrders)
  const [orderAction, setOrderAction] = useState<{ order: RecordRow; kind: 'cancel' | 'return' | 'details' | 'invoice' } | null>(null)
  const [activeConversation, setActiveConversation] = useState(stores[0].name)
  const [conversationQuery, setConversationQuery] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [conversationFlags, setConversationFlags] = useState<Record<string, { pinned?: boolean; archived?: boolean; muted?: boolean; blocked?: boolean }>>({})
  const [chatLabel, setChatLabel] = useState('General')
  const [chatNote, setChatNote] = useState('')
  const [translatedChat, setTranslatedChat] = useState(false)
  const [attachmentName, setAttachmentName] = useState('')
  const [messagesByStore, setMessagesByStore] = useState<Record<string, { content: string; from: 'seller' | 'buyer'; time: string }[]>>({
    [stores[0].name]: [
      { content: 'Assalamu alaikum! Thank you for your order. Is there anything we can help with?', from: 'seller', time: '10:22 AM' },
      { content: 'Could you tell me a little more about the fabric?', from: 'buyer', time: '10:24 AM' },
      { content: 'Of course! It is handwoven cotton from our workshop in Mirpur.', from: 'seller', time: '10:25 AM' },
    ],
  })
  const saveCustomerOrders = (next: RecordRow[]) => {
    setCustomerOrders(next)
    try {
      localStorage.setItem('nahora-customer-orders', JSON.stringify(next))
    } catch {
      notify('Order changes remain temporary because browser storage is unavailable.')
    }
  }
  const submitOrderAction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!orderAction) return
    const formData = new FormData(event.currentTarget)
    const reason = String(formData.get('reason') || '').trim()
    if (!reason) {
      notify('Choose a reason before saving this request preview.')
      return
    }
    const status = orderAction.kind === 'cancel' ? 'Cancellation requested' : 'Return requested'
    saveCustomerOrders(customerOrders.map((order) => order.id === orderAction.order.id ? { ...order, status, subtitle: `${status} · ${reason}` } : order))
    notify(`${status} for ${orderAction.order.id}. This is a local request preview only.`)
    setOrderAction(null)
  }
  return <div className="public-page content-wrap"><Breadcrumbs parts={[title]} /><PageHeader eyebrow="YOUR NAHORA" title={title} description={description} actions={<Pill tone="demo">Demo data</Pill>} />
    {isOrders ? <><div className="customer-tabs"><div>{['All orders', 'Processing', 'Completed', 'Returns'].map((item) => <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>)}</div><div className="customer-order-list">{customerOrders.filter((row) => tab === 'All orders' || tab === 'Returns' ? (tab === 'Returns' ? /return|review|refund/i.test(row.status) : true) : row.status.toLowerCase() === tab.toLowerCase()).map((row, i) => <article key={row.id} className="customer-order-card"><div className="order-id-line"><b>Order {row.id}</b><Pill tone={row.status}>{row.status}</Pill><span>{row.date}</span></div><div className="customer-order-product"><div className="store-mini-mark">{row.avatar.slice(0, 1)}</div><span><b>{row.title}</b><small>{row.subtitle} · seller order {row.id}-0{i + 1}</small></span><b>৳{row.amount.toLocaleString('en-BD')}</b></div><div className="customer-order-actions"><button onClick={() => setOrderAction({ order: row, kind: 'details' })}>View order details</button><button onClick={() => notify(`Tracking preview for ${row.id}: sample parcel event only.`)}>Track parcel</button><button onClick={() => setOrderAction({ order: row, kind: 'return' })}>Return / help</button><button onClick={() => setOrderAction({ order: row, kind: 'invoice' })}>Invoice preview</button><button onClick={() => { const product = products.find((item) => item.store === row.title) || products[i % products.length]; addCart(product.id); notify(`${product.name} added to cart as a reorder preview.`) }}>Reorder</button>{row.status === 'Processing' && <button onClick={() => setOrderAction({ order: row, kind: 'cancel' })}>Request cancellation</button>}</div></article>)}</div></div>
      {orderAction && <div className="advanced-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOrderAction(null) }}><section className="advanced-dialog" role="dialog" aria-modal="true" aria-labelledby="order-dialog-title"><div className="module-toolbar"><h2 id="order-dialog-title">{orderAction.kind === 'cancel' ? 'Cancellation request preview' : orderAction.kind === 'return' ? 'Return or support request' : orderAction.kind === 'invoice' ? 'Invoice preview' : 'Order details preview'}</h2><button aria-label="Close dialog" onClick={() => setOrderAction(null)}><X size={17} /></button></div><Pill tone="demo">Order {orderAction.order.id} · Illustrative data</Pill>{orderAction.kind === 'details' || orderAction.kind === 'invoice' ? <><div className="preview-result"><b>{orderAction.order.title}</b><p>{orderAction.order.subtitle}</p><p>Order total preview: ৳{orderAction.order.amount.toLocaleString('en-BD')} · {orderAction.order.date}</p><small>{orderAction.kind === 'invoice' ? 'Not a valid tax invoice; no payment was verified.' : 'Seller fulfillment and address details are sample data.'}</small></div><div className="advanced-actions"><Button variant="outline" onClick={() => setOrderAction(null)}>Close preview</Button></div></> : <form onSubmit={submitOrderAction}><label>Reason<select name="reason" required defaultValue=""><option value="" disabled>Select a reason</option>{(orderAction.kind === 'cancel' ? ['Ordered by mistake', 'Delivery timing changed', 'Need to update order'] : ['Item arrived damaged', 'Wrong item or size', 'No longer needed', 'Need seller support']).map((reason) => <option key={reason}>{reason}</option>)}</select></label><label>Additional details<textarea name="details" rows={3} placeholder="Optional context for this local preview" /></label><div className="honest-demo-note">No merchant, courier or support team is contacted.</div><div className="advanced-actions"><Button type="button" variant="outline" onClick={() => setOrderAction(null)}>Cancel</Button><Button type="submit">Save request preview</Button></div></form>}</section></div>}
    </> :
    isInbox ? <div className="inbox-shell">
      <div className="inbox-list">
        <div className="inbox-heading"><b>Messages</b><button onClick={() => notify('New conversation preview. Choose a store to begin.')}>＋</button></div>
        <div className="inbox-search"><Search size={15} /><input aria-label="Search conversations" placeholder="Search conversations" value={conversationQuery} onChange={(event) => setConversationQuery(event.target.value)} /></div>
        {stores.filter((store) => !conversationFlags[store.name]?.archived && store.name.toLowerCase().includes(conversationQuery.toLowerCase())).sort((a, b) => Number(Boolean(conversationFlags[b.name]?.pinned)) - Number(Boolean(conversationFlags[a.name]?.pinned))).map((store, i) => {
          const conversationMessages = messagesByStore[store.name] || []
          return <button className={`conversation-row ${activeConversation === store.name ? 'selected' : ''}`} key={store.name} onClick={() => setActiveConversation(store.name)}><span className="conversation-avatar">{store.name[0]}</span><span><b>{store.name}{conversationFlags[store.name]?.pinned ? ' · Pinned' : ''}</b><small>{conversationMessages[conversationMessages.length - 1]?.content || (i === 0 ? 'Thanks! We will pack it with care.' : 'Hello, how can we help?')}</small></span><small>{conversationFlags[store.name]?.muted ? 'Muted' : `10:2${i} AM`}</small></button>
        })}
      </div>
      <div className="inbox-chat">
        <div className="chat-heading"><span className="conversation-avatar">{activeConversation[0]}</span><span><b>{activeConversation}</b><small><i className="online-dot" /> Usually replies within a day · demo status</small></span><button className="icon-button" aria-label="Conversation details" onClick={() => notify(`Customer, order and report details for ${activeConversation} are preview-only.`)}><CircleHelp size={17} /></button></div>
        <div className="chat-demo-label">DEMO CONVERSATION · Messages stay in this browser preview</div>
        <div className="chat-controls">
          <label>Label <select aria-label="Conversation label" value={chatLabel} onChange={(event) => setChatLabel(event.target.value)}>{['General', 'Order question', 'Returns', 'VIP customer'].map((label) => <option key={label}>{label}</option>)}</select></label>
          <button onClick={() => setConversationFlags((current) => ({ ...current, [activeConversation]: { ...current[activeConversation], pinned: !current[activeConversation]?.pinned } }))}>{conversationFlags[activeConversation]?.pinned ? 'Unpin' : 'Pin'}</button>
          <button onClick={() => setConversationFlags((current) => ({ ...current, [activeConversation]: { ...current[activeConversation], muted: !current[activeConversation]?.muted } }))}>{conversationFlags[activeConversation]?.muted ? 'Unmute' : 'Mute'}</button>
          <button onClick={() => setConversationFlags((current) => ({ ...current, [activeConversation]: { ...current[activeConversation], archived: true } }))}>Archive</button>
          <button onClick={() => { setConversationFlags((current) => ({ ...current, [activeConversation]: { ...current[activeConversation], blocked: true } })); notify('Block action shown as a local preview; no account was blocked.') }}>Block preview</button>
          <button onClick={() => notify('Report form preview opened; no report was submitted.')}>Report</button>
        </div>
        {conversationFlags[activeConversation]?.blocked && <div className="honest-demo-note">This conversation is marked blocked in the current local demo view.</div>}
        <div className="chat-date">Today · {chatLabel}</div>
        {(messagesByStore[activeConversation] || []).map((message, index) => <div className={`chat-bubble ${message.from === 'buyer' ? 'sent' : 'received'}`} key={`${activeConversation}-${index}`}>{translatedChat && message.from === 'seller' ? 'বাংলা অনুবাদ প্রিভিউ: আপনার বার্তার জন্য ধন্যবাদ।' : message.content}<small>{message.time}{message.from === 'buyer' ? ' · Seen preview' : ''}</small></div>)}
        {!messagesByStore[activeConversation]?.length && <EmptyState title="Start a conversation" description={`Send a preview message to ${activeConversation}.`} />}
        <div className="chat-extra-tools">
          <div className="quick-replies"><span>Quick replies</span>{['Thanks! We will check this for you.', 'Your sample order is being prepared.', 'Please share more details.'].map((reply) => <button key={reply} onClick={() => setMessageDraft(reply)}>{reply}</button>)}</div>
          <div className="chat-tools-row"><button onClick={() => setTranslatedChat(!translatedChat)}>{translatedChat ? 'Show original' : 'Translation preview'}</button><button onClick={() => setMessageDraft(`Product: ${products[0].name} · ৳${products[0].price.toLocaleString('en-BD')}`)}>Share product card</button><button onClick={() => setMessageDraft('Order NH-2841 · Processing · Demo order reference')}>Share order card</button><button onClick={() => notify('Voice and audio/video call controls are UI previews only.')}>Voice / call preview</button><label className="chat-attachment">Attach preview<input type="file" accept="image/*,.pdf,.doc,.docx,audio/*" onChange={(event) => setAttachmentName(event.target.files?.[0]?.name || '')} /></label></div>
          {attachmentName && <small className="attachment-preview">Selected locally: {attachmentName} · not uploaded</small>}
          <label className="chat-note">Internal note<textarea rows={2} placeholder="Private note for your team" value={chatNote} onChange={(event) => setChatNote(event.target.value)} /></label>
        </div>
        <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); const content = messageDraft.trim(); if (!content) return; setMessagesByStore((current) => ({ ...current, [activeConversation]: [...(current[activeConversation] || []), { content, from: 'buyer', time: 'Now' }] })); setMessageDraft(''); notify('Message added to this local conversation preview. Nothing was sent.') }}><button type="button" aria-label="Attach file" onClick={() => notify('Select a file using the attachment preview control above.')}>＋</button><input aria-label="Write a message" placeholder="Write a message..." value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} /><button className="chat-send" aria-label="Send message" type="submit"><ArrowRight size={17} /></button></form>
      </div>
    </div>
    : ['Subscriptions', 'Pre-orders', 'Group buying', 'Product authenticity', 'Order tracking timeline', 'Customer community', 'Nearby stores & local deals', 'Price & stock alerts', 'Wishlist collections', 'Returns & replacements', 'Refund status', 'Warranty claims'].includes(title) ? <CustomerAdvancedFeature title={title} />
    : <CustomerFeatureSurface title={title} />}
  </div>
}

function CustomerFeatureSurface({ title }: { title: string }) {
  const { notify, wishlist, recentlyViewed } = useAppStore()
  const [selected, setSelected] = useState<string[]>(['p-1001', 'p-1002'])
  const [shareProductId, setShareProductId] = useState(products[0].id)
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [formSent, setFormSent] = useState(false)
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false)
  const [addresses, setAddresses] = useState<CustomerAddress[]>(readCustomerAddresses)
  const [profile, setProfile] = useState<CustomerProfile>(readCustomerProfile)
  const [addressFormOpen, setAddressFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)
  const [pendingAddressRemoval, setPendingAddressRemoval] = useState<string | null>(null)
  const needsForm = /return|refund|warranty|complaint|question|gift registry/i.test(title)
  const compareProducts = products.filter((product) => selected.includes(product.id))
  const shareProduct = products.find((product) => product.id === shareProductId) || products[0]
  const shareUrl = `https://nahora.demo/product/${shareProduct.id}`
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      notify('Product link copied to the clipboard. The destination is a demo URL.')
    } catch {
      notify('Clipboard access is unavailable. Select the demo link to copy it manually.')
    }
  }
  const saveAddressBook = (next: CustomerAddress[]) => {
    setAddresses(next)
    try {
      localStorage.setItem('nahora-customer-addresses', JSON.stringify(next))
    } catch {
      notify('Address changed in this page only; browser storage is unavailable.')
    }
  }
  const submitAddress = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const phone = String(formData.get('phone') || '').replace(/\s+/g, '')
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone)) {
      notify('Enter a valid Bangladesh mobile number, such as 01712 345 678.')
      return
    }
    const address: CustomerAddress = {
      id: editingAddress?.id || `address-${Date.now()}`,
      label: String(formData.get('label') || '').trim(),
      name: String(formData.get('name') || '').trim(),
      street: String(formData.get('street') || '').trim(),
      city: `${String(formData.get('district') || '')} ${String(formData.get('postal') || '').trim()}`.trim(),
      phone: String(formData.get('phone') || '').trim(),
      isDefault: Boolean(formData.get('isDefault')) || (!editingAddress && addresses.length === 0),
    }
    const next = editingAddress
      ? addresses.map((item) => item.id === editingAddress.id ? address : address.isDefault ? { ...item, isDefault: false } : item)
      : [...addresses.map((item) => address.isDefault ? { ...item, isDefault: false } : item), address]
    saveAddressBook(next)
    notify(editingAddress ? 'Address updated in your browser-local demo address book.' : 'Address added to your browser-local demo address book.')
    setEditingAddress(null)
    setAddressFormOpen(false)
  }
  const setDefaultAddress = (id: string) => {
    saveAddressBook(addresses.map((item) => ({ ...item, isDefault: item.id === id })))
    notify('Default delivery address updated locally.')
  }
  const removeAddress = (id: string) => {
    if (addresses.find((item) => item.id === id)?.isDefault) {
      notify('Choose another default address before removing this one.')
      setPendingAddressRemoval(null)
      return
    }
    saveAddressBook(addresses.filter((item) => item.id !== id))
    setPendingAddressRemoval(null)
    notify('Address removed from the local demo address book.')
  }
  const saveCustomerProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const phone = String(formData.get('phone') || '').trim()
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^(?:\+?88)?01[3-9]\d{8}$/.test(phone.replace(/\s+/g, ''))) {
      notify('Enter a name, valid email, and Bangladesh mobile number before saving.')
      return
    }
    const nextProfile = { name, email, phone, language: String(formData.get('language') || 'English') }
    setProfile(nextProfile)
    try {
      localStorage.setItem('nahora-customer-profile', JSON.stringify(nextProfile))
      notify('Profile saved in this browser-local demo.')
    } catch {
      notify('Profile updated on this page only; browser storage is unavailable.')
    }
  }
  const downloadShareCard = () => {
    const escapeXml = (value: string) => value.replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character] || character)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f5f7f5"/><rect x="48" y="48" width="1104" height="534" rx="28" fill="#fff" stroke="#dce5df" stroke-width="2"/><text x="92" y="142" fill="#176b52" font-family="Arial,sans-serif" font-size="26" font-weight="700">NAHORA · LOCAL FINDS</text><text x="92" y="280" fill="#17212b" font-family="Arial,sans-serif" font-size="46" font-weight="700">${escapeXml(shareProduct.name)}</text><text x="92" y="360" fill="#52635a" font-family="Arial,sans-serif" font-size="29">${escapeXml(shareProduct.store)} · ${escapeXml(shareProduct.location)}</text><text x="92" y="466" fill="#123b32" font-family="Arial,sans-serif" font-size="44" font-weight="700">৳${shareProduct.price.toLocaleString('en-BD')}</text><text x="92" y="530" fill="#65736b" font-family="Arial,sans-serif" font-size="20">Preview card · ${escapeXml(shareUrl)}</text></svg>`
    const anchor = document.createElement('a')
    anchor.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    anchor.download = `nahora-${shareProduct.id}-share-preview.svg`
    anchor.click()
    notify('A share-card SVG preview was downloaded. No product image was included.')
  }
  const isWishlist = title.toLowerCase().includes('wishlist') || title.toLowerCase().includes('saved finds')
  const isRecentlyViewed = title.toLowerCase().includes('viewed')
  const featureProducts = isWishlist
    ? products.filter((product) => wishlist.includes(product.id))
    : isRecentlyViewed
      ? recentlyViewed.map((id) => products.find((product) => product.id === id)).filter((product): product is typeof products[number] => Boolean(product))
      : title.includes('saved') ? products.slice(0, 4) : products.slice(2, 6)

  if (title === 'Personal information') return <div className="customer-feature-body"><div className="account-profile-card"><span className="profile-large-avatar">{profile.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><div><b>{profile.name}</b><small>Customer since October 2026 · Demo account</small><Pill tone="verified"><BadgeCheck size={12} /> Profile preview</Pill></div><Button variant="outline" onClick={() => notify('Profile photo selection is a local preview.')}>Change photo</Button></div><form className="form-section form-grid" onSubmit={saveCustomerProfile}><label>Full name<input name="name" defaultValue={profile.name} required minLength={2} maxLength={80} /></label><label>Email address<input name="email" type="email" defaultValue={profile.email} required /></label><label>Mobile number<input name="phone" defaultValue={profile.phone} required /></label><label>Preferred language<select name="language" defaultValue={profile.language}><option>English</option><option>বাংলা</option></select></label><div className="span-two"><Button type="submit">Save profile preview</Button></div></form><SectionTitle overline="ACCOUNT SHORTCUTS" title="Your shopping life" /><div className="feature-hub-grid">{customerHubs.map(({ label, detail, icon: Icon, path }) => <Link className="feature-hub-card" to={path} key={label}><span><Icon size={20} /></span><b>{label}</b><p>{detail}</p><ArrowRight size={15} /></Link>)}</div></div>

  if (title === 'Address book') return <div className="customer-feature-body"><div className="feature-toolbar"><p>Saved delivery addresses stay in this browser demo only.</p><Button onClick={() => { setEditingAddress(null); setAddressFormOpen(!addressFormOpen) }}><Plus size={14} /> Add address</Button></div>{addressFormOpen && <form key={editingAddress?.id || 'new-address'} className="form-section form-grid" onSubmit={submitAddress}><label>Address label<input name="label" defaultValue={editingAddress?.label || ''} placeholder="Home, Office..." required maxLength={40} /></label><label>Full name<input name="name" defaultValue={editingAddress?.name || 'Samira Ahmed'} required maxLength={80} /></label><label>Mobile number<input name="phone" defaultValue={editingAddress?.phone || ''} placeholder="01712 345 678" required /></label><label className="span-two">Street address<input name="street" defaultValue={editingAddress?.street || ''} placeholder="House, road, area" required maxLength={160} /></label><label>District<select name="district" defaultValue={editingAddress?.city.split(' ')[0] || 'Dhaka'}>{['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh'].map((district) => <option key={district}>{district}</option>)}</select></label><label>Postal code<input name="postal" defaultValue={editingAddress?.city.split(' ').slice(1).join(' ') || ''} placeholder="1207" maxLength={12} /></label><label className="setting-row span-two"><span><b>Set as default delivery address</b><small>Only one saved address can be the default.</small></span><input name="isDefault" type="checkbox" defaultChecked={editingAddress?.isDefault || addresses.length === 0} /></label><div className="span-two advanced-actions"><Button type="submit">{editingAddress ? 'Save address changes' : 'Save address'}</Button><Button type="button" variant="outline" onClick={() => { setAddressFormOpen(false); setEditingAddress(null) }}>Cancel</Button></div></form>}<div className="address-grid">{addresses.map((address) => <article className="address-card" key={address.id}><div><b>{address.label}</b>{address.isDefault && <Pill tone="active">Default</Pill>}</div><strong>{address.name}</strong><p>{address.street}<br />{address.city}</p><small>{address.phone}</small><div><button onClick={() => { setEditingAddress(address); setAddressFormOpen(true) }}>Edit</button><button onClick={() => setPendingAddressRemoval(address.id)}>Remove</button>{!address.isDefault && <button onClick={() => setDefaultAddress(address.id)}>Set default</button>}</div>{pendingAddressRemoval === address.id && <div className="address-remove-confirm" role="group" aria-label={`Confirm removal of ${address.label} address`}><span>Remove this saved address?</span><button onClick={() => removeAddress(address.id)}>Confirm remove</button><button onClick={() => setPendingAddressRemoval(null)}>Keep address</button></div>}</article>)}</div>{!addresses.length && <EmptyState title="No saved addresses" description="Add a delivery address to see it in this browser-local address book." />}</div>

  if (title === 'Accessibility settings') return <AccessibilitySettings />
  if (title === 'Notification preferences' || title === 'Privacy settings') return <div className="customer-feature-body"><div className="settings-list">{(title === 'Notification preferences' ? [['Order status updates', 'Receive sample delivery and fulfillment notifications.'], ['Store messages', 'Preview merchant replies and conversation reminders.'], ['Offers and campaigns', 'Show seasonal deals and sponsored offer preferences.'], ['Community activity', 'Comments, mentions and followed-maker stories.']] : [['Personalized recommendations', 'Use local demo preferences to shape product picks.'], ['Profile visibility', 'Control what other demo users can see.'], ['Data export request', 'Preview a data access request; no file will be created.'], ['Account deletion request', 'Preview request only; nothing is deleted.']]).map(([label, detail], index) => <label className="setting-row" key={label}><span><b>{label}</b><small>{detail}</small></span><input type="checkbox" defaultChecked={index < 2} onChange={() => notify(`${label} preference changed locally.`)} /></label>)}</div><div className="honest-demo-note"><ShieldCheck size={15} /> Preferences only change the visual demo state. No account data is transmitted.</div></div>

  if (title === 'Followed stores' || title === 'Favourite brands') return <div className="customer-feature-body"><div className="store-directory-grid">{stores.map((store, index) => <article className="directory-store-card" key={store.name}><div className="directory-cover"><img src={productImage(store.image, 700)} alt="" /><div className="directory-logo">{store.name[0]}</div></div><div className="directory-content"><div className="directory-heading"><div><h3>{store.name}</h3><span>{store.type}</span></div><span className="rating"><span>★</span>{store.rating}</span></div><p><MapPin size={14} />{store.location} · Bangladesh</p><div className="directory-actions"><Link className="button button-outline" to={`/stores/${index + 1}`}>Visit storefront</Link><Button variant="ghost" onClick={() => notify(`Follow preference for ${store.name} updated locally.`)}>Following</Button></div></div></article>)}</div></div>

  if (title === 'Product comparison') return <div className="customer-feature-body">
    <div className="feature-toolbar"><p>Select a few local maker finds to compare side by side.</p><Button variant="outline" onClick={() => setSelected(products.slice(0, 3).map((product) => product.id))}>Compare sample picks</Button></div>
    <div className="comparison-table"><div className="compare-label-column"><strong>Product</strong><strong>Price</strong><strong>Rating</strong><strong>Independent store</strong><strong>Ships from</strong><strong>Condition</strong></div>{compareProducts.map((product) => <div className="compare-product-column" key={product.id}><button className="compare-remove" onClick={() => setSelected(selected.filter((id) => id !== product.id))}>Remove</button><img src={productImage(product.image, 300)} alt={product.name} /><b>{product.name}</b><span>৳{product.price.toLocaleString('en-BD')}</span><span className="rating"><span>★</span>{product.rating} · {product.reviews}</span><span>{product.store}</span><span>{product.location}</span><Pill tone="active">New</Pill></div>)}{compareProducts.length < 3 && <button className="compare-add" onClick={() => { const next = products.find((product) => !selected.includes(product.id)); if (next) setSelected([...selected, next.id]) }}><Plus size={19} />Add a product</button>}</div>
    <div className="honest-demo-note"><Sparkles size={15} /> Prices, ratings and product information are illustrative demo data.</div>
  </div>

  if (/review/i.test(title)) return <div className="customer-feature-body">
    <div className="customer-tabs"><div>{['All', 'Published', 'Needs attention'].map((tab) => <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div></div>
    <div className="customer-order-list">{products.slice(0, 3).map((product, index) => <article className="customer-order-card" key={product.id}><div className="customer-order-product"><img className="review-product-thumb" src={productImage(product.image, 140)} alt="" /><span><b>{product.name}</b><small>{product.store} · Verified-purchase sample</small></span><Pill tone={index ? 'pending' : 'active'}>{index ? 'Draft' : 'Published'}</Pill></div><div className="review-stars" aria-label="Five stars">★★★★★</div><p className="review-card-copy">Beautifully made, arrived with care. Happy to support a thoughtful local maker.</p><div className="customer-order-actions"><button onClick={() => notify('Edit review preview opened.')}>Edit review</button><button onClick={() => notify('Review media upload is preview only.')}>Add photo or video</button><button onClick={() => notify('Review report preview opened.')}>Report</button><span>Helpful votes · {12 + index * 3}</span></div></article>)}</div>
    <section className="form-section customer-review-form"><div className="form-section-heading"><span>✳</span><div><h3>Write a product review</h3><p>Review creation is a local preview.</p></div></div><div className="interactive-rating">{[1, 2, 3, 4, 5].map((value) => <button key={value} aria-label={`${value} stars`} onClick={() => setRating(value)} className={rating >= value ? 'chosen' : ''}>★</button>)}</div><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What should other shoppers know?" rows={3} /><Button onClick={() => { if (!rating || !message.trim()) { notify('Choose a star rating and write a comment first.'); return } notify('Review saved as a local preview. It has not been published.'); setMessage('') }}>Save review preview</Button></section>
  </div>

  if (title === 'Coupon wallet' || title === 'Rewards & membership') return <div className="customer-feature-body"><div className="loyalty-banner"><span className="section-overline">YOUR NAHORA CLUB · DEMO ACCOUNT</span><h2>{title === 'Coupon wallet' ? 'A little thank-you goes a long way.' : 'Good shopping, good things back.'}</h2><p>Illustrative rewards and membership benefits. No value can be redeemed in this preview.</p><div><b>1,280</b><span>sample points</span><Pill tone="gold">SILVER MEMBER</Pill></div></div><div className="feature-hub-grid">{[['Points wallet', 'Earn points in this preview', '1,280 pts'], ['Next reward', 'Illustrative progress', '720 pts to Gold'], ['Welcome coupon', 'Sample · minimum spend ৳2,000', '৳150 off'], ['Free delivery', 'Preview offer from participating sellers', '1 voucher']].map(([label, detail, value]) => <article className="reward-card" key={label}><span className="section-overline">{label}</span><b>{value}</b><p>{detail}</p><Button variant="outline" onClick={() => notify('Reward redemption is a preview only.')}>View reward</Button></article>)}</div><SectionTitle overline="WAYS TO EARN" title="More than a marketplace" /><div className="feature-hub-grid">{customerHubs.slice(1, 5).map(({ label, detail, icon: Icon, path }) => <Link to={path} className="feature-hub-card" key={label}><span><Icon size={20} /></span><b>{label}</b><p>{detail}</p><ArrowRight size={15} /></Link>)}</div></div>

  if (title === 'Merchant Academy') return <div className="customer-feature-body"><div className="academy-hero"><div><span className="section-overline">LEARN AT YOUR OWN PACE</span><h2>Small steps, stronger businesses.</h2><p>Short practical lessons for the people building Bangladesh's next generation of independent businesses.</p><Button onClick={() => notify('Course player preview opened. No video is streamed.')}>Continue learning <ArrowRight size={14} /></Button></div><div className="academy-progress"><span>YOUR DEMO PROGRESS</span><b>3 <small>of 12 lessons</small></b><i><span /></i><small>Keep building your skills</small></div></div><div className="filter-chips">{['All courses', 'Getting started', 'Marketing', 'Operations', 'Finance'].map((tab) => <button key={tab} className={`filter-chip ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><div className="course-grid">{[['Build a memorable storefront', 'Getting started', '6 lessons', '72%'], ['Product photos that tell a story', 'Marketing', '4 lessons', '25%'], ['Simple cash-flow habits', 'Finance', '5 lessons', '0%'], ['Pack orders with care', 'Operations', '3 lessons', '0%']].map(([name, category, count, progress]) => <article className="course-card" key={name}><div className="course-art"><BookOpen size={23} /><span>NAHORA LEARNING</span></div><div><Pill tone="neutral">{category}</Pill><h3>{name}</h3><p>{count} · Bengali and English learning preview</p><i className="course-progress"><span style={{ width: progress }} /></i><small>{progress} complete · Sample progress</small><button onClick={() => notify(`${name}: lesson preview opened.`)}>{progress === '0%' ? 'Start lesson' : 'Continue lesson'} <ArrowRight size={13} /></button></div></article>)}</div></div>

  if (title === 'Community & stories') return <div className="customer-feature-body"><div className="community-compose"><span className="avatar avatar-user">SA</span><button onClick={() => notify('Community post composer preview. Your post will not be published.')}>Share a story, discovery or question with the community...</button><Button variant="outline" onClick={() => notify('Photo/video attachment preview.')}>Add media</Button></div><div className="community-feed">{[['Mrittika Studio', 'A little look inside our Dhamrai pottery workshop today.', 'photo-1490312278390-ab64016e0aa9', 'Workshop story · 2 hours ago'], ['Rongdhonu Boutique', 'The Jamdani detail that took our weaver three afternoons to finish.', 'photo-1610030469983-98e550d6193c', 'Maker story · Yesterday'], ['Bengal Harvest', 'Rajshahi mango season is almost here. Here is how we pick each box.', 'photo-1553279768-865429fa0078', 'Seasonal note · 2 days ago']].map(([name, post, image, byline]) => <article className="community-post" key={name}><div className="community-post-author"><span className="conversation-avatar">{name[0]}</span><span><b>{name}</b><small>{byline} · demo post</small></span><Button variant="outline" onClick={() => notify(`Follow preview for ${name}.`)}>Follow</Button></div><p>{post}</p><img src={productImage(image, 900)} alt="Community post preview" /><div className="community-post-actions"><button onClick={() => notify('Like saved in this local preview.')}>♡ Like · 24</button><button onClick={() => notify('Comment preview opened.')}>Comment · 8</button><button onClick={() => notify('Share preview opened.')}>Share</button><button onClick={() => notify('Content reporting preview opened.')}>Report</button></div></article>)}</div></div>

  if (title === 'Deals & campaigns' || title === 'Nearby stores & local deals') return <div className="customer-feature-body"><div className="loyalty-banner deal-banner"><span className="section-overline">GOOD FINDS, GOOD TIMING</span><h2>{title === 'Deals & campaigns' ? 'Seasonal offers from local shops.' : 'Good things, closer to you.'}</h2><p>Local deals and campaign placements are illustrative and may not be redeemable.</p><div><Pill tone="gold">FESTIVE EDIT 2026</Pill><Pill tone="active">BANGLADESH SELLERS</Pill></div></div><div className="product-grid">{products.filter((product) => product.oldPrice).slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div><div className="honest-demo-note"><BadgeCheck size={15} /> Campaign pricing is sample data. Offers are not live.</div></div>

  if (title === 'Social sharing') return <div className="customer-feature-body"><div className="share-preview-card"><span className="section-overline">SHARE A GOOD FIND</span><h2>Take a little local love with you.</h2><p>Choose an item, then use a share preview. External publishing is not connected.</p><label>Choose a product<select aria-label="Choose a product to share" value={shareProductId} onChange={(event) => setShareProductId(event.target.value)}>{products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label><div className="share-link-preview"><span><small>DEMO PRODUCT LINK</small><code>{shareUrl}</code></span><Button variant="outline" onClick={copyShareLink}>Copy link</Button></div><div className="share-product-preview"><img src={productImage(shareProduct.image, 300)} alt="" /><span><b>{shareProduct.name}</b><small>{shareProduct.store} · {shareProduct.location}</small><strong>৳{shareProduct.price.toLocaleString('en-BD')}</strong></span></div><div className="share-options">{['WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'Telegram', 'Pinterest', 'Email', 'QR preview'].map((platform) => <button key={platform} onClick={() => platform === 'QR preview' ? setQrPreviewOpen(!qrPreviewOpen) : notify(`${platform} share preview selected. Direct publishing is unavailable.`)}>{platform}<ArrowUpRight size={13} /></button>)}</div><div className="advanced-actions"><Button variant="outline" onClick={downloadShareCard}>Download share card preview</Button><Pill tone="preview">No external post is made</Pill></div>{qrPreviewOpen && <div className="preview-result" role="status"><Pill tone="preview">QR visual preview</Pill><p>QR generation is not connected. Use the demo link above; this interface does not display a scannable code.</p><code>{shareUrl}</code></div>}</div></div>

  if (title === 'Shopping assistant') return <div className="customer-feature-body"><div className="assistant-shell"><div className="assistant-heading"><span className="workspace-icon"><Sparkles size={18} /></span><span><b>Your shopping companion</b><small>Frontend demo · Suggestions use sample listings</small></span></div><div className="assistant-message">Hi Samira! Looking for something special? I can help you explore independent Bangladesh stores.</div><div className="assistant-chips">{['A thoughtful gift under ৳1,500', 'Handmade home decor', 'Local fashion finds'].map((suggestion) => <button key={suggestion} onClick={() => { setMessage(suggestion); notify(`Shopping suggestion preview: ${suggestion}`) }}>{suggestion}</button>)}</div><form className="assistant-input" onSubmit={(event) => { event.preventDefault(); notify(`Suggestion preview for “${message}”. No automated service is connected.`); setMessage('') }}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell me what you're looking for..." /><Button type="submit">Ask <ArrowRight size={14} /></Button></form><div className="assistant-recommendations"><span className="section-overline">A FEW IDEAS TO START</span><div className="product-grid">{products.slice(1, 4).map((product) => <ProductCard key={product.id} product={product} compact />)}</div></div></div></div>

  if (needsForm) return <div className="customer-feature-body"><div className="form-section customer-request-form"><div className="form-section-heading"><span>01</span><div><h3>{title} request</h3><p>Fill in a sample request to see the frontend interaction. Nothing is submitted externally.</p></div></div>{formSent ? <div className="request-preview-result"><Pill tone="pending">Preview saved</Pill><h3>Your request preview is ready</h3><p>Reference NH-DEMO-1042 · This remains local demo data.</p><Button variant="outline" onClick={() => setFormSent(false)}>Create another preview</Button></div> : <form className="form-grid" onSubmit={(event) => { event.preventDefault(); setFormSent(true) }}><label>Related order<select required defaultValue=""><option value="" disabled>Select an order</option>{demoRows.slice(0, 4).map((row) => <option key={row.id} value={row.id}>{row.id} · {row.title}</option>)}</select></label><label>Request type<select required><option>Choose a reason</option><option>Item arrived damaged</option><option>Wrong item or size</option><option>Product question</option><option>Other</option></select></label><label className="span-two">Tell us a little more<textarea rows={4} required placeholder="Add helpful details for the support team..." /></label><label className="span-two">Attach images (preview)<input type="file" accept="image/*" onChange={() => notify('File selected for local UI preview only; no upload occurs.')} /></label><div className="span-two"><Button type="submit">Save request preview <ArrowRight size={15} /></Button></div></form>}</div><div className="honest-demo-note"><ShieldCheck size={15} /> Sample request controls do not contact a merchant or support team.</div></div>

  if (title.toLowerCase().includes('recently viewed') || title.toLowerCase().includes('saved finds') || title.toLowerCase().includes('wishlist') || title.toLowerCase().includes('shopping collections') || title.toLowerCase().includes('saved searches')) return <div className="customer-feature-body"><div className="feature-toolbar"><div className="filter-chips">{['All', 'Fashion', 'Home & Living', 'Accessories'].map((tab) => <button key={tab} className={`filter-chip ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><Button variant="outline" onClick={() => notify(title.toLowerCase().includes('search') ? 'Saved-search form preview opened.' : 'Collection sharing preview opened.')}>{title.toLowerCase().includes('search') ? 'Save a search' : 'Create collection'} <Plus size={14} /></Button></div>{featureProducts.length ? <div className="product-grid">{featureProducts.filter((product) => activeTab === 'All' || product.category.toLowerCase().includes(activeTab.toLowerCase())).map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title={isWishlist ? 'Your wishlist is waiting for its first find' : 'No recently viewed products yet'} description={isWishlist ? 'Save a product with the heart button and it will appear here.' : 'Explore a product to add it to your recently viewed list.'} action={<Link className="button button-primary" to="/search">Discover products</Link>} />}{title.toLowerCase().includes('collection') && <div className="honest-demo-note"><Heart size={15} /> Collections can be organized and shared as a frontend preview; products are sample catalog content.</div>}</div>

  return <div className="customer-feature-body"><div className="feature-hub-grid">{customerHubs.map(({ label, detail, icon: FeatureIcon, path }) => <Link to={path} className="feature-hub-card" key={label}><span><FeatureIcon size={20} /></span><b>{label}</b><p>{detail}</p><ArrowRight size={15} /></Link>)}</div><div className="customer-more-links"><span className="section-overline">MORE IN YOUR ACCOUNT</span><div>{[
    ['Returns & replacements', '/returns'], ['Refund status', '/refunds'], ['Warranty claims', '/warranty'], ['Complaints & support', '/complaints'],
    ['Coupon wallet', '/coupons'], ['Gift center', '/gift-center'], ['Gift registry', '/gift-registry'], ['Referrals', '/referrals'],
    ['Social sharing', '/share'], ['Nearby stores', '/nearby'], ['Saved searches', '/saved-searches'], ['Compare products', '/compare'],
  ].map(([label, path]) => <Link to={path} key={path}>{label}<ArrowRight size={13} /></Link>)}</div></div></div>
}

export function PortalPage({ workspace }: { workspace: string }) {
  const location = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { t } = useTranslation()
  const { notify } = useAppStore()
  const nav = portalNavigation[workspace] || portalNavigation.merchant
  const workspaceMeta = workspaces.find((item) => item.path.startsWith(`/${workspace}`)) || workspaces[0]
  const pathParts = location.pathname.split('/').filter(Boolean)
  const slug = pathParts[1] || ''
  const navItem = nav.find((item) => item.path === location.pathname)
  const title = navItem?.label || (slug ? slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Overview')
  const description = pageDescriptions[slug] || (slug ? 'A focused workspace view with interactive preview controls and realistic sample data.' : t('today'))
  const isCreate = slug === 'create'
  const isDashboard = !slug
  useEffect(() => setMobileSidebarOpen(false), [location.pathname])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const data = demoRows.filter((row) => {
    const searchable = `${row.title} ${row.id} ${row.subtitle}`.toLowerCase().includes(search.toLowerCase())
    return searchable && (statusFilter === 'All' || row.status === statusFilter)
  })
  const statTitles = workspace === 'admin'
    ? ['Platform revenue', 'Total orders', 'Active merchants', 'Pending review']
    : workspace === 'courier'
      ? ['Parcels today', 'Collected COD', 'Pending remittance', 'On-time delivery']
      : workspace === 'advertiser'
        ? ['Active campaigns', 'Campaign reach', 'Engagements', 'Available budget']
        : workspace === 'creator'
          ? ['Affiliate clicks', 'Attributed orders', 'Estimated earnings', 'Partnerships']
          : workspace === 'staff'
            ? ['Assigned tasks', 'Open tickets', 'Review queue', 'Due today']
            : workspace === 'developer'
              ? ['Applications', 'Sandbox events', 'Documentation views', 'Open incidents']
              : ['Gross sales', 'Total orders', 'Products listed', 'Pending fulfillment']
  const statValues = workspace === 'admin' ? ['৳ 24.8L', '1,284', '1,208', '18'] : workspace === 'courier' ? ['384', '৳ 3.42L', '৳ 1.18L', '96.4%'] : workspace === 'advertiser' ? ['12', '2.4M', '84.2K', '৳ 85,000'] : workspace === 'creator' ? ['18.4K', '284', '৳ 42,800', '6'] : workspace === 'staff' ? ['24', '18', '12', '5'] : workspace === 'developer' ? ['3', '128', '2.8K', '0'] : ['৳ 1,84,250', '128', '86', '12']

  const campaignSchema = z.object({ name: z.string().min(3, 'Campaign name must be at least 3 characters.'), objective: z.string().min(1, 'Choose an objective.'), budget: z.coerce.number().min(500, 'Minimum demo budget is ৳500.'), startDate: z.string().min(1, 'Choose a start date.') })
  const campaignForm = useForm<z.infer<typeof campaignSchema>>({ resolver: zodResolver(campaignSchema), defaultValues: { objective: '', budget: 500 } })

  return <div className="portal-layout"><Header portal mobileOpen={mobileSidebarOpen} onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} /><div className="portal-body"><Sidebar items={nav} title={workspaceMeta.name} icon={workspaceMeta.icon} mobileOpen={mobileSidebarOpen} /><main className="portal-main"><div className="portal-main-inner"><Breadcrumbs parts={[workspaceMeta.name, ...(slug ? [title] : [])]} />
    {isCreate ? <><PageHeader eyebrow={`${workspaceMeta.name.toUpperCase()} · CAMPAIGN WORKSPACE`} title="Create campaign" description={description} actions={<Pill tone="preview">Preview only</Pill>} /><form className="campaign-form-card" onSubmit={(e) => { void campaignForm.handleSubmit(() => notify('Campaign saved as a local preview. It has not been submitted or published.'))(e) }}><div className="form-section-heading"><span>01</span><div><h3>Campaign basics</h3><p>Plan a placement in the NAHORA marketplace.</p></div></div><div className="form-grid"><label>Campaign name<input placeholder="e.g. Winter artisan collection" {...campaignForm.register('name')} />{campaignForm.formState.errors.name && <small className="field-error">{campaignForm.formState.errors.name.message}</small>}</label><label>Objective<select {...campaignForm.register('objective')}><option value="">Choose an objective</option><option>Brand awareness</option><option>Product discovery</option><option>Store visits</option></select>{campaignForm.formState.errors.objective && <small className="field-error">{campaignForm.formState.errors.objective.message}</small>}</label><label>Demo budget (৳)<input type="number" {...campaignForm.register('budget')} />{campaignForm.formState.errors.budget && <small className="field-error">{campaignForm.formState.errors.budget.message}</small>}</label><label>Start date<input type="date" {...campaignForm.register('startDate')} />{campaignForm.formState.errors.startDate && <small className="field-error">{campaignForm.formState.errors.startDate.message}</small>}</label><label>Target category<select><option>All marketplace shoppers</option><option>Fashion & Clothing</option><option>Home & Living</option></select></label><label>Target location<select><option>All Bangladesh</option><option>Dhaka</option><option>Chattogram</option></select></label></div><div className="upload-preview" role="button" tabIndex={0} onClick={() => notify('Banner upload is a local visual preview; no file is uploaded.')}><Plus size={19} /><b>Add a campaign banner</b><small>PNG or JPG · upload is preview only</small></div><div className="campaign-form-footer"><Pill tone="demo">No billing or publishing is connected</Pill><Button type="submit">Save campaign draft <ArrowRight size={15} /></Button></div></form></> :
    <>
      <PageHeader eyebrow={isDashboard ? `${workspaceMeta.name.toUpperCase()} · DEMO WORKSPACE` : `${workspaceMeta.name.toUpperCase()} · ${title.toUpperCase()}`} title={isDashboard ? (workspace === 'merchant' ? 'Good morning, Samira' : `Welcome to ${workspaceMeta.name}`) : title} description={description} actions={<><DateLabel /><Button variant="outline" onClick={() => notify(`${title} data refreshed locally. All metrics are demo data.`)}><span className="refresh-glyph">↻</span> Refresh</Button></>} />
      {!isDashboard && !isCreate && <PortalWorkflow workspace={workspace} slug={slug} title={title} />}
      {workspace === 'admin' && <div className="admin-alert"><ShieldCheck size={17} /><span><b>{t('Super Admin preview')}</b> — {t('sensitive controls are disabled. All records and platform metrics on this page are illustrative.')}</span><Pill tone="demo">Read-only demo</Pill></div>}
      {workspace === 'developer' && <div className="developer-alert"><Code2Icon />No keys, webhooks, APIs or integrations are connected in this frontend preview.</div>}
      {isDashboard && <div className="stats-grid">{statTitles.map((label, index) => { const Icon = statIcons[index]; return <article className="stat-card" key={label}><div className="stat-card-top"><span className={`stat-icon ${statTones[index]}`}><Icon size={18} /></span><button onClick={() => notify(`${label}: illustrative demo metric.`)} aria-label={`More about ${label}`}>···</button></div><span className="stat-title">{label}</span><strong>{statValues[index]}</strong><MiniStatTrend negative={index === 3 && workspace === 'staff'} /><div className={`stat-sparkline sparkline-${index}`}><span /><span /><span /><span /><span /><span /><span /></div></article>})}</div>}
      {isDashboard && workspace === 'merchant' && <MerchantOverviewExtras />}
      {isDashboard && <>
      <div className="portal-content-grid">
        <section className="panel analytics-panel"><div className="panel-heading"><div><span className="section-overline">{isDashboard ? 'YOUR BUSINESS AT A GLANCE' : 'WORKSPACE SNAPSHOT'}</span><h2>{workspace === 'courier' ? 'Parcel activity' : workspace === 'admin' ? 'Marketplace performance' : workspace === 'creator' ? 'Your reach over time' : workspace === 'developer' ? 'Workspace activity' : 'Sales overview'}</h2></div><button className="select-small" onClick={() => notify('Date range options are available in this analytics preview.')}>Last 7 days <ChevronDown size={14} /></button></div><div className="chart-legend"><span><i className="legend-dot green-dot" />{workspace === 'courier' ? 'Parcels' : 'Sales'}<b>{workspace === 'courier' ? '2,408' : '৳ 2,84,300'}</b></span><span><i className="legend-dot gold-dot" />Orders <b>183</b></span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={salesData} margin={{ top: 10, right: 6, left: -19, bottom: 0 }}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2b8a67" stopOpacity={0.2} /><stop offset="95%" stopColor="#2b8a67" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line-soft)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} /><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--text)' }} formatter={(value) => [`৳${Number(value).toLocaleString('en-BD')}`, 'Sales']} /><Area type="monotone" dataKey="sales" stroke="#247858" strokeWidth={2.5} fill="url(#salesFill)" activeDot={{ r: 5, fill: '#d7a84b', stroke: 'var(--surface)', strokeWidth: 3 }} /></AreaChart></ResponsiveContainer></div><div className="chart-footnote"><span><i />Demo data · Not connected to live activity</span><button onClick={() => navigateToAnalytics(location.pathname, notify)}>View report <ArrowRight size={14} /></button></div></section>
        <section className="panel quick-actions-panel"><div className="panel-heading"><div><span className="section-overline">MAKE IT HAPPEN</span><h2>{t('quickActions')}</h2></div><button className="panel-more" aria-label="More quick actions">···</button></div><div className="quick-action-list">{getQuickActions(workspace).map(({ label, detail, icon: Icon }, index) => <button key={label} onClick={() => notify(`${label} opened as a frontend preview.`)}><span className={`quick-action-icon quick-${index}`}><Icon size={17} /></span><span><b>{label}</b><small>{detail}</small></span><ArrowUpRight size={15} /></button>)}</div><Link to={nav[1]?.path || '/'} className="quick-actions-all">Explore workspace <ArrowRight size={14} /></Link></section>
      </div>
      <section className="panel table-panel"><div className="panel-heading table-heading"><div><span className="section-overline">{isDashboard ? 'WHAT NEEDS YOUR ATTENTION' : `${title.toUpperCase()} · SAMPLE RECORDS`}</span><h2>{isDashboard ? getActivityTitle(workspace) : `${title} directory`}</h2></div><Link to={nav[1]?.path || '/'} className="table-view-all">View all <ArrowRight size={14} /></Link></div><div className="table-toolbar"><div className="table-search"><Search size={15} /><input aria-label="Search records" placeholder="Search by name or reference..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><button className="table-filter" onClick={() => setStatusFilter(statusFilter === 'All' ? 'Pending' : 'All')}><Filter size={15} /> {statusFilter === 'All' ? 'Filters' : 'Pending only'}<span className="filter-count">{statusFilter === 'All' ? 2 : 1}</span></button><button className="table-export" onClick={() => notify('Export is a preview. No file was generated.')}>Export</button></div><RecordsTable data={data} workspace={workspace} onAction={(action, record) => notify(`${action} for ${record.title} — demo preview only.`)} /></section>
      <div className="portal-bottom-row"><section className="panel bottom-panel"><div className="panel-heading"><div><span className="section-overline">LOCAL MARKET REACH</span><h2>Top locations</h2></div><button className="panel-more">···</button></div><div className="location-bars">{[['Dhaka', '72%', '72'], ['Chattogram', '48%', '48'], ['Rajshahi', '34%', '34'], ['Khulna', '26%', '26']].map(([label, percent, width]) => <div className="location-bar" key={label}><div><span>{label}</span><b>{percent}</b></div><i><span style={{ width: `${width}%` }} /></i></div>)}</div><div className="location-note"><MapPin size={14} /> Illustrative regional activity · Bangladesh</div></section><section className="panel bottom-panel activity-panel"><div className="panel-heading"><div><span className="section-overline">LATEST UPDATES</span><h2>Recent activity</h2></div><button className="panel-more">···</button></div><div className="activity-feed">{[['Samira Ahmed', 'updated a storefront profile', '12 min ago', 'SA'], ['Bengal Harvest', 'submitted a product for review', '48 min ago', 'BH'], ['Marketplace team', 'published a community announcement', '2 hrs ago', 'NA']].map(([name, text, time, initials], index) => <div className="activity-item" key={name}><span className={`activity-avatar activity-${index}`}>{initials}</span><span><b>{name}</b> {text}<small>{time} · demo activity</small></span></div>)}</div></section></div>
      <div className="demo-footnote"><Sparkles size={14} /><span>NAHORA preview workspace · All figures, activity and records are sample data and are not verified real-world information.</span><Pill tone="demo">Demo data</Pill></div>
      </>}
    </>}
  </div></main></div></div>
}

function PortalWorkflow({ workspace, slug, title }: { workspace: string; slug: string; title: string }) {
  const { notify } = useAppStore()
  const [paused, setPaused] = useState<Record<string, boolean>>({})
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [linkCreated, setLinkCreated] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('All')
  const action = (label: string, detail: string) => notify(`${label}: ${detail} Preview only; no external action occurred.`)
  const panelTitle = `${title} · workspace tools`

  if ((workspace === 'admin' && ['risk', 'system', 'privacy', 'audit'].includes(slug)) || (workspace === 'courier' && ['agents', 'bulk-booking', 'disputes'].includes(slug)) || (workspace === 'advertiser' && slug === 'calendar')) return <WorkspaceAdvancedModule module={slug} />

  if (workspace === 'merchant' && ['onboarding', 'products', 'catalog', 'inventory', 'orders', 'customers', 'accounting', 'store-builder', 'marketing', 'automation', 'social', 'analytics', 'branches', 'subscription', 'procurement', 'returns', 'team', 'data'].includes(slug)) {
    const module = slug === 'store-builder' ? 'storebuilder' : slug === 'customers' ? 'crm' : slug
    return <MerchantAdvancedModule module={module} />
  }

  if (workspace === 'admin' && slug === 'finance') return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">PLATFORM FINANCE · DEMO LEDGER</span><h2>Money flows, clearly separated</h2></div><Pill tone="demo">Illustrative balances</Pill></div><div className="finance-breakdown">{[['Gross platform revenue', '৳ 24,80,000'], ['Merchant settlements payable', '৳ 12,40,000'], ['Courier fees accrued', '৳ 1,18,400'], ['Advertiser billing preview', '৳ 3,25,000'], ['Refunds under review', '৳ 42,800'], ['Disputed amount', '৳ 18,500']].map(([label, amount]) => <div key={label}><span>{label}</span><b>{amount}</b></div>)}</div><div className="approval-card"><ShieldCheck size={18} /><span><b>Dual approval required</b><small>Critical financial actions need a second reviewer. Approval is not connected.</small></span><Button variant="outline" onClick={() => action('Approval request', 'queued as a local preview')}>Review approval queue</Button></div></section>

  if (workspace === 'admin' && slug === 'governance') return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">PLATFORM CONTROLS</span><h2>Governance preview</h2></div><Pill tone="preview">Read-only demo</Pill></div><div className="warning-banner"><ShieldCheck size={17} /> Administrative controls are disabled previews. No platform-wide setting can be changed here.</div><div className="control-grid">{[['Emergency read-only mode', 'Would restrict changes across the demo interface.'], ['Maintenance mode', 'Preview of a planned maintenance notice.'], ['Admin impersonation', 'Time-limited and audit-logged in a real workflow.'], ['Data export requests', 'Sample privacy request queue.'], ['Feature flags', 'Tenant-level capability display.'], ['Role & permission matrix', 'Illustrative access controls by staff role.']].map(([label, detail]) => <div className="control-card" key={label}><div><b>{label}</b><p>{detail}</p></div><button className={`demo-switch ${checked[label] ? 'on' : ''}`} onClick={() => { setChecked({ ...checked, [label]: !checked[label] }); action(label, 'local visual toggle changed') }} aria-label={`Preview ${label}`}><i /></button></div>)}</div></section>

  if (workspace === 'courier' && slug === 'remittance') return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">COD RECONCILIATION · PREVIEW</span><h2>Remittance breakdown</h2></div><Pill tone="demo">Sample ledger</Pill></div><div className="finance-breakdown courier-breakdown">{[['Collected COD', '৳ 3,42,800'], ['Merchant remittance', '৳ 3,06,400'], ['Courier fee', '৳ 24,200'], ['Platform fee', '৳ 4,800'], ['Pending confirmation', '৳ 61,400'], ['Disputed amount', '৳ 8,000']].map(([label, amount], index) => <div key={label}><span><i className={`ledger-dot ledger-${index}`} />{label}</span><b>{amount}</b></div>)}</div><div className="workflow-toolbar"><div className="table-search"><Search size={14} /><input placeholder="Search remittance reference..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><Button variant="outline" onClick={() => action('Remittance export', 'file generation is disabled')}>Export preview</Button></div><RecordsTable data={demoRows.filter((row) => `${row.title} ${row.id}`.toLowerCase().includes(query.toLowerCase()))} workspace={workspace} onAction={(label, row) => action(label, row.id)} /></section>

  if (workspace === 'courier' && ['parcels', 'tracking', 'pickups'].includes(slug)) return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">COURIER OPERATIONS · DEMO PARCELS</span><h2>{slug === 'pickups' ? 'Pickup requests' : slug === 'tracking' ? 'Tracking timeline preview' : 'Incoming parcels'}</h2></div><Button onClick={() => action('Schedule pickup', 'opened a local scheduling preview')}><Plus size={14} /> Schedule pickup</Button></div><div className="filter-chips">{['All', 'Pending', 'Processing', 'Completed'].map((value) => <button key={value} className={`filter-chip ${selected === value ? 'active' : ''}`} onClick={() => setSelected(value)}>{value}</button>)}</div><div className="parcel-list">{demoRows.slice(0, 5).filter((row) => selected === 'All' || row.status === selected).map((row, index) => <article className="parcel-row" key={row.id}><span className="parcel-icon"><Package size={18} /></span><span className="parcel-main"><b>Parcel {row.id}-0{index + 1}</b><small>{row.title} · Dhaka → {index % 2 ? 'Chattogram' : 'Rajshahi'}</small><small><Clock3 size={12} /> Updated {row.date} · demo tracking</small></span><Pill tone={row.status}>{row.status}</Pill><Button variant="outline" onClick={() => action('Parcel status', `${row.id} details opened`)}>Details</Button></article>)}</div><div className="timeline-preview"><span className="timeline-step done"><i /><b>Label created</b><small>Sample event</small></span><span className="timeline-step done"><i /><b>Pickup scheduled</b><small>Preview status</small></span><span className="timeline-step"><i /><b>In transit</b><small>Not verified</small></span><span className="timeline-step"><i /><b>Delivery attempt</b><small>Not completed</small></span></div></section>

  if (workspace === 'advertiser' && (slug === 'campaigns' || slug === 'analytics')) return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">CAMPAIGN MANAGER · SAMPLE DATA</span><h2>{slug === 'analytics' ? 'Campaign performance preview' : 'Your campaigns'}</h2></div><Link className="button button-primary" to="/advertiser/create"><Plus size={14} /> Create campaign</Link></div><div className="campaign-list">{[['Autumn artisan edit', 'Sponsored products', 'Active', '৳ 18,400', '72,840'], ['Dhaka home makers', 'Store promotion', 'Pending', '৳ 8,000', '24,190'], ['Local gift guide', 'Homepage banner', 'Draft', '৳ 12,500', '—']].map(([name, type, status, budget, reach], index) => <article className="campaign-row" key={name}><span className={`campaign-thumbnail campaign-${index}`}><Sparkles size={18} /></span><span className="campaign-name"><b>{name}</b><small>{type} · {budget} demo budget</small></span><Pill tone={status}>{status}</Pill><span className="campaign-metric"><b>{reach}</b><small>sample reach</small></span><Button variant="outline" onClick={() => { setPaused({ ...paused, [name]: !paused[name] }); action(name, paused[name] ? 'resume preview toggled' : 'pause preview toggled') }}>{paused[name] ? 'Resume preview' : 'Pause preview'}</Button></article>)}</div><div className="honest-demo-note"><Sparkles size={15} /> Impressions, clicks, engagement, conversion and billing figures are illustrative.</div></section>

  if (workspace === 'creator' && slug === 'links') return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">CREATOR TOOLKIT · LOCAL PREVIEW</span><h2>Affiliate link builder</h2></div><Pill tone="preview">No attribution connected</Pill></div><div className="link-builder"><label>Choose a product<select value={selected} onChange={(event) => setSelected(event.target.value)}>{products.map((product) => <option value={product.id} key={product.id}>{product.name} · ৳{product.price.toLocaleString('en-BD')}</option>)}</select></label><label>Your campaign name<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Eid gift edit" /></label><Button onClick={() => { setLinkCreated(true); action('Affiliate link', 'generated in local preview') }}>Generate preview link <ArrowRight size={14} /></Button></div>{linkCreated && <div className="generated-link"><span><small>PREVIEW LINK · NOT TRACKED</small><b>nahora.demo/p/{selected}?ref=creator-demo</b></span><Button variant="outline" onClick={() => action('Copy link', 'clipboard sharing is not connected')}>Copy link</Button><div className="qr-preview">QR<br />PREVIEW</div></div>}<div className="creator-stats"><div><span>Sample clicks</span><b>1,284</b></div><div><span>Attributed orders</span><b>24</b></div><div><span>Estimated commission</span><b>৳ 4,280</b></div></div></section>

  if (workspace === 'staff' && ['tasks', 'moderation', 'support', 'disputes'].includes(slug)) return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">STAFF OPERATIONS · ASSIGNED DEMO QUEUE</span><h2>{title} queue</h2></div><Button variant="outline" onClick={() => action('Queue filters', 'opened filter preview')}><Filter size={14} /> Filter queue</Button></div><div className="task-list">{[['Review a reported product photo', 'High priority · Catalog review · Due today'], ['Reply to merchant application question', 'Normal priority · Merchant support · Due today'], ['Escalate delayed parcel case', 'High priority · Courier dispute · Due tomorrow'], ['Check community post report', 'Low priority · Content moderation · Nov 06']].map(([task, detail], index) => <label className="task-row" key={task}><input type="checkbox" checked={Boolean(checked[task])} onChange={() => setChecked({ ...checked, [task]: !checked[task] })} /><span><b>{task}</b><small>{detail}</small></span><Pill tone={index < 2 ? 'pending' : 'active'}>{checked[task] ? 'Reviewed' : index < 2 ? 'Pending' : 'Assigned'}</Pill><button type="button" onClick={() => action('Task note', `${task} notes opened`)}>Add note</button></label>)}</div><div className="honest-demo-note">Task changes only update this local preview; no staff record is saved.</div></section>

  if (workspace === 'developer') return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">DEVELOPER TOOLKIT · DOCUMENTATION PREVIEW</span><h2>{title} workspace</h2></div><Pill tone="preview">Sandbox only</Pill></div>{slug === 'docs' ? <div className="docs-grid">{[['Getting started', 'A tour of the developer workspace and example conventions.'], ['Product catalog guide', 'Example product fields and sample display structures.'], ['Order events', 'Illustrative event payloads for documentation reading only.'], ['SDK quickstart', 'Code snippets are text examples and do not call a service.']].map(([label, detail]) => <button className="docs-card" key={label} onClick={() => action(label, 'documentation preview opened')}><span className="workspace-icon"><FileText size={17} /></span><b>{label}</b><small>{detail}</small><ArrowRight size={14} /></button>)}</div> : <div className="developer-preview-grid">{[['Application registration', 'Demo storefront preview', 'Not connected'], ['API key manager', 'No real credentials are generated', 'Preview only'], ['Webhook events', 'Example catalog.updated event', 'Sample event'], ['Sandbox usage', '128 illustrative events this month', 'Demo data']].map(([label, detail, status]) => <article className="developer-card" key={label}><span className="section-overline">{status}</span><b>{label}</b><p>{detail}</p><Button variant="outline" onClick={() => action(label, 'interface opened')}>Open preview <ArrowUpRight size={13} /></Button></article>)}</div>}<pre className="code-preview"><code>{`// Example shape for documentation only\nconst listing = {\n  product: \"Handwoven Jamdani Saree\",\n  currency: \"BDT\",\n  amount: 4850,\n  demo: true\n};`}</code><Pill tone="demo">Not executable</Pill></pre></section>

  if (workspace === 'admin' && ['merchants', 'catalog', 'support', 'customers'].includes(slug)) return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">PLATFORM OPERATIONS · DEMO QUEUE</span><h2>{slug === 'merchants' ? 'Merchant applications & health' : slug === 'catalog' ? 'Catalog moderation queue' : slug === 'customers' ? 'Customer care sample records' : 'Support & dispute queue'}</h2></div><Button variant="outline" onClick={() => action('Queue export', 'download is disabled')}>Export preview</Button></div><div className="admin-queue">{[['Rongdhonu Boutique', 'Merchant application · Dhaka', 'Pending'], ['Bengal Harvest', 'Product authenticity review · Rajshahi', 'Review'], ['Mrittika Studio', 'Store verification · Dhamrai', 'Approved'], ['Leather Lane BD', 'Customer complaint · Chawkbazar', 'Pending']].map(([name, detail, status]) => <article className="admin-queue-row" key={name}><span className="table-avatar">{name[0]}</span><span><b>{name}</b><small>{detail}</small></span><Pill tone={status}>{status}</Pill><Button variant="outline" onClick={() => action('Review record', name)}>Open review</Button><button className="row-action" onClick={() => action('Resolution note', name)}>Add note</button></article>)}</div><div className="honest-demo-note"><ShieldCheck size={15} /> Approve, reject, suspend and moderation decisions are previews only.</div></section>

  if (workspace === 'merchant' && ['products', 'orders', 'marketing', 'customers'].includes(slug)) return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">MERCHANT OPERATIONS · SAMPLE STORE</span><h2>{slug === 'products' ? 'Your product listings' : slug === 'orders' ? 'Fulfillment queue' : slug === 'customers' ? 'Customer relationships' : 'Store marketing tools'}</h2></div><Button onClick={() => action(slug === 'products' ? 'New product' : 'Create draft', 'form opened as a local preview')}><Plus size={14} />{slug === 'products' ? 'Add product' : 'Create draft'}</Button></div><div className="merchant-list">{(slug === 'products' ? products.slice(0, 5).map((product) => [product.name, `${product.category} · ${product.location}`, `৳${product.price.toLocaleString('en-BD')}`, 'Published']) : demoRows.slice(0, 5).map((row) => [row.title, `${row.id} · ${row.subtitle}`, row.amount ? `৳${row.amount.toLocaleString('en-BD')}` : '—', row.status])).map(([name, detail, amount, status]) => <article className="merchant-row" key={name}><span className="table-avatar">{name[0]}</span><span><b>{name}</b><small>{detail}</small></span><b>{amount}</b><Pill tone={status}>{status}</Pill><Button variant="outline" onClick={() => action(slug === 'orders' ? 'Fulfillment' : 'Edit listing', name)}>{slug === 'orders' ? 'Update status' : 'Open'}</Button></article>)}</div><div className="honest-demo-note">Store inventory and orders are sample records. Listing updates are not published.</div></section>

  if (workspace === 'merchant' && slug === 'settings') return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">STORE PROFILE & PREFERENCES</span><h2>Store settings</h2></div><Pill tone="demo">Local preview</Pill></div><form className="form-grid" onSubmit={(event) => { event.preventDefault(); action('Store profile', 'saved locally') }}><label>Public store name<input defaultValue="Rongdhonu Boutique" /></label><label>Store email<input type="email" defaultValue="hello@rongdhonu.demo" /></label><label>Phone<input defaultValue="01712 345 678" /></label><label>Location<input defaultValue="Mirpur, Dhaka" /></label><label className="span-two">Store description<textarea rows={3} defaultValue="Thoughtful handcrafted fashion from Bangladesh." /></label><label className="span-two">Visible contact methods<div className="setting-checkboxes">{['WhatsApp', 'Facebook', 'Messenger', 'Instagram', 'Email', 'Phone'].map((method) => <span key={method}><input type="checkbox" defaultChecked />{method}</span>)}</div></label><div className="span-two"><Button type="submit">Save store settings preview</Button></div></form></section>

  if ((workspace === 'courier' && ['settlements', 'areas', 'reports'].includes(slug)) || (workspace === 'advertiser' && ['billing', 'profile'].includes(slug)) || (workspace === 'creator' && ['partnerships', 'content', 'earnings', 'analytics'].includes(slug)) || (workspace === 'staff' && slug === 'calendar') || (workspace === 'admin' && ['campaigns', 'analytics'].includes(slug))) {
    const config: Record<string, { heading: string; metrics: [string, string][]; rows: [string, string, string, string][] }> = {
      'courier-settlements': { heading: 'Courier settlement history', metrics: [['Collected COD', '৳ 3,42,800'], ['Remitted', '৳ 2,81,400'], ['Pending', '৳ 61,400'], ['Disputed', '৳ 8,000']], rows: [['SET-2026-114', 'Pathao Courier · Oct 30', '৳ 84,200', 'Completed'], ['SET-2026-109', 'Steadfast · Oct 28', '৳ 61,400', 'Pending'], ['SET-2026-102', 'RedX · Oct 24', '৳ 8,000', 'Disputed']] },
      'courier-areas': { heading: 'Service coverage & rate comparison', metrics: [['Dhaka coverage', '64 areas'], ['Outside Dhaka', '42 districts'], ['Average handoff', '1.4 days'], ['Providers shown', '3 demos']], rows: [['Pathao Courier', 'Dhaka & 64 districts · COD preview', '৳ 65+', 'Available'], ['Steadfast', 'Nationwide · COD preview', '৳ 60+', 'Available'], ['RedX', 'Selected districts · rate estimate', '৳ 70+', 'Preview']] },
      'courier-reports': { heading: 'Delivery performance report', metrics: [['Delivered', '96.4%'], ['First attempt', '88.2%'], ['Average delivery', '2.1 days'], ['Return to origin', '3.8%']], rows: [['Dhaka Metro', 'Sample delivery zone', '96.8%', 'Active'], ['Chattogram', 'Sample delivery zone', '93.1%', 'Active'], ['Rajshahi', 'Sample delivery zone', '91.4%', 'Review']] },
      'advertiser-billing': { heading: 'Campaign invoices & billing', metrics: [['Current preview', '৳ 18,400'], ['Invoices', '4 sample'], ['Pending review', '৳ 8,000'], ['Paid status', 'Not connected']], rows: [['INV-DEMO-114', 'Autumn artisan edit · Oct 28', '৳ 18,400', 'Preview'], ['INV-DEMO-108', 'Dhaka home makers · Oct 20', '৳ 8,000', 'Pending'], ['INV-DEMO-102', 'Local gift guide · Oct 12', '৳ 12,500', 'Draft']] },
      'advertiser-profile': { heading: 'Advertiser profile & verification', metrics: [['Organization', 'Demo Collective'], ['Verification', 'Pending preview'], ['Billing currency', 'BDT'], ['Contact', 'samira@example.com']], rows: [['Business profile', 'Name, address and contacts', 'Complete', 'Review'], ['Verification documents', 'No files uploaded', 'Not connected', 'Preview'], ['Billing details', 'Local display preferences', 'BDT', 'Active']] },
      'creator-partnerships': { heading: 'Brand collaboration invitations', metrics: [['Invitations', '6 sample'], ['Pending requests', '3'], ['Accepted', '2'], ['Campaigns', '4']], rows: [['Rongdhonu Boutique', 'Festive Jamdani collection', '৳ 8,000', 'Invited'], ['Mrittika Studio', 'Maker story feature', 'Product gift', 'Pending'], ['Bengal Harvest', 'Seasonal mango edit', '৳ 4,500', 'Accepted']] },
      'creator-content': { heading: 'Content library & calendar', metrics: [['Drafts', '8'], ['Scheduled', '3'], ['Published preview', '12'], ['Needs edits', '2']], rows: [['Jamdani styling guide', 'Short video · Nov 05', 'Draft', 'Review'], ['Behind the loom', 'Photo story · Nov 07', 'Scheduled', 'Preview'], ['Local maker picks', 'Collection · Nov 10', 'Needs edits', 'Open']] },
      'creator-earnings': { heading: 'Creator earnings & payout history', metrics: [['Estimated commission', '৳ 42,800'], ['Attributed orders', '284'], ['Available preview', '৳ 18,200'], ['Payout connection', 'Not connected']], rows: [['PAY-DEMO-048', 'Sample attribution window', '৳ 12,400', 'Preview'], ['PAY-DEMO-044', 'Sample attribution window', '৳ 8,200', 'Pending'], ['PAY-DEMO-039', 'Sample attribution window', '৳ 6,400', 'Completed']] },
      'creator-analytics': { heading: 'Creator performance & attribution', metrics: [['Link visits', '18.4K'], ['Product clicks', '3,840'], ['Sample orders', '284'], ['Engagement', '6.8%']], rows: [['Handloom edit', 'Audience: Dhaka · Sample', '8,420 views', 'Active'], ['Makers at home', 'Audience: Bangladesh · Sample', '5,120 views', 'Active'], ['Gift guide', 'Audience: Chattogram · Sample', '2,840 views', 'Draft']] },
      'staff-calendar': { heading: 'Team work calendar', metrics: [['Today', '5 tasks'], ['This week', '18 tasks'], ['Review slots', '4'], ['Team members', '8 demo']], rows: [['09:30 AM', 'Product moderation review', 'High priority', 'Today'], ['11:00 AM', 'Merchant support handoff', 'Normal', 'Today'], ['02:30 PM', 'Courier dispute follow-up', 'High priority', 'Tomorrow']] },
      'admin-campaigns': { heading: 'Marketplace campaigns & homepage placements', metrics: [['Active placements', '12'], ['Pending approval', '4'], ['Sponsored products', '86'], ['Budget preview', '৳ 3.25L']], rows: [['Festive artisan edit', 'Homepage feature · Bangladesh', '৳ 48,000', 'Pending'], ['Dhaka home makers', 'Sponsored store · Dhaka', '৳ 18,000', 'Active'], ['Local gift guide', 'Category banner · Fashion', '৳ 12,500', 'Draft']] },
      'admin-analytics': { heading: 'Marketplace analytics & reports', metrics: [['Merchant retention', '92.4%'], ['New customers', '18.2K'], ['Orders sample', '1,284'], ['Commission trend', '+12.8%']], rows: [['Growth report', 'Bangladesh · last 30 days', 'Demo', 'Ready'], ['Category performance', 'Fashion & Home · sample', 'Demo', 'Ready'], ['Regional distribution', '8 divisions · illustrative', 'Demo', 'Preview']] },
    }
    const key = `${workspace}-${slug}`
    const item = config[key]
    if (item) return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">{workspaceMetaLabel(workspace)} · DEMO DATA</span><h2>{item.heading}</h2></div><Pill tone="preview">Illustrative</Pill></div><div className="workflow-metric-grid">{item.metrics.map(([label, value]) => <div className="workflow-metric" key={label}><small>{label}</small><b>{value}</b></div>)}</div><div className="workflow-records">{item.rows.map(([reference, detail, amount, status]) => <article className="merchant-row" key={reference}><span className="table-avatar">{reference[0]}</span><span><b>{reference}</b><small>{detail}</small></span><b>{amount}</b><Pill tone={status}>{status}</Pill><Button variant="outline" onClick={() => action('Open details', reference)}>Details</Button></article>)}</div><div className="workflow-action-row"><Button variant="outline" onClick={() => action('Filter', title)}>Open filters</Button><Button variant="outline" onClick={() => action('Export', title)}>Export preview</Button></div></section>
  }

  return <section className="workflow-panel"><div className="workflow-heading"><div><span className="section-overline">{workspaceMetaLabel(workspace)} · WORKSPACE PREVIEW</span><h2>{panelTitle}</h2></div><Pill tone="demo">Sample records</Pill></div><div className="workflow-toolbar"><div className="table-search"><Search size={14} /><input placeholder={`Search ${title.toLowerCase()}...`} value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className="workflow-select" value={selected} onChange={(event) => setSelected(event.target.value)}><option>All</option><option>Active</option><option>Pending</option><option>Completed</option></select><Button variant="outline" onClick={() => action(title, 'new record form opened')}>Create preview <Plus size={14} /></Button></div><div className="workflow-metric-grid">{[['Current status', 'Active preview'], ['Items requiring attention', '04 sample items'], ['Last updated', 'Today · illustrative'], ['Owner', 'NAHORA demo workspace']].map(([label, value]) => <div className="workflow-metric" key={label}><small>{label}</small><b>{value}</b></div>)}</div><div className="workflow-action-row"><Button variant="outline" onClick={() => action('Filter and sort', title)}>Open filter options</Button><Button variant="outline" onClick={() => action('Help', `${title} usage notes`)}>View help</Button></div></section>
}

function workspaceMetaLabel(workspace: string) {
  return workspace === 'admin' ? 'SUPER ADMIN' : workspace.toUpperCase()
}

function navigateToAnalytics(path: string, notify: (message: string) => void) {
  notify(`Analytics report preview for ${path}.`)
}

function getActivityTitle(workspace: string) {
  if (workspace === 'admin') return 'Platform activity'
  if (workspace === 'courier') return 'Recent parcels'
  if (workspace === 'advertiser') return 'Campaign activity'
  if (workspace === 'creator') return 'Recent performance'
  if (workspace === 'staff') return 'Your latest tasks'
  if (workspace === 'developer') return 'Recent workspace events'
  return 'Recent orders'
}

function getQuickActions(workspace: string) {
  const actions: Record<string, { label: string; detail: string; icon: React.ElementType }[]> = {
    merchant: [{ label: 'Add a product', detail: 'Create a new listing', icon: Plus }, { label: 'View orders', detail: 'Review incoming orders', icon: Package }, { label: 'Promote your store', detail: 'Reach new shoppers', icon: Sparkles }],
    admin: [{ label: 'Review merchants', detail: '18 applications waiting', icon: Users }, { label: 'Moderate products', detail: '12 listings to review', icon: Eye }, { label: 'Platform settings', detail: 'Governance preview', icon: ShieldCheck }],
    courier: [{ label: 'View new parcels', detail: '28 parcels need attention', icon: Package }, { label: 'Schedule pickups', detail: 'Coordinate merchant pickups', icon: Truck }, { label: 'Review COD', detail: 'Check remittance preview', icon: Wallet }],
    advertiser: [{ label: 'Create campaign', detail: 'Plan a sponsored placement', icon: Plus }, { label: 'Review campaign', detail: 'Check current performance', icon: Eye }, { label: 'Open billing', detail: 'Invoice preview', icon: Wallet }],
    creator: [{ label: 'Browse collaborations', detail: 'Meet merchant partners', icon: Users }, { label: 'Create affiliate link', detail: 'Share a product you love', icon: Plus }, { label: 'View earnings', detail: 'Commission preview', icon: Wallet }],
    staff: [{ label: 'Open my tasks', detail: '5 tasks due today', icon: Package }, { label: 'Support queue', detail: '18 open conversations', icon: MessageCircle }, { label: 'Review moderation', detail: '12 items awaiting review', icon: ShieldCheck }],
    developer: [{ label: 'Read documentation', detail: 'Browse guides and examples', icon: Eye }, { label: 'Open sandbox', detail: 'Interactive UI preview', icon: Code2Icon }, { label: 'View changelog', detail: 'Recent interface updates', icon: Package }],
  }
  return actions[workspace] || actions.merchant
}

function Code2Icon() {
  return <span className="code-glyph">&lt;/&gt;</span>
}

function RecordsTable({ data, workspace, onAction }: { data: typeof demoRows; workspace: string; onAction: (action: string, record: typeof demoRows[number]) => void }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }])
  const columns = useMemo<ColumnDef<typeof demoRows[number]>[]>(() => [
    { accessorKey: 'id', header: 'REFERENCE' },
    { accessorKey: 'title', header: 'NAME & DETAILS' },
    { accessorKey: 'status', header: 'STATUS' },
    { accessorKey: 'amount', header: 'AMOUNT' },
    { accessorKey: 'date', header: 'LAST UPDATED' },
  ], [])
  const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })
  const actionLabel = workspace === 'admin' ? 'Review' : workspace === 'courier' ? 'Track' : workspace === 'staff' ? 'Open task' : 'View'
  return <div className="responsive-table-wrap"><table className="records-table"><thead>{table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => <th key={header.id}><button onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())} {header.column.getIsSorted() === 'asc' ? '↑' : header.column.getIsSorted() === 'desc' ? '↓' : '↕'}</button></th>)}<th /></tr>)}</thead><tbody>{table.getRowModel().rows.length ? table.getRowModel().rows.map(({ original: row }) => <tr key={row.id}><td><span className="table-ref">{row.id}</span></td><td><span className="table-name"><span className="table-avatar">{row.avatar}</span><span><b>{row.title}</b><small>{row.subtitle}</small></span></span></td><td><Pill tone={row.status}>{row.status}</Pill></td><td>{row.amount ? `৳${row.amount.toLocaleString('en-BD')}` : '—'}</td><td className="table-date">{row.date}</td><td><button className="row-action" onClick={() => onAction(actionLabel, row)}>{actionLabel} <ArrowUpRight size={13} /></button></td></tr>) : <tr><td colSpan={6}><div className="table-empty">No matching records. Try another search or filter.</div></td></tr>}</tbody></table></div>
}
