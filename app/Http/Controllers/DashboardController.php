<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        // Data Statistik (Card Atas)
        $revenueToday = Payment::where('status', 'completed')
            ->whereDate('created_at', $today)
            ->sum('amount');
        
        $revenueYesterday = Payment::where('status', 'completed')
            ->whereDate('created_at', $yesterday)
            ->sum('amount');
        
        $percentageChange = 0;
        if ($revenueYesterday > 0) {
            $percentageChange = (($revenueToday - $revenueYesterday) / $revenueYesterday) * 100;
        } else {
            $percentageChange = $revenueToday > 0 ? 100 : 0;
        }

        $ordersToday = Order::whereDate('created_at', $today)->count();
        $lowStockCount = Product::where('stock', '<=', 5)->count();

        // Data Produk Terlaris (Top 5)
        $topProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        // Pesanan Terbaru
        $recentOrders = Order::with('payment')
            ->latest()
            ->limit(5)
            ->get();

        // Data Grafik (7 Hari Terakhir)
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            
            $revenue = Payment::where('status', 'completed') 
                ->whereDate('created_at', $date)
                ->sum('amount');
            
            $chartData[] = [
                'date' => $date->format('d M'),
                'revenue' => (int) $revenue
            ];
        }

        return Inertia::render('admin/dashboard/index', [
            'stats' => [
                'revenue_today' => (int) $revenueToday,
                'orders_today' => $ordersToday,
                'low_stock_count' => $lowStockCount,
                'revenue_percentage' => round($percentageChange, 1),
            ],
            'top_products' => $topProducts,
            'recent_orders' => $recentOrders,
            'chart_data' => $chartData, 
        ]);
    }
}
