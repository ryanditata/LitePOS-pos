import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, router } from '@inertiajs/react';
import { XCircle } from 'lucide-react';

export default function PaymentError() {
    const goHome = () => {
        router.visit('/');
    };

    const tryAgain = () => {
        router.visit('/checkout');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Head title="Pembayaran Gagal - Kasirku" />

            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-red-600">Pembayaran Gagal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Maaf, terjadi kesalahan saat memproses pembayaran Anda. Silakan coba lagi atau hubungi kasir untuk bantuan.
                    </p>

                    <div className="space-y-2">
                        <Button className="w-full" onClick={tryAgain}>
                            Coba Lagi
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
