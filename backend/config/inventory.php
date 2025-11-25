<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Low Stock Alert Configuration
    |--------------------------------------------------------------------------
    |
    | Configure low stock alert notifications and webhooks
    |
    */

    // Email addresses to receive low stock alerts
    'low_stock_alert_emails' => env('LOW_STOCK_ALERT_EMAILS', ''),

    // Webhook URL for low stock alerts
    'low_stock_webhook_url' => env('LOW_STOCK_WEBHOOK_URL', null),

    // Auto-send notifications when alerts are generated
    'auto_send_low_stock_notifications' => env('AUTO_SEND_LOW_STOCK_NOTIFICATIONS', false),

    /*
    |--------------------------------------------------------------------------
    | Replenishment Configuration
    |--------------------------------------------------------------------------
    |
    | Configure replenishment suggestion settings
    |
    */

    // Default lead time in days (when not specified in reorder rule)
    'default_lead_time_days' => env('DEFAULT_LEAD_TIME_DAYS', 7),

    // Auto-create purchase orders from suggestions
    'auto_create_purchase_orders' => env('AUTO_CREATE_PURCHASE_ORDERS', false),

    /*
    |--------------------------------------------------------------------------
    | Stock Check Schedule
    |--------------------------------------------------------------------------
    |
    | Configure how often to check stock levels
    |
    */

    // How often to run stock checks (hourly, daily, etc.)
    'stock_check_frequency' => env('STOCK_CHECK_FREQUENCY', 'hourly'),
];
