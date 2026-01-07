<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItems;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Display a listing of orders.
     */
    public function index(Request $request)
    {
        try {
            $query = Order::with(['orderItems.product.photos', 'payment'])
                ->orderBy('created_at', 'desc');

            // Filter by status if provided
            if ($request->filled('status') && $request->status !== 'all') {
    $query->where('status', $request->status);
}

            // Search by customer name or order ID
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('customer_name', 'like', "%{$search}%")
                      ->orWhere('id', 'like', "%{$search}%");
                });
            }

            // Paginate results (10 per page)
            // Inertia akan otomatis menyertakan 'data', 'links', 'meta' dalam object ini
            $orders = $query->paginate(10)->through(function ($order) {
                return [
                    'id' => $order->id,
                    'customer_name' => $order->customer_name,
                    'customer_phone' => null, // Not stored in database
                    'customer_email' => null, // Not stored in database
                    'total_amount' => $order->payment->amount ?? 0,
                    'status' => $order->status,
                    'order_type' => 'admin', // Since these are admin-created orders
                    'notes' => null, // Not stored in database
                    'created_at' => $order->created_at,
                    'order_items' => $order->orderItems->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product' => [
                                'id' => $item->product->id,
                                'name' => $item->product->name,
                                'photos' => $item->product->photos->map(function ($photo) {
                                    return [
                                        'id' => $photo->id,
                                        'photo_url' => $photo->url
                                    ];
                                })
                            ],
                            'quantity' => $item->quantity,
                            'price' => $item->product->price,
                            'subtotal' => $item->quantity * $item->product->price
                        ];
                    }),
                    'payment' => [
                        'id' => $order->payment->id ?? 0,
                        'method' => $order->payment->payment_method ?? 'cash',
                        'status' => $order->payment->status ?? 'completed',
                        'amount' => $order->payment->amount ?? 0,
                        'transaction_id' => $order->payment->transaction_id ?? '',
                        'paid_at' => $order->payment->paid_at ?? null
                    ]
                ];
            });

            // Ambil semua produk untuk keperluan modal Create Order
            $products = Product::with('photos')->get();

            return Inertia::render('admin/orders/index', [
                'orders' => $orders,
                'products' => $products,
                'filters' => $request->only(['status', 'search'])
            ]);

        } catch (\Exception $e) {
            // Log error jika perlu
            // \Log::error($e->getMessage());
            
            return redirect()->back()->withErrors(['error' => 'Gagal memuat data order: ' . $e->getMessage()]);
        }
    }

    /**
     * Show the form for creating a new order.
     */
    public function create()
    {
        // Tidak digunakan karena form create menggunakan Modal di index
    }

    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'table_number' => 'nullable|integer|min:0',
            'status' => 'nullable|in:pending,completed,cancelled',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'required|in:cash,digital',
        ]);

        DB::beginTransaction();

        try {
            $subtotalAmount = 0;
            $validatedItems = [];

            foreach ($request->items as $item) {
                $product = Product::lockForUpdate()->findOrFail($item['product_id']); 
                
                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Stok '{$product->name}' tidak mencukupi. Sisa: {$product->stock}");
                }

                $subtotal = $product->price * $item['quantity'];
                $subtotalAmount += $subtotal;

                $validatedItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'subtotal' => $subtotal
                ];
            }

            // Add tax (10%)
            $taxAmount = $subtotalAmount * 0.1;
            $totalAmount = $subtotalAmount + $taxAmount;

            // Create order
            $order = Order::create([
                'customer_name' => $request->customer_name,
                'table_number' => $request->table_number ?? 0,
                'status' => $request->status ?? 'pending',
            ]);

            foreach ($validatedItems as $item) {
                OrderItems::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'subtotal' => $item['subtotal'],
                ]);

                Product::where('id', $item['product_id'])->decrement('stock', $item['quantity']);
            }

            // Create payment record
            $payment = Payment::create([
                'order_id' => $order->id,
                'amount' => $totalAmount,
                'payment_method' => $request->payment_method,
                'status' => 'completed',
                'transaction_id' => 'ADMIN-' . time() . '-' . $order->id,
                'paid_at' => now(),
            ]);

            DB::commit();

            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json([
                    'success' => true,
                    'message' => 'Order berhasil dibuat!',
                    'order_id' => $order->id
                ]);
            }

            return redirect()->route('orders.index')->with('success', 'Order berhasil dibuat!');
        } catch (\Exception $e) {
            DB::rollback();

            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'errors' => ['general' => $e->getMessage()]
                ], 422);
            }

            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order)
    {
        // Digunakan jika ingin menampilkan detail page terpisah
        // Namun saat ini sudah di-handle via Modal di index
        $order->load(['orderItems.product.photos', 'payment']);

        return Inertia::render('admin/orders/show', [
            'order' => $order,
            'printReceipt' => session('print_receipt', false)
        ]);
    }

    /**
     * Show the form for editing the specified order.
     */
    public function edit(Order $order)
    {
        // Tidak digunakan karena edit form menggunakan Modal
    }

    /**
     * Update the specified order in storage.
     */
    public function update(Request $request, Order $order)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'status' => 'required|in:pending,completed,cancelled',
        ]);

        $order->update([
            'customer_name' => $request->customer_name,
            'status' => $request->status,
        ]);

        // Return JSON response for AJAX requests (Modal)
        if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'success' => true,
                'message' => 'Order berhasil diupdate!',
                'order_id' => $order->id
            ]);
        }

        return redirect()->route('orders.index')
            ->with('success', 'Order berhasil diupdate!');
    }

    /**
     * Remove the specified order from storage.
     */
    public function destroy(Request $request, Order $order)
    {
        // Only allow deletion of cancelled orders
        if ($order->status !== 'cancelled') {
            // Jika request AJAX (dari modal delete)
            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya order yang dibatalkan yang bisa dihapus.'
                ], 422);
            }
            return back()->withErrors(['error' => 'Hanya order yang dibatalkan yang bisa dihapus.']);
        }

        DB::beginTransaction();

        try {
            // Restore stock
            foreach ($order->orderItems as $item) {
                Product::where('id', $item->product_id)->increment('stock', $item->quantity);
            }
            
            // Delete related data
            $order->orderItems()->delete();
            $order->payment()->delete();
            $order->delete();

            DB::commit();

            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json([
                    'success' => true,
                    'message' => 'Order berhasil dihapus!'
                ]);
            }

            return redirect()->route('orders.index')
                ->with('success', 'Order berhasil dihapus!');
        } catch (\Exception $e) {
            DB::rollback();

            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal menghapus order: ' . $e->getMessage(),
                    'errors' => ['general' => $e->getMessage()]
                ], 422);
            }

            return back()->withErrors(['error' => 'Gagal menghapus order: ' . $e->getMessage()]);
        }
    }

    /**
     * Print receipt for the order.
     */
    public function printReceipt(Order $order)
    {
        $order->load(['orderItems.product', 'payment']);

        // Prepare data for print endpoint
        $items = $order->orderItems->map(function ($item) {
            return [
                'name' => $item->product->name,
                'quantity' => $item->quantity,
                'price' => $item->price,
                'subtotal' => $item->subtotal
            ];
        });

        $printData = [
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->customer_phone,
            'items' => $items,
            'total_amount' => $order->payment->amount, // Fixed access to amount
            'payment_method' => $order->payment->payment_method ?? 'cash', // Fixed access to payment_method
            'order_date' => $order->created_at->format('d/m/Y H:i'),
            'order_id' => $order->id
        ];

        // Redirect to print endpoint with query parameters
        return redirect()->route('print.index', $printData);
    }

    /**
     * Update order status (Quick Action).
     */
    public function updateStatus(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|in:pending,completed,cancelled'
        ]);

        $order->update(['status' => $request->status]);

        if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'success' => true,
                'message' => 'Status order berhasil diupdate!'
            ]);
        }
        
        return back();
    }
}