import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowDown, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Bell, Check, ChevronDown, ChevronLeft,
  ChevronRight, Heart, HelpCircle, Languages, Menu, Moon, Search, ShoppingBag, SlidersHorizontal,
  Sparkles, Sun, X,
} from 'lucide-react'
import { workspaces, type NavItem, type Product, productImage } from './data'
import { useAuth } from './auth'
import { useAppStore } from './store'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand-lockup" aria-label="NAHORA home">
      <span className="brand-mark">n</span>
      {!compact && <span className="brand-name">NAHORA<span className="brand-dot">.</span></span>}
    </Link>
  )
}

export function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: string }) {
  const { t } = useTranslation()
  return <span className={`pill pill-${tone.toLowerCase().replace(/ /g, '-')}`}>{typeof children === 'string' ? t(children) : children}</span>
}

export function Button({
  children, variant = 'primary', className = '', ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'outline' }) {
  const { t } = useTranslation()
  const localizedChildren = Array.isArray(children)
    ? children.map((child) => typeof child === 'string' && child.trim() ? t(child.trim()) : child)
    : typeof children === 'string' ? t(children) : children
  return <button className={`button button-${variant} ${className}`} {...props}>{localizedChildren}</button>
}

export function Header({ portal = false, mobileOpen: portalMobileOpen, onMenuToggle }: { portal?: boolean; mobileOpen?: boolean; onMenuToggle?: () => void }) {
  const { t, i18n } = useTranslation()
  const { dark, setDark, cartCount, notify } = useAppStore()
  const { user, logout } = useAuth()
  const [workspacesOpen, setWorkspacesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((open) => !open)
      }
      if (event.key === 'Escape') {
        setCommandOpen(false)
        setWorkspacesOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setWorkspacesOpen(false)
  }, [location.pathname])

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <>
      <header className={`topbar ${portal ? 'topbar-portal' : ''}`}>
        <div className="topbar-inner">
          <div className="topbar-brand">
            <button className="icon-button mobile-menu-trigger" onClick={() => portal ? onMenuToggle?.() : setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">
            {(portal ? portalMobileOpen : mobileOpen) ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Logo />
          </div>
          {!portal && (
            <form className="global-search" onSubmit={submitSearch}>
              <Search size={18} />
              <input aria-label={t('search')} placeholder={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} />
              <button type="submit" className="search-submit" aria-label="Search"><ArrowRight size={17} /></button>
              <kbd>Ctrl K</kbd>
            </form>
          )}
          {portal && <form className="portal-search global-search" onSubmit={submitSearch}><Search size={18} /><input placeholder={t('searchRecords')} aria-label={t('searchRecords')} value={query} onChange={(e) => setQuery(e.target.value)} /><button type="submit" className="search-submit" aria-label="Search"><ArrowRight size={17} /></button><kbd>Ctrl K</kbd></form>}
          {!portal && <nav className={`header-nav ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">
            <NavLink to="/search">{t('discover')}</NavLink>
            <NavLink to="/shop">Live shop</NavLink>
            <NavLink to="/stores">{t('stores')}</NavLink>
            <NavLink to="/deals">{t('deals')}</NavLink>
            <NavLink to="/community">{t('community')}</NavLink>
          </nav>}
          <div className="topbar-actions">
            <div className="dropdown-wrap">
              <button className="icon-button workspace-trigger" onClick={() => setWorkspacesOpen(!workspacesOpen)} aria-label={t('allPortals')} title={t('allPortals')}>
                <span className="workspace-grid">▦</span>
              </button>
              {workspacesOpen && <div className="dropdown workspace-dropdown">
                <div className="dropdown-heading">{t('allPortals')}</div>
                <div className="workspace-list">
                  {workspaces.map(({ name, path, icon: Icon, description }) => (
                    <Link to={path} className="workspace-option" key={path} onClick={() => setWorkspacesOpen(false)}>
                      <span className="workspace-icon"><Icon size={17} /></span><span><b>{t(name)}</b><small>{t(description)}</small></span><ChevronRight size={15} />
                    </Link>
                  ))}
                </div>
                <div className="dropdown-foot"><Pill tone="blue">{t('demo')}</Pill><span>NAHORA ecosystem</span></div>
              </div>}
            </div>
            <button className="icon-button language-button" aria-label={t('language')} onClick={() => { const language = i18n.language === 'en' ? 'bn' : 'en'; localStorage.setItem('nahora-language', language); void i18n.changeLanguage(language) }}>
              <Languages size={18} /><span>{i18n.language === 'en' ? 'EN' : 'বাং'}</span>
            </button>
            <button className="icon-button theme-button" aria-label={t('darkMode')} title={t('darkMode')} onClick={() => setDark(!dark)}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-button notification-button" aria-label={t('notifications')} title={t('notifications')} onClick={() => navigate('/notifications-center')}>
              <Bell size={18} /><i />
            </button>
            {!portal && <Link className="cart-button" to="/cart" aria-label={`${t('cart')}: ${cartCount}`}><ShoppingBag size={18} /><span>{t('cart')}</span><b>{cartCount}</b></Link>}
            <div className="dropdown-wrap profile-wrap">
              <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-label="Open profile menu">
                <span className="avatar avatar-user">{user?.fullName.slice(0, 2).toUpperCase() || 'SA'}</span><ChevronDown size={14} />
              </button>
              {profileOpen && <div className="dropdown profile-dropdown">
                <div className="profile-card"><span className="avatar avatar-user">{user?.fullName.slice(0, 2).toUpperCase() || 'SA'}</span><span><b>{user?.fullName || 'Guest account'}</b><small>{user?.email || 'Preview session'}</small></span></div>
                {user?.role === 'customer' && <Link to="/orders/live" onClick={() => setProfileOpen(false)}>My live orders</Link>}
                {user?.role === 'merchant' && <Link to="/merchant/live" onClick={() => setProfileOpen(false)}>Merchant live workspace</Link>}
                {user?.role === 'admin' && <Link to="/admin/live-merchants" onClick={() => setProfileOpen(false)}>Platform approvals</Link>}
                <Link to={user ? '/account' : '/login'} onClick={() => setProfileOpen(false)}>{user ? t('account') : 'Sign in'}</Link>
                <Link to="/help" onClick={() => setProfileOpen(false)}>{t('help')}</Link>
                <Link to="/shop" onClick={() => setProfileOpen(false)}>Live marketplace</Link>
                {user ? <button onClick={() => {
                  setProfileOpen(false)
                  void logout().then(() => notify('You have signed out.')).catch((error: unknown) => notify(error instanceof Error ? error.message : 'Sign out failed.'))
                }}>{t('signOut')}</button> : <Link to="/register" onClick={() => setProfileOpen(false)}>Create account</Link>}
              </div>}
            </div>
          </div>
        </div>
      </header>
      {commandOpen && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setCommandOpen(false) }}>
        <div className="command-dialog" role="dialog" aria-modal="true" aria-label="Command palette">
          <div className="command-search"><Search size={19} /><input autoFocus placeholder="Search pages and workspaces..." onChange={(e) => setQuery(e.target.value)} value={query} /><kbd>ESC</kbd><button className="icon-button" onClick={() => setCommandOpen(false)} aria-label="Close"><X size={18} /></button></div>
          <div className="command-label">QUICK NAVIGATION</div>
          {workspaces.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase())).map(({ name, path, icon: Icon, description }) => (
            <Link to={path} key={path} className="command-option" onClick={() => setCommandOpen(false)}><Icon size={17} /><span><b>{name}</b><small>{description}</small></span><span className="command-enter">↵</span></Link>
          ))}
          {[
            ['Universal search', '/search/all', 'Products, stores, orders and workspace pages'],
            ['AI experience studio', '/ai', 'Reviewable mock suggestions'],
            ['Notification center', '/notifications-center', 'Filter and manage demo notifications'],
            ['Mobile experience', '/mobile-preview', 'Install and offline state previews'],
          ].filter(([name, path, description]) => `${name} ${path} ${description}`.toLowerCase().includes(query.toLowerCase())).map(([name, path, description]) => (
            <Link to={path} key={path} className="command-option" onClick={() => setCommandOpen(false)}><Sparkles size={17} /><span><b>{name}</b><small>{description}</small></span><span className="command-enter">↵</span></Link>
          ))}
          <div className="command-foot"><span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span><span><kbd>↵</kbd> to select</span><span><kbd>esc</kbd> to close</span></div>
        </div>
      </div>}
    </>
  )
}

export function Sidebar({ items, title, icon: Icon, mobileOpen = false }: { items: NavItem[]; title: string; icon: React.ElementType; mobileOpen?: boolean }) {
  const { t } = useTranslation()
  const { notify } = useAppStore()
  return <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
    <div className="sidebar-workspace">
      <span className="sidebar-workspace-icon"><Icon size={19} /></span>
      <span><small>{t('NAHORA WORKSPACE')}</small><b>{t(title)}</b></span>
      <ChevronDown size={15} />
    </div>
    <div className="side-section-label">{t('WORKSPACE')}</div>
    <nav className="sidebar-nav">
      {items.map(({ label, path, icon: ItemIcon }) => (
        <NavLink key={path} to={path} end={path.split('/').filter(Boolean).length === 1} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <ItemIcon size={18} strokeWidth={1.8} /><span>{t(label)}</span>
          {label === 'Support & disputes' && <i className="sidebar-count">4</i>}
        </NavLink>
      ))}
    </nav>
    <div className="sidebar-bottom">
      <div className="academy-callout"><span className="academy-icon"><Sparkles size={16} /></span><b>{t('Grow with NAHORA')}</b><p>{t('Explore practical guides and community support.')}</p><Link to="/academy">{t('Visit Merchant Academy')} <ArrowUpRight size={13} /></Link></div>
      <div className="sidebar-user"><span className="avatar avatar-user">SA</span><span><b>Samira Ahmed</b><small>{t('Workspace owner')}</small></span><button aria-label={t('settings')} onClick={() => notify('Workspace profile settings preview.') }><MoreDots /></button></div>
    </div>
  </aside>
}

function MoreDots() {
  return <span className="more-dots">···</span>
}

export function Breadcrumbs({ parts }: { parts: string[] }) {
  const { t } = useTranslation()
  return <div className="breadcrumbs"><Link to="/">{t('Marketplace')}</Link><ChevronRight size={13} />{parts.map((part, index) => <span key={part}>{index > 0 && <ChevronRight size={13} />}{t(part)}</span>)}</div>
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  const { t } = useTranslation()
  return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{t(eyebrow)}</div>}<h1>{t(title)}</h1>{description && <p>{t(description)}</p>}</div>{actions && <div className="heading-actions">{actions}</div>}</div>
}

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { t, i18n } = useTranslation()
  const { addCart, notify, wishlist, toggleWishlist } = useAppStore()
  const liked = wishlist.includes(product.id)
  const navigate = useNavigate()
  const price = new Intl.NumberFormat(i18n.language === 'bn' ? 'bn-BD' : 'en-BD').format(product.price)
  return <article className={`product-card ${compact ? 'product-card-compact' : ''}`}>
    <div className={`product-image ${product.color}`}>
      <img src={productImage(product.image, 520)} alt={i18n.language === 'bn' ? product.bn : product.name} loading="lazy" />
      {product.oldPrice && <Pill tone="sale">SAVE {Math.round((1 - product.price / product.oldPrice) * 100)}%</Pill>}
      <button className={`favorite-button ${liked ? 'is-liked' : ''}`} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => { toggleWishlist(product.id); notify(liked ? 'Removed from your wishlist.' : 'Saved to your wishlist.') }}><Heart size={17} fill={liked ? 'currentColor' : 'none'} /></button>
      <button className="product-view" onClick={() => navigate(`/product/${product.id}`)}>Quick view <ArrowUpRight size={13} /></button>
    </div>
    <div className="product-info">
      <div className="product-category">{product.category}</div>
      <Link to={`/product/${product.id}`} className="product-name">{i18n.language === 'bn' ? product.bn : product.name}</Link>
      <div className="product-store"><span className="tiny-store-icon">{product.store.slice(0, 1)}</span>{product.store} <span>· {product.location.split(',')[0]}</span></div>
      <div className="product-bottom"><span className="product-price">৳{price}{product.oldPrice && <del>৳{new Intl.NumberFormat('en-BD').format(product.oldPrice)}</del>}</span><span className="rating"><span>★</span> {product.rating}</span></div>
      <button className="product-add" onClick={() => { addCart(product.id); notify(`${product.name} added to your demo cart.`) }}><ShoppingBag size={15} />{t('addToCart')}</button>
    </div>
  </article>
}

export function SectionTitle({ overline, title, description, to, linkLabel }: { overline?: string; title: string; description?: string; to?: string; linkLabel?: string }) {
  return <div className="section-title"><div>{overline && <span className="section-overline">{overline}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{to && <Link to={to} className="text-link">{linkLabel || 'Explore all'} <ArrowRight size={16} /></Link>}</div>
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><ShoppingBag size={21} /></span><h3>{title}</h3><p>{description}</p>{action}</div>
}

export function ToastHost() {
  const { toast, clearToast } = useAppStore()
  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(clearToast, 3500)
    return () => window.clearTimeout(timeout)
  }, [toast, clearToast])
  if (!toast) return null
  return <div className="toast" role="status" aria-live="polite"><span className="toast-check"><Check size={16} /></span><span>{toast}</span><button onClick={clearToast} aria-label="Dismiss notification"><X size={16} /></button></div>
}

export function Footer() {
  const { t } = useTranslation()
  const { notify } = useAppStore()
  return <footer className="market-footer">
    <div className="footer-main">
      <div className="footer-brand"><Logo /><p>{t('tagline')}<br />A home for Bangladesh's independent businesses.</p><div className="footer-socials"><button aria-label="Instagram" onClick={() => notify('Social profile preview. Direct publishing is not connected.')}>ig</button><button aria-label="Facebook" onClick={() => notify('Social profile preview. Direct publishing is not connected.')}>f</button><button aria-label="YouTube" onClick={() => notify('Social profile preview. Direct publishing is not connected.')}>▶</button></div></div>
      <div><b>Discover</b><Link to="/search">Shop all</Link><Link to="/shop">Live shop</Link><Link to="/stores">Local stores</Link><Link to="/deals">Deals & campaigns</Link><Link to="/community">Community</Link></div>
      <div><b>For business</b><Link to="/merchant">Sell on NAHORA</Link><Link to="/advertiser">Advertise</Link><Link to="/creator">Creator program</Link><Link to="/academy">Merchant Academy</Link></div>
      <div><b>Need a hand?</b><Link to="/help">Help center</Link><Link to="/inbox">Contact a store</Link><Link to="/orders">Track an order</Link><Link to="/privacy">Privacy & trust</Link><Link to="/search/all">Search all NAHORA</Link><Link to="/ai">AI experience preview</Link></div>
    </div>
    <div className="footer-bottom"><span>© 2026 NAHORA. One platform, every business.</span><span><Pill tone="demo">{t('demo')}</Pill><span>৳ BDT</span><span>বাংলাদেশ</span></span></div>
  </footer>
}

export function FilterBar({ onFilter }: { onFilter?: (filter: string) => void }) {
  const [active, setActive] = useState('All')
  const options = ['All', 'Fashion', 'Home & Living', 'Food & Grocery', 'Accessories']
  return <div className="filter-bar"><div className="filter-chips">{options.map((option) => <button key={option} className={active === option ? 'filter-chip active' : 'filter-chip'} onClick={() => { setActive(option); onFilter?.(option) }}>{option}</button>)}</div><button className="filter-button" onClick={() => onFilter?.('Filters')}><SlidersHorizontal size={16} /> Filters <span className="filter-count">2</span></button></div>
}

export function Pagination({ page, setPage, total }: { page: number; setPage: (page: number) => void; total: number }) {
  return <div className="pagination"><span>Showing {(page - 1) * 8 + 1}–{Math.min(page * 8, total)} of {total} products</span><div><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous page"><ChevronLeft size={17} /></button><button className="current-page">{page}</button><button onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div></div>
}

export function GalleryBack() {
  const navigate = useNavigate()
  return <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back</button>
}

export function DateLabel() {
  const { i18n } = useTranslation()
  return <span>{new Intl.DateTimeFormat(i18n.language === 'bn' ? 'bn-BD' : 'en-BD', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</span>
}

export function MiniStatTrend({ negative = false }: { negative?: boolean }) {
  return <span className={`stat-trend ${negative ? 'trend-negative' : ''}`}>{negative ? <ArrowDownRight size={14} /> : <ArrowDown size={14} className="trend-up-icon" />} {negative ? '2.4%' : '12.8%'} <small>vs last month</small></span>
}

export function BreadcrumbBack({ label }: { label: string }) {
  const navigate = useNavigate()
  return <button className="back-link" onClick={() => navigate(-1)}><ChevronLeft size={15} /> {label}</button>
}

export function SearchSuggestions({ value }: { value: string }) {
  const { i18n } = useTranslation()
  const items = useMemo(() => {
    if (!value) return []
    return ['Jamdani saree', 'Handloom panjabi', 'Jute bag'].filter((item) => item.toLowerCase().includes(value.toLowerCase()) || value.length < 3)
  }, [value])
  if (!items.length) return null
  return <div className="search-suggestions">{items.map((item) => <Link key={item} to={`/search?q=${encodeURIComponent(item)}`}><Search size={14} />{item}<span>{i18n.language === 'bn' ? 'অনুসন্ধান' : 'Search'}</span></Link>)}</div>
}

export function SubtleTooltip({ label }: { label: string }) {
  return <span className="tooltip-trigger" tabIndex={0} aria-label={label}><HelpCircle size={14} /><span>{label}</span></span>
}
