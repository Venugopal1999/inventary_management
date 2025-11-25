<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateReportJob;
use App\Services\ReportService;
use App\Services\ReportExportService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    protected $reportService;
    protected $exportService;

    public function __construct(ReportService $reportService, ReportExportService $exportService)
    {
        $this->reportService = $reportService;
        $this->exportService = $exportService;
    }

    /**
     * Get list of available reports
     */
    public function index()
    {
        $reports = [
            [
                'id' => 'stock_on_hand',
                'name' => 'Stock on Hand by Warehouse',
                'description' => 'Current inventory levels grouped by warehouse with total quantities and values',
                'category' => 'inventory',
                'icon' => 'warehouse',
                'filters' => ['warehouse_id', 'category_id', 'search'],
                'supports_export' => ['csv', 'xlsx'],
            ],
            [
                'id' => 'inventory_valuation',
                'name' => 'Inventory Valuation (FIFO)',
                'description' => 'Inventory value calculated using FIFO costing method with variance analysis',
                'category' => 'financial',
                'icon' => 'dollar',
                'filters' => ['warehouse_id', 'category_id'],
                'supports_export' => ['csv', 'xlsx'],
            ],
            [
                'id' => 'stock_movement',
                'name' => 'Stock Movement History',
                'description' => 'Detailed audit trail of all stock movements including receipts, shipments, and adjustments',
                'category' => 'inventory',
                'icon' => 'history',
                'filters' => ['warehouse_id', 'product_variant_id', 'ref_type', 'date_from', 'date_to'],
                'supports_export' => ['csv', 'xlsx'],
            ],
            [
                'id' => 'expiry_aging',
                'name' => 'Expiry Aging Report',
                'description' => 'Lot/batch expiry analysis with aging buckets (expired, 30/60/90 days)',
                'category' => 'inventory',
                'icon' => 'clock',
                'filters' => ['warehouse_id', 'days_threshold'],
                'supports_export' => ['csv', 'xlsx'],
            ],
            [
                'id' => 'movers_analysis',
                'name' => 'Top/Slow Movers Analysis',
                'description' => 'Analysis of fast-moving and slow-moving products based on sales velocity',
                'category' => 'analytics',
                'icon' => 'trending',
                'filters' => ['warehouse_id', 'date_from', 'date_to', 'limit'],
                'supports_export' => ['csv', 'xlsx'],
            ],
        ];

        return response()->json([
            'data' => $reports,
        ]);
    }

    /**
     * Stock on Hand by Warehouse Report
     */
    public function stockOnHand(Request $request)
    {
        $filters = $request->only(['warehouse_id', 'category_id', 'search']);
        $report = $this->reportService->getStockOnHandByWarehouse($filters);

        $format = $request->get('format');
        if ($format === 'csv' || $format === 'xlsx') {
            return $this->downloadExport('stock_on_hand', $report, $format);
        }

        return response()->json($report);
    }

    /**
     * Inventory Valuation Report
     */
    public function inventoryValuation(Request $request)
    {
        $filters = $request->only(['warehouse_id', 'category_id']);
        $report = $this->reportService->getInventoryValuation($filters);

        $format = $request->get('format');
        if ($format === 'csv' || $format === 'xlsx') {
            return $this->downloadExport('inventory_valuation', $report, $format);
        }

        return response()->json($report);
    }

    /**
     * Stock Movement History Report
     */
    public function stockMovement(Request $request)
    {
        $filters = $request->only(['warehouse_id', 'product_variant_id', 'ref_type', 'date_from', 'date_to']);
        $report = $this->reportService->getStockMovementHistory($filters);

        $format = $request->get('format');
        if ($format === 'csv' || $format === 'xlsx') {
            return $this->downloadExport('stock_movement', $report, $format);
        }

        return response()->json($report);
    }

    /**
     * Expiry Aging Report
     */
    public function expiryAging(Request $request)
    {
        $filters = $request->only(['warehouse_id', 'days_threshold']);
        $report = $this->reportService->getExpiryAgingReport($filters);

        $format = $request->get('format');
        if ($format === 'csv' || $format === 'xlsx') {
            return $this->downloadExport('expiry_aging', $report, $format);
        }

        return response()->json($report);
    }

    /**
     * Top/Slow Movers Analysis Report
     */
    public function moversAnalysis(Request $request)
    {
        $filters = $request->only(['warehouse_id', 'date_from', 'date_to', 'limit']);
        $report = $this->reportService->getMoversAnalysis($filters);

        $format = $request->get('format');
        if ($format === 'csv' || $format === 'xlsx') {
            return $this->downloadExport('movers_analysis', $report, $format);
        }

        return response()->json($report);
    }

    /**
     * Download export file
     */
    private function downloadExport($reportType, $data, $format)
    {
        if ($format === 'xlsx') {
            $result = $this->exportService->generateXLSX($reportType, $data);
        } else {
            $result = $this->exportService->generateCSV($reportType, $data);
        }

        return response($result['content'], 200)
            ->header('Content-Type', $result['mime_type'])
            ->header('Content-Disposition', 'attachment; filename="' . $result['filename'] . '"');
    }

    /**
     * Get report summary/dashboard
     */
    public function dashboard(Request $request)
    {
        // Quick summary stats for reports dashboard
        $stockOnHand = $this->reportService->getStockOnHandByWarehouse([]);
        $valuation = $this->reportService->getInventoryValuation([]);
        $expiry = $this->reportService->getExpiryAgingReport(['days_threshold' => 90]);
        $movers = $this->reportService->getMoversAnalysis(['limit' => 5]);

        return response()->json([
            'inventory_summary' => [
                'total_skus' => $stockOnHand['summary']['total_skus'] ?? 0,
                'total_qty' => $stockOnHand['summary']['total_qty'] ?? 0,
                'total_value' => $valuation['summary']['total_fifo_value'] ?? 0,
                'warehouses' => $stockOnHand['summary']['total_warehouses'] ?? 0,
            ],
            'expiry_summary' => [
                'expired_lots' => $expiry['summary']['expired_lots'] ?? 0,
                'expiring_30_days' => $expiry['summary']['expiring_30_days'] ?? 0,
                'expiring_60_days' => $expiry['summary']['expiring_60_days'] ?? 0,
                'expiring_90_days' => $expiry['summary']['expiring_90_days'] ?? 0,
                'at_risk_value' => $expiry['summary']['total_at_risk_value'] ?? 0,
                'expired_value' => $expiry['summary']['total_expired_value'] ?? 0,
            ],
            'valuation_summary' => [
                'fifo_value' => $valuation['summary']['total_fifo_value'] ?? 0,
                'standard_value' => $valuation['summary']['total_standard_value'] ?? 0,
                'variance' => $valuation['summary']['total_variance'] ?? 0,
            ],
            'movers_summary' => [
                'top_movers_count' => $movers['summary']['total_top_movers'] ?? 0,
                'slow_movers_count' => $movers['summary']['total_slow_movers'] ?? 0,
                'top_movers_value' => $movers['summary']['top_movers_value'] ?? 0,
                'slow_movers_stock_value' => $movers['summary']['slow_movers_stock_value'] ?? 0,
            ],
        ]);
    }

    /**
     * Schedule a background report generation job
     */
    public function scheduleReport(Request $request)
    {
        $request->validate([
            'report_type' => 'required|string|in:stock_on_hand,inventory_valuation,stock_movement,expiry_aging,movers_analysis',
            'format' => 'required|string|in:csv,xlsx',
            'filters' => 'array',
        ]);

        $reportType = $request->input('report_type');
        $format = $request->input('format');
        $filters = $request->input('filters', []);
        $userId = $request->user()->id;

        // Create and dispatch the job
        $job = new GenerateReportJob($reportType, $filters, $format, $userId);
        $jobId = $job->getJobId();

        dispatch($job);

        return response()->json([
            'success' => true,
            'message' => 'Report generation scheduled',
            'job_id' => $jobId,
            'status_url' => '/api/reports/job-status/' . $jobId,
        ]);
    }

    /**
     * Get job status
     */
    public function jobStatus($jobId)
    {
        $status = Cache::get("report_job_{$jobId}");

        if (!$status) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found or expired',
            ], 404);
        }

        return response()->json($status);
    }

    /**
     * Download generated report from storage
     */
    public function downloadFile($encodedPath)
    {
        $path = base64_decode($encodedPath);

        if (!Storage::exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found',
            ], 404);
        }

        $filename = basename($path);
        $mimeType = str_ends_with($path, '.xlsx')
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv';

        return response(Storage::get($path), 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Get user's recent report jobs
     */
    public function myJobs(Request $request)
    {
        $userId = $request->user()->id;

        // In a production system, you'd query this from a database
        // For now, we return empty since jobs are stored in cache
        return response()->json([
            'data' => [],
            'message' => 'Recent jobs are stored temporarily in cache. Check specific job status using job ID.',
        ]);
    }
}
