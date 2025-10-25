/**
 * PrinterStatus Component
 * Simplified status display with test print button
 * Works with PrinterConnection component for connection management
 */

import { useState, useEffect } from 'react';
import Button from './Button';
import printerService from '../services/printerService';

export default function PrinterStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // Listen to connection changes
    printerService.setOnConnectionChange((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setTestResult(null);
      }
    });

    // Check initial connection status
    setIsConnected(printerService.getConnectionStatus());

    return () => {
      printerService.setOnConnectionChange(null);
    };
  }, []);

  const handleTestPrint = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      await printerService.printTestPage();
      setTestResult({ success: true, message: 'Test imprimé avec succès!' });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setTestResult(null);
      }, 3000);
    } catch (error) {
      console.error('Test print error:', error);
      setTestResult({ success: false, message: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  // Only show test button when connected
  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {/* Test Print Button */}
      <Button
        size="sm"
        variant="secondary"
        onClick={handleTestPrint}
        disabled={isTesting}
      >
        {isTesting ? 'Impression...' : 'Test d\'impression'}
      </Button>

      {/* Test Result Message */}
      {testResult && (
        <div
          className="absolute top-full mt-2 right-0 px-3 py-2 rounded-lg text-sm max-w-xs z-50"
          style={{
            backgroundColor: testResult.success ? '#d1fae5' : '#fee2e2',
            color: testResult.success ? '#065f46' : '#991b1b',
            border: testResult.success ? '1px solid #6ee7b7' : '1px solid #fca5a5',
          }}
        >
          {testResult.success ? '✓' : '✕'} {testResult.message}
        </div>
      )}
    </div>
  );
}
