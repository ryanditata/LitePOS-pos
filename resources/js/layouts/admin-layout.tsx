import { Link } from '@inertiajs/react';
import { Home, LogOut, Package, Settings, ShoppingCart } from 'lucide-react';
import { type ReactNode } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 border-r bg-white shadow-sm">
                <div className="p-6">
                    <Link href={route('admin.dashboard')} className="text-2xl font-bold text-gray-900">
                        LitePOS
                    </Link>
                </div>

                <nav className="mt-6">
                    <div className="px-3">
                        <Link
                            href={route('admin.dashboard')}
                            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                            <Home className="mr-3 h-5 w-5" />
                            Dashboard
                        </Link>

                        <Link
                            href={route('orders.index')}
                            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                            <ShoppingCart className="mr-3 h-5 w-5" />
                            Kelola Order
                        </Link>

                        <Link
                            href={route('products.index')}
                            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                            <Package className="mr-3 h-5 w-5" />
                            Produk
                        </Link>

                        <Link
                            href={route('categories.index')}
                            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                            <Settings className="mr-3 h-5 w-5" />
                            Kategori
                        </Link>
                    </div>

                    <div className="mt-8 px-3">
                        <Link
                            href={route('logout')}
                            method="post"
                            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Logout
                        </Link>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col">
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
