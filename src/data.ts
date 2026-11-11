import type { LucideIcon } from 'lucide-react'
import {
  Activity, BadgePercent, BookOpen, Boxes, Building2, ChartNoAxesCombined, Code2,
  CreditCard, FileText, Headphones, Heart, LayoutDashboard, Megaphone, MessageSquare,
  Package, PackageCheck, Settings, Shield, ShoppingBag, Store, Truck, Users, Wallet,
} from 'lucide-react'

export type NavItem = { label: string; path: string; icon: LucideIcon }
export type Workspace = { name: string; path: string; description: string; icon: LucideIcon; color: string }

export const workspaces: Workspace[] = [
  { name: 'Marketplace', path: '/', description: 'Shop across independent local stores', icon: ShoppingBag, color: 'mint' },
  { name: 'Customer account', path: '/account', description: 'Orders, wishlist and profile', icon: Heart, color: 'rose' },
  { name: 'Merchant workspace', path: '/merchant', description: 'Manage your store and business', icon: Store, color: 'gold' },
  { name: 'Super Admin', path: '/admin', description: 'Platform governance and operations', icon: Shield, color: 'violet' },
  { name: 'Courier portal', path: '/courier', description: 'Parcels, delivery and remittance', icon: Truck, color: 'blue' },
  { name: 'Advertiser portal', path: '/advertiser', description: 'Campaigns and sponsored listings', icon: Megaphone, color: 'orange' },
  { name: 'Creator & Affiliate', path: '/creator', description: 'Partnerships, links and earnings', icon: Activity, color: 'pink' },
  { name: 'Staff portal', path: '/staff', description: 'Tasks, support and moderation', icon: Users, color: 'teal' },
  { name: 'Developer portal', path: '/developer', description: 'Documentation and sandbox previews', icon: Code2, color: 'slate' },
  { name: 'Merchant Academy', path: '/academy', description: 'Learn, grow and connect', icon: BookOpen, color: 'green' },
]

