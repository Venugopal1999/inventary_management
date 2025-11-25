<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Order Submitted for Approval</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #232F3E;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
        }
        .po-details {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #FF9900;
        }
        .po-details h3 {
            color: #232F3E;
            margin-top: 0;
        }
        .detail-row {
            margin: 10px 0;
        }
        .detail-row strong {
            display: inline-block;
            width: 140px;
            color: #666;
        }
        .button {
            display: inline-block;
            background-color: #FF9900;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #E88B00;
        }
        .items-table {
            width: 100%;
            background-color: white;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .items-table th {
            background-color: #232F3E;
            color: white;
            padding: 10px;
            text-align: left;
        }
        .items-table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #999;
            font-size: 12px;
        }
        .alert {
            background-color: #FFF3CD;
            border-left: 4px solid #FF9900;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Purchase Order Submitted</h1>
    </div>

    <div class="content">
        <p>Hello,</p>

        <p>A new purchase order has been submitted for your approval.</p>

        <div class="po-details">
            <h3>Purchase Order Details</h3>
            <div class="detail-row">
                <strong>PO Number:</strong> {{ $po->po_number }}
            </div>
            <div class="detail-row">
                <strong>Supplier:</strong> {{ $po->supplier->name }}
            </div>
            <div class="detail-row">
                <strong>Order Date:</strong> {{ $po->order_date->format('M d, Y') }}
            </div>
            <div class="detail-row">
                <strong>Expected Date:</strong> {{ $po->expected_date ? $po->expected_date->format('M d, Y') : 'N/A' }}
            </div>
            <div class="detail-row">
                <strong>Warehouse:</strong> {{ $po->warehouse->name }}
            </div>
            <div class="detail-row">
                <strong>Total Amount:</strong> <strong style="color: #FF9900; font-size: 18px;">${{ number_format($po->total_amount, 2) }}</strong>
            </div>
            <div class="detail-row">
                <strong>Created By:</strong> {{ $po->creator->name ?? 'N/A' }}
            </div>
        </div>

        <div class="alert">
            <strong>Action Required:</strong> Please review and approve this purchase order at your earliest convenience.
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th style="text-align: right;">Qty</th>
                    <th style="text-align: right;">Unit Cost</th>
                    <th style="text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($po->items as $item)
                <tr>
                    <td>{{ $item->productVariant->product->name }}</td>
                    <td>{{ $item->productVariant->sku }}</td>
                    <td style="text-align: right;">{{ number_format($item->ordered_qty, 0) }}</td>
                    <td style="text-align: right;">${{ number_format($item->unit_cost, 2) }}</td>
                    <td style="text-align: right;">${{ number_format($item->line_total, 2) }}</td>
                </tr>
                @endforeach
                <tr>
                    <td colspan="4" style="text-align: right; font-weight: bold;">Subtotal:</td>
                    <td style="text-align: right; font-weight: bold;">${{ number_format($po->subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td colspan="4" style="text-align: right; font-weight: bold;">Tax:</td>
                    <td style="text-align: right; font-weight: bold;">${{ number_format($po->tax_amount, 2) }}</td>
                </tr>
                <tr>
                    <td colspan="4" style="text-align: right; font-weight: bold;">Shipping:</td>
                    <td style="text-align: right; font-weight: bold;">${{ number_format($po->shipping_cost, 2) }}</td>
                </tr>
                <tr style="background-color: #f0f0f0;">
                    <td colspan="4" style="text-align: right; font-weight: bold; font-size: 16px;">TOTAL:</td>
                    <td style="text-align: right; font-weight: bold; font-size: 16px; color: #FF9900;">${{ number_format($po->total_amount, 2) }}</td>
                </tr>
            </tbody>
        </table>

        @if($po->notes)
        <div style="background-color: white; padding: 15px; margin: 20px 0;">
            <strong>Notes:</strong><br>
            {{ $po->notes }}
        </div>
        @endif

        <center>
            <a href="{{ config('app.url') }}/purchase-orders/{{ $po->id }}" class="button">
                Review Purchase Order
            </a>
        </center>

        <p style="margin-top: 30px;">
            Thank you,<br>
            <strong>Inventory Management System</strong>
        </p>
    </div>

    <div class="footer">
        <p>This is an automated notification from your Inventory Management System.</p>
        <p>&copy; {{ date('Y') }} Your Company Name. All rights reserved.</p>
    </div>
</body>
</html>
