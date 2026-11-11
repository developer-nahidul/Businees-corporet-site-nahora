import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ToastHost } from './components'
import {
  CartPage, CheckoutPage, MarketplaceHome, PortalPage, ProductDetails, PublicFeaturePage, PublicLayout,
  SearchPage, StoreDirectory, Storefront,
} from './pages'
import { AiWorkspace, MobilePreview, NotificationCenter, UniversalSearch } from './advanced'
import { AuthProvider } from './auth'
import {
  AuthPage, LiveCustomerOrdersPage, LiveMarketplacePage, LiveMerchantApprovalsPage,
  LiveMerchantPage, RequireRole,
} from './live'
import { useAppStore } from './store'

export const customerRoutes = [
  ['/compare', 'Product comparison', 'Compare specifications, pricing and independent sellers side by side.'],
  ['/collections', 'Shopping collections', 'Curated product collections and saved shopping edits.'],
  ['/recently-viewed', 'Recently viewed', 'Return to products you explored in this local demo.'],
  ['/saved-searches', 'Saved searches', 'Revisit product discovery filters and saved search previews.'],
  ['/reviews', 'Reviews & ratings', 'Your reviews, helpful votes and seller replies.'],
  ['/questions', 'Product questions', 'Product Q&A and merchant response previews.'],
  ['/returns', 'Returns & replacements', 'Frontend request forms and illustrative request statuses.'],
  ['/refunds', 'Refund status', 'Refund history and dispute status shown as sample data.'],
  ['/warranty', 'Warranty claims', 'Warranty information and claim request previews.'],
  ['/complaints', 'Complaints & support', 'Submit and track buyer support requests in the demo.'],
  ['/rewards', 'Rewards & membership', 'Membership levels, loyalty points and reward previews.'],
  ['/coupons', 'Coupon wallet', 'Browse sample offers and saved coupon previews.'],
  ['/gift-center', 'Gift center', 'Gift cards and store credit shown as preview-only items.'],
  ['/gift-registry', 'Gift registry', 'Create and share a wishlist for a special occasion.'],
  ['/referrals', 'Referral program', 'Sample referral link and attribution dashboard.'],
  ['/assistant', 'Shopping assistant', 'A frontend shopping guide preview using marketplace sample content.'],
  ['/wholesale', 'Wholesale marketplace', 'Bulk order listings, minimum quantities and tier pricing previews.'],
  ['/nearby', 'Nearby stores & local deals', 'Explore local stores and neighborhood offer previews.'],
  ['/price-alerts', 'Price & stock alerts', 'Manage price drop and back-in-stock alert preferences.'],
  ['/share', 'Social sharing', 'Share products, stores and collections with copy-link and QR previews.'],
  ['/notifications', 'Notification preferences', 'Choose which marketplace updates appear in your demo account.'],
  ['/profile', 'Personal information', 'Manage your customer profile with local form preview.'],
  ['/addresses', 'Address book', 'Manage Bangladesh delivery address cards in local demo state.'],
  ['/followed-stores', 'Followed stores', 'The independent stores you follow in local demo state.'],
  ['/brands', 'Favourite brands', 'Browse and save favourite brands as a local preview.'],
  ['/accessibility', 'Accessibility settings', 'Adjust readable display preferences for this browser preview.'],
  ['/privacy-settings', 'Privacy settings', 'Manage privacy preferences in local demo state.'],
  ['/subscriptions', 'Subscriptions', 'Preview recurring product choices; no recurring purchase is created.'],
  ['/pre-orders', 'Pre-orders', 'Review maker-led pre-order schedules and sample availability.'],
  ['/group-buying', 'Group buying', 'Explore group price thresholds using illustrative demo participants.'],
  ['/authenticity', 'Product authenticity', 'Preview QR-based product information; no authenticity claim is verified.'],
  ['/order-tracking', 'Order tracking timeline', 'Follow sample order milestones; courier events are not live.'],
  ['/customer-community', 'Customer community', 'Share local product stories and community recommendations.'],
] as const

function RoutedPortal({ workspace }: { workspace: string }) {
  return <PortalPage workspace={workspace} />
}

function MissingPage() {
  return <PublicLayout><div className="public-page content-wrap"><div className="not-found"><span>404</span><h1>This page wandered off.</h1><p>It may have moved, or it may not be part of this demo yet.</p><a className="button button-primary" href="/">Back to marketplace</a></div></div></PublicLayout>
}

function BackendOnly({ children }: { children: React.ReactNode }) {
  if (!__NAHORA_STATIC_PREVIEW__) return children
  return <PublicLayout><div className="public-page content-wrap">
    <section className="loyalty-banner">
      <span className="eyebrow">PUBLIC FRONTEND PREVIEW</span>
      <h2>Backend features are not enabled here</h2>
      <p>Sign-in, accounts, live listings, merchant approvals and order processing are not part of this static showcase. Browse the demo marketplace and preview screens instead.</p>
      <p lang="bn">এই public preview-তে login, account, live product বা order সুবিধা চালু নেই। এখানে শুধু frontend demo দেখা যাবে।</p>
      <a className="button button-primary" href={`${import.meta.env.BASE_URL}`}>Browse the preview</a>
    </section>
  </div></PublicLayout>
}

