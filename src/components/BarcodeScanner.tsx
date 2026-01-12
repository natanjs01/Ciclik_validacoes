import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Scan, X, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onCancel: () => void;
  mode: 'barcode' | 'qrcode';
}

export default function BarcodeScanner({ onScan, onCancel, mode }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [shouldInitScanner, setShouldInitScanner] = useState(false);

  const initScanner = async () => {
    try {
      const scanner = new Html5Qrcode('scanner-container');
      scannerRef.current = scanner;

      const config = mode === 'qrcode' 
        ? {
            fps: 10,
            qrbox: { width: 300, height: 300 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.DATA_MATRIX,
            ],
          }
        : {
            fps: 10,
            qrbox: { width: 400, height: 200 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.ITF,
              Html5QrcodeSupportedFormats.CODE_93,
            ],
          };

      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          stopScanner();
          onScan(decodedText);
        },
        (error) => {
          // Ignore errors durante scanning (muitos falsos positivos)
        }
      );
    } catch (error) {
      console.error('[BarcodeScanner] Erro ao iniciar scanner:', error);
      setIsScanning(false);
      setShouldInitScanner(false);
    }
  };

  const startScanner = () => {
    setIsScanning(true);
    setShouldInitScanner(true);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // Html5QrcodeScannerState.SCANNING
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (error) {
        // Ignore stop errors - scanner may already be stopped
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (shouldInitScanner && isScanning) {
      initScanner();
      setShouldInitScanner(false);
    }
  }, [shouldInitScanner, isScanning]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-4">
      {!isScanning ? (
        <div className="flex gap-2">
          <Button onClick={startScanner} className="flex-1">
            <Scan className="mr-2 h-4 w-4" />
            {mode === 'qrcode' ? 'Escanear QR Code' : 'Escanear Código de Barras'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">
                Procurando {mode === 'qrcode' ? 'QR Code' : 'código de barras'}...
              </span>
            </div>
            <div id="scanner-container" className="w-full rounded-lg overflow-hidden border-2 border-primary/20" />
          </div>
          <Button variant="outline" onClick={() => { stopScanner(); onCancel(); }} className="w-full">
            Cancelar Scan
          </Button>
        </>
      )}
    </div>
  );
}