export const portalNavigation: Record<string, NavItem[]> = {
  merchant: [
    { label: 'Overview', path: '/merchant', icon: LayoutDashboard },
    { label: 'Onboarding', path: '/merchant/onboarding', icon: Store },
    { label: 'Products', path: '/merchant/products', icon: Package },
    { label: 'Universal catalog', path: '/merchant/catalog', icon: Boxes },
    { label: 'Inventory & warehouse', path: '/merchant/inventory', icon: PackageCheck },
    { label: 'Orders', path: '/merchant/orders', icon: PackageCheck },
    { label: 'Customers', path: '/merchant/customers', icon: Users },
    { label: 'Accounting', path: '/merchant/accounting', icon: Wallet },
    { label: 'Store builder', path: '/merchant/store-builder', icon: Store },
    { label: 'Procurement', path: '/merchant/procurement', icon: Boxes },
    { label: 'Returns center', path: '/merchant/returns', icon: Package },
    { label: 'Marketing', path: '/merchant/marketing', icon: Megaphone },
    { label: 'Automation', path: '/merchant/automation', icon: Activity },
    { label: 'Social commerce', path: '/merchant/social', icon: MessageSquare },
    { label: 'Messages', path: '/inbox', icon: MessageSquare },
    { label: 'Analytics', path: '/merchant/analytics', icon: ChartNoAxesCombined },
    { label: 'Branches & team', path: '/merchant/branches', icon: Building2 },
    { label: 'Team & HR', path: '/merchant/team', icon: Users },
    { label: 'Plans & apps', path: '/merchant/subscription', icon: CreditCard },
    { label: 'Data portability', path: '/merchant/data', icon: FileText },
    { label: 'Academy', path: '/academy', icon: BookOpen },
    { label: 'Settings', path: '/merchant/settings', icon: Settings },
  ],
  admin: [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Merchants', path: '/admin/merchants', icon: Store },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Catalog & moderation', path: '/admin/catalog', icon: Boxes },
    { label: 'Financials', path: '/admin/finance', icon: Wallet },
    { label: 'Campaigns', path: '/admin/campaigns', icon: BadgePercent },
    { label: 'Support & disputes', path: '/admin/support', icon: Headphones },
    { label: 'Risk & security', path: '/admin/risk', icon: Shield },
    { label: 'Governance', path: '/admin/governance', icon: Shield },
    { label: 'System health', path: '/admin/system', icon: Activity },
    { label: 'Privacy requests', path: '/admin/privacy', icon: FileText },
    { label: 'Audit history', path: '/admin/audit', icon: FileText },
    { label: 'Analytics', path: '/admin/analytics', icon: ChartNoAxesCombined },
  ],
  courier: [
    { label: 'Overview', path: '/courier', icon: LayoutDashboard },
    { label: 'Parcels', path: '/courier/parcels', icon: Package },
    { label: 'Pickups', path: '/courier/pickups', icon: Truck },
    { label: 'Bulk booking', path: '/courier/bulk-booking', icon: PackageCheck },
    { label: 'Tracking', path: '/courier/tracking', icon: Activity },
    { label: 'Delivery agents', path: '/courier/agents', icon: Users },
    { label: 'COD & remittance', path: '/courier/remittance', icon: Wallet },
    { label: 'Disputes', path: '/courier/disputes', icon: Shield },
    { label: 'Settlements', path: '/courier/settlements', icon: CreditCard },
    { label: 'Service areas', path: '/courier/areas', icon: Building2 },
    { label: 'Reports', path: '/courier/reports', icon: FileText },
  ],
  advertiser: [
    { label: 'Overview', path: '/advertiser', icon: LayoutDashboard },
    { label: 'Campaigns', path: '/advertiser/campaigns', icon: Megaphone },
    { label: 'Create campaign', path: '/advertiser/create', icon: BadgePercent },
    { label: 'Campaign calendar', path: '/advertiser/calendar', icon: FileText },
    { label: 'Analytics', path: '/advertiser/analytics', icon: ChartNoAxesCombined },
    { label: 'Billing history', path: '/advertiser/billing', icon: Wallet },
    { label: 'Profile', path: '/advertiser/profile', icon: Building2 },
  ],
  creator: [
    { label: 'Overview', path: '/creator', icon: LayoutDashboard },
    { label: 'Partnerships', path: '/creator/partnerships', icon: Users },
    { label: 'Affiliate links', path: '/creator/links', icon: PackageCheck },
    { label: 'Content library', path: '/creator/content', icon: FileText },
    { label: 'Earnings', path: '/creator/earnings', icon: Wallet },
    { label: 'Analytics', path: '/creator/analytics', icon: ChartNoAxesCombined },
  ],
  staff: [
    { label: 'Overview', path: '/staff', icon: LayoutDashboard },
    { label: 'My tasks', path: '/staff/tasks', icon: FileText },
    { label: 'Support queue', path: '/staff/support', icon: Headphones },
    { label: 'Moderation', path: '/staff/moderation', icon: Shield },
    { label: 'Disputes', path: '/staff/disputes', icon: Activity },
    { label: 'Team calendar', path: '/staff/calendar', icon: BookOpen },
  ],
  developer: [
    { label: 'Overview', path: '/developer', icon: LayoutDashboard },
    { label: 'Documentation', path: '/developer/docs', icon: BookOpen },
    { label: 'API keys (preview)', path: '/developer/keys', icon: Shield },
    { label: 'Webhooks (preview)', path: '/developer/webhooks', icon: Activity },
    { label: 'Integrations', path: '/developer/integrations', icon: Boxes },
    { label: 'Sandbox', path: '/developer/sandbox', icon: Code2 },
    { label: 'Changelog', path: '/developer/changelog', icon: FileText },
  ],
}

export type Product = {
  id: string; name: string; bn: string; category: string; price: number; oldPrice?: number
  rating: number; reviews: number; store: string; location: string; image: string; color: string
}

