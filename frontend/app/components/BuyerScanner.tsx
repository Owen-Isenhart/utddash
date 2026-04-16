import { Scanner } from '@yudiel/react-qr-scanner';

export default function BuyerScanner({ orderId }: { orderId: number }) {
  const onScan = async (result: any) => {
    if (result?.[0]?.rawValue) {
      const scannedToken = result[0].rawValue;
      
      const response = await fetch(`http://127.0.0.1:8000/orders/${orderId}/verify-handshake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanned_token: scannedToken }),
      });

      if (response.ok) {
        alert("Success! Order completed.");
      } else {
        alert("Verification failed. Try again.");
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Scanner onScan={onScan} />
      <p className="text-center mt-2">Point camera at Provider's QR Code</p>
    </div>
  );
}