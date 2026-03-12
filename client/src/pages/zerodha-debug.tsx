import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ZerodhaDebug() {
  const [token, setToken] = useState<string>('');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('zerodha_token') || '';
    setToken(storedToken);
  }, []);

  const fetchRealProfile = async () => {
    if (!token) {
      setError('No Zerodha token found. Please login first.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/zerodha/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setProfileData(data);
        console.log('✅ REAL ZERODHA PROFILE DATA:', data);
      } else {
        setError(`Error: ${data.error || 'Failed to fetch profile'}`);
      }
    } catch (err: any) {
      setError(`Connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Zerodha Connection Debug</h1>

        {/* Token Status */}
        <Card>
          <CardHeader>
            <CardTitle>Zerodha Token Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Stored Token:</p>
              <p className="font-mono text-xs break-all bg-muted p-3 rounded">
                {token ? `${token.substring(0, 50)}...` : 'No token found'}
              </p>
            </div>
            <Button 
              onClick={fetchRealProfile}
              disabled={loading || !token}
              className="w-full"
            >
              {loading ? 'Fetching Real Zerodha Profile...' : 'Fetch Real Zerodha Profile Data'}
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Real Zerodha Profile Data */}
        {profileData && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">Real Zerodha Profile Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Profile Info */}
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h3 className="font-bold text-lg text-green-900 mb-4">Your Real Zerodha Details:</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold text-green-900">Client ID (user_id):</span>
                    <span className="text-lg font-bold text-green-700">{profileData.profile?.userId || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold text-green-900">Username:</span>
                    <span className="text-green-700">{profileData.profile?.username || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold text-green-900">Email:</span>
                    <span className="text-green-700">{profileData.profile?.email || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold text-green-900">Phone:</span>
                    <span className="text-green-700">{profileData.profile?.phone || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold text-green-900">Broker:</span>
                    <span className="text-green-700">{profileData.profile?.broker || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-900">Account Type:</span>
                    <span className="text-green-700">{profileData.profile?.accountType || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Raw JSON */}
              <details className="cursor-pointer">
                <summary className="font-semibold text-green-900 hover:text-green-800">Show Full Raw Data (JSON)</summary>
                <pre className="bg-white p-4 rounded-lg border border-green-200 mt-2 overflow-x-auto text-xs">
                  {JSON.stringify(profileData, null, 2)}
                </pre>
              </details>

              <div className="bg-green-100 p-3 rounded text-sm text-green-900">
                ✅ This data is fetched LIVE from Zerodha API endpoint: https://api.kite.trade/user/profile
              </div>
            </CardContent>
          </Card>
        )}

        {!profileData && !error && (
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Click the button above to fetch your real Zerodha profile data</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