export const products: Product[] = [
  { id: 'p-1001', name: 'Handwoven Jamdani Saree', bn: 'হ্যান্ডওভেন জামদানি শাড়ি', category: 'Fashion', price: 4850, oldPrice: 6200, rating: 4.9, reviews: 128, store: 'Rongdhonu Boutique', location: 'Mirpur, Dhaka', image: 'photo-1610030469983-98e550d6193c', color: 'sage' },
  { id: 'p-1002', name: 'Artisan Terracotta Vase', bn: 'কারুশিল্পের টেরাকোটা ফুলদানি', category: 'Home & Living', price: 1250, rating: 4.8, reviews: 64, store: 'Mrittika Studio', location: 'Dhamrai, Dhaka', image: 'photo-1578500494198-246f612d3b3d', color: 'rose' },
  { id: 'p-1003', name: 'Premium Leather Wallet', bn: 'প্রিমিয়াম লেদার ওয়ালেট', category: 'Accessories', price: 890, oldPrice: 1100, rating: 4.7, reviews: 92, store: 'Leather Lane BD', location: 'Chawkbazar, Dhaka', image: 'photo-1627123424574-724758594e93', color: 'sand' },
  { id: 'p-1004', name: 'Handloom Cotton Panjabi', bn: 'হ্যান্ডলুম সুতি পাঞ্জাবি', category: 'Fashion', price: 1750, oldPrice: 2200, rating: 4.9, reviews: 203, store: 'Shobuj Loom', location: 'Narayanganj', image: 'photo-1598033129183-c4f50c736f10', color: 'blue' },
  { id: 'p-1005', name: 'Organic Rajshahi Mango Box', bn: 'অর্গানিক রাজশাহীর আম', category: 'Food & Grocery', price: 1450, rating: 4.8, reviews: 78, store: 'Bengal Harvest', location: 'Rajshahi Sadar', image: 'photo-1553279768-865429fa0078', color: 'yellow' },
  { id: 'p-1006', name: 'Minimal Ceramic Tea Set', bn: 'মিনিমাল সিরামিক চায়ের সেট', category: 'Home & Living', price: 2250, oldPrice: 2800, rating: 4.6, reviews: 41, store: 'Mrittika Studio', location: 'Dhamrai, Dhaka', image: 'photo-1576021182211-9ea8dced3690', color: 'lavender' },
  { id: 'p-1007', name: 'Natural Jute Tote Bag', bn: 'প্রাকৃতিক পাটের টোট ব্যাগ', category: 'Accessories', price: 650, rating: 4.9, reviews: 111, store: 'Jute & Joy', location: 'Khulna Sadar', image: 'photo-1590874103328-eac38a683ce7', color: 'mint' },
  { id: 'p-1008', name: 'Handcrafted Nakshi Cushion', bn: 'হাতে তৈরি নকশি কুশন', category: 'Home & Living', price: 980, oldPrice: 1250, rating: 4.8, reviews: 56, store: 'Nakshi Katha House', location: 'Jashore Sadar', image: 'photo-1584100936595-c0654b55a2e2', color: 'pink' },
]

export const productImage = (image: string, width = 600) =>
  `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}&q=85`

export const stores = [
  { name: 'Rongdhonu Boutique', type: 'Handcrafted fashion', location: 'Mirpur, Dhaka', rating: '4.9', image: 'photo-1441986300917-64674bd600d8', tint: 'mint' },
  { name: 'Mrittika Studio', type: 'Home & pottery', location: 'Dhamrai, Dhaka', rating: '4.8', image: 'photo-1490312278390-ab64016e0aa9', tint: 'sand' },
  { name: 'Bengal Harvest', type: 'Farm fresh goods', location: 'Rajshahi', rating: '4.9', image: 'photo-1542838132-92c53300491e', tint: 'green' },
  { name: 'Jute & Joy', type: 'Sustainable lifestyle', location: 'Khulna', rating: '4.7', image: 'photo-1441984904996-e0b6ba687e04', tint: 'rose' },
]

export const categories = [
  { name: 'Fashion & Clothing', icon: '✳', count: '2.4k stores', tint: 'soft-sage' },
  { name: 'Home & Living', icon: '⌂', count: '1.8k stores', tint: 'soft-gold' },
  { name: 'Food & Grocery', icon: '◉', count: '980 stores', tint: 'soft-peach' },
  { name: 'Beauty & Care', icon: '✿', count: '1.2k stores', tint: 'soft-pink' },
  { name: 'Electronics', icon: '⌁', count: '760 stores', tint: 'soft-blue' },
  { name: 'Arts & Crafts', icon: '◇', count: '640 stores', tint: 'soft-lavender' },
]

export type RecordRow = { id: string; title: string; subtitle: string; status: string; amount: number; date: string; avatar: string }

export const demoRows: RecordRow[] = [
  { id: 'NH-2841', title: 'Rongdhonu Boutique', subtitle: 'New order · 3 items', status: 'Processing', amount: 4850, date: 'Today, 10:42 AM', avatar: 'RB' },
  { id: 'NH-2839', title: 'Bengal Harvest', subtitle: 'Merchant application', status: 'Pending', amount: 0, date: 'Today, 9:18 AM', avatar: 'BH' },
  { id: 'NH-2836', title: 'Mrittika Studio', subtitle: 'Order delivered', status: 'Completed', amount: 2250, date: 'Yesterday', avatar: 'MS' },
  { id: 'NH-2831', title: 'Leather Lane BD', subtitle: 'Refund requested', status: 'Review', amount: 890, date: 'Yesterday', avatar: 'LL' },
  { id: 'NH-2828', title: 'Shobuj Loom', subtitle: 'Pickup scheduled · Pathao', status: 'Active', amount: 3500, date: 'Nov 01, 2026', avatar: 'SL' },
  { id: 'NH-2823', title: 'Nakshi Katha House', subtitle: 'Campaign draft', status: 'Draft', amount: 0, date: 'Oct 31, 2026', avatar: 'NK' },
  { id: 'NH-2819', title: 'Jute & Joy', subtitle: 'New store registration', status: 'Approved', amount: 0, date: 'Oct 30, 2026', avatar: 'JJ' },
]

