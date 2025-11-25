# Inventory Management System - 10 Week Plan

## Project Overview

**Full-stack multi-tenant inventory management web application**

### UI/UX Design Philosophy
The frontend UI will look and feel like **Amazon Seller Central / Amazon.com** with the following characteristics:
- **Clean**: Minimalist design with focus on content over decoration
- **Product-focused**: Product information, inventory data, and actions take center stage
- **Responsive**: Mobile-first approach, works seamlessly on all devices
- **Data-dense**: Efficient use of space to display maximum relevant information without clutter
- **Professional**: Business-grade interface suitable for warehouse and sales teams

### Frontend Technology
- **React** (UI framework)
- **Tailwind CSS** (utility-first styling)
- **Vite** (build tool & dev server)

### Design Inspirations
- Amazon Seller Central dashboard layouts
- Amazon.com product listing grids
- Data tables with filters, sorting, and bulk actions
- Card-based layouts for metrics and quick actions
- Sidebar navigation with collapsible sections
- Top header with search, notifications, and user menu

---

## Core Modules

### Catalog
Products, variants/SKUs, categories, units of measure (UoM), price lists, taxes.

### Warehouses & Bins
Multi‑warehouse, optional bin/zone locations.

### Stock Ledger
Immutable stock movements table (in/out/transfer/adjust). System of record.

### Purchasing
Suppliers, Purchase Orders (PO), Goods Receipts (GRN), Supplier returns.

### Sales & Fulfilment
Customers, Sales Orders (SO), Reservations/allocations, Shipments/Issues, Customer returns (RMA).

### Transfers
Inter‑warehouse stock transfers.

### Counts
Cycle counts & full stock takes with variance adjustments.

### Replenishment
Reorder rules (min/max), low‑stock alerts.

### Reporting
Stock on hand (SOH), valuation (FIFO), movement history, ageing/expiry, top movers, slow movers.

### Integrations
Barcode/QR printing & scanning; optional webhooks/API for POS/Accounting.

---

## Data Model (ERD Outline)

### Master Data

**warehouses**
- id, code, name, address_json, is_active

**locations**
- id, warehouse_id, code, type[bin,zone,bulk], is_pickable

**categories**
- id, name, parent_id

**uoms**
- id, name, symbol, base_ratio

**products**
- id, name, sku_policy[variant|simple], category_id, uom_id, barcode, track_serial, track_batch, shelf_life_days, tax_id, status

**product_variants**
- id, product_id, sku, attributes_json, barcode, reorder_min, reorder_max

**price_lists**
- id, name, currency, tax_inclusive

**price_list_items**
- id, price_list_id, product_variant_id, price

**suppliers**
- id, name, contact_json, terms

**customers**
- id, name, contact_json, terms

### Inventory Control

**inventory_lots**
- id, product_variant_id, lot_no, mfg_date, exp_date, qty_on_hand
- For batch/expiry tracking

**stock_movements**
- id, ts, product_variant_id, warehouse_id, location_id, lot_id, qty_delta, uom_id, unit_cost, ref_type, ref_id, note, user_id
- Types via ref_type: PO, GRN, SO, SHIPMENT, ADJUSTMENT, TRANSFER, COUNT

**stock_reservations**
- id, sales_order_item_id, product_variant_id, warehouse_id, location_id, qty_reserved

**reorder_rules**
- id, product_variant_id, warehouse_id, min_qty, max_qty

### Purchasing

**purchase_orders**
- id, supplier_id, status[draft,approved,ordered,partial,received,closed,cancelled], order_date, expected_date, currency, notes

**po_items**
- id, purchase_order_id, product_variant_id, uom_id, ordered_qty, unit_cost, received_qty

**goods_receipts**
- id, purchase_order_id, received_at, received_by, status

**grn_items**
- id, goods_receipt_id, po_item_id, product_variant_id, lot_id, received_qty, unit_cost

**supplier_returns**
- id, goods_receipt_id, reason, status

### Sales & Fulfilment

**sales_orders**
- id, customer_id, status[draft,confirmed,allocated,shipped,closed,cancelled], order_date, promise_date, currency

