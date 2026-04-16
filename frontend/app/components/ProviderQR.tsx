import { useState } from 'react';
import QRCode from 'react-qr-code';

export default function ProviderQR({ orderId }: { orderId: number }) {
  const [token, setToken] = useState<string | null>(null);

  const handleArrive = async () => {
    const res = await fetch(`http://127.0.0.1:8000/orders/${orderId}/arrive`, { method: 'POST' });
    const data = await res.json();
    setToken(data.qr_token);
  };

  return (
    <div className="p-4 border rounded shadow-md text-center">
      {!token ? (
        <button onClick={handleArrive} className="bg-blue-500 text-white p-2 rounded">
          I Have Arrived
        </button>
      ) : (
        <div>
          <h3 className="mb-4 font-bold">Buyer must scan this:</h3>
          <div className="bg-white p-2 inline-block">
            <QRCode value={token} size={200} />
          </div>
          <p className="mt-2 text-red-500 text-sm">Expires in 5 minutes</p>
        </div>
      )}
    </div>
  );
}