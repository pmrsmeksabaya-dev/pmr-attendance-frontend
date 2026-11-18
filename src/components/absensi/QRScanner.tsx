'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

interface Props {
  onScan: (token: string) => void;
}

export function QRScanner({ onScan }: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  const safeCleanup = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // Abaikan error cleanup saat komponen sudah unmount
    }
  };

  const startScanner = async () => {
    if (isStarting || isScanning) return;
    setError(null);
    setIsStarting(true);
    hasScannedRef.current = false;

    try {
      await safeCleanup();
      scannerRef.current = new Html5Qrcode('qr-reader');

      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          // Kunci agar hanya 1 hasil scan yang diproses
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;

          safeCleanup().finally(() => {
            setIsScanning(false);
            onScan(decodedText);
          });
        },
        () => {
          /* Abaikan error per-frame saat mencari QR */
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      const rawMsg = String(err?.message || err || '');
      if (rawMsg.includes('NotAllowedError') || rawMsg.includes('Permission')) {
        setError('Izin kamera ditolak. Aktifkan izin kamera pada pengaturan browser Anda.');
      } else if (rawMsg.includes('NotFoundError')) {
        setError('Kamera tidak ditemukan pada perangkat ini.');
      } else {
        setError('Gagal membuka kamera. Pastikan tidak ada aplikasi lain yang memakai kamera.');
      }
      setIsScanning(false);
    } finally {
      setIsStarting(false);
    }
  };

  const stopScanner = async () => {
    await safeCleanup();
    setIsScanning(false);
  };

  // Cleanup otomatis saat berpindah halaman
  useEffect(() => {
    return () => {
      safeCleanup();
    };
  }, []);

  return (
    <div className="space-y-3">
      {!isScanning && (
        <button
          type="button"
          onClick={startScanner}
          disabled={isStarting}
          className="w-full bg-pmr-red text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-pmr-red-dark disabled:opacity-60 transition"
        >
          {isStarting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Membuka Kamera...
            </>
          ) : (
            <>
              <Camera size={20} />
              Buka Kamera
            </>
          )}
        </button>
      )}

      {isScanning && (
        <button
          type="button"
          onClick={stopScanner}
          className="w-full bg-gray-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition"
        >
          <CameraOff size={20} />
          Hentikan Kamera
        </button>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs text-center">
          {error}
        </div>
      )}

      <div
        id="qr-reader"
        className={`w-full max-w-sm mx-auto overflow-hidden rounded-xl border-2 bg-gray-50 ${
          isScanning ? 'border-pmr-red min-h-[260px]' : 'border-gray-200'
        }`}
      />
    </div>
  );
}