function AppRoutes() {
  const { dark, setDark } = useAppStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { i18n } = useTranslation()

  useEffect(() => {
    setDark(dark)
  }, [dark, setDark])

  useEffect(() => {
    document.documentElement.lang = i18n.language
    document.documentElement.dir = i18n.dir(i18n.language)
  }, [i18n.language])

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('nahora-accessibility') || '{}')
      if (saved && typeof saved === 'object') {
        const preferences = saved as Record<string, unknown>
        for (const preference of ['larger-text', 'reduced-motion', 'high-contrast', 'keyboard-navigation']) {
          document.documentElement.classList.toggle(`a11y-${preference}`, preferences[preference] === true)
        }
      }
    } catch {
      localStorage.removeItem('nahora-accessibility')
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'ArrowLeft') navigate(-1)
      if (event.altKey && event.key === 'ArrowRight') navigate(1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  return <>
    <Routes>
      <Route path="/" element={<PublicLayout><MarketplaceHome /></PublicLayout>} />
      <Route path="/search" element={<PublicLayout><SearchPage /></PublicLayout>} />
      <Route path="/products" element={<Navigate to="/search" replace />} />
      <Route path="/product/:productId" element={<PublicLayout><ProductDetails /></PublicLayout>} />
      <Route path="/stores" element={<PublicLayout><StoreDirectory /></PublicLayout>} />
      <Route path="/stores/:storeId" element={<PublicLayout><Storefront /></PublicLayout>} />
      <Route path="/cart" element={<PublicLayout><CartPage /></PublicLayout>} />
      <Route path="/checkout" element={<PublicLayout><CheckoutPage /></PublicLayout>} />
      <Route path="/account" element={<PublicLayout><PublicFeaturePage title="Your account" description="Your personal NAHORA space for saved finds, delivery preferences and shopping history." /></PublicLayout>} />
      <Route path="/orders" element={<PublicLayout><PublicFeaturePage title="Your orders" description="A clear view of your sample marketplace orders, delivery updates and buyer support options." /></PublicLayout>} />
      <Route path="/wishlist" element={<PublicLayout><PublicFeaturePage title="Your wishlist" description="Keep the independent finds and stores you love in one thoughtful place." /></PublicLayout>} />
      <Route path="/inbox" element={<PublicLayout><PublicFeaturePage title="Buyer & merchant inbox" description="A mobile-friendly messaging preview for conversations with independent stores." /></PublicLayout>} />
      <Route path="/community" element={<PublicLayout><PublicFeaturePage title="Community & stories" description="A preview of creator stories, merchant conversations and shoppable community finds." /></PublicLayout>} />
      <Route path="/deals" element={<PublicLayout><PublicFeaturePage title="Deals & campaigns" description="Explore seasonal edits, local offers, flash sale previews and wholesale opportunities." /></PublicLayout>} />
      <Route path="/academy" element={<PublicLayout><PublicFeaturePage title="Merchant Academy" description="Short practical lessons and community resources to help independent businesses grow." /></PublicLayout>} />
      <Route path="/help" element={<PublicLayout><PublicFeaturePage title="Help center" description="Find guidance for shopping, selling and using the NAHORA demo experience." /></PublicLayout>} />
      <Route path="/privacy" element={<PublicLayout><PublicFeaturePage title="Privacy & trust" description="Privacy controls, account preferences and marketplace trust information." /></PublicLayout>} />
      <Route path="/ai" element={<PublicLayout><AiWorkspace /></PublicLayout>} />
      <Route path="/notifications-center" element={<PublicLayout><NotificationCenter /></PublicLayout>} />
      <Route path="/search/all" element={<PublicLayout><UniversalSearch /></PublicLayout>} />
      <Route path="/mobile-preview" element={<PublicLayout><MobilePreview /></PublicLayout>} />
      <Route path="/login" element={<BackendOnly><PublicLayout><AuthPage mode="login" /></PublicLayout></BackendOnly>} />
      <Route path="/register" element={<BackendOnly><PublicLayout><AuthPage mode="register" /></PublicLayout></BackendOnly>} />
      <Route path="/shop" element={<BackendOnly><PublicLayout><LiveMarketplacePage /></PublicLayout></BackendOnly>} />
      <Route path="/orders/live" element={<BackendOnly><PublicLayout><RequireRole role="customer"><LiveCustomerOrdersPage /></RequireRole></PublicLayout></BackendOnly>} />
      <Route path="/merchant/live" element={<BackendOnly><PublicLayout><RequireRole role="merchant"><LiveMerchantPage /></RequireRole></PublicLayout></BackendOnly>} />
      <Route path="/admin/live-merchants" element={<BackendOnly><PublicLayout><RequireRole role="admin"><LiveMerchantApprovalsPage /></RequireRole></PublicLayout></BackendOnly>} />
      {customerRoutes.map(([path, title, description]) => <Route key={path} path={path} element={<PublicLayout><PublicFeaturePage title={title} description={description} /></PublicLayout>} />)}
      <Route path="/merchant/*" element={<RoutedPortal workspace="merchant" />} />
      <Route path="/admin/*" element={<RoutedPortal workspace="admin" />} />
      <Route path="/courier/*" element={<RoutedPortal workspace="courier" />} />
      <Route path="/advertiser/*" element={<RoutedPortal workspace="advertiser" />} />
      <Route path="/creator/*" element={<RoutedPortal workspace="creator" />} />
      <Route path="/staff/*" element={<RoutedPortal workspace="staff" />} />
      <Route path="/developer/*" element={<RoutedPortal workspace="developer" />} />
      <Route path="*" element={<MissingPage />} />
    </Routes>
    <ToastHost />
  </>
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}
