import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CreditCard,
    EditIcon,
    EyeIcon,
    FileText,
    ImageIcon,
    Minus,
    Package,
    PlusIcon,
    Printer,
    SearchIcon,
    ShoppingCart,
    TrashIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Types
interface OrderItem {
    id: number;
    product: {
        id: number;
        name: string;
        photos: Array<{ id: number; photo_url: string }>;
    };
    quantity: number;
    price: number;
    subtotal: number;
}

interface Payment {
    id: number;
    method: string;
    status: string;
    amount: number;
    transaction_id: string;
    paid_at: string | null;
}

interface Order {
    id: number;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    total_amount: number;
    status: string;
    order_type: string;
    notes: string | null;
    created_at: string;
    order_items: OrderItem[];
    payment: Payment;
}

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    photos: Array<{
        id: number;
        url: string;
     }>;
}

interface CartItem {
    product_id: number;
    product: Product;
    quantity: number;
    subtotal: number;
}

// Interface Pagination Link dari Laravel
interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface OrdersData {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[]; 
}

interface Props {
    orders: OrdersData;
    products: Product[];
    filters: {
        status?: string;
        search?: string;
    };
}

interface OrderFormData {
    customer_name: string;
    payment_method: string;
    table_number: number;
    status?: string; 
    items: { product_id: number; quantity: number }[];
    // Tambahan field untuk edit yang mungkin diperlukan
    customer_phone?: string;
    customer_email?: string;
    notes?: string;
    [key: string]: any;
}   

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Orders',
        href: '/admin/orders',
    },
];

const statusConfig = {
    pending: { label: 'Pending', variant: 'secondary' as const },
    completed: { label: 'Completed', variant: 'default' as const },
    cancelled: { label: 'Cancelled', variant: 'destructive' as const },
};

const paymentStatusConfig = {
    pending: { label: 'Pending', variant: 'secondary' as const },
    completed: { label: 'Completed', variant: 'default' as const },
    failed: { label: 'Failed', variant: 'destructive' as const },
};