export const pageDescriptions: Record<string, string> = {
  merchants: 'Review applications, monitor store health and support the merchant community.',
  customers: 'Customer profiles and support history shown using sample marketplace data.',
  catalog: 'Product catalog quality, authenticity labels and moderation queue.',
  finance: 'A preview of platform revenue, commission and settlement activity.',
  campaigns: 'Manage homepage placements and sponsored marketplace campaigns.',
  support: 'Resolve customer and merchant support requests in one workspace.',
  governance: 'Platform controls and policy tools. All settings are demo previews.',
  analytics: 'Explore marketplace trends using illustrative demo metrics.',
  parcels: 'Review inbound parcels, delivery status and shipment exceptions.',
  pickups: 'Coordinate merchant pickup requests and scheduling previews.',
  tracking: 'Sample parcel tracking and delivery attempt timeline.',
  remittance: 'Keep collected COD, fees and merchant remittance clearly separated.',
  settlements: 'Sample courier settlement and reconciliation records.',
  areas: 'Service coverage and rate previews for Bangladesh districts.',
  reports: 'Courier performance summaries based on demo data.',
  create: 'Plan an on-platform campaign. Submission is a preview and does not publish.',
  billing: 'Invoice and billing history preview for advertiser campaigns.',
  profile: 'Manage your advertiser profile and verification status.',
  partnerships: 'Invitations and brand partnership requests for your creator profile.',
  links: 'Generate sample affiliate links and QR previews for product discovery.',
  content: 'Organize creator content drafts and your publishing calendar.',
  earnings: 'Illustrative commissions, attribution and payout history.',
  tasks: 'Assigned work items and their current demo statuses.',
  moderation: 'Review reported listings and community content in the demo queue.',
  disputes: 'Track marketplace disputes and resolution notes.',
  calendar: 'Upcoming team activities and review deadlines.',
  docs: 'Browse frontend documentation examples and product guides.',
  keys: 'API key management is a preview only; no real keys are created.',
  webhooks: 'Example event viewer only. No real events are connected.',
  integrations: 'Browse integration cards and their illustrative connection status.',
  sandbox: 'A safe UI walkthrough; code execution and network calls are disabled.',
  changelog: 'Recent product interface updates and release notes.',
  products: 'Manage your listings, pricing and product visibility.',
  orders: 'Track incoming customer orders and their merchant-level fulfillment.',
  marketing: 'Plan storefront promotions and customer engagement.',
  onboarding: 'Create a store profile and review your plan and storefront publishing preview.',
  inventory: 'Review sample stock, warehouse movements, low-stock signals and purchase records.',
  accounting: 'Inspect merchant revenue, commission calculations, COD and immutable sample cost snapshots.',
  'store-builder': 'Arrange storefront content and review responsive device previews before publishing.',
  automation: 'Build reviewable customer workflows from sample triggers and actions.',
  social: 'Plan shoppable merchant posts, stories and creator collaborations.',
  branches: 'Review sample branch performance, staff and operational approvals.',
  subscription: 'Compare the Basic Lifetime plan with optional premium feature previews.',
  procurement: 'Compare sample suppliers, purchase orders and goods receiving.',
  returns: 'Review merchant-side return, refund and replacement request previews.',
  team: 'Manage sample staff, permissions, shifts, attendance and payroll previews.',
  data: 'Preview import validation, column mapping and merchant portability options.',
  risk: 'Review illustrative platform risk signals; critical actions require human review.',
  system: 'Review sample platform status, backup, maintenance and task queue interfaces.',
  privacy: 'Manage illustrative customer privacy and export request records.',
  audit: 'Read sample administrative event history in a read-only audit viewer.',
  agents: 'Review courier agent assignments and delivery evidence previews.',
  'bulk-booking': 'Prepare sample parcel batches and shipping label previews.',
  settings: 'Store profile, contact preferences and notification settings.',
}
