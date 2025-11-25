<?php

namespace App\Services;

use App\Models\LowStockAlert;
use App\Models\ReorderRule;
use App\Models\StockBalance;
use App\Notifications\LowStockNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class LowStockAlertService
{
    /**
     * Check stock levels and generate alerts for items below reorder point
     */
    public function checkAndGenerateAlerts(?int $warehouseId = null): array
    {
        $query = ReorderRule::where('is_active', true)
            ->with(['productVariant', 'warehouse']);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $rules = $query->get();
        $alerts = [];

        foreach ($rules as $rule) {
            // Get current stock balance
            $balance = StockBalance::where('product_variant_id', $rule->product_variant_id)
                ->where('warehouse_id', $rule->warehouse_id)
                ->first();

            $currentQty = $balance ? $balance->qty_available : 0;

            // Check if below reorder point
            if ($rule->shouldReorder($currentQty)) {
                $alert = $this->createOrUpdateAlert($rule, $currentQty);
                if ($alert) {
                    $alerts[] = $alert;
                }
            } else {
                // Resolve any existing alerts if stock is now above min
                $this->resolveAlertsForRule($rule);
            }
        }

        return $alerts;
    }

    /**
     * Create or update a low stock alert
     */
    protected function createOrUpdateAlert(ReorderRule $rule, float $currentQty): ?LowStockAlert
    {
        // Check if alert already exists and is unresolved
        $existingAlert = LowStockAlert::where('product_variant_id', $rule->product_variant_id)
            ->where('warehouse_id', $rule->warehouse_id)
            ->where('is_resolved', false)
            ->first();

        $shortageQty = $rule->min_qty - $currentQty;
        $severity = $this->calculateSeverity($currentQty, $rule->min_qty);

        if ($existingAlert) {
            // Update existing alert
            $existingAlert->update([
                'current_qty' => $currentQty,
                'shortage_qty' => $shortageQty,
                'severity' => $severity,
            ]);

            return $existingAlert;
        }

        // Create new alert
        return LowStockAlert::create([
            'product_variant_id' => $rule->product_variant_id,
            'warehouse_id' => $rule->warehouse_id,
            'reorder_rule_id' => $rule->id,
            'current_qty' => $currentQty,
            'min_qty' => $rule->min_qty,
            'shortage_qty' => $shortageQty,
            'severity' => $severity,
        ]);
    }

    /**
     * Calculate severity based on stock level
     */
    protected function calculateSeverity(float $currentQty, float $minQty): string
    {
        if ($currentQty <= 0) {
            return 'critical'; // Out of stock
        }

        $percentOfMin = ($currentQty / $minQty) * 100;

        if ($percentOfMin <= 25) {
            return 'critical'; // 25% or less of min qty
        } elseif ($percentOfMin <= 50) {
            return 'warning'; // 26-50% of min qty
        } else {
            return 'info'; // 51-100% of min qty
        }
    }

    /**
     * Resolve alerts for a rule (when stock is replenished)
     */
    protected function resolveAlertsForRule(ReorderRule $rule): void
    {
        LowStockAlert::where('product_variant_id', $rule->product_variant_id)
            ->where('warehouse_id', $rule->warehouse_id)
            ->where('is_resolved', false)
            ->update([
                'is_resolved' => true,
                'resolved_at' => now(),
            ]);
    }

    /**
     * Send alert notifications via email and webhook
     */
    public function sendAlertNotifications(array $alertIds = []): int
    {
        $query = LowStockAlert::with(['productVariant.product', 'warehouse'])
            ->where('notification_sent', false)
            ->where('is_resolved', false);

        if (!empty($alertIds)) {
            $query->whereIn('id', $alertIds);
        }

        $alerts = $query->get();
        $sentCount = 0;

        foreach ($alerts as $alert) {
            try {
                // Send email notification
                $this->sendEmailNotification($alert);

                // Send webhook notification
                $this->sendWebhookNotification($alert);

                // Mark as sent
                $alert->markNotificationSent();

                $sentCount++;
            } catch (\Exception $e) {
                Log::error('Failed to send low stock alert notification', [
                    'alert_id' => $alert->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $sentCount;
    }

    /**
     * Send email notification
     */
    protected function sendEmailNotification(LowStockAlert $alert): void
    {
        // Get notification recipients from config or user preferences
        $recipients = config('inventory.low_stock_alert_emails', []);

        if (empty($recipients)) {
            return;
        }

        Notification::route('mail', $recipients)
            ->notify(new LowStockNotification($alert));
    }

    /**
     * Send webhook notification
     */
    protected function sendWebhookNotification(LowStockAlert $alert): void
    {
        $webhookUrl = config('inventory.low_stock_webhook_url');

        if (!$webhookUrl) {
            return;
        }

        $payload = [
            'event' => 'low_stock_alert',
            'alert_id' => $alert->id,
            'product_variant_id' => $alert->product_variant_id,
            'product_name' => $alert->productVariant->product->name ?? 'Unknown',
            'sku' => $alert->productVariant->sku ?? 'Unknown',
            'warehouse_id' => $alert->warehouse_id,
            'warehouse_name' => $alert->warehouse->name ?? 'Unknown',
            'current_qty' => $alert->current_qty,
            'min_qty' => $alert->min_qty,
            'shortage_qty' => $alert->shortage_qty,
            'severity' => $alert->severity,
            'created_at' => $alert->created_at->toIso8601String(),
        ];

        Http::post($webhookUrl, $payload);
    }

    /**
     * Get summary statistics
     */
    public function getSummary(?int $warehouseId = null): array
    {
        $query = LowStockAlert::where('is_resolved', false);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $total = $query->count();
        $critical = (clone $query)->where('severity', 'critical')->count();
        $warning = (clone $query)->where('severity', 'warning')->count();
        $info = (clone $query)->where('severity', 'info')->count();

        $notificationsPending = (clone $query)->where('notification_sent', false)->count();

        return [
            'total_unresolved' => $total,
            'critical' => $critical,
            'warning' => $warning,
            'info' => $info,
            'notifications_pending' => $notificationsPending,
        ];
    }

    /**
     * Auto-resolve alerts when stock is replenished
     */
    public function autoResolveAlerts(?int $warehouseId = null): int
    {
        $query = LowStockAlert::with(['reorderRule'])
            ->where('is_resolved', false);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $alerts = $query->get();
        $resolvedCount = 0;

        foreach ($alerts as $alert) {
            if (!$alert->reorderRule) {
                continue;
            }

            // Get current stock
            $balance = StockBalance::where('product_variant_id', $alert->product_variant_id)
                ->where('warehouse_id', $alert->warehouse_id)
                ->first();

            $currentQty = $balance ? $balance->qty_available : 0;

            // If stock is now above min, resolve the alert
            if ($currentQty > $alert->min_qty) {
                $alert->resolve();
                $resolvedCount++;
            }
        }

        return $resolvedCount;
    }
}
