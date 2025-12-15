/**
 * Utilitários para debug de autenticação
 * Ajuda a identificar quando e onde o logout está acontecendo
 */

export class AuthDebug {
  private static enabled = true; // Mude para false em produção

  static log(message: string, data?: any) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString();
    const stack = new Error().stack?.split('\n')[2]?.trim();
    
    console.log(`[AUTH DEBUG ${timestamp}] ${message}`, data || '', `\n  at ${stack}`);
  }

  static logTokenState() {
    if (!this.enabled) return;
    
    const authToken = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const authStorage = localStorage.getItem('auth-storage');
    
    console.log('[AUTH DEBUG] Current Token State:', {
      hasAuthToken: !!authToken,
      authTokenLength: authToken?.length || 0,
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length || 0,
      authStorageExists: !!authStorage,
      timestamp: new Date().toISOString(),
    });
  }

  static trackLogout(source: string) {
    if (!this.enabled) return;
    
    const stack = new Error().stack;
    console.warn(`[AUTH DEBUG] LOGOUT TRIGGERED from: ${source}`, {
      timestamp: new Date().toISOString(),
      stack: stack,
      currentPath: window.location.pathname,
    });
  }

  static trackTokenRefresh(success: boolean, error?: any) {
    if (!this.enabled) return;
    
    console.log(`[AUTH DEBUG] Token Refresh ${success ? 'SUCCESS' : 'FAILED'}`, {
      timestamp: new Date().toISOString(),
      error: error?.message || null,
      currentPath: window.location.pathname,
    });
  }
}

// Monitora mudanças no localStorage
if (typeof window !== 'undefined') {
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  const originalClear = localStorage.clear;

  localStorage.setItem = function(key: string, value: string) {
    if (key === 'auth_token' || key === 'refresh_token' || key === 'auth-storage') {
      AuthDebug.log(`localStorage.setItem('${key}')`, { valueLength: value.length });
    }
    return originalSetItem.apply(this, [key, value]);
  };

  localStorage.removeItem = function(key: string) {
    if (key === 'auth_token' || key === 'refresh_token' || key === 'auth-storage') {
      AuthDebug.log(`localStorage.removeItem('${key}')`);
    }
    return originalRemoveItem.apply(this, [key]);
  };

  localStorage.clear = function() {
    AuthDebug.log('localStorage.clear() called');
    return originalClear.apply(this);
  };
}