**so_items**
- id, sales_order_id, product_variant_id, ordered_qty, allocated_qty, unit_price

**shipments**
- id, sales_order_id, shipped_at, shipped_by, status

**shipment_items**
- id, shipment_id, so_item_id, product_variant_id, lot_id, shipped_qty, unit_cost_fifo_snap

**customer_returns**
- id, shipment_id, reason, status

### Adjustments, Transfers, Counts

**stock_adjustments**
- id, reason[damage,writeoff,found], status, adjusted_at, user_id

**stock_adjustment_items**
- id, stock_adjustment_id, product_variant_id, lot_id, qty_delta, note

**transfers**
- id, from_warehouse_id, to_warehouse_id, status[draft,approved,in_transit,received], requested_at, received_at

**transfer_items**
- id, transfer_id, product_variant_id, lot_id, qty_requested, qty_shipped, qty_received

**stock_counts**
- id, warehouse_id, scope[cycle,full], status[draft,in_progress,reviewed,posted]

**stock_count_items**
- id, stock_count_id, product_variant_id, lot_id, expected_qty, counted_qty, variance

### Indexing Essentials
- product_variants(sku) unique
- Composite indexes on (product_variant_id, warehouse_id), (warehouse_id, location_id)
- stock_movements(product_variant_id, warehouse_id, ts)
- inventory_lots(product_variant_id, exp_date)

---

## Frontend UI Architecture

### Design System (Amazon Seller Central Inspired)

#### Color Palette
- **Primary Dark**: `#232F3E` (Header, navigation, dark elements)
- **Primary Orange**: `#FF9900` (Highlights, primary buttons, badges)
- **Secondary Dark**: `#37475A` (Body text, secondary headers)
- **Background**: `#F3F3F3` (Page background, subtle gray)
- **Card White**: `#FFFFFF` (Content cards, modals)
- **Border Gray**: `#DDD` (Table borders, dividers)
- **Success Green**: `#067D62` (Success states, in-stock badges)
- **Warning Yellow**: `#F0C14B` (Low stock, warnings)
- **Error Red**: `#C45500` (Out of stock, errors)

#### Design Principles
1. **Simple Two-Column Layouts**: Sidebar + main content area
2. **Data-Dense Tables**: Filters, checkboxes, sortable columns, pagination
3. **White Cards on Gray Background**: Rounded corners (rounded-lg), subtle shadows
4. **Minimal Orange Highlights**: Use sparingly for primary actions only
5. **Consistent Spacing**: Tailwind spacing scale (p-4, p-6, gap-4, etc.)
6. **Responsive Breakpoints**: Mobile-first, collapse sidebar on small screens

