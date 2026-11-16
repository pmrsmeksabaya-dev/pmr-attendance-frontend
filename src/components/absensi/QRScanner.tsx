'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';

interface Props {
  onScan: (token: string) => void;
}

export function QRScanner({ onScan }: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    setError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Hentikan scan setelah dapat 1 QR
          scannerRef.current?.stop().then(() => {
            setIsScanning(false);
            onScan(decodedText);
          });
        },
        () => {} // ignore error per frame
      );
      setIsScanning(true);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengakses kamera. Pastikan izin kamera diberikan.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  return (
    <div className="space-y-3">
      {!isScanning && (
        <button
          onClick={startScanner}
          className="w-full bg-pmr-red text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-pmr-red-dark transition"
        >
          <Camera size={20} />
          Buka Kamera
        </button>
      )}

      {isScanning && (
        <button
          onClick={stopScanner}
          className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <CameraOff size={20} />
          Hentikan Kamera
        </button>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <div
        id="qr-reader"
        className={`w-full max-w-sm mx-auto overflow-hidden rounded-xl border-2 ${
          isScanning ? 'border-pmr-red' : 'border-gray-200'
        }`}
      ></div>
    </div>
  );
}