'use client';

import { useEffect, useRef, useState, useId } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  Loader2,
  ImagePlus,
  SwitchCamera,
  ScanLine,
} from 'lucide-react';

interface Props {
  onScan: (token: string) => void;
}

interface CameraDevice {
  id: string;
  label: string;
}

export function QRScanner({ onScan }: Props) {
  const rawId = useId();
  const readerId = `qr-reader-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasScannedRef = useRef(false);

  const triggerSuccessFeedback = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(120);
      }
    } catch {
      // Abaikan jika browser tidak mendukung vibration API
    }
  };

  const safeCleanup = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // Abaikan error cleanup saat transisi atau komponen sudah unmount
    } finally {
      scannerRef.current = null;
    }
  };

  const startScanner = async (overrideCameraId?: string) => {
    if (isStarting || isScanning) return;
    setError(null);
    setIsStarting(true);
    hasScannedRef.current = false;

    try {
      await safeCleanup();
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      const cameraConfig = overrideCameraId
        ? { deviceId: { exact: overrideCameraId } }
        : { facingMode: 'environment' };

      await scanner.start(
        cameraConfig,
        {
          fps: 12,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;
          triggerSuccessFeedback();

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

      // Ambil daftar kamera setelah izin kamera diberikan oleh pengguna
      if (cameras.length === 0) {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
            const backIdx = devices.findIndex((d) =>
              /back|rear|environment|belakang/i.test(d.label)
            );
            if (backIdx >= 0) setCameraIndex(backIdx);
          }
        } catch {
          // Abaikan jika daftar kamera tidak dapat diakses
        }
      }
    } catch (err: any) {
      const rawMsg = String(err?.message || err || '');
      if (rawMsg.includes('NotAllowedError') || rawMsg.includes('Permission')) {
        setError(
          'Izin kamera ditolak. Aktifkan izin kamera pada pengaturan browser Anda atau gunakan tombol "Pilih Gambar QR".'
        );
      } else if (rawMsg.includes('NotFoundError')) {
        setError(
          'Kamera tidak ditemukan pada perangkat ini. Silakan pindai melalui tombol "Pilih Gambar QR".'
        );
      } else {
        setError(
          'Gagal membuka kamera. Pastikan tidak ada aplikasi lain yang memakai kamera.'
        );
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

  const handleSwitchCamera = async () => {
    if (cameras.length < 2 || isStarting) return;
    const nextIdx = (cameraIndex + 1) % cameras.length;
    setCameraIndex(nextIdx);
    await safeCleanup();
    setIsScanning(false);
    await startScanner(cameras[nextIdx].id);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsReadingFile(true);

    try {
      await safeCleanup();
      setIsScanning(false);

      const fileScanner = new Html5Qrcode(readerId);
      const decodedText = await fileScanner.scanFile(file, false);
      fileScanner.clear();

      triggerSuccessFeedback();
      onScan(decodedText);
    } catch {
      setError(
        'QR Code tidak ditemukan atau gambar kurang jelas. Pastikan gambar QR terlihat utuh.'
      );
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    return () => {
      safeCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      {/* Baris Tombol Kontrol Kamera & Upload Gambar QR */}
      {!isScanning ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => startScanner()}
            disabled={isStarting || isReadingFile}
            className="w-full bg-gradient-to-r from-[#D32F2F] to-red-600 text-white py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-red-600/20 hover:brightness-105 active:scale-[0.99] disabled:opacity-60 transition-all"
          >
            {isStarting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Membuka Kamera...</span>
              </>
            ) : (
              <>
                <Camera size={18} />
                <span>Buka Kamera</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStarting || isReadingFile}
            className="w-full bg-slate-100 dark:bg-red-950/70 text-slate-700 dark:text-red-100 border border-slate-200 dark:border-red-800/60 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:text-[#D32F2F] dark:hover:bg-red-900/70 active:scale-[0.99] disabled:opacity-60 transition-all"
          >
            {isReadingFile ? (
              <>
                <Loader2 size={18} className="animate-spin text-[#D32F2F]" />
                <span>Membaca QR...</span>
              </>
            ) : (
              <>
                <ImagePlus size={18} className="text-[#D32F2F]" />
                <span>Pilih Gambar QR</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={stopScanner}
            className="flex-1 bg-slate-800 dark:bg-red-950 text-white py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-900 dark:hover:bg-red-900 transition"
          >
            <CameraOff size={18} />
            <span>Hentikan Kamera</span>
          </button>

          {cameras.length > 1 && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              title="Ganti Kamera (Depan / Belakang)"
              aria-label="Ganti Kamera"
              className="px-3.5 py-3 rounded-xl bg-red-50 dark:bg-red-950/80 text-[#D32F2F] dark:text-red-200 border border-red-200/80 dark:border-red-800/60 hover:bg-red-100 transition shrink-0"
            >
              <SwitchCamera size={18} />
            </button>
          )}
        </div>
      )}

      {/* Input file tersembunyi untuk pemindaian QR dari galeri */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800/70 text-red-700 dark:text-red-200 p-3 rounded-xl text-xs text-center leading-relaxed">
          {error}
        </div>
      )}

      {/* Area Viewport Kamera QR */}
      <div className="relative w-full max-w-sm mx-auto">
        {!isScanning && (
          <div className="w-full py-10 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-red-900/60 bg-slate-50/80 dark:bg-red-950/35 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800/60 flex items-center justify-center mb-2.5">
              <ScanLine size={24} className="text-[#D32F2F]" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-red-100">
              Kamera Belum Aktif
            </p>
            <p className="text-[11px] text-slate-400 dark:text-red-200/65 mt-0.5 max-w-[220px]">
              Tekan <b>Buka Kamera</b> untuk memindai langsung atau unggah gambar QR
            </p>
          </div>
        )}

        <div
          id={readerId}
          className={`w-full overflow-hidden rounded-2xl bg-black transition-all ${
            isScanning
              ? 'border-2 border-[#D32F2F] min-h-[260px] shadow-md'
              : 'h-0 overflow-hidden opacity-0 pointer-events-none'
          }`}
        />
      </div>
    </div>
  );
}