### Folder Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.jsx       # Main layout wrapper
│   │   ├── Sidebar.jsx               # Collapsible sidebar navigation
│   │   ├── Topbar.jsx                # Top header with scan input
│   │   └── Footer.jsx                # Optional footer
│   ├── common/
│   │   ├── DataTable.jsx             # Reusable data table
│   │   ├── Button.jsx                # Primary/secondary buttons
│   │   ├── Badge.jsx                 # Status badges (in-stock, low, out)
│   │   ├── Card.jsx                  # White content card
│   │   ├── Modal.jsx                 # Confirmation/form modals
│   │   ├── Drawer.jsx                # Side drawer (allocation, filters)
│   │   ├── ScanInput.jsx             # Global barcode scan input
│   │   ├── SearchBar.jsx             # Search with filters
│   │   ├── Pagination.jsx            # Table pagination
│   │   ├── Dropdown.jsx              # Select dropdowns
│   │   └── FileUpload.jsx            # CSV/image upload
│   ├── wizard/
│   │   ├── WizardStepper.jsx         # Multi-step wizard component
│   │   └── StepIndicator.jsx         # Visual step progress
│   └── charts/
│       ├── BarChart.jsx              # Reporting charts
│       └── MetricCard.jsx            # Dashboard metric cards
├── pages/
│   ├── products/
│   │   ├── ProductList.jsx           # Product catalog list
│   │   ├── ProductForm.jsx           # Create/edit product
│   │   └── VariantMatrix.jsx         # Variant grid editor
│   ├── warehouses/
│   │   ├── WarehouseList.jsx         # Warehouse overview
│   │   └── LocationManager.jsx       # Bin/location drag-drop
│   ├── purchasing/
│   │   ├── POList.jsx                # Purchase order list
│   │   ├── POForm.jsx                # Create/edit PO
│   │   └── GRNWizard.jsx             # Goods receiving wizard
│   ├── sales/
│   │   ├── SOList.jsx                # Sales order list
│   │   ├── SOForm.jsx                # Create/edit SO
│   │   ├── AllocateDrawer.jsx        # Stock allocation drawer
│   │   └── ShipmentWizard.jsx        # Pick/pack/ship wizard
│   ├── inventory/
│   │   ├── TransferWizard.jsx        # Inter-warehouse transfer
│   │   ├── CountSession.jsx          # Cycle count interface
│   │   ├── AdjustmentsList.jsx       # Stock adjustments list
│   │   └── AdjustmentForm.jsx        # Create adjustment
│   ├── reports/
│   │   └── ReportsHome.jsx           # Dashboard with canned reports
│   └── settings/
│       ├── SettingsRBAC.jsx          # Roles & permissions
│       └── ReorderRules.jsx          # Reorder threshold config
├── hooks/
│   ├── useAuth.js                    # Authentication hook
│   ├── useApi.js                     # Laravel API calls
│   └── useScan.js                    # Barcode scanning logic
├── utils/
│   ├── api.js                        # Axios instance
│   ├── formatters.js                 # Date, currency formatters
│   └── validators.js                 # Form validation
└── App.jsx                           # Main app with routing
```

### Key Screens & Components Detail

#### 1. ProductList
**Layout**: Topbar + Sidebar + Main content
**Features**:
- Search bar with real-time filtering
- Multi-select filters (category dropdown, status badges, stock state)
- Bulk action buttons (Edit, Delete, Export CSV)
- Import CSV button (top-right, orange)
- Data table with columns: Image, SKU, Name, Category, Stock, Status, Actions
- Checkbox column for bulk selection
- Pagination at bottom

**Tailwind Classes**:
```
- Container: bg-gray-100 min-h-screen
- Card: bg-white rounded-lg shadow p-6
- Table: border border-gray-200 rounded-lg
- Header row: bg-gray-50 text-sm font-semibold text-gray-700
- Data row: hover:bg-gray-50 transition
- Orange button: bg-orange-500 hover:bg-orange-600 text-white
```

#### 2. ProductForm
**Layout**: Two-column form (left: product details, right: image preview)
**Features**:
- Product name, description (textarea)
- Category dropdown (searchable)
- UoM dropdown (Unit of Measure)
- Tax dropdown
- SKU policy toggle (Simple/Variant)
- Variant matrix (if variant: show attributes grid)
- Barcode input + "Generate" button
- Image uploader (drag-drop or click)
- Track serial/batch checkboxes
- Shelf life days input
- Save/Cancel buttons

**Tailwind Classes**:
```
- Form grid: grid grid-cols-2 gap-6
- Input: border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500
- Label: text-sm font-medium text-gray-700 mb-1
- Variant matrix: grid auto-cols table border-collapse
```

#### 3. WarehouseList & LocationManager
**Layout**: Left sidebar (warehouse list), right panel (selected warehouse locations)
**Features**:
- Warehouse cards with name, code, address
- "Add Warehouse" button (top-right)
- Click warehouse → show bins/locations on right
- Drag-and-drop bins to reorder
- Location type badges (Bin, Zone, Bulk)
- "Is Pickable" toggle per location
- Delete/Edit location icons

**Tailwind Classes**:
```
- Warehouse card: border-l-4 border-orange-500 bg-white p-4 cursor-pointer
- Active state: bg-orange-50
- Location grid: grid grid-cols-3 gap-4
- Draggable item: bg-gray-50 border border-dashed border-gray-300 rounded p-3
```

#### 4. POList, POForm, GRNWizard
**POList**:
- Table columns: PO#, Supplier, Order Date, Expected Date, Status, Total, Actions
- Status badges (Draft, Approved, Ordered, Partial, Received, Closed, Cancelled)
- Filter by status, supplier, date range
- "Create PO" button (top-right, orange)

**POForm**:
- Supplier dropdown (searchable)
- Order date & expected date pickers
- Line items table (Product, Variant, UoM, Qty, Unit Cost, Total)
- "Add Item" button
- Currency dropdown
- Notes textarea
- Submit for approval button

**GRNWizard**:
- Step 1: Select PO
- Step 2: Scan/receive items (show expected vs received qty)
- Step 3: Create inventory lots (lot#, mfg date, exp date)
- Step 4: Putaway to bins/locations (dropdown per item)
- Step 5: Review & post
- Stepper at top showing progress

**Tailwind Classes**:
```
- Stepper: flex items-center justify-between mb-8
- Step circle: w-10 h-10 rounded-full bg-gray-200 text-gray-600 (active: bg-orange-500 text-white)
- Step line: flex-1 h-0.5 bg-gray-300 (completed: bg-orange-500)
```

#### 5. SOList, SOForm, AllocateDrawer, ShipmentWizard
**SOList**:
- Table: SO#, Customer, Order Date, Promise Date, Status, Total, Actions
- Status badges (Draft, Confirmed, Allocated, Shipped, Closed, Cancelled)
- "Create SO" button

**SOForm**:
- Customer dropdown
- Order date, promise date
- Line items (Product, Variant, Qty, Unit Price, Total)
- Price list dropdown
- Tax rate input
- "Confirm Order" button → triggers allocation

**AllocateDrawer**:
- Slide-in from right
- Show available stock by warehouse/location
- FEFO/FIFO logic indicator
- Allocate button per line
- Close drawer

**ShipmentWizard**:
- Step 1: Select SO
- Step 2: Pick items (scan to confirm pick)
- Step 3: Pack (enter box dimensions, weight)
- Step 4: Ship (carrier, tracking#, ship date)
- Step 5: Confirm (post movements, close SO if complete)

#### 6. TransferWizard
**Layout**: Multi-step wizard
**Steps**:
1. Select from warehouse
2. Select to warehouse
3. Add items to transfer (Product, Variant, Qty)
4. Review & submit
5. Track in-transit status (visual timeline: Draft → Approved → In Transit → Received)

#### 7. CountSession
**Layout**: Split screen (left: instructions, right: scan input)
**Features**:
- Assign counters (user dropdown)
- Scope selector (Cycle/Full)
- Warehouse selector
- Mobile-friendly scan input (large font)
- Live count table (Expected, Counted, Variance)
- Variance review modal (approve/reject with notes)
- "Post Count" button (supervisor approval required)

#### 8. AdjustmentsList & AdjustmentForm
**AdjustmentsList**:
- Table: Adjustment#, Reason, Date, User, Status, Actions
- Filter by reason (Damage, Write-off, Found)
- Status badges (Draft, Pending Approval, Posted)

**AdjustmentForm**:
- Reason dropdown (required)
- Line items (Product, Variant, Lot, Qty Delta, Note)
- Supervisor approval modal (2-step confirm)
- Post button (creates stock movements)

#### 9. ReportsHome
**Layout**: Dashboard grid (3 columns of metric cards)
**Cards**:
1. **Stock on Hand (SOH)**: Total units, total value, by warehouse
2. **Valuation (FIFO)**: Total inventory value, average cost
3. **Movement History**: Chart showing in/out over time
4. **Expiry Ageing**: Items expiring in 30/60/90 days
5. **Top Movers**: Best-selling SKUs (bar chart)
6. **Slow Movers**: Low-turnover items (table)
7. **Low Stock Alerts**: Items below reorder point (count + link)
8. **On Order**: Total value of pending POs

**Tailwind Classes**:
```
- Grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Metric card: bg-white rounded-lg shadow p-6
- Metric value: text-3xl font-bold text-gray-900
- Metric label: text-sm text-gray-500 mt-1
```

#### 10. SettingsRBAC & ReorderRules
**SettingsRBAC**:
- Tab navigation (Roles, Permissions, Users)
- Roles table (Name, Description, Users Count, Actions)
- Permission matrix (grid: Roles × Permissions with checkboxes)
- Invite user form (email, role dropdown)

**ReorderRules**:
- Table: Product, Variant, Warehouse, Min Qty, Max Qty, Actions
- "Add Rule" button
- Inline edit or modal edit
- Bulk import CSV

### Reusable Components (Tailwind Examples)

#### DashboardLayout
```jsx
<div className="flex h-screen bg-gray-100">
  <Sidebar />
  <div className="flex-1 flex flex-col overflow-hidden">
    <Topbar />
    <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
      {children}
    </main>
  </div>
