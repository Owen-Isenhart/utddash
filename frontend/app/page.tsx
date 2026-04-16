"use client";
import { useState } from "react";
import ProviderQR from "./components/ProviderQR";
import BuyerScanner from "./components/BuyerScanner";

export default function Home() {
  const [role, setRole] = useState<"provider" | "buyer">("provider");
  // We'll use Order ID 1 for testing
  const testOrderId = 1;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">UTDDash Handshake</h1>
      
      <div className="flex gap-4 mb-10">
        <button 
          onClick={() => setRole("provider")}
          className={`px-6 py-2 rounded ${role === "provider" ? "bg-orange-500" : "bg-gray-700"}`}
        >
          Provider View
        </button>
        <button 
          onClick={() => setRole("buyer")}
          className={`px-6 py-2 rounded ${role === "buyer" ? "bg-orange-500" : "bg-gray-700"}`}
        >
          Buyer View
        </button>
      </div>

      <div className="bg-white text-black p-8 rounded-xl shadow-2xl w-full max-w-md">
        {role === "provider" ? (
          <ProviderQR orderId={testOrderId} />
        ) : (
          <BuyerScanner orderId={testOrderId} />
        )}
      </div>
    </main>
  );
}