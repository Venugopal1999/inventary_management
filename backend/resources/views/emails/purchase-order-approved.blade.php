<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Order Approved</title>
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
            background-color: #067D62;
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
            border-left: 4px solid #067D62;
        }
        .po-details h3 {
            color: #067D62;
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
            background-color: #067D62;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #055A4A;
        }
        .success-badge {
            background-color: #C8E6C9;
            color: #1B5E20;
            padding: 10px 20px;
            border-radius: 5px;
            display: inline-block;
            font-weight: bold;
            margin: 20px 0;
        }
        .next-steps {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .next-steps h4 {
            color: #232F3E;
            margin-top: 0;
        }
        .next-steps ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .next-steps li {
            margin: 8px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>✓ Purchase Order Approved</h1>
    </div>

    <div class="content">
        <p>Hello,</p>

        <p>Good news! Your purchase order has been approved and is ready to be sent to the supplier.</p>

        <center>
            <div class="success-badge">
                ✓ APPROVED
            </div>
        </center>

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
                <strong>Total Amount:</strong> <strong style="color: #067D62; font-size: 18px;">${{ number_format($po->total_amount, 2) }}</strong>
            </div>
            <div class="detail-row">
                <strong>Approved By:</strong> {{ $po->approver->name ?? 'N/A' }}
            </div>
            <div class="detail-row">
                <strong>Approved Date:</strong> {{ $po->approved_date ? $po->approved_date->format('M d, Y') : 'N/A' }}
            </div>
        </div>

        <div class="next-steps">
            <h4>Next Steps:</h4>
            <ul>
                <li>The purchase order is now ready to be sent to the supplier</li>
                <li>Once sent, update the PO status to "Ordered" and include the supplier's reference number</li>
                <li>Monitor the expected delivery date: <strong>{{ $po->expected_date ? $po->expected_date->format('M d, Y') : 'N/A' }}</strong></li>
                <li>Prepare for goods receipt when shipment arrives</li>
            </ul>
        </div>

        <center>
            <a href="{{ config('app.url') }}/purchase-orders/{{ $po->id }}" class="button">
                View Purchase Order
            </a>
            <a href="{{ config('app.url') }}/purchase-orders/{{ $po->id }}/pdf" class="button">
                Download PDF
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
