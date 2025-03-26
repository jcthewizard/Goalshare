/**
 * Network debugging utilities - simplified version without external dependencies
 */
export const NetworkDebug = {
  /**
   * Basic connectivity check using fetch
   */
  async checkConnection(): Promise<boolean> {
    console.log('🔍 NETWORK: Checking connection status...');
    try {
      // Try to connect to Google as a basic connectivity test
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const isConnected = response.status >= 200 && response.status < 400;
      console.log('🔗 NETWORK: Is connected?', isConnected ? 'Yes' : 'No');
      return isConnected;
    } catch (error) {
      console.error('❌ NETWORK: Error checking connection:', error);
      return false;
    }
  },
  
  /**
   * Tests connectivity to a specific URL
   */
  async testEndpoint(url: string): Promise<boolean> {
    console.log(`🔍 NETWORK: Testing connectivity to ${url}...`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      clearTimeout(timeoutId);
      
      console.log(`✅ NETWORK: Endpoint ${url} is reachable, status:`, response.status);
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      console.error(`❌ NETWORK: Endpoint ${url} is NOT reachable:`, error);
      return false;
    }
  },
  
  /**
   * Tests connection to endpoint using XMLHttpRequest (alternative to fetch)
   */
  testWithXHR(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      console.log(`🔍 NETWORK: Testing with XHR to ${url}...`);
      const xhr = new XMLHttpRequest();
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          const success = xhr.status >= 200 && xhr.status < 400;
          console.log(`${success ? '✅' : '❌'} NETWORK: XHR ${success ? 'succeeded' : 'failed'} with status:`, xhr.status);
          resolve(success);
        }
      };
      
      xhr.onerror = function() {
        console.error('❌ NETWORK: XHR failed with error');
        resolve(false);
      };
      
      xhr.timeout = 5000;
      xhr.ontimeout = function() {
        console.error('❌ NETWORK: XHR timed out');
        resolve(false);
      };
      
      try {
        xhr.open('HEAD', url, true);
        xhr.send();
      } catch (error) {
        console.error('❌ NETWORK: XHR setup error:', error);
        resolve(false);
      }
    });
  },
  
  /**
   * Comprehensive network debug that runs all checks
   */
  async runFullDiagnostics(apiUrl: string): Promise<void> {
    console.log('🔧 NETWORK: Starting full diagnostics...');
    
    // Check basic connectivity
    const isConnected = await this.checkConnection();
    console.log('🔧 NETWORK: Basic connectivity:', isConnected ? 'GOOD' : 'POOR');
    
    // Extract hostname from API URL
    let hostname = '';
    try {
      hostname = new URL(apiUrl).hostname;
      console.log('🔧 NETWORK: Testing hostname:', hostname);
    } catch (error) {
      console.error('❌ NETWORK: Invalid API URL:', apiUrl);
      hostname = apiUrl.replace(/^https?:\/\//, '').split('/')[0];
    }
    
    // Test API endpoint with both methods
    const apiReachable = await this.testEndpoint(apiUrl);
    console.log('🔧 NETWORK: API endpoint reachability (fetch):', apiReachable ? 'GOOD' : 'FAILED');
    
    const apiReachableXHR = await this.testWithXHR(apiUrl);
    console.log('🔧 NETWORK: API endpoint reachability (XHR):', apiReachableXHR ? 'GOOD' : 'FAILED');
    
    // Test general internet 
    const googleReachable = await this.testEndpoint('https://www.google.com');
    console.log('🔧 NETWORK: Internet connectivity:', googleReachable ? 'GOOD' : 'FAILED');
    
    // Display connection information
    console.log('📊 NETWORK: Diagnostics results');
    console.log('- Internet connectivity:', googleReachable ? '✅' : '❌');
    console.log('- API connectivity (fetch):', apiReachable ? '✅' : '❌');
    console.log('- API connectivity (XHR):', apiReachableXHR ? '✅' : '❌');
    
    console.log('🔧 NETWORK: Diagnostics complete!');
    console.log('📊 NETWORK: Summary:', 
      (isConnected && (apiReachable || apiReachableXHR) && googleReachable)
        ? 'All systems operational' 
        : 'Connectivity issues detected'
    );
    
    // Provide troubleshooting tips
    if (!googleReachable) {
      console.log('💡 TIP: Cannot connect to internet. Check your device\'s network connection.');
    } else if (!apiReachable && !apiReachableXHR) {
      console.log('💡 TIP: Internet works but API unreachable. Check if:');
      console.log('  1. The API server is running at', apiUrl);
      console.log('  2. Your API URL is correct');
      console.log('  3. There are no firewalls blocking the connection');
    }
  }
};

export default NetworkDebug; 