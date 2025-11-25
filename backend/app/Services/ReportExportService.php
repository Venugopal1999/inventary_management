<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class ReportExportService
{
    /**
     * Generate XLSX file from report data
     * Uses simple XML-based approach for XLSX (Open XML format)
     */
    public function generateXLSX($reportType, $data, $filename = null)
    {
        $rows = $this->convertToRows($reportType, $data);
        $filename = $filename ?? $reportType . '_' . date('Y-m-d_His') . '.xlsx';

        // Generate XLSX using simple XML approach
        $xlsx = $this->createXLSX($rows, $reportType);

        return [
            'content' => $xlsx,
            'filename' => $filename,
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
    }

    /**
     * Generate CSV file from report data
     */
    public function generateCSV($reportType, $data, $filename = null)
    {
        $rows = $this->convertToRows($reportType, $data);
        $filename = $filename ?? $reportType . '_' . date('Y-m-d_His') . '.csv';

        $output = fopen('php://temp', 'r+');
        foreach ($rows as $row) {
            fputcsv($output, $row);
        }
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return [
            'content' => $csv,
            'filename' => $filename,
            'mime_type' => 'text/csv',
        ];
    }

    /**
     * Convert report data to rows for export
     */
    private function convertToRows($reportType, $data)
    {
        $rows = [];

        switch ($reportType) {
            case 'stock_on_hand':
            case 'stock_on_hand_by_warehouse':
                $rows[] = ['Warehouse', 'Product', 'SKU', 'Barcode', 'Qty On Hand', 'Qty Reserved', 'Qty Available', 'Unit Cost', 'Total Value'];
                if (isset($data['data']) && is_array($data['data'])) {
                    foreach ($data['data'] as $warehouse) {
                        if (isset($warehouse['items']) && is_array($warehouse['items'])) {
                            foreach ($warehouse['items'] as $item) {
                                $rows[] = [
                                    $warehouse['warehouse_name'] ?? '',
                                    $item['product_name'] ?? '',
                                    $item['sku'] ?? '',
                                    $item['barcode'] ?? '',
                                    $item['qty_on_hand'] ?? 0,
                                    $item['qty_reserved'] ?? 0,
                                    $item['qty_available'] ?? 0,
                                    $item['unit_cost'] ?? 0,
                                    $item['total_value'] ?? 0,
                                ];
                            }
                        }
                    }
                }
                break;

            case 'inventory_valuation':
                $rows[] = ['Product', 'SKU', 'Warehouse', 'Qty On Hand', 'Avg Unit Cost', 'Standard Cost', 'FIFO Value', 'Standard Value', 'Variance'];
                if (isset($data['data']) && is_array($data['data'])) {
                    foreach ($data['data'] as $item) {
                        $rows[] = [
                            $item['product_name'] ?? '',
                            $item['sku'] ?? '',
                            $item['warehouse_name'] ?? '',
                            $item['qty_on_hand'] ?? 0,
                            $item['avg_unit_cost'] ?? 0,
                            $item['standard_cost'] ?? 0,
                            $item['fifo_value'] ?? 0,
                            $item['standard_value'] ?? 0,
                            $item['variance'] ?? 0,
                        ];
                    }
                }
                break;

            case 'stock_movement':
            case 'stock_movement_history':
                $rows[] = ['Date', 'Product', 'SKU', 'Warehouse', 'Type', 'Ref ID', 'Direction', 'Qty', 'Unit Cost', 'Total Value', 'User', 'Note'];
                if (isset($data['data']) && is_array($data['data'])) {
                    foreach ($data['data'] as $item) {
                        $rows[] = [
                            $item['date'] ?? '',
                            $item['product_name'] ?? '',
                            $item['sku'] ?? '',
                            $item['warehouse_name'] ?? '',
                            $item['ref_type'] ?? '',
                            $item['ref_id'] ?? '',
                            $item['direction'] ?? '',
                            abs($item['qty_delta'] ?? 0),
                            $item['unit_cost'] ?? 0,
                            $item['total_value'] ?? 0,
                            $item['user'] ?? '',
                            $item['note'] ?? '',
                        ];
                    }
                }
                break;

            case 'expiry_aging':
                $rows[] = ['Aging Bucket', 'Lot No', 'Product', 'SKU', 'Qty On Hand', 'Mfg Date', 'Exp Date', 'Days Until Expiry', 'Unit Cost', 'Total Value'];
                if (isset($data['data']) && is_array($data['data'])) {
                    foreach ($data['data'] as $bucket => $items) {
                        if (is_array($items)) {
                            foreach ($items as $item) {
                                $rows[] = [
                                    str_replace('_', ' ', ucfirst($bucket)),
                                    $item['lot_no'] ?? '',
                                    $item['product_name'] ?? '',
                                    $item['sku'] ?? '',
                                    $item['qty_on_hand'] ?? 0,
                                    $item['mfg_date'] ?? '',
                                    $item['exp_date'] ?? '',
                                    $item['days_until_expiry'] ?? 0,
                                    $item['unit_cost'] ?? 0,
                                    $item['total_value'] ?? 0,
                                ];
                            }
                        }
                    }
                }
                break;

            case 'movers_analysis':
                // Top Movers
                $rows[] = ['TOP MOVERS'];
                $rows[] = ['Product', 'SKU', 'Total Qty Sold', 'Movement Count', 'Total Value', 'Avg Daily Sales'];
                if (isset($data['top_movers']) && is_array($data['top_movers'])) {
                    foreach ($data['top_movers'] as $item) {
                        $rows[] = [
                            $item['product_name'] ?? '',
                            $item['sku'] ?? '',
                            $item['total_qty_sold'] ?? 0,
                            $item['movement_count'] ?? 0,
                            $item['total_value'] ?? 0,
                            $item['avg_daily_sales'] ?? 0,
                        ];
                    }
                }

                $rows[] = []; // Empty row

                // Slow Movers
                $rows[] = ['SLOW MOVERS'];
                $rows[] = ['Product', 'SKU', 'Stock On Hand', 'Qty Sold', 'Movement Count', 'Turnover Rate', 'Stock Value'];
                if (isset($data['slow_movers']) && is_array($data['slow_movers'])) {
                    foreach ($data['slow_movers'] as $item) {
                        $rows[] = [
                            $item['product_name'] ?? '',
                            $item['sku'] ?? '',
                            $item['stock_on_hand'] ?? 0,
                            $item['qty_sold'] ?? 0,
                            $item['movement_count'] ?? 0,
                            $item['turnover_rate'] ?? 0,
                            $item['stock_value'] ?? 0,
                        ];
                    }
                }
                break;

            default:
                $rows[] = ['No data available for this report type'];
        }

        return $rows;
    }

    /**
     * Create XLSX file using simple XML format
     */
    private function createXLSX($rows, $sheetName = 'Report')
    {
        // Create temporary directory for XLSX parts
        $tempDir = sys_get_temp_dir() . '/xlsx_' . uniqid();
        mkdir($tempDir);
        mkdir($tempDir . '/_rels');
        mkdir($tempDir . '/xl');
        mkdir($tempDir . '/xl/_rels');
        mkdir($tempDir . '/xl/worksheets');

        // [Content_Types].xml
        $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
    <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
    <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>';
        file_put_contents($tempDir . '/[Content_Types].xml', $contentTypes);

        // _rels/.rels
        $rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>';
        file_put_contents($tempDir . '/_rels/.rels', $rels);

        // xl/_rels/workbook.xml.rels
        $workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
    <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>';
        file_put_contents($tempDir . '/xl/_rels/workbook.xml.rels', $workbookRels);

        // xl/workbook.xml
        $workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <sheets>
        <sheet name="' . htmlspecialchars(substr($sheetName, 0, 31)) . '" sheetId="1" r:id="rId1"/>
    </sheets>
</workbook>';
        file_put_contents($tempDir . '/xl/workbook.xml', $workbook);

        // xl/styles.xml
        $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <fonts count="2">
        <font><sz val="11"/><name val="Calibri"/></font>
        <font><sz val="11"/><b/><name val="Calibri"/></font>
    </fonts>
    <fills count="3">
        <fill><patternFill patternType="none"/></fill>
        <fill><patternFill patternType="gray125"/></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="FFE0E0E0"/></patternFill></fill>
    </fills>
    <borders count="1">
        <border><left/><right/><top/><bottom/><diagonal/></border>
    </borders>
    <cellStyleXfs count="1">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    </cellStyleXfs>
    <cellXfs count="3">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
        <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
        <xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    </cellXfs>
</styleSheet>';
        file_put_contents($tempDir . '/xl/styles.xml', $styles);

        // Build shared strings and sheet data
        $sharedStrings = [];
        $sharedStringIndex = [];
        $sheetData = '';

        foreach ($rows as $rowIndex => $row) {
            $rowNum = $rowIndex + 1;
            $sheetData .= '<row r="' . $rowNum . '">';

            foreach ($row as $colIndex => $cellValue) {
                $colLetter = $this->getColumnLetter($colIndex);
                $cellRef = $colLetter . $rowNum;

                // Determine cell style (header row gets bold style)
                $style = ($rowIndex === 0) ? ' s="1"' : '';

                if (is_numeric($cellValue) && !is_string($cellValue)) {
                    // Numeric value
                    $sheetData .= '<c r="' . $cellRef . '"' . ($rowIndex === 0 ? ' s="1"' : ' s="2"') . '><v>' . $cellValue . '</v></c>';
                } else {
                    // String value - use shared strings
                    $stringValue = (string)$cellValue;
                    if (!isset($sharedStringIndex[$stringValue])) {
                        $sharedStringIndex[$stringValue] = count($sharedStrings);
                        $sharedStrings[] = $stringValue;
                    }
                    $sheetData .= '<c r="' . $cellRef . '" t="s"' . $style . '><v>' . $sharedStringIndex[$stringValue] . '</v></c>';
                }
            }

            $sheetData .= '</row>';
        }

        // xl/sharedStrings.xml
        $sharedStringsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' . count($sharedStrings) . '" uniqueCount="' . count($sharedStrings) . '">';
        foreach ($sharedStrings as $str) {
            $sharedStringsXml .= '<si><t>' . htmlspecialchars($str) . '</t></si>';
        }
        $sharedStringsXml .= '</sst>';
        file_put_contents($tempDir . '/xl/sharedStrings.xml', $sharedStringsXml);

        // xl/worksheets/sheet1.xml
        $sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <sheetData>' . $sheetData . '</sheetData>
</worksheet>';
        file_put_contents($tempDir . '/xl/worksheets/sheet1.xml', $sheet);

        // Create ZIP (XLSX is just a ZIP file)
        $zipFile = $tempDir . '/output.xlsx';
        $zip = new \ZipArchive();
        $zip->open($zipFile, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);

        $this->addDirectoryToZip($zip, $tempDir, '');
        $zip->close();

        $content = file_get_contents($zipFile);

        // Cleanup
        $this->deleteDirectory($tempDir);

        return $content;
    }

    /**
     * Get Excel column letter from index
     */
    private function getColumnLetter($index)
    {
        $letters = '';
        while ($index >= 0) {
            $letters = chr(65 + ($index % 26)) . $letters;
            $index = intval($index / 26) - 1;
        }
        return $letters;
    }

    /**
     * Add directory contents to ZIP
     */
    private function addDirectoryToZip($zip, $dir, $zipPath)
    {
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;

            $filePath = $dir . '/' . $file;
            $zipFilePath = $zipPath ? $zipPath . '/' . $file : $file;

            if (is_dir($filePath)) {
                $this->addDirectoryToZip($zip, $filePath, $zipFilePath);
            } else {
                if ($file !== 'output.xlsx') {
                    $zip->addFile($filePath, $zipFilePath);
                }
            }
        }
    }

    /**
     * Delete directory recursively
     */
    private function deleteDirectory($dir)
    {
        if (!is_dir($dir)) return;

        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;

            $filePath = $dir . '/' . $file;
            if (is_dir($filePath)) {
                $this->deleteDirectory($filePath);
            } else {
                unlink($filePath);
            }
        }
        rmdir($dir);
    }

    /**
     * Save report to storage for background job processing
     */
    public function saveToStorage($format, $reportType, $data, $filename = null)
    {
        if ($format === 'xlsx') {
            $result = $this->generateXLSX($reportType, $data, $filename);
        } else {
            $result = $this->generateCSV($reportType, $data, $filename);
        }

        $path = 'reports/' . $result['filename'];
        Storage::put($path, $result['content']);

        return [
            'path' => $path,
            'filename' => $result['filename'],
            'url' => Storage::url($path),
            'size' => strlen($result['content']),
        ];
    }
}
