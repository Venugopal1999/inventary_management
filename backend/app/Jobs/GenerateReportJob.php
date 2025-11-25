<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\ReportService;
use App\Services\ReportExportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class GenerateReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes max
    public $tries = 3;

    protected $reportType;
    protected $filters;
    protected $format;
    protected $userId;
    protected $jobId;

    /**
     * Create a new job instance.
     */
    public function __construct(string $reportType, array $filters, string $format, int $userId)
    {
        $this->reportType = $reportType;
        $this->filters = $filters;
        $this->format = $format;
        $this->userId = $userId;
        $this->jobId = uniqid('report_');
    }

    /**
     * Execute the job.
     */
    public function handle(ReportService $reportService, ReportExportService $exportService)
    {
        try {
            // Update job status
            $this->updateStatus('processing', 'Generating report data...');

            // Generate report data based on type
            $data = $this->generateReportData($reportService);

            // Update status
            $this->updateStatus('processing', 'Exporting to ' . strtoupper($this->format) . '...');

            // Export to file
            $filename = $this->reportType . '_' . date('Y-m-d_His') . '.' . $this->format;
            $result = $exportService->saveToStorage($this->format, $this->reportType, $data, $filename);

            // Mark as complete
            $this->updateStatus('completed', 'Report ready for download', [
                'path' => $result['path'],
                'filename' => $result['filename'],
                'size' => $result['size'],
                'download_url' => '/api/reports/download/' . base64_encode($result['path']),
            ]);

            // Send notification email if user has email
            $user = User::find($this->userId);
            if ($user && $user->email) {
                $this->sendNotificationEmail($user, $result);
            }

            Log::info('Report generated successfully', [
                'job_id' => $this->jobId,
                'report_type' => $this->reportType,
                'user_id' => $this->userId,
                'filename' => $result['filename'],
            ]);

        } catch (\Exception $e) {
            $this->updateStatus('failed', $e->getMessage());

            Log::error('Report generation failed', [
                'job_id' => $this->jobId,
                'report_type' => $this->reportType,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Generate report data based on type
     */
    protected function generateReportData(ReportService $reportService)
    {
        switch ($this->reportType) {
            case 'stock_on_hand':
            case 'stock_on_hand_by_warehouse':
                return $reportService->getStockOnHandByWarehouse($this->filters);

            case 'inventory_valuation':
                return $reportService->getInventoryValuation($this->filters);

            case 'stock_movement':
            case 'stock_movement_history':
                return $reportService->getStockMovementHistory($this->filters);

            case 'expiry_aging':
                return $reportService->getExpiryAgingReport($this->filters);

            case 'movers_analysis':
                return $reportService->getMoversAnalysis($this->filters);

            default:
                throw new \Exception("Unknown report type: {$this->reportType}");
        }
    }

    /**
     * Update job status in cache
     */
    protected function updateStatus(string $status, string $message, array $result = [])
    {
        Cache::put("report_job_{$this->jobId}", [
            'job_id' => $this->jobId,
            'report_type' => $this->reportType,
            'status' => $status,
            'message' => $message,
            'result' => $result,
            'user_id' => $this->userId,
            'updated_at' => now()->toIso8601String(),
        ], now()->addHours(24));
    }

    /**
     * Send notification email when report is ready
     */
    protected function sendNotificationEmail(User $user, array $result)
    {
        try {
            // Simple email notification (can be enhanced with a proper Mailable class)
            Mail::raw(
                "Your report '{$this->reportType}' is ready for download.\n\n" .
                "Filename: {$result['filename']}\n" .
                "Size: " . number_format($result['size'] / 1024, 2) . " KB\n\n" .
                "Please log in to download your report.",
                function ($message) use ($user) {
                    $message->to($user->email)
                        ->subject('Your Report is Ready - ' . ucwords(str_replace('_', ' ', $this->reportType)));
                }
            );
        } catch (\Exception $e) {
            Log::warning('Failed to send report notification email', [
                'user_id' => $this->userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get the job ID
     */
    public function getJobId()
    {
        return $this->jobId;
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception)
    {
        $this->updateStatus('failed', 'Report generation failed: ' . $exception->getMessage());

        Log::error('Report job failed', [
            'job_id' => $this->jobId,
            'report_type' => $this->reportType,
            'exception' => $exception->getMessage(),
        ]);
    }
}
