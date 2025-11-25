<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Order - {{ $po->po_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11pt;
            color: #333;
            line-height: 1.5;
            padding: 20px;
        }

        .header {
            border-bottom: 3px solid #FF9900;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }

        .header h1 {
            color: #232F3E;
            font-size: 24pt;
            margin-bottom: 5px;
        }

        .header .po-number {
            color: #FF9900;
            font-size: 18pt;
            font-weight: bold;
        }

        .company-info {
            margin-bottom: 30px;
        }

        .company-info h2 {
            color: #232F3E;
            font-size: 14pt;
            margin-bottom: 5px;
        }

        .two-column {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }

        .column {
            display: table-cell;
            width: 48%;
            vertical-align: top;
        }

        .column.right {
            text-align: right;
        }

        .info-box {
            background-color: #F3F3F3;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 10px;
        }

        .info-box h3 {
            color: #232F3E;
            font-size: 12pt;
            margin-bottom: 8px;
            border-bottom: 1px solid #DDD;
            padding-bottom: 5px;
        }

        .info-box p {
            margin: 4px 0;
            font-size: 10pt;
        }

        .info-box strong {
            display: inline-block;
            width: 120px;
            color: #666;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            margin-bottom: 20px;
        }

        table thead {
            background-color: #232F3E;
            color: white;
        }

        table thead th {
            padding: 10px;
            text-align: left;
            font-weight: bold;
            font-size: 10pt;
        }

        table tbody tr {
            border-bottom: 1px solid #DDD;
        }

        table tbody tr:nth-child(even) {
            background-color: #F9F9F9;
        }

        table tbody td {
            padding: 8px 10px;
            font-size: 10pt;
        }

        table tbody td.number {
            text-align: right;
        }

        .totals {
            float: right;
            width: 300px;
            margin-top: 20px;
        }

        .totals table {
            margin: 0;
        }

        .totals table tr {
            border: none;
        }

        .totals table td {
            padding: 5px 10px;
            border: none;
        }

        .totals table td.label {
            text-align: right;
            font-weight: bold;
            color: #666;
        }

        .totals table td.amount {
            text-align: right;
            width: 120px;
        }

        .totals table tr.total {
            border-top: 2px solid #232F3E;
            font-size: 12pt;
            font-weight: bold;
        }

        .totals table tr.total td {
            color: #232F3E;
            padding-top: 8px;
        }

        .notes {
            clear: both;
            margin-top: 40px;
            padding: 15px;
            background-color: #FFF8E1;
            border-left: 4px solid #FF9900;
        }

        .notes h4 {
            color: #232F3E;
            margin-bottom: 8px;
        }

        .notes p {
            font-size: 10pt;
            color: #666;
        }

        .terms {
            margin-top: 30px;
            padding: 15px;
            border: 1px solid #DDD;
            font-size: 9pt;
            color: #666;
        }

        .terms h4 {
            color: #232F3E;
            margin-bottom: 8px;
            font-size: 11pt;
        }

        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #DDD;
            text-align: center;
            font-size: 9pt;
            color: #999;
        }

        .status-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 4px;
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-draft { background-color: #E0E0E0; color: #666; }
        .status-submitted { background-color: #BBE5F5; color: #0277BD; }
        .status-approved { background-color: #C8E6C9; color: #2E7D32; }
        .status-ordered { background-color: #FFF9C4; color: #F57C00; }
        .status-partial { background-color: #FFCCBC; color: #D84315; }
        .status-received { background-color: #C8E6C9; color: #1B5E20; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PURCHASE ORDER</h1>
        <div class="po-number">{{ $po->po_number }}</div>
        <span class="status-badge status-{{ $po->status }}">{{ ucfirst($po->status) }}</span>
    </div>

    <div class="company-info">
        <h2>Your Company Name</h2>
        <p>123 Business Street, Suite 100<br>
        City, State 12345<br>
        Phone: (555) 123-4567 | Email: orders@yourcompany.com</p>
    </div>

    <div class="two-column">
        <div class="column">
            <div class="info-box">
                <h3>Supplier</h3>
                <p><strong>Name:</strong> {{ $po->supplier->name }}</p>
                <p><strong>Code:</strong> {{ $po->supplier->code }}</p>
                @if($po->supplier->email)
                <p><strong>Email:</strong> {{ $po->supplier->email }}</p>
                @endif
                @if($po->supplier->phone)
                <p><strong>Phone:</strong> {{ $po->supplier->phone }}</p>
                @endif
                @if($po->supplier->formatted_address)
                <p><strong>Address:</strong> {{ $po->supplier->formatted_address }}</p>
                @endif
            </div>
        </div>

        <div class="column right">
            <div class="info-box">
                <h3>Order Details</h3>
                <p><strong>Order Date:</strong> {{ $po->order_date->format('M d, Y') }}</p>
                @if($po->expected_date)
                <p><strong>Expected Date:</strong> {{ $po->expected_date->format('M d, Y') }}</p>
                @endif
                @if($po->approved_date)
                <p><strong>Approved:</strong> {{ $po->approved_date->format('M d, Y') }}</p>
                @endif
                <p><strong>Warehouse:</strong> {{ $po->warehouse->name }}</p>
                <p><strong>Payment Terms:</strong> {{ $po->supplier->payment_terms }}</p>
                <p><strong>Currency:</strong> {{ $po->currency }}</p>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 35%;">Product</th>
                <th style="width: 15%;">SKU</th>
                <th style="width: 10%;">UOM</th>
                <th style="width: 10%;" class="number">Qty</th>
                <th style="width: 10%;" class="number">Unit Cost</th>
                <th style="width: 8%;" class="number">Discount</th>
                <th style="width: 7%;" class="number">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($po->items as $index => $item)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $item->productVariant->product->name }}</td>
                <td>{{ $item->productVariant->sku }}</td>
                <td>{{ $item->uom->symbol }}</td>
                <td class="number">{{ number_format($item->ordered_qty, 2) }}</td>
                <td class="number">${{ number_format($item->unit_cost, 2) }}</td>
                <td class="number">{{ $item->discount_percent > 0 ? $item->discount_percent . '%' : '-' }}</td>
                <td class="number">${{ number_format($item->line_total, 2) }}</td>
            </tr>
            @if($item->notes)
            <tr>
                <td colspan="8" style="font-size: 9pt; color: #666; padding-left: 30px;">
                    Note: {{ $item->notes }}
                </td>
            </tr>
            @endif
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td class="label">Subtotal:</td>
                <td class="amount">${{ number_format($po->subtotal, 2) }}</td>
            </tr>
            <tr>
                <td class="label">Tax:</td>
                <td class="amount">${{ number_format($po->tax_amount, 2) }}</td>
            </tr>
            <tr>
                <td class="label">Shipping:</td>
                <td class="amount">${{ number_format($po->shipping_cost, 2) }}</td>
            </tr>
            <tr class="total">
                <td class="label">TOTAL:</td>
                <td class="amount">${{ number_format($po->total_amount, 2) }}</td>
            </tr>
        </table>
    </div>

    @if($po->notes)
    <div class="notes">
        <h4>Notes</h4>
        <p>{{ $po->notes }}</p>
    </div>
    @endif

    @if($po->terms_and_conditions)
    <div class="terms">
        <h4>Terms and Conditions</h4>
        <p>{{ $po->terms_and_conditions }}</p>
    </div>
    @endif

    <div class="footer">
        <p>Purchase Order generated on {{ now()->format('F d, Y \a\t g:i A') }}</p>
        <p>This is a computer-generated document. No signature is required.</p>
    </div>
</body>
</html>
