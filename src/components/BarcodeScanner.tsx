
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useScanner } from '@/hooks/useScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CameraOff, Camera, RefreshCw, Scan } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  onDetected: (isbn: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onDetected,
  isVisible,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const handleDetection = (result: string) => {
    // Check if it's a valid ISBN (10 or 13 digits)
    const isbnRegex = /^(?:\d{10}|\d{13})$/;
    
    if (isbnRegex.test(result)) {
      toast.success(`ISBN detected: ${result}`);
      onDetected(result);
      scanner.stopScanning();
    } else {
      toast.error('Invalid ISBN format. Please try again.');
    }
  };
  
  const scanner = useScanner({
    onDetected: handleDetection
  });
  
  // Start scanning when component becomes visible
  useEffect(() => {
    if (isVisible) {
      if (scanner.cameras.length > 0) {
        scanner.startScanning();
      } else {
        scanner.getCameras();
      }
    } else {
      scanner.stopScanning();
    }
    
    return () => {
      scanner.stopScanning();
    };
  }, [isVisible, scanner]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md mx-auto overflow-hidden animate-scale-in">
        <CardHeader className="relative">
          <CardTitle className="text-center">Scan ISBN Barcode</CardTitle>
          <Button 
            className="absolute right-4 top-4"
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <CameraOff className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {scanner.error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {scanner.error}
            </div>
          )}
          
          <div className="relative w-full aspect-video overflow-hidden rounded-md bg-black">
            {scanner.cameras.length > 0 ? (
              <>
                <video
                  id="video-preview"
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 transform -translate-y-1/2 animate-pulse"></div>
                  <div className="absolute inset-16 border-2 border-primary/50 rounded-md"></div>
                </div>
                
                {/* Status indicator */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2 bg-black/70 px-2 py-1 rounded-md">
                    <div className={`w-2 h-2 rounded-full ${scanner.isScanning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-white">{scanner.isScanning ? 'Scanning...' : 'Idle'}</span>
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-black/70 hover:bg-black/90"
                    onClick={() => scanner.isScanning ? scanner.stopScanning() : scanner.startScanning()}
                  >
                    {scanner.isScanning ? <CameraOff className="h-3 w-3 mr-1" /> : <Camera className="h-3 w-3 mr-1" />}
                    {scanner.isScanning ? 'Stop' : 'Start'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-white">
                <Scan className="h-10 w-10 mb-2 opacity-70" />
                <p className="text-sm text-center">No camera found or permission denied</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scanner.getCameras()}
                  className="mt-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            )}
          </div>
          
          {/* Camera selector */}
          {scanner.cameras.length > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm">Camera:</span>
              <Select
                value={scanner.selectedCamera}
                onValueChange={(value) => scanner.changeCamera(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {scanner.cameras.map((camera) => (
                    <SelectItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${camera.deviceId.substring(0, 4)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Position the barcode inside the viewfinder to scan</p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onDetected('9780345391803')}>
              Use Test ISBN
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarcodeScanner;
