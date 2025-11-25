<?php

namespace App\Console\Commands;

use App\Services\LowStockAlertService;
use App\Services\ReplenishmentService;
use Illuminate\Console\Command;

class CheckLowStockCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stock:check-low-stock {--warehouse_id= : Optional warehouse ID to check}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check stock levels and generate low stock alerts and replenishment suggestions';

    protected $lowStockAlertService;
    protected $replenishmentService;

    /**
     * Create a new command instance.
     */
    public function __construct(
        LowStockAlertService $lowStockAlertService,
        ReplenishmentService $replenishmentService
    ) {
        parent::__construct();
        $this->lowStockAlertService = $lowStockAlertService;
        $this->replenishmentService = $replenishmentService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $warehouseId = $this->option('warehouse_id');

        $this->info('Starting low stock check...');

        // Generate low stock alerts
        $this->info('Generating low stock alerts...');
        $alerts = $this->lowStockAlertService->checkAndGenerateAlerts($warehouseId);
        $this->info('Generated ' . count($alerts) . ' low stock alerts.');

        // Generate replenishment suggestions
        $this->info('Generating replenishment suggestions...');
        $suggestions = $this->replenishmentService->generateSuggestions($warehouseId);
        $this->info('Generated ' . count($suggestions) . ' replenishment suggestions.');

        // Send notifications for new alerts
        if (config('inventory.auto_send_low_stock_notifications', false)) {
            $this->info('Sending low stock notifications...');
            $sent = $this->lowStockAlertService->sendAlertNotifications();
            $this->info('Sent ' . $sent . ' notifications.');
        }

        // Auto-resolve alerts where stock is back above minimum
        $this->info('Auto-resolving alerts...');
        $resolved = $this->lowStockAlertService->autoResolveAlerts($warehouseId);
        $this->info('Resolved ' . $resolved . ' alerts.');

        $this->info('Low stock check completed successfully!');

        return Command::SUCCESS;
    }
}
