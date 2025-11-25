import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';
import PurchaseOrdersPage from './pages/purchasing/PurchaseOrdersPage';
import PurchaseOrderFormPage from './pages/purchasing/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from './pages/purchasing/PurchaseOrderDetailPage';
import GRNList from './pages/purchasing/GRNList';
import GRNWizard from './pages/purchasing/GRNWizard';
import GRNDetailPage from './pages/purchasing/GRNDetailPage';
import SOList from './pages/sales/SOList';
import SOForm from './pages/sales/SOForm';
import SODetail from './pages/sales/SODetail';
import ShipmentList from './pages/sales/ShipmentList';
import ShipmentWizard from './pages/sales/ShipmentWizard';
import ShipmentDetails from './pages/sales/ShipmentDetails';
import AdjustmentsList from './pages/inventory/AdjustmentsList';
import AdjustmentForm from './pages/inventory/AdjustmentForm';
import AdjustmentDetail from './pages/inventory/AdjustmentDetail';
import TransferList from './pages/inventory/TransferList';
import TransferWizard from './pages/inventory/TransferWizard';
import TransferDetail from './pages/inventory/TransferDetail';
import CountList from './pages/inventory/CountList';
import CountForm from './pages/inventory/CountForm';
import CountSession from './pages/inventory/CountSession';
import CountDetail from './pages/inventory/CountDetail';
import ReorderRules from './pages/settings/ReorderRules';
import Settings from './pages/settings/Settings';
import ReplenishmentSuggestions from './pages/replenishment/ReplenishmentSuggestions';
import LowStockAlerts from './pages/alerts/LowStockAlerts';
import ReportsHome from './pages/reports/ReportsHome';
import ReportDetail from './pages/reports/ReportDetail';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import StockBadgeExample from './components/common/StockBadgeExample';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route
              path="warehouses"
              element={
                <div className="card">
                  <h1 className="text-2xl font-bold">Warehouses</h1>
                  <p className="text-gray-600 mt-2">Warehouses page coming soon...</p>
                </div>
              }
            />
            <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="purchase-orders/new" element={<PurchaseOrderFormPage />} />
            <Route path="purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
            <Route path="purchase-orders/:id/edit" element={<PurchaseOrderFormPage />} />
            <Route path="goods-receipts" element={<GRNList />} />
            <Route path="goods-receipts/new" element={<GRNWizard />} />
            <Route path="goods-receipts/:id" element={<GRNDetailPage />} />
            <Route path="goods-receipts/:id/edit" element={<GRNWizard />} />
            <Route path="sales-orders" element={<SOList />} />
            <Route path="sales-orders/new" element={<SOForm />} />
            <Route path="sales-orders/:id" element={<SODetail />} />
            <Route path="sales-orders/:id/edit" element={<SOForm />} />
            <Route path="shipments" element={<ShipmentList />} />
            <Route path="shipments/new" element={<ShipmentWizard />} />
            <Route path="shipments/:id" element={<ShipmentDetails />} />
            <Route path="shipments/:id/process" element={<ShipmentWizard />} />
            <Route path="inventory/adjustments" element={<AdjustmentsList />} />
            <Route path="inventory/adjustments/new" element={<AdjustmentForm />} />
            <Route path="inventory/adjustments/:id" element={<AdjustmentDetail />} />
            <Route path="inventory/adjustments/:id/edit" element={<AdjustmentForm />} />
            <Route path="inventory/transfers" element={<TransferList />} />
            <Route path="inventory/transfers/new" element={<TransferWizard />} />
            <Route path="inventory/transfers/:id" element={<TransferDetail />} />
            <Route path="inventory/transfers/:id/edit" element={<TransferWizard />} />
            <Route path="inventory/counts" element={<CountList />} />
            <Route path="inventory/counts/new" element={<CountForm />} />
            <Route path="inventory/counts/:id" element={<CountDetail />} />
            <Route path="inventory/counts/:id/edit" element={<CountForm />} />
            <Route path="inventory/counts/:id/session" element={<CountSession />} />

            {/* Week 8 - Replenishment & Alerts */}
            <Route path="replenishment/suggestions" element={<ReplenishmentSuggestions />} />
            <Route path="alerts/low-stock" element={<LowStockAlerts />} />
            <Route path="settings/reorder-rules" element={<ReorderRules />} />

            {/* Week 9 - Reports & Analytics */}
            <Route path="reports" element={<ReportsHome />} />
            <Route path="reports/:reportId" element={<ReportDetail />} />
            <Route path="settings" element={<Settings />} />
            <Route path="stock-badges" element={<StockBadgeExample />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
