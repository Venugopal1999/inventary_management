import React from 'react';
import StockBadge from './StockBadge';
import Badge from './Badge';

/**
 * Example component demonstrating Stock Badge usage.
 * This can be used in product lists, inventory tables, and reports.
 */
const StockBadgeExample = () => {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Stock Badge Examples</h1>

        {/* Stock Badges Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Stock State Badges</h2>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 w-32">In Stock:</span>
              <StockBadge state="in_stock" />
              <StockBadge state="in_stock" showQuantity quantity={150} />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 w-32">Low Stock:</span>
              <StockBadge state="low_stock" />
              <StockBadge state="low_stock" showQuantity quantity={12} />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 w-32">Out of Stock:</span>
              <StockBadge state="out_of_stock" />
              <StockBadge state="out_of_stock" showQuantity quantity={0} />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 w-32">On Order:</span>
              <StockBadge state="on_order" />
              <StockBadge state="on_order" showQuantity quantity={250} />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 w-32">Allocated:</span>
              <StockBadge state="allocated" />
              <StockBadge state="allocated" showQuantity quantity={80} />
            </div>
          </div>
        </div>

        {/* Badge Sizes Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Badge Sizes</h2>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 w-32">Small:</span>
              <StockBadge state="in_stock" size="sm" />
              <StockBadge state="low_stock" size="sm" />
              <StockBadge state="out_of_stock" size="sm" />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 w-32">Medium:</span>
              <StockBadge state="in_stock" size="md" />
              <StockBadge state="low_stock" size="md" />
              <StockBadge state="out_of_stock" size="md" />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 w-32">Large:</span>
              <StockBadge state="in_stock" size="lg" />
              <StockBadge state="low_stock" size="lg" />
              <StockBadge state="out_of_stock" size="lg" />
            </div>
          </div>
        </div>

        {/* General Badge Variants */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">General Badge Variants</h2>

          <div className="flex flex-wrap gap-4">
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="orange">Orange</Badge>
          </div>
        </div>

        {/* Product Table Example */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-800 p-6 pb-4">Example: Product Table with Stock Badges</h2>

          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-900">SKU-001</td>
                <td className="px-6 py-4 text-sm text-gray-900">Widget A</td>
                <td className="px-6 py-4 text-sm text-gray-900">150</td>
                <td className="px-6 py-4"><StockBadge state="in_stock" /></td>
              </tr>
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-900">SKU-002</td>
                <td className="px-6 py-4 text-sm text-gray-900">Widget B</td>
                <td className="px-6 py-4 text-sm text-gray-900">12</td>
                <td className="px-6 py-4"><StockBadge state="low_stock" /></td>
              </tr>
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-900">SKU-003</td>
                <td className="px-6 py-4 text-sm text-gray-900">Widget C</td>
                <td className="px-6 py-4 text-sm text-gray-900">0</td>
                <td className="px-6 py-4"><StockBadge state="out_of_stock" /></td>
              </tr>
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-900">SKU-004</td>
                <td className="px-6 py-4 text-sm text-gray-900">Widget D</td>
                <td className="px-6 py-4 text-sm text-gray-900">250</td>
                <td className="px-6 py-4"><StockBadge state="on_order" /></td>
              </tr>
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-900">SKU-005</td>
                <td className="px-6 py-4 text-sm text-gray-900">Widget E</td>
                <td className="px-6 py-4 text-sm text-gray-900">80</td>
                <td className="px-6 py-4"><StockBadge state="allocated" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Usage Example</h3>
          <pre className="bg-white p-4 rounded border border-blue-300 overflow-x-auto">
            <code className="text-sm text-gray-800">{`import StockBadge from './components/common/StockBadge';

// Basic usage
<StockBadge state="in_stock" />

// With quantity
<StockBadge state="low_stock" showQuantity quantity={12} />

// Different sizes
<StockBadge state="out_of_stock" size="sm" />
<StockBadge state="on_order" size="lg" />`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default StockBadgeExample;
