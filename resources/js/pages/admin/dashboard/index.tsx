import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertTriangle, DollarSign, Utensils, ShoppingBag } from 'lucide-react';
import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DashboardProps {
    stats: {
        revenue_today: number;
        orders_today: number;
        low_stock_count: number;
        revenue_percentage: number;
    };
    top_products: {
        name: string;
        total_sold: number;
    }[];
    recent_orders: {
        id: number;
        customer_name: string;
        table_number: number;
        created_at: string;
        amount: number;
        status: string;
        payment?: { status: string };
    }[];
    chart_data: {
        date: string;
        revenue: number;
    }[];
}

interface ChartProps {
    data: { month: string; total: number }[];
}

const AnalyticsChart: React.FC<ChartProps> = ({ data }) => {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0f172a" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="month" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                    />
                    <YAxis 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `Rp${value / 1000}k`} 
                    />
                    <Tooltip 
                        formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#0f172a" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorTotal)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

export default function Dashboard({ 
    stats = { 
        revenue_today: 0, 
        orders_today: 0, 
        low_stock_count: 0, 
        revenue_percentage: 0 
    }, 
    top_products = [], 
    recent_orders = [], 
    chart_data = []
}: DashboardProps) {
    const formattedChartData = chart_data.map(item => ({
        month: item.date,
        total: item.revenue
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pendapatan Hari Ini</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.revenue_today)}</div>
                            <p className={`text-xs ${stats.revenue_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.revenue_percentage > 0 ? '+' : ''}
                                {stats.revenue_percentage}% dari kemarin
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.orders_today}</div>
                            <p className="text-xs text-muted-foreground">Order masuk hari ini</p>
                        </CardContent>
                    </Card>
                    <Card className={stats.low_stock_count > 0 ? "border-red-200 bg-red-50 dark:bg-red-900/10" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className={`text-sm font-medium ${stats.low_stock_count > 0 ? "text-red-600" : ""}`}>
                                Stok Menipis
                            </CardTitle>
                            <AlertTriangle className={`h-4 w-4 ${stats.low_stock_count > 0 ? "text-red-600" : "text-muted-foreground"}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${stats.low_stock_count > 0 ? "text-red-600" : ""}`}>
                                {stats.low_stock_count}
                            </div>
                            <p className="text-xs text-muted-foreground">Produk dengan stok &le; 5</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-7">
                    <Card className="md:col-span-4">
                        <CardHeader>
                            <CardTitle>Overview Pendapatan</CardTitle>
                            <CardDescription>Grafik pendapatan 7 hari terakhir</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <AnalyticsChart data={formattedChartData} />
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-3">
                        <CardHeader>
                            <CardTitle>Menu Terlaris</CardTitle>
                            <CardDescription>5 produk dengan penjualan tertinggi</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {top_products.length > 0 ? (
                                    top_products.map((product, index) => (
                                        <div key={index} className="flex items-center">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                                <Utensils className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">Rank #{index + 1}</p>
                                            </div>
                                            <div className="ml-auto font-medium">
                                                {product.total_sold} Terjual
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground py-4">
                                        Belum ada penjualan hari ini
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Pesanan Terbaru</CardTitle>
                            <CardDescription>Daftar transaksi yang baru masuk</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Meja</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Pembayaran</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recent_orders.length > 0 ? (
                                    recent_orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">#{order.id}</TableCell>
                                            <TableCell>{order.customer_name}</TableCell>
                                            <TableCell>Meja {order.table_number}</TableCell>
                                            <TableCell>
                                                {formatDate(order.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    order.payment?.status === 'completed' ? 'text-green-600 border-green-600' :
                                                    order.payment?.status === 'failed' ? 'text-red-600 border-red-600' : 'text-yellow-600 border-yellow-600'
                                                }>
                                                    {order.payment?.status || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatCurrency(order.payment?.amount || 0)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                            Tidak ada pesanan terbaru.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
