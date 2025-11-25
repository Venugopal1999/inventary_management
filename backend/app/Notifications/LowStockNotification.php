<?php

namespace App\Notifications;

use App\Models\LowStockAlert;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LowStockNotification extends Notification
{
    use Queueable;

    protected $alert;

    /**
     * Create a new notification instance.
     */
    public function __construct(LowStockAlert $alert)
    {
        $this->alert = $alert;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $productName = $this->alert->productVariant->product->name ?? 'Unknown Product';
        $sku = $this->alert->productVariant->sku ?? 'N/A';
        $warehouseName = $this->alert->warehouse->name ?? 'Unknown Warehouse';

        $severityColor = match ($this->alert->severity) {
            'critical' => '#dc2626',
            'warning' => '#f59e0b',
            default => '#3b82f6',
        };

        return (new MailMessage)
            ->subject("Low Stock Alert: {$productName} ({$sku})")
            ->greeting('Low Stock Alert')
            ->line("**Product:** {$productName}")
            ->line("**SKU:** {$sku}")
            ->line("**Warehouse:** {$warehouseName}")
            ->line("**Current Qty:** {$this->alert->current_qty}")
            ->line("**Min Qty:** {$this->alert->min_qty}")
            ->line("**Shortage:** {$this->alert->shortage_qty}")
            ->line("**Severity:** <span style=\"color: {$severityColor}; font-weight: bold;\">" . strtoupper($this->alert->severity) . "</span>")
            ->action('View Alert Details', url('/low-stock-alerts'))
            ->line('Please take action to replenish this item.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'alert_id' => $this->alert->id,
            'product_variant_id' => $this->alert->product_variant_id,
            'warehouse_id' => $this->alert->warehouse_id,
            'current_qty' => $this->alert->current_qty,
            'min_qty' => $this->alert->min_qty,
            'shortage_qty' => $this->alert->shortage_qty,
            'severity' => $this->alert->severity,
        ];
    }
}