</div>
```

#### Sidebar
```jsx
<aside className="w-64 bg-[#232F3E] text-white flex-shrink-0">
  <div className="p-4 font-bold text-xl border-b border-gray-700">
    Inventory Pro
  </div>
  <nav className="p-4 space-y-2">
    <a className="block px-4 py-2 rounded hover:bg-[#37475A] transition">
      Dashboard
    </a>
    {/* More nav items */}
  </nav>
</aside>
```

#### Topbar
```jsx
<header className="bg-[#232F3E] text-white shadow-md p-4 flex items-center justify-between">
  <ScanInput />
  <div className="flex items-center space-x-4">
    <NotificationBell />
    <UserMenu />
  </div>
</header>
```

#### DataTable
```jsx
<div className="bg-white rounded-lg shadow overflow-hidden">
  <table className="w-full">
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
          SKU
        </th>
        {/* More headers */}
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      <tr className="hover:bg-gray-50 transition">
        <td className="px-6 py-4 text-sm text-gray-900">SKU-001</td>
      </tr>
    </tbody>
  </table>
  <Pagination />
</div>
```

#### WizardStepper
```jsx
<div className="flex items-center justify-between mb-8">
  {steps.map((step, idx) => (
    <div key={idx} className="flex items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center
        ${idx <= currentStep ? 'bg-[#FF9900] text-white' : 'bg-gray-200 text-gray-600'}`}>
        {idx + 1}
      </div>
      <span className="ml-2 text-sm font-medium">{step.name}</span>
      {idx < steps.length - 1 && (
        <div className={`flex-1 h-0.5 mx-4
          ${idx < currentStep ? 'bg-[#FF9900]' : 'bg-gray-300'}`} />
      )}
    </div>
  ))}
</div>
```

#### ScanInput (Global)
```jsx
<div className="relative">
  <input
    type="text"
    placeholder="Scan barcode or search SKU/Lot/Location..."
    className="w-96 px-4 py-2 rounded-md bg-white text-gray-900
               placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
    onKeyDown={handleScan}
  />
  <MagnifyingGlassIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
</div>
```

### Global Scan Input Logic

**Location**: Top navbar (Topbar component)
**Behavior**:
1. User scans barcode or types SKU/Lot/Location code
2. On Enter, resolve type (check if it's a product SKU, lot number, or location code)
3. Trigger contextual action based on current page:
   - On GRNWizard: Mark item as received
   - On ShipmentWizard: Mark item as picked
   - On CountSession: Increment counted qty
   - On AdjustmentForm: Add item to adjustment
   - On ProductList: Navigate to product detail
4. Show toast notification with resolved item name

**Implementation Note**: Use React Context or global state (Zustand/Redux) to share scan events across components.

### Integration with Laravel API

All components should use:
- Axios for HTTP requests
- Base URL from environment variable (`VITE_API_URL`)
- JWT token in Authorization header
- Consistent error handling (toast notifications)
- Loading states (skeletons or spinners)
- Optimistic updates where appropriate

**Example API Hook**:
```jsx
// hooks/useApi.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useProducts = () => {
  const fetchProducts = async (filters) => {
    const response = await api.get('/api/products', { params: filters });
    return response.data;
  };
  return { fetchProducts };
};
```

### Modular Design Guidelines

1. **Component Independence**: Each component should be self-contained with its own state
2. **Prop-driven**: Pass data and callbacks as props, avoid tight coupling
3. **Tailwind Only**: No Material UI, Bootstrap, or other CSS frameworks
4. **Responsive First**: Use Tailwind breakpoints (sm:, md:, lg:, xl:)
5. **Accessibility**: Add aria-labels, keyboard navigation support
6. **Consistent Spacing**: Use Tailwind spacing scale consistently (p-4, p-6, gap-4)
7. **Dark Mode Ready**: Use Tailwind dark mode classes if needed later

---

## Security & Roles

### Roles
Admin, Purchasing, Warehouse, Sales, Auditor

### Principles
- Least privilege
- Approval gates for PO > threshold
- All destructive actions require reason & 2‑step confirm

### Audit
- stock_movements + model_changes (Laravel Auditing) for create/update/delete on master data

---

## Week‑by‑Week Plan (10 Weeks)

### Week 1 — Foundation & Project Setup
- Create repo; set coding standards (Pint, PHPStan)
- Install Livewire v3 + FluxUI
- Enable Spatie Permissions; seed roles
- (Optional) Set up Stancl Tenancy and tenant switch middleware
- Scaffold core models/migrations for warehouses, locations, categories, uoms, products, product_variants
- Build ProductList & ProductForm (simple SKU/no variants yet)
- CSV import skeleton

**Deliverable**: Running app with auth, basic catalog CRUD

---

### Week 2 — Inventory Ledger & SOH
- Create stock_movements, stock_balances projector/job, inventory_lots (if batch/expiry)
- Implement SOH service (read from balances; fallback to sum for debug)
- UI badges for stock state: In‑stock / Low / Out / On order / Allocated

**Deliverable**: Accurate SOH updates via seeded movements

---

### Week 3 — Purchasing (PO)
- purchase_orders, po_items CRUD; status flow with approvals
- Add supplier master; unit costs on PO items
- PO PDF/email template

**Deliverable**: Approve/issue POs with items

---

### Week 4 — Receiving (GRN) & Putaway
- goods_receipts, grn_items; scan receiving
- Create inventory_lots & stock_movements(+qty) with unit_cost
- Putaway to bins/locations; stock_balances update
- Handle partial receipts & backorder

**Deliverable**: Receive goods, see SOH rise and FIFO layers populated

---

### Week 5 — Sales Orders & Reservations
- sales_orders, so_items
- Confirm to create stock_reservations (by FEFO/FIFO)
- Soft checks for available to promise (ATP)
- Price lists on SO items; taxes (simple rate) & totals

**Deliverable**: SO confirm with allocations visible

---

### Week 6 — Picking/Shipping
- shipments, shipment_items
- Pick/pack/ship wizard with scan
- Post stock_movements(-qty); capture unit_cost_fifo_snap and reduce FIFO layers
- Customer return flow skeleton

**Deliverable**: Shipment reduces SOH, closes SO when complete

---

### Week 7 — Adjustments, Transfers, Counts
- Stock adjustments with reasons; supervisor approval; movements (+/-)
- Inter‑warehouse transfers with in‑transit stage
- Cycle count sessions: expected vs counted; post variances

**Deliverable**: Full inventory control suite

---

### Week 8 — Replenishment & Alerts
- Reorder rules (min/max per warehouse)
- Low‑stock report; email/webhook alerts
- Simple MRP: suggest POs from net requirements (optional)

**Deliverable**: Auto suggestions list; create PO from suggestions

---

### Week 9 — Reporting & Performance
- Canned reports (SOH by warehouse, valuation FIFO, movement history, expiry ageing, top/slow movers)
- Export CSV/XLSX; schedule background report jobs
- Add covering indexes; load test with 500k movements; p95 validation

**Deliverable**: Reports dashboard; documented indexes & SLOs

---

### Week 10 — Hardening & Launch
- RBAC audit; pentest checklist
- Rate limiting on API; logs & alerts
- Data importers (products, opening balances, suppliers/customers)
- Backup/restore drill; staged rollout
- Create admin runbook and user guide

**Deliverable**: Production deployment with monitoring and rollback plan