export default function OrdersIndex({ orders, products, filters }: Props) {
    // State Filter
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState<string>(filters?.status || 'all');
    
    // State Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // State Data & Processing
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Create Order Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');

    const [formData, setFormData] = useState<OrderFormData>({
        customer_name: '',
        payment_method: 'cash',
        table_number: 0,
        status: 'pending',
        items: [],
        customer_phone: '',
        customer_email: '',
        notes: ''
    });

    // Handle Search & Filter (Pagination Trigger)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== (filters.search || '') || statusFilter !== (filters.status || 'all')) {
                router.get(
                    '/admin/orders',
                    { 
                        search: searchTerm, 
                        status: statusFilter === 'all' ? '' : statusFilter 
                    },
                    { 
                        preserveState: true,
                        preserveScroll: true,
                        replace: true
                    }
                );
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter]);

    // Auto print logic
    useEffect(() => {
        if (orderToPrint) {
            handlePrint(orderToPrint);
            setOrderToPrint(null);
        }
    }, [orderToPrint]);

    // Reset form
    const resetForm = () => {
        setFormData({
            customer_name: '',
            payment_method: 'cash',
            table_number: 0,
            status: 'pending',
            items: [],
            customer_phone: '',
            customer_email: '',
            notes: ''
        });
        setCart([]);
        setErrors({});
    };

    // Handle form input changes
    const handleInputChange = (field: keyof OrderFormData, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const filteredProducts = (products || []).filter((product) => product.name.toLowerCase().includes(productSearchTerm.toLowerCase()));

    // Cart Functions
    const addToCart = (product: Product) => {
        if (product.stock <= 0) {
            alert('Stok produk ini habis!');
            return;
        }

        const existingItem = cart.find((item) => item.product_id === product.id);

        if (existingItem) {
            if (existingItem.quantity + 1 > product.stock) {
                alert(`Stok tidak mencukupi! Sisa stok: ${product.stock}`);
                return;
            }
            updateQuantity(product.id, existingItem.quantity + 1);
        } else {
            const newItem: CartItem = {
                product_id: product.id,
                product,
                quantity: 1,
                subtotal: product.price,
            };
            setCart([...cart, newItem]);
        }
    };

    const updateQuantity = (productId: number, newQuantity: number) => {
        const itemInCart = cart.find((item) => item.product_id === productId);

        if (itemInCart && newQuantity > itemInCart.product.stock) {
            alert(`Stok tidak mencukupi! Sisa stok hanya ${itemInCart.product.stock}`);
            return;
        }

        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(
            cart.map((item) => {
                if (item.product_id === productId) {
                    return {
                        ...item,
                        quantity: newQuantity,
                        subtotal: item.product.price * newQuantity,
                    };
                }
                return item;
            }),
        );
    };

    const removeFromCart = (productId: number) => {
        setCart(cart.filter((item) => item.product_id !== productId));
    };

    const getSubtotal = () => {
        return cart.reduce((total, item) => total + item.subtotal, 0);
    };

    const getTaxAmount = () => {
        return getSubtotal() * 0.1; 
    };

    const getTotalAmount = () => {
        return getSubtotal() + getTaxAmount();
    };

    // Handle Create Order
    const handleCreate = async () => {
        if (cart.length === 0) {
            setErrors({ items: 'Please add at least one product to the cart' });
            return;
        }

        if (!formData.customer_name.trim()) {
            setErrors({ customer_name: 'Customer name is required' });
            return;
        }

        if (!formData.status) {
            setErrors({ status: 'Order status is required' });
            return;
        }

        setIsLoading(true);
        setErrors({});

        const items = cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
        }));

        const formDataToSend = {
            ...formData,
            items,
            tax_rate: 0.1,
        };

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch('/admin/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(formDataToSend),
            });

            if (response.ok) {
                console.log('Order created successfully');
                setIsCreateModalOpen(false);

                // Mock order for printing
                const mockOrder: Order = {
                    id: Date.now(), 
                    customer_name: formData.customer_name,
                    customer_phone: null, 
                    customer_email: null, 
                    total_amount: getTotalAmount(),
                    status: formData.status || 'pending',
                    order_type: 'admin',
                    notes: null,
                    created_at: new Date().toISOString(),
                    order_items: cart.map((item) => ({
                        id: item.product_id,
                        product: {
                            id: item.product.id,
                            name: item.product.name,
                            photos: item.product.photos.map((p) => ({ id: p.id, photo_url: p.url })),
                        },
                        quantity: item.quantity,
                        price: item.product.price,
                        subtotal: item.subtotal,
                    })),
                    payment: {
                        id: Date.now(),
                        method: formData.payment_method,
                        status: 'completed',
                        amount: getTotalAmount(),
                        transaction_id: `TXN-${Date.now()}`,
                        paid_at: new Date().toISOString(),
                    },
                };

                setOrderToPrint(mockOrder);
                resetForm();
                router.reload({ only: ['orders', 'products'] });
            } else {
                const errorData = await response.json();
                setErrors(errorData.errors || { general: 'Failed to create order' });
            }
        } catch (error) {
            console.error('Network error:', error);
            setErrors({ general: 'Network error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Edit Order (ASLI)
    const handleEdit = async () => {
        if (!selectedOrder) return;
        setIsLoading(true);
        setErrors({});

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch(`/admin/orders/${selectedOrder.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                console.log('Order updated successfully');
                setIsEditModalOpen(false);
                setSelectedOrder(null);
                resetForm();
                router.reload({ only: ['orders'] });
            } else {
                const errorData = await response.json();
                console.error('Order update failed:', errorData);
                setErrors(errorData.errors || { general: 'Failed to update order' });
            }
        } catch (error) {
            console.error('Network error:', error);
            setErrors({ general: 'Network error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Delete Order
    const handleDelete = async () => {
        if (!selectedOrder) return;
        setIsLoading(true);

        try {
             const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
             const response = await fetch(`/admin/orders/${selectedOrder.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                console.log('Order deleted successfully');
                setIsDeleteModalOpen(false);
                setSelectedOrder(null);
                router.reload({ only: ['orders'] });
            } else {
                console.error('Order deletion failed:', response.status);
            }
        } catch (error) {
            console.error('Network error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Open Edit Modal (Dengan data lengkap untuk form)
    const openEditModal = (order: Order) => {
        setSelectedOrder(order);
        setFormData({
            customer_name: order.customer_name,
            payment_method: order.payment.method,
            table_number: 0,
            status: order.status,
            items: [],
            customer_phone: order.customer_phone || '',
            customer_email: order.customer_email || '',
            notes: order.notes || ''
        });
        setIsEditModalOpen(true);
    };

    // Open View Modal
    const openViewModal = (order: Order) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
    };

    // Open Delete Modal
    const openDeleteModal = (order: Order) => {
        setSelectedOrder(order);
        setIsDeleteModalOpen(true);
    };

    // Handle Print
    const handlePrint = async (order: Order) => {
        const items = order.order_items?.map((item) => ({
                name: item.product?.name || 'Unknown Product',
                quantity: item.quantity,
                price: item.price,
            })) || [];

        const paid = order.payment?.amount || order.total_amount || 0;

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch('/print', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ items, paid }),
            });

            if (response.ok) {
                console.log('Print request successful');
            } else {
                console.error('Print request failed:', response.statusText);
            }
        } catch (error) {
            console.error('Error printing order:', error);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders Management" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Orders Management</h1>
                        <p className="text-muted-foreground">Manage customer orders and create new orders</p>
                    </div>

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => resetForm()}>
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add Order
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Order</DialogTitle>
                                <DialogDescription>Create a new order for walk-in customers</DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 gap-6">
                                {/* Product Selection */}
                                <div className="">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Select Products</CardTitle>
                                            <Input
                                                placeholder="Search products..."
                                                value={productSearchTerm}
                                                onChange={(e) => setProductSearchTerm(e.target.value)}
                                            />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid max-h-64 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2">
                                                {filteredProducts.map((product) => {
                                                    const cartItem = cart.find((item) => item.product_id === product.id);
                                                    const currentQty = cartItem ? cartItem.quantity : 0;
                                                    const isOutOfStock = product.stock <= 0;
                                                    const isMaxedOut = currentQty >= product.stock;
                                                    const isDisabled = isOutOfStock || isMaxedOut;

                                                    return (
                                                        <div
                                                            key={product.id}
                                                            className={`rounded-lg border p-3 transition-colors ${
                                                                isDisabled ? '' : 'cursor-pointer hover:bg-gray-50' 
                                                            }`}
                                                            onClick={() => !isDisabled && addToCart(product)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {product.photos.length > 0 ? (
                                                                    <img src={product.photos[0].url} alt={product.name} className="h-12 w-12 rounded object-cover" />
                                                                ) : (
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
                                                                        <ImageIcon className="h-6 w-6 text-gray-400" />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1">
                                                                    <h4 className="text-sm font-medium">{product.name}</h4>
                                                                    <p className='text-xs text-gray-600'>Stock: {product.stock}</p>
                                                                    <p className="text-sm font-semibold text-green-600">{formatCurrency(product.price)}</p>
                                                                </div>
                                                                <PlusIcon className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Cart & Customer Form */}
                                <div className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-base">
                                                <ShoppingCart className="mr-2 h-4 w-4" /> Cart ({cart.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {cart.length === 0 ? (
                                                <p className="py-2 text-center text-sm text-muted-foreground">Cart is empty</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {cart.map((item) => (
                                                        <div key={item.product_id} className="flex items-center gap-2">
                                                            <div className="flex-1">
                                                                <p className="text-xs font-medium">{item.product.name}</p>
                                                                <p className="text-xs text-muted-foreground">{formatCurrency(item.product.price)} x {item.quantity}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button type="button" variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>
                                                                    <Minus className="h-3 w-3" />
                                                                </Button>
                                                                <span className="w-6 text-center text-xs">{item.quantity}</span>
                                                                <Button type="button" variant="outline" size="sm" className="h-6 w-6 p-0" disabled={item.quantity >= item.product.stock} onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                                                                    <PlusIcon className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                            <p className="min-w-[60px] text-right text-xs font-semibold">{formatCurrency(item.subtotal)}</p>
                                                        </div>
                                                    ))}
                                                    <div className="space-y-2 border-t pt-3">
                                                        <div className="flex items-center justify-between text-sm"><span>Subtotal:</span><span>{formatCurrency(getSubtotal())}</span></div>
                                                        <div className="flex items-center justify-between text-sm"><span>Tax (10%):</span><span>{formatCurrency(getTaxAmount())}</span></div>
                                                        <div className="flex items-center justify-between border-t pt-2 text-sm font-bold"><span>Total:</span><span>{formatCurrency(getTotalAmount())}</span></div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                    
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Customer Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <Label htmlFor="customer_name" className="text-sm">Customer Name *</Label>
                                                <Input id="customer_name" value={formData.customer_name} onChange={(e) => handleInputChange('customer_name', e.target.value)} className="h-8" />
                                                {errors.customer_name && <p className="mt-1 text-xs text-red-500">{errors.customer_name}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="payment_method" className="text-sm">Payment Method *</Label>
                                                <Select value={formData.payment_method} onValueChange={(value) => handleInputChange('payment_method', value)}>
                                                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="cash">Cash</SelectItem>
                                                        <SelectItem value="digital">Digital</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="order_status" className="text-sm">Order Status *</Label>
                                                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                                                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {errors.items && <p className="text-sm text-red-600">{errors.items}</p>}
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isLoading}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={isLoading || cart.length === 0 || !formData.customer_name}>{isLoading ? 'Creating...' : 'Create Order'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative max-w-md">
                        <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                        <Input 
                            placeholder="Search orders..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="pl-10" 
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
                    {/* Orders Table */}
                    <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Order ID</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Customer</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Type</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Payment</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Total</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {orders.data && orders.data.length > 0 ? (
                                        orders.data.map((order) => (
                                            <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle font-medium">#{order.id}</td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{order.customer_name}</span>
                                                        {order.customer_phone && <span className="text-xs text-muted-foreground">{order.customer_phone}</span>}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                                                        {order.order_type === 'admin' ? 'Admin' : 'Customer'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle whitespace-nowrap text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{formatDate(order.created_at)}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={statusConfig[order.status as keyof typeof statusConfig]?.variant}>
                                                        {statusConfig[order.status as keyof typeof statusConfig]?.label}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={paymentStatusConfig[order.payment.status as keyof typeof paymentStatusConfig]?.variant} className="text-xs">
                                                        {paymentStatusConfig[order.payment.status as keyof typeof paymentStatusConfig]?.label}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle text-right font-semibold text-green-600">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                                <td className="p-4 align-middle text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openViewModal(order)}>
                                                            <EyeIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditModal(order)}>
                                                            <EditIcon className="h-4 w-4" />
                                                        </Button>
                                                        {order.status === 'cancelled' && (
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => openDeleteModal(order)}>
                                                                <TrashIcon className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="h-24 text-center text-muted-foreground">
                                                No orders found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {orders.data && orders.data.length > 0 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-500">
                                Showing {orders.from} to {orders.to} of {orders.total} results
                            </div>
                            <div className="flex gap-1">
                                {orders.links.map((link, index) => {
                                    const label = link.label.replace('&laquo; Previous', 'Prev').replace('Next &raquo;', 'Next');
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveState
                                            preserveScroll
                                            onClick={(e) => !link.url && e.preventDefault()}
                                            className={`
                                                inline-flex items-center justify-center h-8 px-3 text-sm font-medium border rounded transition-colors
                                                ${link.active 
                                                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                                                    : 'bg-background border-input hover:bg-accent hover:text-accent-foreground'
                                                }
                                                ${!link.url ? 'pointer-events-none opacity-50' : ''}
                                            `}
                                            dangerouslySetInnerHTML={{ __html: label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* View Order Modal (FULL ORIGINAL) */}
                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Order Details #{selectedOrder?.id}</DialogTitle>
                            <DialogDescription>Complete order and customer information</DialogDescription>
                        </DialogHeader>

                        {selectedOrder && (
                            <div className="grid grid-cols-1 gap-6">
                                {/* Order Items */}
                                <div className="">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <Package className="mr-2 h-5 w-5" />
                                                Order Items
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {selectedOrder.order_items.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-3 rounded border p-3">
                                                        {item.product.photos.length > 0 ? (
                                                            <img
                                                                src={item.product.photos[0].photo_url}
                                                                alt={item.product.name}
                                                                className="h-12 w-12 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
                                                                <ImageIcon className="h-6 w-6 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-medium">{item.product.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {formatCurrency(item.price)} x {item.quantity}
                                                            </p>
                                                        </div>
                                                        <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                                                    </div>
                                                ))}

                                                <div className="space-y-2 border-t pt-3">
                                                    {(() => {
                                                        const orderSubtotal = selectedOrder.order_items.reduce(
                                                            (total, item) => total + item.subtotal,
                                                            0,
                                                        );
                                                        const orderTax = selectedOrder.total_amount - orderSubtotal;

                                                        return (
                                                            <>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span>Subtotal:</span>
                                                                    <span>{formatCurrency(orderSubtotal)}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span>Pajak (10%):</span>
                                                                    <span>{formatCurrency(orderTax)}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between border-t pt-2 text-lg font-bold">
                                                                    <span>Total:</span>
                                                                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Notes */}
                                    {selectedOrder.notes && (
                                        <Card className="mt-4">
                                            <CardHeader>
                                                <CardTitle className="flex items-center">
                                                    <FileText className="mr-2 h-5 w-5" />
                                                    Order Notes
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-gray-700">{selectedOrder.notes}</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* Order Info Sidebar */}
                                <div className="space-y-4">
                                    {/* Order Status */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Order Status</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span>Status:</span>
                                                <Badge variant={statusConfig[selectedOrder.status as keyof typeof statusConfig]?.variant}>
                                                    {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span>Type:</span>
                                                <Badge variant="outline">{selectedOrder.order_type === 'admin' ? 'Admin' : 'Customer'}</Badge>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>{formatDate(selectedOrder.created_at)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Customer Info */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Customer Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div>
                                                <p className="font-medium">{selectedOrder.customer_name}</p>
                                            </div>

                                            {selectedOrder.customer_phone && (
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Phone: </span>
                                                    <span>{selectedOrder.customer_phone}</span>
                                                </div>
                                            )}

                                            {selectedOrder.customer_email && (
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Email: </span>
                                                    <span>{selectedOrder.customer_email}</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Payment Info */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <CreditCard className="mr-2 h-5 w-5" />
                                                Payment
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span>Status:</span>
                                                <Badge
                                                    variant={
                                                        paymentStatusConfig[selectedOrder.payment.status as keyof typeof paymentStatusConfig]?.variant
                                                    }
                                                >
                                                    {paymentStatusConfig[selectedOrder.payment.status as keyof typeof paymentStatusConfig]?.label}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span>Method:</span>
                                                <span className="capitalize">{selectedOrder.payment.method}</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span>Amount:</span>
                                                <span className="font-medium">{formatCurrency(selectedOrder.payment.amount)}</span>
                                            </div>

                                            <div className="text-xs text-muted-foreground">
                                                <p>Transaction ID:</p>
                                                <p className="font-mono">{selectedOrder.payment.transaction_id}</p>
                                            </div>

                                            {selectedOrder.payment.paid_at && (
                                                <div className="text-xs text-muted-foreground">
                                                    <p>Paid at:</p>
                                                    <p>{formatDate(selectedOrder.payment.paid_at)}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                                Close
                            </Button>
                            {selectedOrder && (
                                <Button onClick={() => handlePrint(selectedOrder)}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Receipt
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Order Modal (FULL ORIGINAL) */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Order #{selectedOrder?.id}</DialogTitle>
                            <DialogDescription>Update customer information and order status</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit_customer_name">Customer Name *</Label>
                                <Input
                                    id="edit_customer_name"
                                    value={formData.customer_name}
                                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                                />
                                {errors.customer_name && <p className="mt-1 text-sm text-red-500">{errors.customer_name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="edit_customer_phone">Phone Number</Label>
                                <Input
                                    id="edit_customer_phone"
                                    value={formData.customer_phone}
                                    onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit_customer_email">Email</Label>
                                <Input
                                    id="edit_customer_email"
                                    type="email"
                                    value={formData.customer_email}
                                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit_status">Order Status *</Label>
                                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="edit_notes">Notes</Label>
                                <Textarea
                                    id="edit_notes"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button onClick={handleEdit} disabled={isLoading || !formData.customer_name || !formData.status}>
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Order</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete order #{selectedOrder?.id} for "{selectedOrder?.customer_name}"? This action cannot be
                                undone.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                                {isLoading ? 'Deleting...' : 'Delete Order'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}