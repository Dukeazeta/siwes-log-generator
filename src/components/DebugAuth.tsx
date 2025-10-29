'use client';

import { useState, useEffect } from 'react';
import { getAuthDebugInfo, runApiConnectivityTest, logAuthDebugInfo } from '../lib/debug-auth';
import { Button } from './ui/button';

export function DebugAuth() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logAuthDebugInfo('Initial Auth Debug');
    }
  }, []);

  const handleRefreshDebugInfo = async () => {
    setLoading(true);
    try {
      const info = await getAuthDebugInfo();
      setDebugInfo(info);
    } catch (error) {
      console.error('Failed to get debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunApiTest = async () => {
    await runApiConnectivityTest();
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-black/90 text-white rounded-lg text-xs font-mono max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-yellow-400">🔍 Auth Debug</span>
        <div className="space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshDebugInfo}
            disabled={loading}
            className="h-6 px-2 text-xs"
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunApiTest}
            className="h-6 px-2 text-xs"
          >
            Test API
          </Button>
        </div>
      </div>

      {debugInfo && (
        <div className="space-y-1">
          <div>Env: {debugInfo.environment}</div>
          <div>Supabase: {debugInfo.supabaseConfigured ? '✅' : '❌'}</div>
          <div>Session: {debugInfo.sessionExists ? '✅' : '❌'}</div>
          {debugInfo.errors.length > 0 && (
            <div className="text-red-400">
              Errors: {debugInfo.errors.length}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        :global(body) {
          margin-bottom: 200px;
        }
      `}</style>
    </div>
  );
}