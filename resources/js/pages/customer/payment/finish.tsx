import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, router } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
    order_id: string;
    status: string;
}

export default function PaymentFinish({ order_id, status }: Props) {
    useEffect(() => {
        // Clear cart after successful payment
        localStorage.removeItem('kasirku_cart');
    }, []);

    const goToOrderStatus = () => {
        router.visit(`/order/${order_id}/status`);
    };

    const goHome = () => {
        router.visit('/');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Head title="Pembayaran Berhasil - Kasirku" />

            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-green-600">Pembayaran Berhasil!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">Terima kasih! Pembayaran Anda telah berhasil diproses. Pesanan Anda sedang dipersiapkan.</p>

                    <div className="space-y-2">
                        <Button className="w-full" onClick={goToOrderStatus}>
                            Lihat Status Pesanan
                        </Button>
                        <Button variant="outline" className="w-full" onClick={goHome}>
                            Kembali ke Beranda
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
