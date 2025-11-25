<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerReturn;
use App\Models\CustomerReturnItem;
use App\Models\Shipment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class CustomerReturnController extends Controller
{
    /**
     * Display a listing of customer returns
     */
    public function index(Request $request): JsonResponse
    {
        $query = CustomerReturn::with(['shipment.salesOrder', 'customer', 'items']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by customer
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Filter by return number
        if ($request->has('return_number')) {
            $query->where('return_number', 'LIKE', "%{$request->return_number}%");
        }

        // Filter by date range
        if ($request->has('requested_from')) {
            $query->where('requested_at', '>=', $request->requested_from);
        }
        if ($request->has('requested_to')) {
            $query->where('requested_at', '<=', $request->requested_to);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginate
        $perPage = $request->get('per_page', 15);
        $returns = $query->paginate($perPage);

        return response()->json($returns);
    }

    /**
     * Show a single customer return
     */
    public function show(int $id): JsonResponse
    {
        $return = CustomerReturn::with([
            'shipment.salesOrder.customer',
            'customer',
            'items.productVariant.product',
            'items.shipmentItem',
            'approver',
            'receiver',
        ])->findOrFail($id);

        return response()->json($return);
    }

    /**
     * Create a new customer return
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'shipment_id' => 'required|exists:shipments,id',
            'reason' => 'required|in:defective,wrong_item,damaged,not_as_described,customer_changed_mind,other',
            'reason_notes' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.shipment_item_id' => 'required|exists:shipment_items,id',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.return_qty' => 'required|numeric|min:0.01',
            'items.*.uom_id' => 'required|exists:uoms,id',
            'items.*.condition' => 'required|in:new,used,damaged,defective',
            'items.*.restockable' => 'nullable|boolean',
            'items.*.notes' => 'nullable|string',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                $shipment = Shipment::findOrFail($validated['shipment_id']);

                $return = CustomerReturn::create([
                    'shipment_id' => $validated['shipment_id'],
                    'customer_id' => $shipment->salesOrder->customer_id,
                    'status' => 'pending',
                    'reason' => $validated['reason'],
                    'reason_notes' => $validated['reason_notes'] ?? null,
                    'requested_at' => now(),
                    'notes' => $validated['notes'] ?? null,
                ]);

                // Create return items
                foreach ($validated['items'] as $itemData) {
                    CustomerReturnItem::create([
                        'customer_return_id' => $return->id,
                        'shipment_item_id' => $itemData['shipment_item_id'],
                        'product_variant_id' => $itemData['product_variant_id'],
                        'return_qty' => $itemData['return_qty'],
                        'uom_id' => $itemData['uom_id'],
                        'condition' => $itemData['condition'],
                        'restockable' => $itemData['restockable'] ?? true,
                        'notes' => $itemData['notes'] ?? null,
                    ]);
                }

                return response()->json([
                    'message' => 'Customer return created successfully',
                    'data' => $return->fresh(['items', 'shipment', 'customer']),
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create customer return',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Update customer return
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|in:defective,wrong_item,damaged,not_as_described,customer_changed_mind,other',
            'reason_notes' => 'nullable|string',
            'notes' => 'nullable|string',
            'refund_method' => 'nullable|in:original_payment,store_credit,replacement',
            'restock' => 'nullable|boolean',
        ]);

        try {
            $return = CustomerReturn::findOrFail($id);

            if (!$return->canEdit()) {
                return response()->json([
                    'message' => 'Customer return cannot be edited',
                ], 403);
            }

            $return->update($validated);

            return response()->json([
                'message' => 'Customer return updated successfully',
                'data' => $return->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update customer return',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Approve customer return
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'refund_method' => 'required|in:original_payment,store_credit,replacement',
            'restock' => 'nullable|boolean',
        ]);

        try {
            $return = CustomerReturn::findOrFail($id);

            if (!$return->isPending()) {
                return response()->json([
                    'message' => 'Only pending returns can be approved',
                ], 400);
            }

            $return->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => Auth::id(),
                'refund_method' => $validated['refund_method'],
                'restock' => $validated['restock'] ?? false,
            ]);

            return response()->json([
                'message' => 'Customer return approved successfully',
                'data' => $return->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to approve customer return',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Reject customer return
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        try {
            $return = CustomerReturn::findOrFail($id);

            if (!$return->isPending()) {
                return response()->json([
                    'message' => 'Only pending returns can be rejected',
                ], 400);
            }

            $return->update([
                'status' => 'rejected',
                'notes' => $validated['notes'] ?? $return->notes,
            ]);

            return response()->json([
                'message' => 'Customer return rejected successfully',
                'data' => $return->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reject customer return',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Mark return as received
     */
    public function markAsReceived(Request $request, int $id): JsonResponse
    {
        try {
            $return = CustomerReturn::findOrFail($id);

            if ($return->status !== 'approved') {
                return response()->json([
                    'message' => 'Only approved returns can be marked as received',
                ], 400);
            }

            $return->update([
                'status' => 'received',
                'received_at' => now(),
                'received_by' => Auth::id(),
            ]);

            // TODO: In a future iteration, implement restocking logic here
            // if ($return->restock) {
            //     $this->restockItems($return);
            // }

            return response()->json([
                'message' => 'Customer return marked as received',
                'data' => $return->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark return as received',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Process refund
     */
    public function processRefund(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'refund_amount' => 'required|numeric|min:0',
        ]);

        try {
            $return = CustomerReturn::findOrFail($id);

            if ($return->status !== 'received') {
                return response()->json([
                    'message' => 'Only received returns can be refunded',
                ], 400);
            }

            $return->update([
                'status' => 'refunded',
                'refunded_at' => now(),
                'refund_amount' => $validated['refund_amount'],
            ]);

            return response()->json([
                'message' => 'Refund processed successfully',
                'data' => $return->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to process refund',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Cancel customer return
     */
    public function cancel(int $id): JsonResponse
    {
        try {
            $return = CustomerReturn::findOrFail($id);

            if (!in_array($return->status, ['pending', 'approved'])) {
                return response()->json([
                    'message' => 'Only pending or approved returns can be cancelled',
                ], 400);
            }

            $return->update(['status' => 'cancelled']);

            return response()->json([
                'message' => 'Customer return cancelled successfully',
                'data' => $return->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to cancel customer return',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Delete customer return
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $return = CustomerReturn::findOrFail($id);

            if (!$return->canEdit()) {
                return response()->json([
                    'message' => 'Customer return cannot be deleted',
                ], 403);
            }

            $return->delete();

            return response()->json([
                'message' => 'Customer return deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete customer return',
                'error' => $e->getMessage(),
            ], 400);
        }
    }
}
