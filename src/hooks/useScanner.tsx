
import { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

interface ScannerOptions {
  onDetected: (result: string) => void;
}

export function useScanner({ onDetected }: ScannerOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize the barcode reader
  useEffect(() => {
    // Create hints to optimize for ISBN barcodes
    const hints = new Map();
    const formats = [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_128
    ];
    
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);
    
    // Create and configure the reader
    const reader = new BrowserMultiFormatReader(hints, 500); // 500ms timeBetweenScans
    
    readerRef.current = reader;
    
    return () => {
      stopScanning();
      
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  // Function to stop scanning
  const stopScanning = useCallback(() => {
    console.log('Stopping scanner');
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (readerRef.current) {
      readerRef.current.reset();
    }
    
    setIsScanning(false);
  }, []);

  // Get available cameras
  const getCameras = useCallback(async () => {
    try {
      setError('');
      
      // Request camera permissions first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop this initial stream after getting permission
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('Camera permission error:', err);
        setError('Camera permission denied. Please enable camera access in your browser settings.');
        return;
      }
      
      if (!readerRef.current) return;
      
      const devices = await readerRef.current.listVideoInputDevices();
      console.log('Available cameras:', devices);
      setCameras(devices);
      
      if (devices.length > 0 && !selectedCamera) {
        // Select the back camera by default if it exists
        const backCamera = devices.find(device => 
          device.label?.toLowerCase().includes('back') || 
          device.label?.toLowerCase().includes('traseira') ||
          device.label?.toLowerCase().includes('rear')
        );
        
        const cameraToUse = backCamera?.deviceId || devices[0].deviceId;
        console.log('Auto-selecting camera:', cameraToUse, backCamera?.label || devices[0].label);
        setSelectedCamera(cameraToUse);
      }
    } catch (err) {
      console.error('Error accessing cameras:', err);
      setError('Could not access cameras. Please check your permissions.');
    }
  }, [selectedCamera]);

  // Start scanning for barcodes
  const startScanning = useCallback(async () => {
    try {
      setError('');
      console.log('Starting scan, selected camera:', selectedCamera);
      
      if (!readerRef.current) {
        console.error('Reader not initialized');
        return;
      }
      
      if (!selectedCamera) {
        if (cameras.length === 0) {
          console.log('No cameras found, requesting cameras');
          await getCameras();
          return;
        }
      }
      
      // Make sure we're not already scanning
      if (isScanning) {
        console.log('Already scanning, stopping first');
        stopScanning();
      }
      
      setIsScanning(true);
      console.log('Starting decoding from device:', selectedCamera);
      
      // Reset the reader before starting
      readerRef.current.reset();
      
      // Start decoding from the selected camera
      try {
        // Corrigindo o problema de tipagem aqui
        const promise = readerRef.current.decodeFromVideoDevice(
          selectedCamera,
          'video-preview',
          (result, error) => {
            if (result) {
              console.log('Code detected:', result.getText());
              const text = result.getText();
              onDetected(text);
            }
            
            if (error && !(error instanceof Error)) {
              // Ignore normal operation errors
            }
          }
        );
        
        // promise não é um MediaStream, mas precisa ser armazenado para ser interrompido depois
        // Armazenar o stream real quando disponível
        if (promise) {
          // A biblioteca não retorna o stream diretamente, vamos pegá-lo manualmente
          setTimeout(() => {
            const videoElement = document.getElementById('video-preview') as HTMLVideoElement;
            if (videoElement && videoElement.srcObject instanceof MediaStream) {
              streamRef.current = videoElement.srcObject;
            }
          }, 500);
        }
      } catch (scanErr) {
        console.error('Error in decoding process:', scanErr);
        setError('Error initializing camera scanner.');
        setIsScanning(false);
      }
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start the barcode scanner.');
      setIsScanning(false);
    }
  }, [cameras, getCameras, onDetected, selectedCamera, isScanning, stopScanning]);

  // Change selected camera
  const changeCamera = useCallback((deviceId: string) => {
    console.log('Changing camera to:', deviceId);
    if (isScanning) {
      stopScanning();
    }
    
    setSelectedCamera(deviceId);
    
    // Restart scanning after a short delay
    setTimeout(() => {
      if (deviceId) {
        startScanning();
      }
    }, 500);
  }, [isScanning, startScanning, stopScanning]);

  return {
    isScanning,
    startScanning,
    stopScanning,
    cameras,
    selectedCamera,
    changeCamera,
    getCameras,
    error
  };
}
