import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ArrowDown, ArrowRight, ArrowUp, Bell, Check, Copy, Download, Grid2X2, Plus, Search,
  ShieldCheck, Sparkles, Store, WandSparkles, X,
} from 'lucide-react'
import { Breadcrumbs, Button, EmptyState, PageHeader, Pill } from './components'
import { demoRows, products, stores } from './data'
import { useAppStore } from './store'

type ModuleRecord = { name: string; detail: string; amount: string; status: string }
const recordsFromTuples = (rows: [string, string, string, string][]): ModuleRecord[] =>
  rows.map(([name, detail, amount, status]) => ({ name, detail, amount, status }))
const isModuleRecord = (record: unknown): record is ModuleRecord =>
  Boolean(record && typeof record === 'object' && 'name' in record && typeof record.name === 'string' && 'detail' in record && typeof record.detail === 'string' && 'amount' in record && typeof record.amount === 'string' && 'status' in record && typeof record.status === 'string')
const readModuleRecords = (module: string, initial: ModuleRecord[]): ModuleRecord[] => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(`nahora-demo-records-${module}`) || 'null')
    return Array.isArray(saved) && saved.length <= 500 && saved.every(isModuleRecord) ? saved : initial
  } catch {
    return initial
  }
}

const parseCsv = (source: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (character === '"' && quoted && source[index + 1] === '"') {
      cell += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === ',' && !quoted) {
      row.push(cell.trim())
      cell = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && source[index + 1] === '\n') index += 1
      row.push(cell.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.')
  row.push(cell.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

const moduleDefinitions: Record<string, { title: string; description: string; section: string; records: ModuleRecord[]; actions: string[] }> = {
  onboarding: {
    title: 'Merchant onboarding', description: 'Set up your business profile and preview your independent storefront.', section: 'BUSINESS SETUP',
    records: [['Business profile', 'Store name, description and category', 'Step 1 of 4', 'In progress'], ['Location & hours', 'Bangladesh address and opening hours', 'Step 2 of 4', 'Ready'], ['Contact methods', 'Choose what visitors can see', 'Step 3 of 4', 'Ready'], ['Store preview', 'Review before publishing', 'Step 4 of 4', 'Preview only']].map(([name, detail, amount, status]) => ({ name, detail, amount, status })),
    actions: ['Business details', 'Store location', 'Contact settings', 'Preview storefront'],
  },
  catalog: {
    title: 'Universal catalog & listings', description: 'Find catalog products, compare identity signals and create a store-specific listing preview.', section: 'PRODUCT CATALOG',
    records: products.slice(0, 5).map((product, index) => ({ name: product.name, detail: `${product.category} · ${product.store} · ${product.location}`, amount: `৳${product.price.toLocaleString('en-BD')}`, status: index === 1 ? 'Identity review' : 'Catalog match' })),
    actions: ['Search catalog', 'Match by barcode', 'Category suggestion', 'Duplicate review'],
  },
  inventory: {
    title: 'Inventory & warehouse', description: 'Review sample stock across warehouses, stock movements and purchase approvals.', section: 'STOCK OPERATIONS',
    records: [['Jamdani Saree · SKU JM-1001', 'Dhaka Central · Movement Oct 30', '12 units', 'In stock'], ['Terracotta Vase · SKU TV-1002', 'Dhamrai Workshop · Movement Oct 29', '4 units', 'Low stock'], ['Leather Wallet · SKU LW-1003', 'Chawkbazar Branch · Movement Oct 28', '0 units', 'Reorder']].map(([name, detail, amount, status]) => ({ name, detail, amount, status })),
    actions: ['Adjust stock', 'Transfer warehouse', 'Receive purchase order', 'Design barcode label'],
  },
  accounting: {
    title: 'Accounting & financials', description: 'Illustrative merchant ledger with transparent commission math and immutable order cost snapshots.', section: 'FINANCE · BDT',
    records: recordsFromTuples([['Order NH-2048', 'Net product price ৳4,500 · WAC COGS ৳2,100', 'Commission ৳240', 'Confirmed'], ['Order NH-2049', 'Net product price ৳1,650 · WAC COGS ৳1,800', 'Commission ৳0', 'Confirmed'], ['Order NH-2050', 'COD not remitted · commission held', '৳120 pending', 'Pending']]),
    actions: ['Cashbook', 'Expenses', 'Settlement history', 'Audit trail'],
  },
  crm: {
    title: 'Customer CRM', description: 'Explore sample customer segments, purchase history and relationship notes.', section: 'CUSTOMER RELATIONSHIPS',
    records: recordsFromTuples([['Samira Ahmed', 'Repeat · 8 orders · Mirpur, Dhaka', '৳28,450', 'VIP'], ['Nafis Rahman', 'Returning · 4 orders · Chattogram', '৳12,800', 'Active'], ['Tania Akter', 'Inactive · last order 90 days ago', '৳3,200', 'Re-engage']]),
    actions: ['Create segment', 'Add customer note', 'Export customer preview', 'View timeline'],
  },
  marketing: {
    title: 'Marketing & social studio', description: 'Draft a campaign, share a store card and plan content. Publishing is not connected.', section: 'CAMPAIGNS & CONTENT',
    records: recordsFromTuples([['Festive artisan edit', 'Product promotion · Bangladesh', '৳8,000 budget', 'Draft'], ['Jamdani styling story', 'Shoppable story · Instagram format', 'Nov 06', 'Scheduled preview'], ['Local maker welcome', 'Repeat customer offer', '120 recipients', 'Suggestion']]),
    actions: ['Create offer', 'Build coupon', 'Generate share card', 'Open content calendar'],
  },
  automation: {
    title: 'Marketing automation', description: 'Assemble a reviewable customer journey from demo triggers and actions.', section: 'WORKFLOW DESIGNER',
    records: recordsFromTuples([['Back-in-stock reminder', 'Trigger: selected item becomes available', '2 steps', 'Draft'], ['Repeat customer offer', 'Trigger: 3rd completed sample order', '3 steps', 'Paused'], ['Abandoned cart reminder', 'Trigger: sample cart idle for 24h', '2 steps', 'Preview']]),
    actions: ['Add trigger', 'Add message step', 'Set schedule', 'Review workflow'],
  },
  social: {
    title: 'Social commerce workspace', description: 'Prepare shoppable posts and stories with product tags and creator collaboration previews.', section: 'STORE CONTENT',
    records: recordsFromTuples([['Behind the loom', 'Story · Jamdani collection tagged', '1.8K views', 'Draft'], ['Makers of Dhamrai', 'Shoppable image · Terracotta vase', '640 saves', 'Preview'], ['Live shopping room', 'Host, products and audience controls', 'Oct 31 · 7 PM', 'Not started']]),
    actions: ['Create post', 'Tag a product', 'Plan a story', 'Invite a creator'],
  },
  branches: {
    title: 'Branches & team', description: 'Manage sample branch profiles, staff permissions, attendance and approval queues.', section: 'PEOPLE & LOCATIONS',
    records: recordsFromTuples([['Mirpur Studio', 'Dhaka · 5 team members', '৳1.8L sample sales', 'Active'], ['Dhamrai Workshop', 'Dhaka · 8 team members', '৳96K sample sales', 'Active'], ['Chawkbazar Kiosk', 'Dhaka · 3 team members', '2 leave requests', 'Review']]),
    actions: ['Add branch', 'Invite team member', 'Review attendance', 'Purchase approvals'],
  },
  subscription: {
    title: 'Plans & merchant marketplace', description: 'Review plan boundaries, premium feature previews and store tools.', section: 'PLAN & APPS',
    records: recordsFromTuples([['Basic Lifetime', 'Core storefront, product listings and orders', '৳500 one-time opening fee', 'Current demo plan'], ['Premium analytics', 'Forecasting and advanced reports', 'Preview only', 'Optional'], ['Theme marketplace', 'Store theme and template catalog', 'Preview only', 'Browse']]),
    actions: ['Compare plans', 'Explore store apps', 'Usage preview', 'Export my store data'],
  },
  procurement: {
    title: 'Procurement & suppliers', description: 'Compare sample supplier offers, purchase orders and receiving checks.', section: 'SUPPLY & PURCHASING',
    records: recordsFromTuples([['Nakshi Textile House', 'Cotton yarn · Dhaka wholesale market · 4.8/5 sample score', '৳420 / kg', 'Preferred'], ['Dhamrai Clay Cooperative', 'Terracotta material · Dhamrai · lead time 4 days', '৳85 / kg', 'Compare'], ['Bengal Packaging Ltd.', 'Recycled cartons · Narayanganj', '৳18 / unit', 'Review']]),
    actions: ['Create purchase order', 'Supplier comparison', 'Goods receiving', 'Return to supplier'],
  },
  returns: {
    title: 'Returns management', description: 'Review merchant-side return, refund and replacement request previews.', section: 'AFTER-SALES',
    records: recordsFromTuples([['RET-2048', 'Jamdani Saree · buyer reason: size exchange', '৳4,850', 'Needs review'], ['RET-2044', 'Terracotta Vase · damaged on arrival report', '৳1,250', 'Evidence preview'], ['RET-2039', 'Leather Wallet · replacement request', '৳890', 'Pending']]),
    actions: ['Open request', 'Add resolution note', 'Replacement preview', 'Refund review'],
  },
  team: {
    title: 'Team collaboration & HR', description: 'View sample staff profiles, permissions, shifts, attendance and purchase approvals.', section: 'TEAM MANAGEMENT',
    records: recordsFromTuples([['Nusrat Jahan', 'Store manager · Mirpur Studio · Today 10 AM–6 PM', 'Present', 'Manager'], ['Rafiul Islam', 'Fulfillment associate · Dhamrai Workshop', 'Leave request', 'Review'], ['Moumita Das', 'Customer care · Remote demo shift', 'Present', 'Support']]),
    actions: ['Invite staff', 'Permission matrix', 'Shift schedule', 'Payroll preview'],
  },
  data: {
    title: 'Import, export & portability', description: 'Preview CSV column mapping, validation results and a merchant data export request.', section: 'DATA TOOLS',
    records: recordsFromTuples([['Products.csv', '24 rows · name, price, category, stock', '22 valid · 2 warnings', 'Preview'], ['Customers.csv', '18 rows · customer contact preview', 'Consent review required', 'Not imported'], ['Store archive', 'Products, storefront copy and sample orders', 'ZIP export preview', 'Ready']]),
    actions: ['Choose CSV preview', 'Map columns', 'Review validation', 'Request store export'],
  },
  risk: {
    title: 'Risk & security overview', description: 'Review illustrative platform risk signals; high-impact actions stay human-controlled.', section: 'PLATFORM SAFETY',
    records: recordsFromTuples([['Merchant health watch', 'Bengal Harvest · unusual listing and response pattern', 'Score 64 / 100', 'Review'], ['Transaction anomaly', 'Sample order sequence · no real payments', 'Medium signal', 'Investigate'], ['Account security notice', 'New device sign-in preview · Dhaka', 'Low signal', 'Monitor']]),
    actions: ['Open risk case', 'Assign reviewer', 'Add audit note', 'View policy'],
  },
  system: {
    title: 'System health & status', description: 'Status cards are local sample data and do not reflect live platform infrastructure.', section: 'SYSTEM STATUS · DEMO',
    records: recordsFromTuples([['Marketplace interface', 'User-facing page preview', 'Operational', 'Sample'], ['Backup status', 'Last illustrative snapshot · Nov 02', 'Completed', 'Demo'], ['Failed task queue', '2 sample jobs require review', '2 items', 'Preview'], ['Maintenance mode', 'No scheduled maintenance', 'Inactive', 'Demo']]),
    actions: ['View status history', 'Maintenance notice preview', 'Migration progress', 'Integration status'],
  },
  privacy: {
    title: 'Privacy & data requests', description: 'Manage illustrative customer privacy and export request records.', section: 'PRIVACY OPERATIONS',
    records: recordsFromTuples([['PRV-118', 'Customer data access request · Samira A.', 'Due Nov 08', 'Pending'], ['PRV-114', 'Store data export request · Jute & Joy', 'Due Nov 06', 'In review'], ['PRV-109', 'Account deletion request · demo profile', 'Preview only', 'Needs review']]),
    actions: ['Open request', 'Record resolution note', 'Export request preview', 'View retention policy'],
  },
  audit: {
    title: 'Administrative audit history', description: 'Read-only sample change history with actor, timestamp and reason context.', section: 'AUDIT VIEWER',
    records: recordsFromTuples([['ACT-8821 · Campaign draft reviewed', 'Samira A. · Admin · Nov 03, 09:14', 'Campaigns', 'Recorded demo'], ['ACT-8818 · Merchant profile opened', 'Rafi H. · Staff · Nov 03, 08:42', 'Merchant', 'Read-only'], ['ACT-8811 · Permission matrix viewed', 'Samira A. · Admin · Nov 02, 17:20', 'Governance', 'Recorded demo']]),
    actions: ['Filter actor', 'Filter date range', 'Export audit preview', 'Open event details'],
  },
  agents: {
    title: 'Delivery agent management', description: 'Review sample courier teams, assigned routes and proof-of-delivery UI states.', section: 'COURIER TEAM',
    records: recordsFromTuples([['Arif Hossain', 'Dhaka North · 8 sample parcels', 'Online preview', 'Available'], ['Mehedi Hasan', 'Dhaka South · 6 sample parcels', '3 delivery attempts', 'On route'], ['Shila Akter', 'Chattogram · 4 sample parcels', 'OTP flow preview', 'Available']]),
    actions: ['Assign route', 'View delivery proof', 'OTP confirmation preview', 'Weight verification'],
  },
  'bulk-booking': {
    title: 'Bulk parcel booking & labels', description: 'Select sample orders and inspect booking and label generation previews.', section: 'BULK FULFILLMENT',
    records: recordsFromTuples([['NH-2841 · Rongdhonu Boutique', 'Dhaka → Chattogram · 1 parcel · 1.2kg', 'COD ৳4,850', 'Ready'], ['NH-2839 · Bengal Harvest', 'Rajshahi → Dhaka · 2 parcels · 3.0kg', 'COD ৳1,450', 'Needs weight'], ['NH-2836 · Mrittika Studio', 'Dhamrai → Dhaka · fragile item', 'COD ৳2,250', 'Ready']]),
    actions: ['Select all preview', 'Create bulk booking', 'Generate labels preview', 'Schedule pickup'],
  },
  disputes: {
    title: 'Courier dispute handling', description: 'Separate collection, remittance and evidence details in sample dispute records.', section: 'DELIVERY DISPUTES',
    records: recordsFromTuples([['DSP-2048', 'COD amount differs from merchant invoice', '৳1,200', 'Under review'], ['DSP-2044', 'Delivery attempt marked; recipient disputes', 'Evidence pending', 'Open'], ['DSP-2039', 'Return-to-origin fee review', '৳85', 'Needs evidence']]),
    actions: ['Add resolution note', 'Request evidence preview', 'Escalate case', 'View dispute history'],
  },
  'campaign-calendar': {
    title: 'Campaign calendar', description: 'Review proposed campaign dates, approvals and placements in a local calendar preview.', section: 'ADVERTISER STUDIO',
    records: recordsFromTuples([['Festive artisan edit', 'Nov 06–12 · Homepage sponsored collection', '৳18,400', 'Pending approval'], ['Local maker gift guide', 'Nov 14–20 · Fashion category', '৳12,500', 'Draft'], ['Dhaka home makers', 'Nov 22–29 · Store feature', '৳8,000', 'Scheduled preview']]),
    actions: ['Create calendar event', 'Open campaign builder', 'Review audience preview', 'Export schedule preview'],
  },
  storebuilder: {
    title: 'Visual store builder', description: 'Reorder storefront sections and preview responsive layouts before a demo publish.', section: 'STOREFRONT EDITOR',
    records: recordsFromTuples([['Store header', 'Logo, navigation and contact button', 'Visible', 'Enabled'], ['Hero banner', 'Rongdhonu festive collection', 'Visible', 'Enabled'], ['Product collection', 'Featured Jamdani and handloom picks', '8 products', 'Enabled'], ['Maker story', 'Our Mirpur workshop', 'About section', 'Enabled'], ['Store footer', 'Policies, hours and social links', 'Visible', 'Enabled']]),
    actions: ['Add section', 'Choose theme', 'SEO settings', 'Version history'],
  },
  products: {
    title: 'Product studio', description: 'Manage store listing previews, product media and import validation samples.', section: 'PRODUCT MANAGEMENT',
    records: products.map((product) => ({ name: product.name, detail: `${product.category} · ${product.location} · SKU ${product.id.toUpperCase()}`, amount: `৳${product.price.toLocaleString('en-BD')}`, status: product.oldPrice ? 'Published' : 'Draft' })),
    actions: ['Add product', 'Edit selected', 'Import CSV preview', 'View export history'],
  },
  orders: {
    title: 'Order fulfillment', description: 'Filter sample order lifecycle, add fulfillment notes and review customer communication shortcuts.', section: 'ORDER MANAGEMENT',
    records: demoRows.slice(0, 5).map((row) => ({ name: `Order ${row.id} · ${row.title}`, detail: `${row.subtitle} · ${row.date}`, amount: `৳${row.amount.toLocaleString('en-BD')}`, status: row.status })),
    actions: ['Bulk process', 'Packing slip preview', 'Assign warehouse', 'Message customer'],
  },
  analytics: {
    title: 'Business intelligence', description: 'Review illustrative KPIs, forecasts and configurable report previews.', section: 'BUSINESS INTELLIGENCE',
    records: [['Sales forecast', 'Sample 30-day projection · not a guarantee', '৳6.8L', 'Illustrative'], ['Stock prediction', 'Jamdani Saree · suggested reorder window', '7 days', 'Review suggestion'], ['Price recommendation', 'Leather Wallet · local category sample', '৳940', 'Review suggestion'], ['Business health', 'Sales, fulfillment and customer signals', '82 / 100', 'Demo score']].map(([name, detail, amount, status]) => ({ name, detail, amount, status })),
    actions: ['Custom report', 'Sales heatmap', 'Data import/export', 'Team activity'],
  },
}

function MerchantOnboarding() {
  const { notify } = useAppStore()
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const steps = ['Business profile', 'Location & hours', 'Contact methods', 'Store preview']
  return <section className="advanced-panel">
    <div className="advanced-progress"><span style={{ width: `${(step + 1) * 25}%` }} /></div>
    <div className="advanced-steps">{steps.map((label, index) => <button key={label} className={index === step ? 'active' : index < step ? 'done' : ''} onClick={() => setStep(index)}><span>{index < step ? <Check size={14} /> : index + 1}</span>{label}</button>)}</div>
    {done ? <div className="preview-result"><Pill tone="preview">Store publishing preview</Pill><h2>Rongdhonu Boutique is ready for review</h2><p>Profile completeness: 92%. Store opening fee: ৳500 one-time. Basic Lifetime includes storefront, listings and orders. Premium analytics remain optional.</p><Button variant="outline" onClick={() => setDone(false)}>Edit setup</Button></div> :
      <form className="advanced-form" onSubmit={(event) => { event.preventDefault(); if (step < steps.length - 1) setStep(step + 1); else setDone(true) }}>
        {step === 0 && <><label>Store name<input required defaultValue="Rongdhonu Boutique" /></label><label>Business type<select defaultValue="Retail"><option>Retail</option><option>Handmade producer</option><option>Food & grocery</option><option>Wholesale</option></select></label><label>Category<select defaultValue="Fashion"><option>Fashion</option><option>Home & Living</option><option>Food & Grocery</option><option>Accessories</option></select></label><label>Business description<textarea defaultValue="Thoughtfully made Bangladeshi handloom and artisan clothing." rows={3} /></label><label>Store logo preview<input type="file" accept="image/*" onChange={() => notify('Image selected for local preview only; no file is uploaded.')} /></label></>}
        {step === 1 && <><label>Address<input required defaultValue="House 18, Road 7, Mirpur DOHS" /></label><label>District<select defaultValue="Dhaka"><option>Dhaka</option><option>Chattogram</option><option>Rajshahi</option><option>Sylhet</option></select></label><label>Map location preview<button type="button" className="map-preview" onClick={() => notify('Map pin moved in the location preview.')}>📍 Mirpur, Dhaka · Tap to adjust demo pin</button></label><label>Business hours<input defaultValue="Sat–Thu · 10:00 AM–8:00 PM" /></label></>}
        {step === 2 && <><label>WhatsApp<input defaultValue="01712 345 678" /></label><label>imo number<input placeholder="Optional" /></label><label>Facebook Page<input placeholder="https://facebook.com/your-store" /></label><label>Facebook Messenger<input placeholder="Messenger username" /></label><label>Instagram<input placeholder="@yourstore" /></label><label>Email and phone<input defaultValue="hello@rongdhonu.demo · 01712 345 678" /></label></>}
        {step === 3 && <><div className="preview-result"><Store size={23} /><h2>Rongdhonu Boutique</h2><p>Mirpur, Dhaka · Sat–Thu · 10 AM–8 PM</p><p>Handloom and artisan clothing, made with care in Bangladesh.</p><div className="plan-comparison"><div><b>Basic Lifetime</b><strong>৳500 one-time opening fee</strong><small>Store page, catalog listings, orders and customer messaging</small></div><div><Pill tone="preview">Premium options</Pill><strong>Optional paid features</strong><small>Advanced insights, store themes and usage-based tools</small></div></div></div></>}
        <div className="advanced-actions"><Pill tone="demo">Demo setup · No store is published</Pill><Button type="submit">{step === steps.length - 1 ? 'Finish setup preview' : 'Continue'} <ArrowRight size={14} /></Button></div>
      </form>}
  </section>
}

function StoreBuilder() {
  const { notify } = useAppStore()
  const [sections, setSections] = useState(moduleDefinitions.storebuilder.records.map((record) => record.name))
  const [device, setDevice] = useState('Desktop')
  const [theme, setTheme] = useState('Forest')
  const [history, setHistory] = useState<string[][]>([])
  const [future, setFuture] = useState<string[][]>([])
  const [draggedSection, setDraggedSection] = useState<number | null>(null)
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    setHistory((previous) => [...previous, sections])
    setFuture([])
    setSections((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next })
  }
  const restore = (stack: string[][], setStack: (value: string[][]) => void, other: string[][], setOther: (value: string[][]) => void) => {
    const snapshot = stack[stack.length - 1]
    if (!snapshot) return
    setOther([...other, sections])
    setSections(snapshot)
    setStack(stack.slice(0, -1))
  }
  const addSection = () => { setHistory((previous) => [...previous, sections]); setFuture([]); setSections([...sections, 'Custom content']) }
  const removeSection = (index: number) => { setHistory((previous) => [...previous, sections]); setFuture([]); setSections(sections.filter((_, current) => current !== index)) }
  const dropSection = (target: number) => {
    if (draggedSection === null || draggedSection === target) return
    setHistory((previous) => [...previous, sections])
    setFuture([])
    setSections((current) => { const next = [...current]; const [item] = next.splice(draggedSection, 1); next.splice(target, 0, item); return next })
    setDraggedSection(null)
  }
  return <div className="builder-layout"><section className="advanced-panel"><div className="module-toolbar"><b>Store sections</b><Button variant="outline" onClick={addSection}><Plus size={14} /> Add section</Button></div>{sections.map((section, index) => <div className="builder-section" key={`${section}-${index}`} draggable onDragStart={() => setDraggedSection(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropSection(index)}><span className="drag-handle" aria-label="Drag to reorder">⠿</span><span><b>{section}</b><small>Visible on your storefront preview</small></span><button aria-label={`Move ${section} up`} onClick={() => move(index, -1)}><ArrowUp size={15} /></button><button aria-label={`Move ${section} down`} onClick={() => move(index, 1)}><ArrowDown size={15} /></button><button aria-label={`Remove ${section}`} onClick={() => removeSection(index)}><X size={15} /></button></div>)}<div className="advanced-actions"><Button variant="outline" onClick={() => restore(history, setHistory, future, setFuture)} disabled={!history.length}>Undo</Button><Button variant="outline" onClick={() => restore(future, setFuture, history, setHistory)} disabled={!future.length}>Redo</Button><Button variant="outline" onClick={() => notify('Draft version saved locally for this preview.')}>Save draft</Button><Button onClick={() => notify('Publishing is a preview only; your public store is unchanged.')}>Publish preview</Button></div></section><section className="store-preview-frame"><div className="module-toolbar"><b>Store preview</b><div>{['Desktop', 'Tablet', 'Mobile'].map((size) => <button className={device === size ? 'active' : ''} key={size} onClick={() => setDevice(size)}>{size}</button>)}</div></div><div className={`store-preview-device device-${device.toLowerCase()} theme-${theme.toLowerCase()}`}><span>RONGDHONU BOUTIQUE</span><h2>Made with care,<br />woven in Bangladesh.</h2><p>Discover handloom favourites from our Mirpur workshop.</p><button>Shop the collection</button>{sections.map((section) => <div className="store-preview-block" key={section}>{section}</div>)}</div><label className="theme-select">Theme <select value={theme} onChange={(event) => setTheme(event.target.value)}><option>Forest</option><option>Terracotta</option><option>Minimal</option></select></label></section></div>
}

function Accounting() {
  const [price, setPrice] = useState(4500)
  const [discount, setDiscount] = useState(0)
  const [cogs, setCogs] = useState(2100)
  const [refundPercent, setRefundPercent] = useState(0)
  const netProductPrice = Math.max(0, price - discount)
  const eligibleMargin = Math.max(0, netProductPrice - cogs)
  const commission = Math.round(eligibleMargin * 0.1 * (1 - refundPercent / 100))
  return <div className="advanced-panel">
    <div className="commission-calculator"><div><span className="section-overline">INTERACTIVE COMMISSION PREVIEW</span><h2>10% × max(0, net product price − WAC COGS)</h2><p>Delivery charges and separately collected taxes are excluded. Discounts apply before commission.</p></div><div className="commission-controls"><label>Product price<input type="number" min="0" value={price} onChange={(event) => setPrice(Number(event.target.value))} /></label><label>Discount<input type="number" min="0" max={price} value={discount} onChange={(event) => setDiscount(Number(event.target.value))} /></label><label>WAC COGS<input type="number" min="0" value={cogs} onChange={(event) => setCogs(Number(event.target.value))} /></label><label>Refund %<input type="number" min="0" max="100" value={refundPercent} onChange={(event) => setRefundPercent(Number(event.target.value))} /></label></div><div className="commission-result"><span>Commission preview</span><strong>৳{commission.toLocaleString('en-BD')}</strong><small>Net product price ৳{netProductPrice.toLocaleString('en-BD')} · Eligible margin ৳{eligibleMargin.toLocaleString('en-BD')}</small></div></div>
    <div className="financial-state-grid">{[['Gross product sales', '৳2,84,300'], ['Merchant earnings', '৳2,21,400'], ['COD collected', '৳84,200'], ['COD pending remittance', '৳18,400'], ['Courier charges', '৳12,600'], ['Refund adjustments', `৳${Math.round(commission * refundPercent / 100).toLocaleString('en-BD')}`]].map(([label, amount]) => <div key={label}><small>{label}</small><b>{amount}</b></div>)}</div>
    <h3>Historical order cost snapshots <Pill tone="preview">Immutable demo records</Pill></h3><div className="advanced-table">{moduleDefinitions.accounting.records.map((row) => <div className="advanced-row" key={row.name}><b>{row.name}</b><span>{row.detail}</span><b>{row.amount}</b><Pill tone={row.status}>{row.status}</Pill></div>)}</div><div className="honest-demo-note"><ShieldCheck size={15} /> Figures are illustrative only. COD commission stays pending until remittance confirmation; failed/cancelled deliveries are non-final.</div>
  </div>
}

function ModuleRecords({ module }: { module: string }) {
  const { notify } = useAppStore()
  const { t } = useTranslation()
  const definition = moduleDefinitions[module] || moduleDefinitions.products
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [records, setRecords] = useState(() => readModuleRecords(module, definition.records))
  const [formAction, setFormAction] = useState('')
  const [csvData, setCsvData] = useState<string[][]>([])
  const [csvFileName, setCsvFileName] = useState('')
  const [csvError, setCsvError] = useState('')
  useEffect(() => {
    try {
      localStorage.setItem(`nahora-demo-records-${module}`, JSON.stringify(records))
    } catch {
      notify(`${definition.title} changes remain temporary because browser storage is unavailable.`)
    }
  }, [definition.title, module, notify, records])
  const shown = useMemo(() => records.filter((row) => `${row.name} ${row.detail} ${row.status}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All' || row.status.toLowerCase().includes(filter.toLowerCase()))), [records, query, filter])
  const action = (label: string) => {
    if (module === 'products' && ['Add product', 'Edit selected', 'Import CSV preview'].includes(label)) {
      if (label === 'Import CSV preview') {
        setCsvData([])
        setCsvFileName('')
        setCsvError('')
      }
      setFormAction(label)
    }
    else if (module === 'inventory' && ['Adjust stock', 'Transfer warehouse', 'Receive purchase order'].includes(label)) setFormAction(label)
    else if (module === 'catalog' && ['Search catalog', 'Match by barcode', 'Category suggestion', 'Duplicate review'].includes(label)) setFormAction(label)
    else if (module === 'crm' && ['Create segment', 'Add customer note'].includes(label)) setFormAction(label)
    else if (module === 'crm' && label === 'View timeline') notify('Customer timeline opened: sample orders, support contacts and notes are shown in this preview.')
    else if (['Add product', 'Add branch', 'Create segment', 'Create offer', 'Add trigger', 'Create post', 'Invite staff', 'Create purchase order'].includes(label)) setFormAction(label)
    else notify(`${label} opened as an interactive demo preview. No external action occurred.`)
  }
  const submitAction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') || '').trim()
    const detail = String(formData.get('detail') || '').trim()
    if (module === 'products' && formAction === 'Edit selected') {
      const selected = String(formData.get('name') || '')
      const price = Number(formData.get('price'))
      const status = String(formData.get('detail') || 'Draft')
      setRecords((current) => current.map((row) => row.name === selected ? { ...row, amount: `৳${price.toLocaleString('en-BD')}`, status } : row))
      notify(`${selected} listing updated in the local demo.`)
    } else if (module === 'inventory' && formAction === 'Adjust stock') {
      const quantity = Number(formData.get('quantity'))
      const target = String(formData.get('product') || '')
      const reason = String(formData.get('detail') || '')
      if (!Number.isFinite(quantity) || quantity < 0) {
        notify('Enter a valid non-negative quantity.')
        return
      }
      setRecords((current) => current.map((row) => row.name.startsWith(target) ? { ...row, detail: `${row.detail} · ${reason} adjustment`, amount: `${quantity} units`, status: quantity === 0 ? 'Reorder' : quantity <= 4 ? 'Low stock' : 'In stock' } : row))
      notify(`${target} stock adjusted in the local demo to ${quantity} units.`)
    } else if (module === 'inventory' && formAction === 'Transfer warehouse') {
      const quantity = Number(formData.get('detail'))
      const destination = String(formData.get('amount') || '')
      if (!Number.isFinite(quantity) || quantity < 1) {
        notify('Enter a transfer quantity of at least one unit.')
        return
      }
      setRecords((current) => [{ name: `${name} · stock transfer`, detail: `${quantity} units moved to ${destination}`, amount: `${quantity} units`, status: 'Transfer preview' }, ...current])
      notify('Warehouse transfer recorded in the local movement preview only.')
    } else if (module === 'inventory' && formAction === 'Receive purchase order') {
      const quantity = Number(formData.get('quantity'))
      const location = String(formData.get('location') || '')
      if (!name || !Number.isFinite(quantity) || quantity < 1) {
        notify('Enter a product and a receiving quantity greater than zero.')
        return
      }
      setRecords((current) => [{ name: `${name} · received`, detail: `${location} · purchase order receiving preview`, amount: `${quantity} units`, status: 'Received preview' }, ...current])
      notify('Receiving movement added to the local demo only.')
    } else if (module === 'products' && formAction === 'Import CSV preview') {
      if (csvData.length < 2) {
        notify('Choose a CSV file with a header and at least one product row.')
        return
      }
      const getMappedColumn = (field: string) => {
        const column = String(formData.get(`map_${field}`) || '')
        return column === '' ? -1 : Number(column)
      }
      const nameColumn = getMappedColumn('name')
      const priceColumn = getMappedColumn('price')
      const categoryColumn = getMappedColumn('category')
      const stockColumn = getMappedColumn('stock')
      const validation = csvData.slice(1).map((row, index) => {
        const name = nameColumn < 0 ? '' : row[nameColumn]?.trim() || ''
        const price = priceColumn < 0 ? '' : row[priceColumn]?.trim() || ''
        const category = categoryColumn < 0 ? '' : row[categoryColumn]?.trim() || ''
        const stock = stockColumn < 0 ? '' : row[stockColumn]?.trim() || ''
        const issues: string[] = []
        if (!name) issues.push('missing product name')
        if (!price || !Number.isFinite(Number(price)) || Number(price) < 0) issues.push('invalid price')
        if (!category) issues.push('missing category')
        if (stock && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) issues.push('invalid stock')
        return { index, name: name || `Row ${index + 2}`, valid: issues.length === 0, issue: issues.join(', ') }
      })
      const validCount = validation.filter((row) => row.valid).length
      const warnings = validation.filter((row) => !row.valid).slice(0, 3).map((row) => `Row ${row.index + 2}: ${row.issue}`).join(' · ')
      setRecords((current) => [...current, { name: csvFileName, detail: `${validation.length} rows checked${warnings ? ` · ${warnings}` : ' · all rows passed'}`, amount: `${validCount} valid · ${validation.length - validCount} warning`, status: 'Import preview' }])
      notify(`${validation.length} CSV rows checked locally: ${validCount} valid, ${validation.length - validCount} with warnings. Nothing was imported.`)
    } else if (module === 'catalog' && formAction === 'Match by barcode') {
      const barcode = String(formData.get('barcode') || '')
      setRecords((current) => [{ name: `Barcode match · ${barcode}`, detail: 'No verified catalog source; compare identity, model, size and weight manually.', amount: 'Review match', status: 'Preview only' }, ...current])
      notify('Barcode match suggestions are local sample data only.')
    } else if (module === 'crm' && formAction === 'Add customer note') {
      const target = String(formData.get('name') || '')
      if (!detail) {
        notify('Add a note before saving.')
        return
      }
      setRecords((current) => current.map((row) => row.name === target ? { ...row, detail: `${row.detail} · Note: ${detail}` } : row))
      notify('Customer note added to this local CRM preview.')
    } else if (name) {
      const productDetail = module === 'products' ? `${String(formData.get('detail') || 'Uncategorized')} · ${String(formData.get('sku') || 'SKU not set')} · ${String(formData.get('description') || 'No description')}` : detail || `${formAction} · local demo draft`
      setRecords((current) => [{ name, detail: productDetail, amount: module === 'products' ? `৳${Number(formData.get('price') || 0).toLocaleString('en-BD')}` : 'Draft', status: 'Draft' }, ...current])
      notify(`${formAction} saved as a local draft only.`)
    }
    setFormAction('')
  }
  const formTitle = formAction === 'Import CSV preview' ? 'Validate a product import' : formAction === 'Adjust stock' ? 'Adjust sample inventory' : formAction === 'Transfer warehouse' ? 'Preview a stock transfer' : formAction === 'Receive purchase order' ? 'Receive sample inventory' : formAction === 'Match by barcode' ? 'Find a catalog match' : formAction === 'Category suggestion' ? 'Review category suggestion' : formAction === 'Duplicate review' ? 'Compare possible duplicate' : formAction === 'Add customer note' ? 'Add a local customer note' : formAction === 'View timeline' ? 'Customer activity timeline' : formAction
  return <div className="advanced-panel">
    <div className="module-toolbar"><div className="table-search"><Search size={15} /><input aria-label={t(`Search ${definition.title}`)} placeholder={t(`Search ${definition.title.toLowerCase()}...`)} value={query} onChange={(event) => setQuery(event.target.value)} /></div><select aria-label={t('Filter records')} value={filter} onChange={(event) => setFilter(event.target.value)}><option value="All">{t('All')}</option><option value="Active">{t('Active')}</option><option value="Draft">{t('Draft')}</option><option value="Pending">{t('Pending')}</option><option value="Review">{t('Review')}</option><option value="Published">{t('Published')}</option></select><Button variant="outline" onClick={() => notify('Export file is preview-only; no file was created.')}><Download size={14} /> Export preview</Button></div>
    <div className="advanced-actions module-action-list">{definition.actions.map((label) => <Button variant="outline" key={label} onClick={() => action(label)}><Plus size={13} />{t(label)}</Button>)}</div>
    {formAction && <div className="advanced-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormAction('') }}><form className="advanced-dialog" role="dialog" aria-modal="true" aria-labelledby="advanced-dialog-title" onSubmit={submitAction}><div className="module-toolbar"><h2 id="advanced-dialog-title">{formTitle}</h2><button type="button" aria-label="Close dialog" onClick={() => setFormAction('')}><X size={17} /></button></div>
      {module === 'products' && formAction === 'Add product' && <><label>Product name<input name="name" required maxLength={100} placeholder="e.g. Handwoven Cotton Panjabi" /></label><label>Category<select name="detail" defaultValue="Fashion · Bangladesh"><option>Fashion · Bangladesh</option><option>Home & Living · Bangladesh</option><option>Food & Grocery · Bangladesh</option><option>Accessories · Bangladesh</option></select></label><div className="advanced-form"><label>Price (BDT)<input name="price" type="number" min="0" required defaultValue="0" /></label><label>SKU<input name="sku" placeholder="Store-managed identifier" /></label></div><label>Product description<textarea name="description" rows={3} placeholder="Materials, care and product details" /></label><label>Product images<input name="media" type="file" accept="image/*,video/*" multiple onChange={() => notify('Product media selected for local preview; files are not uploaded.')} /></label><small>Product identity, stock and publishing are sample-only.</small></>}
      {module === 'products' && formAction === 'Edit selected' && <><label>Choose a listing<select name="name" required>{records.map((record) => <option key={record.name} value={record.name}>{record.name}</option>)}</select></label><label>Updated price (BDT)<input name="price" type="number" min="0" defaultValue="1000" /></label><label>Status<select name="detail"><option>Published</option><option>Draft</option><option>Inactive</option></select></label></>}
      {module === 'products' && formAction === 'Import CSV preview' && <><label>CSV file<input name="file" type="file" accept=".csv,text/csv" required onChange={async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        try {
          if (file.size > 2_000_000) throw new Error('Choose a CSV smaller than 2 MB for this local preview.')
          const parsed = parseCsv(await file.text())
          if (parsed.length < 2 || parsed[0].length < 2) throw new Error('CSV needs a header row and at least one data row.')
          setCsvData(parsed)
          setCsvFileName(file.name)
          setCsvError('')
        } catch (error) {
          setCsvData([])
          setCsvFileName('')
          const message = error instanceof Error ? error.message : 'CSV could not be read.'
          setCsvError(message)
          notify(message)
        }
      }} /></label>{csvData.length > 0 && <><div className="column-mapping"><b>Map columns · {csvFileName} · {csvData.length - 1} rows</b>{[['Product name', 'name'], ['Price (BDT)', 'price'], ['Category', 'category'], ['Stock quantity', 'stock']].map(([label, key]) => {
        const suggested = csvData[0].findIndex((header) => key === 'name' ? /name|product|title/i.test(header) : key === 'price' ? /price|bdt|amount/i.test(header) : key === 'category' ? /category|type/i.test(header) : /stock|quantity|inventory/i.test(header))
        return <label key={key}>{label}<select name={`map_${key}`} defaultValue={suggested < 0 ? '' : String(suggested)}><option value="">Not mapped</option>{csvData[0].map((header, index) => <option value={index} key={`${header}-${index}`}>{header || `Column ${index + 1}`}</option>)}</select></label>
      })}</div><div className="csv-validation-preview"><b>Local validation preview</b>{csvData.slice(1, 4).map((row, index) => <span key={index}><b>Row {index + 2}</b><small>{row.join(' · ') || 'Empty row'}</small></span>)}{csvData.length > 4 && <small>+ {csvData.length - 4} more rows will be checked when validated.</small>}</div></>}{csvError && <p className="field-error" role="alert">{csvError}</p>}<div className="honest-demo-note">The selected file is read and validated in this browser only. Validation does not import, publish or upload products.</div></>}
      {module === 'inventory' && formAction === 'Adjust stock' && <><label>Product<select name="product">{records.map((record) => <option key={record.name}>{record.name.split(' · ')[0]}</option>)}</select></label><label>New quantity<input name="quantity" type="number" min="0" required defaultValue="8" /></label><label>Reason<select name="detail"><option>Cycle count</option><option>Received supplier goods</option><option>Damaged stock</option><option>Manual correction</option></select></label></>}
      {module === 'inventory' && formAction === 'Transfer warehouse' && <><label>Product<select name="name">{records.map((record) => <option key={record.name}>{record.name.split(' · ')[0]}</option>)}</select></label><label>Transfer quantity<input name="detail" type="number" min="1" defaultValue="1" /></label><label>Destination warehouse<select name="amount"><option>Dhaka Central</option><option>Dhamrai Workshop</option><option>Chawkbazar Branch</option></select></label></>}
      {module === 'inventory' && formAction === 'Receive purchase order' && <><label>Product name<input name="name" required placeholder="e.g. Cotton Panjabi" /></label><label>Quantity received<input name="quantity" type="number" min="1" required defaultValue="1" /></label><label>Destination warehouse<select name="location"><option>Dhaka Central</option><option>Dhamrai Workshop</option><option>Chawkbazar Branch</option></select></label></>}
      {module === 'catalog' && formAction === 'Match by barcode' && <label>Barcode or product identity<input name="barcode" required placeholder="Enter a sample barcode or model" /></label>}
      {module === 'catalog' && ['Category suggestion', 'Duplicate review', 'Search catalog'].includes(formAction) && <><label>Product identity<input name="name" required placeholder="Name, model, size or brand" /></label><div className="preview-result"><Pill tone="preview">Suggested match</Pill><p>Compare brand, model, barcode, weight and size before selecting. Suggestions are illustrative and do not block a listing.</p></div></>}
      {module === 'crm' && formAction === 'Add customer note' && <><label>Customer<select name="name">{records.map((record) => <option key={record.name}>{record.name}</option>)}</select></label><label>Private team note<textarea name="detail" rows={3} required placeholder="Add local CRM context" /></label></>}
      {!['products', 'inventory', 'catalog', 'crm'].includes(module) && <><label>Draft name<input name="name" required maxLength={100} placeholder={`New ${definition.section.toLowerCase()} item`} /></label><label>Details<input name="detail" placeholder="Add a short description" /></label></>}
      <div className="advanced-actions"><Pill tone="demo">Local preview only</Pill><Button type="button" variant="outline" onClick={() => setFormAction('')}>Cancel</Button><Button type="submit" disabled={formAction === 'Import CSV preview' && csvData.length < 2}>{formAction === 'Import CSV preview' ? 'Validate preview' : 'Save preview'}</Button></div>
    </form></div>}
    <div className="advanced-table">{shown.map((row, index) => {
      const localize = (value: string) => module === 'audit'
        ? value
          .replace('Campaign draft reviewed', t('Campaign draft reviewed'))
          .replace('Merchant profile opened', t('Merchant profile opened'))
          .replace('Permission matrix viewed', t('Permission matrix viewed'))
          .replace('Admin', t('Admin'))
          .replace('Staff', t('Staff'))
          .replace('Campaigns', t('Campaigns'))
          .replace('Merchant', t('Merchant'))
          .replace('Governance', t('Governance'))
        : t(value)
      return <div className="advanced-row" key={`${row.name}-${index}`}><span><b>{localize(row.name)}</b><small>{localize(row.detail)}</small></span><b>{localize(row.amount)}</b><Pill tone={row.status}>{t(row.status)}</Pill><button className="row-action" onClick={() => notify(`${row.name}: details opened in demo preview.`)}>{t('Details')}</button><button className="row-action" onClick={() => { const rowIndex = records.indexOf(row); setRecords((current) => current.map((item, currentIndex) => currentIndex === rowIndex ? { ...item, status: item.status === 'Archived' ? 'Active' : 'Archived' } : item)) }}>{t('Archive')}</button></div>
    })}{!shown.length && <EmptyState title="No matching records" description="Try another search or clear the current filter." />}</div>
    <div className="honest-demo-note"><Sparkles size={14} />{t('Sample records only. Actions update this local view; they do not publish, message customers, or alter verified business records.')}</div>
  </div>
}

export function MerchantAdvancedModule({ module }: { module: string }) {
  return <>{module === 'onboarding' ? <MerchantOnboarding /> : module === 'storebuilder' ? <StoreBuilder /> : module === 'accounting' ? <Accounting /> : <ModuleRecords key={module} module={module} />}</>
}

export function WorkspaceAdvancedModule({ module }: { module: string }) {
  return <ModuleRecords key={module} module={module} />
}

export function MerchantOverviewExtras() {
  const { notify } = useAppStore()
  return <section className="merchant-overview-extras">
    <article className="merchant-health-card"><span className="section-overline">DAILY BUSINESS SUMMARY · DEMO</span><strong>82<span>/100</span></strong><b>Business health</b><p>Sample signals combine fulfillment, customer ratings and stock status.</p><div className="health-meter"><span /></div></article>
    <article className="merchant-overview-card"><div className="module-toolbar"><b>Inventory signals</b><Link to="/merchant/inventory">View inventory <ArrowRight size={13} /></Link></div><div><span>Low stock · Terracotta Vase</span><Pill tone="review">4 units</Pill></div><div><span>Reorder suggestion · Jamdani Saree</span><Pill tone="preview">7 days</Pill></div><Button variant="outline" onClick={() => notify('Inventory summary refreshed locally from demo data.')}>Review stock alerts</Button></article>
    <article className="merchant-overview-card"><div className="module-toolbar"><b>Operations snapshot</b><Pill tone="demo">Illustrative</Pill></div><div><span>Pending orders</span><b>08</b></div><div><span>Returns under review</span><b>02</b></div><div><span>Store rating</span><b>★ 4.9 · 128 reviews</b></div><div><span>Commission summary</span><b>৳12,480 sample</b></div><div><span>Courier settlement</span><b>৳18,400 pending</b></div></article>
    <article className="merchant-overview-card merchant-summary-card"><div className="module-toolbar"><b>Growth & customer pulse</b><Pill tone="preview">Demo data</Pill></div><div><span>Product revenue · 7 days</span><b>৳2,84,300</b></div><div><span>Campaign performance</span><b>1.8K sample visits</b></div><div><span>Repeat customers</span><b>34% illustrative</b></div><Button variant="outline" onClick={() => notify('Daily summary is an illustrative merchant insight, not verified reporting.')}>Open daily summary</Button></article>
  </section>
}

const aiTools = [
  'Product description', 'Product categorization', 'Duplicate listing check', 'Image recognition search',
  'Sales forecast', 'Stock prediction', 'Price recommendation', 'Fraud alert review',
  'Customer support assistant', 'Bengali / English assistant', 'Merchant daily summary',
  'Shopping assistant', 'Search suggestions', 'Campaign caption', 'Hashtag suggestions',
  'Product image assistance', 'Business insights', 'Market trend summary',
]

export function AiWorkspace() {
  const { notify } = useAppStore()
  const [tool, setTool] = useState(aiTools[0])
  const [input, setInput] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [imageName, setImageName] = useState('')
  const mockSuggestion = useMemo(() => {
    const subject = input.trim() || 'your selected product'
    if (tool.includes('description')) return `${subject} — thoughtfully crafted in Bangladesh with careful attention to quality, materials and everyday use. Review details and verify every product claim before publishing.`
    if (tool.includes('categorization')) return `Suggested category: ${subject.toLowerCase().includes('vase') ? 'Home & Living · Decor' : 'Fashion · Local artisan'}. Confidence preview: 87%. Review before applying.`
    if (tool.includes('Duplicate')) return `Possible catalog match: ${subject}. Name and category appear similar in sample data. Compare model, size, barcode and weight before deciding; no listing is blocked.`
    if (tool.includes('forecast') || tool.includes('prediction')) return `Illustrative trend for ${subject}: monitor recent demand and stock cover; no prediction is verified. Review sample assumptions before making a decision.`
    if (tool.includes('caption')) return `Made with care, found close to home ✨ Discover ${subject} from a local Bangladeshi maker. #LocalMakers #MadeInBangladesh`
    if (tool.includes('Hashtag')) return `Suggested tags for ${subject}: #MadeInBangladesh #LocalMakers #Handcrafted #SmallBusinessBD #NAHORA. Review relevance before sharing.`
    if (tool.includes('Bengali')) return `English: Explore ${subject}, thoughtfully made by a local Bangladeshi business.\nবাংলা: ${subject} দেখুন—বাংলাদেশের স্থানীয় উদ্যোক্তার যত্নে তৈরি।`
    if (tool.includes('Image recognition')) return `Image-search preview for ${imageName || subject}: proposed catalog matches are based on mock product descriptions only. No image is uploaded or analyzed.`
    if (tool.includes('Product image')) return `Image assistance preview for ${imageName || subject}: suggested square crop, neutral background and alternate gallery order. No image was edited.`
    if (tool.includes('fraud')) return `Review queue suggestion for ${subject}: verify order consistency and customer context manually. Never auto-reject, suspend or change a financial record.`
    if (tool.includes('Customer support')) return `Suggested reply about ${subject}: "Thanks for reaching out. We will review the order details and share an update shortly." Please verify the customer's actual context before sending.`
    return `Suggested next step for ${subject}: check the latest sample product, order and customer context, then decide manually. This generated mock output is not a verified insight.`
  }, [imageName, input, tool])
  const copy = async () => {
    try { await navigator.clipboard.writeText(suggestion); notify('Suggestion copied to clipboard.') }
    catch { notify('Clipboard is unavailable; select and copy the preview text manually.') }
  }
  return <div className="public-page content-wrap"><Breadcrumbs parts={['AI workspaces']} /><PageHeader eyebrow="REVIEWABLE MOCK OUTPUTS" title="AI experience studio" description="Frontend-only assistant concepts. Outputs are suggestions for human review, never automated decisions." actions={<Pill tone="preview">Mock suggestions</Pill>} /><div className="ai-layout"><aside className="ai-tool-list"><span className="section-overline">TOOLS</span>{aiTools.map((item) => <button className={tool === item ? 'active' : ''} key={item} onClick={() => { setTool(item); setSuggestion('') }}><WandSparkles size={14} />{item}</button>)}</aside><section className="advanced-panel ai-workspace"><span className="ai-mark"><Sparkles size={17} /> MOCK ASSISTANT</span><h2>{tool}</h2><p>Describe a product, question, campaign or business signal. The demo creates a sample suggestion locally.</p><label>Context<input value={input} onChange={(event) => setInput(event.target.value)} placeholder="e.g. Handwoven Jamdani saree in indigo" /></label>{(tool.toLowerCase().includes('image') || tool.toLowerCase().includes('recognition')) && <label>Image file preview<input type="file" accept="image/*" onChange={(event) => setImageName(event.target.files?.[0]?.name || '')} /><small>{imageName ? `${imageName} · local selection only` : 'Image stays on this device and is not analyzed or uploaded.'}</small></label>}<div className="ai-actions"><Button onClick={() => setSuggestion(mockSuggestion)}>Generate suggestion <WandSparkles size={15} /></Button><Button variant="outline" onClick={() => { setInput(''); setImageName(''); setSuggestion('') }}>Clear</Button></div>{suggestion && <div className="preview-result"><Pill tone="preview">Review before using</Pill><p>{suggestion}</p><div className="advanced-actions"><Button variant="outline" onClick={() => void copy()}><Copy size={14} /> Copy</Button><Button variant="outline" onClick={() => notify('Suggestion marked for manual review; no change was applied.')}>Keep for review</Button><Button variant="ghost" onClick={() => setSuggestion('')}>Discard</Button></div></div>}<div className="honest-demo-note"><ShieldCheck size={15} /> AI does not approve refunds, suspend accounts, alter prices or change financial records.</div></section></div></div>
}

type Notice = { id: number; category: string; title: string; detail: string; time: string; read: boolean }
const initialNotices: Notice[] = [
  { id: 1, category: 'Orders', title: 'A new order is ready for review', detail: 'Order NH-2048 · illustrative demo order', time: '10 min ago', read: false },
  { id: 2, category: 'Messages', title: 'Rongdhonu Boutique replied', detail: 'Conversation preview · no message was sent', time: '32 min ago', read: false },
  { id: 3, category: 'Inventory', title: 'Low stock suggestion', detail: 'Terracotta Vase · 4 sample units remain', time: '1 hour ago', read: true },
  { id: 4, category: 'Campaigns', title: 'Campaign draft needs review', detail: 'Festive artisan edit · preview only', time: 'Yesterday', read: true },
  { id: 5, category: 'Security', title: 'Demo account preferences updated', detail: 'No account data was transmitted', time: 'Yesterday', read: true },
  { id: 6, category: 'Reviews', title: 'A new product review was received', detail: 'Handwoven Jamdani Saree · sample review', time: 'Yesterday', read: true },
  { id: 7, category: 'Store activity', title: 'Store profile preview updated', detail: 'Rongdhonu Boutique · local demo state', time: 'Yesterday', read: true },
  { id: 8, category: 'Financial summaries', title: 'Settlement summary is ready', detail: 'BDT totals are illustrative only', time: 'Nov 01', read: true },
  { id: 9, category: 'Marketing', title: 'Your content calendar has a draft', detail: 'No campaign was published', time: 'Nov 01', read: true },
  { id: 10, category: 'Courier', title: 'Sample parcel status changed', detail: 'NH-2841 · tracking is not live', time: 'Oct 31', read: true },
  { id: 11, category: 'Support', title: 'Support case needs a review', detail: 'Demo queue · no real customer data', time: 'Oct 30', read: true },
  { id: 12, category: 'Platform announcements', title: 'Welcome to the NAHORA preview', detail: 'Marketplace announcement sample', time: 'Oct 29', read: true },
]

export function NotificationCenter() {
  const { notify } = useAppStore()
  const [notices, setNotices] = useState<Notice[]>(() => {
    try {
      const saved = localStorage.getItem('nahora-demo-notifications')
      if (!saved) return initialNotices
      const parsed: unknown = JSON.parse(saved)
      return Array.isArray(parsed) && parsed.every((notice) => typeof notice.id === 'number' && typeof notice.category === 'string' && typeof notice.title === 'string' && typeof notice.detail === 'string' && typeof notice.time === 'string' && typeof notice.read === 'boolean')
        ? parsed as Notice[]
        : initialNotices
    } catch {
      return initialNotices
    }
  })
  const [category, setCategory] = useState('All')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const categories = ['All', ...Array.from(new Set(initialNotices.map((notice) => notice.category)))]
  const filtered = notices.filter((notice) => (category === 'All' || notice.category === category) && (!unreadOnly || !notice.read))
  const updateNotices = (update: (current: Notice[]) => Notice[]) => setNotices((current) => {
    const next = update(current)
    localStorage.setItem('nahora-demo-notifications', JSON.stringify(next))
    return next
  })
  return <div className="public-page content-wrap"><Breadcrumbs parts={['Notifications']} /><PageHeader eyebrow="UNIFIED ACTIVITY" title="Notification center" description="Review sample activity across shopping and workspaces. All entries are demo records." actions={<Pill tone="demo">{notices.filter((notice) => !notice.read).length} unread</Pill>} /><section className="advanced-panel"><div className="module-toolbar notification-toolbar"><div className="filter-chips">{categories.map((item) => <button key={item} className={`filter-chip ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="notification-unread"><input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} /> Unread only</label><Button variant="outline" onClick={() => { updateNotices((current) => current.map((notice) => ({ ...notice, read: true }))); notify('All sample notifications marked as read.') }}>Mark all as read</Button></div>{filtered.map((notice) => <button type="button" className={`notice-row ${notice.read ? '' : 'unread'}`} key={notice.id} onClick={() => updateNotices((current) => current.map((item) => item.id === notice.id ? { ...item, read: true } : item))}><span className="notice-icon"><Bell size={16} /></span><span><Pill tone={notice.category}>{notice.category}</Pill><b>{notice.title}</b><small>{notice.detail}</small></span><time>{notice.time}</time>{!notice.read && <i aria-label="Unread" />}</button>)}{!filtered.length && <EmptyState title="No notifications here" description="When demo activity appears, it will show in this filtered list." />}<div className="honest-demo-note">Notification actions only change local read state. Preferences can be managed in <Link to="/notifications">notification settings</Link>.</div></section></div>
}

const accessibilityOptions = [
  { key: 'larger-text', label: 'Larger text', detail: 'Increase interface text size.' },
  { key: 'reduced-motion', label: 'Reduced motion', detail: 'Reduce animation and transition effects.' },
  { key: 'high-contrast', label: 'High contrast', detail: 'Increase borders and text contrast.' },
  { key: 'keyboard-navigation', label: 'Keyboard navigation', detail: 'Keep stronger keyboard focus outlines visible.' },
] as const

export function AccessibilitySettings() {
  const { notify } = useAppStore()
  const [preferences, setPreferences] = useState<Record<string, boolean>>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem('nahora-accessibility') || '{}')
      return parsed && typeof parsed === 'object' ? parsed as Record<string, boolean> : {}
    } catch {
      return {}
    }
  })
  useEffect(() => {
    const root = document.documentElement
    for (const option of accessibilityOptions) root.classList.toggle(`a11y-${option.key}`, Boolean(preferences[option.key]))
    localStorage.setItem('nahora-accessibility', JSON.stringify(preferences))
  }, [preferences])
  return <section className="advanced-panel accessibility-panel"><div className="settings-list">{accessibilityOptions.map((option) => <label className="setting-row" key={option.key}><span><b>{option.label}</b><small>{option.detail}</small></span><input type="checkbox" checked={Boolean(preferences[option.key])} onChange={(event) => { setPreferences((current) => ({ ...current, [option.key]: event.target.checked })); notify(`${option.label} applied to this browser preview.`) }} /></label>)}</div><Button variant="outline" onClick={() => { setPreferences({}); notify('Accessibility preferences reset for this browser.') }}>Reset accessibility preferences</Button><div className="honest-demo-note"><ShieldCheck size={15} /> Preferences are applied to this browser only. Screen-reader and contrast checks should still be verified per page.</div></section>
}

const searchRecords = [
  ...products.map((product) => ({ kind: 'Product', name: product.name, detail: `${product.store} · ${product.location}`, to: `/product/${product.id}` })),
  ...stores.map((store, index) => ({ kind: 'Store', name: store.name, detail: `${store.type} · ${store.location}`, to: `/stores/${index + 1}` })),
  ...[['Samira Ahmed', 'Customer · Dhaka · sample profile'], ['Nafis Rahman', 'Customer · Chattogram · sample history']].map(([name, detail]) => ({ kind: 'Customer', name, detail, to: '/admin/customers' })),
  ...demoRows.map((row) => ({ kind: 'Order', name: `Order ${row.id}`, detail: `${row.title} · ${row.status}`, to: '/orders' })),
  ...[
    ['Campaigns', 'Advertiser campaigns', '/advertiser/campaigns'], ['Reports', 'Marketplace analytics', '/admin/analytics'],
    ['Conversations', 'Buyer & merchant inbox', '/inbox'], ['Help articles', 'NAHORA Help Center', '/help'],
    ['Inventory', 'Merchant inventory and warehouse', '/merchant/inventory'], ['Accounting', 'Merchant accounting', '/merchant/accounting'],
    ['AI tools', 'AI experience studio', '/ai'], ['Notification center', 'All workspace notifications', '/notifications-center'],
  ].map(([kind, name, to]) => ({ kind, name, detail: 'Workspace navigation', to })),
]

export function UniversalSearch() {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('All')
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('nahora-search-history') || '[]') as string[] }
    catch { return [] }
  })
  const results = searchRecords.filter((record) => (kind === 'All' || record.kind === kind) && `${record.name} ${record.detail}`.toLowerCase().includes(query.toLowerCase()))
  const kinds = ['All', ...Array.from(new Set(searchRecords.map((record) => record.kind)))]
  const remember = (term: string) => {
    const updated = [term, ...history.filter((item) => item !== term)].slice(0, 6)
    setHistory(updated)
    localStorage.setItem('nahora-search-history', JSON.stringify(updated))
  }
  return <div className="public-page content-wrap"><Breadcrumbs parts={['Universal search']} /><PageHeader eyebrow="SEARCH ACROSS NAHORA" title="Universal search" description="Find demo products, stores, customers, orders, campaigns, conversations, reports and workspace pages." actions={<Pill tone="preview">Local index</Pill>} /><section className="advanced-panel"><div className="universal-search-input"><Search size={19} /><input autoFocus aria-label="Search all NAHORA" placeholder="Search products, stores, orders, campaigns..." value={query} onKeyDown={(event) => { if (event.key === 'Enter' && query.trim()) remember(query.trim()) }} onChange={(event) => setQuery(event.target.value)} /><kbd>Ctrl K</kbd></div>{!query && history.length > 0 && <div className="search-history"><b>Recent searches</b>{history.map((term) => <button key={term} onClick={() => setQuery(term)}>{term}</button>)}<button onClick={() => { setHistory([]); localStorage.removeItem('nahora-search-history') }}>Clear history</button></div>}<div className="filter-chips search-kind-filters">{kinds.map((item) => <button key={item} className={`filter-chip ${kind === item ? 'active' : ''}`} onClick={() => setKind(item)}>{item}</button>)}</div><div className="universal-results">{results.slice(0, 30).map((result) => <Link className="universal-result" to={result.to} key={`${result.kind}-${result.name}`} onClick={() => query.trim() && remember(query.trim())}><span><Grid2X2 size={16} /></span><span><b>{result.name}</b><small>{result.detail}</small></span><Pill tone="preview">{result.kind}</Pill><ArrowRight size={14} /></Link>)}{!results.length && <EmptyState title="No matching results" description="Try a different search term or result category." />}</div></section></div>
}

export function MobilePreview() {
  const { notify } = useAppStore()
  const [install, setInstall] = useState(false)
  const [offline, setOffline] = useState(false)
  return <div className="public-page content-wrap"><Breadcrumbs parts={['Mobile experience']} /><PageHeader eyebrow="RESPONSIVE EXPERIENCE" title="Mobile app preview" description="Explore app-like navigation and offline/install states. No service worker or real offline mode is active." actions={<Pill tone="preview">PWA concept</Pill>} /><div className="mobile-preview-grid"><section className="advanced-panel"><span className="section-overline">INSTALL EXPERIENCE</span><h2>Add NAHORA to your home screen</h2><p>This UI explains the install experience; your browser may offer its own installation option.</p><Button onClick={() => setInstall(!install)}>{install ? 'Hide install preview' : 'Show install prompt'}</Button>{install && <div className="preview-result"><b>Install NAHORA</b><p>Quick access to local stores, order previews and merchant tools.</p><Button variant="outline" onClick={() => notify('Install prompt preview only. Browser installation was not triggered.')}>Continue preview</Button></div>}</section><section className="advanced-panel"><span className="section-overline">CONNECTION STATUS</span><h2>{offline ? 'Offline state preview' : 'Online preview'}</h2><p>{offline ? 'You are viewing an illustrative offline state. Live data and actions are not available in this concept.' : 'The app is connected to its local frontend preview.'}</p><Button variant="outline" onClick={() => setOffline(!offline)}>{offline ? 'Return to online preview' : 'Preview offline state'}</Button></section></div><nav className="mobile-bottom-nav" aria-label="Mobile preview navigation">{[['Home', '/'], ['Search', '/search'], ['Stores', '/stores'], ['Inbox', '/inbox'], ['Account', '/account']].map(([label, path]) => <Link to={path} key={label}>{label}</Link>)}</nav></div>
}

export function CustomerAdvancedFeature({ title }: { title: string }) {
  const { notify } = useAppStore()
  const [selected, setSelected] = useState('All')
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const rows = title.toLowerCase().includes('subscription')
    ? [['Monthly tea box', 'Mrittika Studio · next sample delivery Nov 15', '৳950 / month', 'Active'], ['Seasonal mango box', 'Bengal Harvest · seasonal plan preview', '৳1,450 / box', 'Paused']]
    : title.toLowerCase().includes('pre-order')
      ? [['Winter handloom panjabi', 'Shobuj Loom · expected dispatch Nov 18', '৳2,250', 'Accepting preview'], ['Nakshi craft collection', 'Jute & Joy · maker production estimate', '৳1,800', 'Preview']]
      : title.toLowerCase().includes('group')
        ? [['Jamdani family set', '3 of 5 buyers · Dhaka delivery group preview', '৳4,250 each', 'Open'], ['Terracotta table set', '8 of 10 buyers · Dhamrai maker', '৳1,050 each', 'Open']]
        : title.toLowerCase().includes('nearby')
          ? stores.map((store) => [store.name, `${store.location} · Open hours are illustrative`, store.type, 'View store'])
          : title.toLowerCase().includes('track')
            ? [['NH-2841 · Rongdhonu Boutique', 'Packed at Mirpur · sample tracking timeline', '৳4,850', 'In transit'], ['NH-2836 · Mrittika Studio', 'Delivered · Oct 30 · sample order', '৳2,250', 'Completed']]
            : title.toLowerCase().includes('share')
              ? [['Product story card', 'Jamdani Saree · 1:1 square preview', 'PNG preview', 'Ready'], ['Store business card', 'Rongdhonu Boutique · QR/link preview', 'Portrait card', 'Ready']]
              : [['Handwoven Jamdani Saree', 'Current ৳4,850 · historical prices are sample data', 'Lowest sample ৳4,500', 'Alert available'], ['Artisan Terracotta Vase', 'Current ৳1,250 · sample price movement', 'Back in stock', 'Alert available']]
  const toggle = (name: string) => {
    setEnabled((current) => ({ ...current, [name]: !current[name] }))
    notify(`${name}: preference updated in this local demo only.`)
  }
  const isAlerts = /alert|price|stock/i.test(title)
  const isReturns = /return|refund|warranty/i.test(title)
  return <section className="advanced-panel">
    {isAlerts && <div className="financial-state-grid"><div><small>Recent sample price</small><b>৳4,500 → ৳4,850</b></div><div><small>Price history range</small><b>Illustrative · 90 days</b></div><div><small>Authenticity QR</small><b>Preview, not verifiable</b></div></div>}
    {isReturns && <div className="feature-toolbar"><p>Select a sample order to request a return, replacement, refund review or warranty claim.</p><Button variant="outline" onClick={() => notify('Request wizard opened as a local preview; nothing was submitted.')}>Start a request</Button></div>}
    {/wishlist|collection/i.test(title) && <div className="filter-chips">{['All', 'Eid favourites', 'Home ideas', 'Gift list'].map((item) => <button key={item} className={`filter-chip ${selected === item ? 'active' : ''}`} onClick={() => setSelected(item)}>{item}</button>)}<Button variant="outline" onClick={() => notify('New wishlist collection created as a local preview.')}>Create collection</Button></div>}
    <div className="advanced-table">{rows.map(([name, detail, amount, status]) => <div className="advanced-row customer-advanced-row" key={name}><span><b>{name}</b><small>{detail}</small></span><b>{amount}</b><Pill tone={status}>{status}</Pill>{isAlerts ? <label className="notification-unread"><input type="checkbox" checked={Boolean(enabled[name])} onChange={() => toggle(name)} /> Notify me</label> : <button className="row-action" onClick={() => toggle(name)}>{enabled[name] ? 'Saved' : isReturns ? 'Request preview' : 'Open preview'}</button>}</div>)}</div>
    {/track|order/i.test(title) && <div className="timeline-preview"><span className="timeline-step done"><i /><b>Order confirmed</b><small>Sample event</small></span><span className="timeline-step done"><i /><b>Packed by store</b><small>Illustrative</small></span><span className="timeline-step done"><i /><b>Courier pickup</b><small>Preview only</small></span><span className="timeline-step"><i /><b>Delivery</b><small>Not verified</small></span></div>}
    {/share/i.test(title) && <div className="advanced-actions">{['Facebook', 'Instagram', 'TikTok', 'WhatsApp', 'YouTube', 'Telegram', 'Pinterest', 'X', 'Email', 'Copy link'].map((platform) => <Button variant="outline" key={platform} onClick={() => notify(`${platform} share preview selected. Direct publishing is unavailable.`)}>{platform}</Button>)}</div>}
    {/group|subscription|pre-order/i.test(title) && <div className="honest-demo-note"><ShieldCheck size={15} /> Group thresholds, fulfillment dates and subscriptions are illustrative; no purchase or recurring order is created.</div>}
    {/nearby/i.test(title) && <button className="map-preview nearby-map" onClick={() => setSelected(selected === 'Map' ? 'List' : 'Map')}>📍 Dhaka map preview · {selected === 'Map' ? 'Show store list' : 'Show map preview'}</button>}
  </section>
}
