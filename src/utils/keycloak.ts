import Keycloak from 'keycloak-js';

// Create a Keycloak instance once
let keycloakInstance: Keycloak | null = null;
let initPromise: Promise<Keycloak | null> | null = null;

/**
 * Initialize Keycloak instance
 */
export const initKeycloak = async (): Promise<Keycloak | null> => {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering check
  }

  // Return existing promise if initialization is already in progress
  if (initPromise) {
    return initPromise;
  }

  // Return existing instance if already initialized and authenticated
  if (keycloakInstance?.authenticated) {
    return keycloakInstance;
  }

  initPromise = (async () => {
    try {
      console.log('Creating new Keycloak instance with:',
        'URL:', process.env.NEXT_PUBLIC_KEYCLOAK_URL,
        'Realm:', process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
        'ClientID:', process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
      );
      
      keycloakInstance = new Keycloak({
        url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || '',
        realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || '',
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || '',
      });
      
      // Initialize Keycloak with improved settings for session persistence
      const authenticated = await keycloakInstance.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        silentCheckSsoFallback: false, // Don't fall back if silent check fails
        pkceMethod: 'S256',
        checkLoginIframe: false,  // Turn this off to avoid issues with iframes
        enableLogging: true, // Enable logging for debugging
        // Improve token handling
        token: localStorage.getItem('kc-token') || undefined,
        refreshToken: localStorage.getItem('kc-refresh-token') || undefined,
        idToken: localStorage.getItem('kc-id-token') || undefined,
        // Configure response mode
        responseMode: 'fragment',
      });
      
      console.log('Keycloak init success, authenticated:', authenticated);
      
      if (authenticated && keycloakInstance.token) {
        console.log('User is authenticated, setting up token management');
        
        // Store tokens in localStorage for persistence
        localStorage.setItem('kc-token', keycloakInstance.token);
        if (keycloakInstance.refreshToken) {
          localStorage.setItem('kc-refresh-token', keycloakInstance.refreshToken);
        }
        if (keycloakInstance.idToken) {
          localStorage.setItem('kc-id-token', keycloakInstance.idToken);
        }
        
        // Set up token refresh with better error handling
        setInterval(() => {
          if (keycloakInstance?.authenticated) {
            keycloakInstance.updateToken(70).then((refreshed) => {
              if (refreshed && keycloakInstance) {
                console.log('Token refreshed successfully');
                // Update stored tokens
                if (keycloakInstance.token) {
                  localStorage.setItem('kc-token', keycloakInstance.token);
                }
                if (keycloakInstance.refreshToken) {
                  localStorage.setItem('kc-refresh-token', keycloakInstance.refreshToken);
                }
                if (keycloakInstance.idToken) {
                  localStorage.setItem('kc-id-token', keycloakInstance.idToken);
                }
              } else {
                console.log('Token is still valid');
              }
            }).catch((error) => {
              console.error('Failed to refresh token:', error);
              // Clear stored tokens and logout
              clearStoredTokens();
              logout();
            });
          }
        }, 60000); // Check every minute
        
        // Listen for token events
        keycloakInstance.onTokenExpired = () => {
          console.log('Token expired, attempting refresh');
          keycloakInstance?.updateToken(5).catch(() => {
            console.log('Token refresh failed, logging out');
            clearStoredTokens();
            logout();
          });
        };
        
        // Listen for auth logout
        keycloakInstance.onAuthLogout = () => {
          console.log('Auth logout detected');
          clearStoredTokens();
        };
      } else {
        console.log('User is not authenticated after init');
        clearStoredTokens();
      }
      
      return keycloakInstance;
    } catch (error) {
      console.error('Failed to initialize Keycloak:', error);
      clearStoredTokens();
      keycloakInstance = null;
      return null;
    } finally {
      initPromise = null;
    }
  })();
  
  return initPromise;
};

/**
 * Clear stored tokens from localStorage
 */
const clearStoredTokens = () => {
  localStorage.removeItem('kc-token');
  localStorage.removeItem('kc-refresh-token');
  localStorage.removeItem('kc-id-token');
};

/**
 * Get the Keycloak instance
 */
export const getKeycloak = () => keycloakInstance;

/**
 * Trigger Keycloak login
 */
export const login = async () => {
  try {
    const kc = await initKeycloak();
    
    if (kc && !kc.authenticated) {
      await kc.login({
        redirectUri: window.location.origin,
      });
    } else if (kc?.authenticated && kc.token) {
      // Already authenticated, make sure tokens are stored
      localStorage.setItem('kc-token', kc.token);
      if (kc.refreshToken) {
        localStorage.setItem('kc-refresh-token', kc.refreshToken);
      }
      if (kc.idToken) {
        localStorage.setItem('kc-id-token', kc.idToken);
      }
    }
    
    return kc?.token || null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

/**
 * Trigger Keycloak logout
 */
export const logout = async () => {
  const kc = getKeycloak();
  if (kc) {
    try {
      // Clear stored tokens first
      clearStoredTokens();
      
      await kc.logout({
        redirectUri: window.location.origin,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Clear tokens even if logout fails
      clearStoredTokens();
      // Force redirect to home page in case of logout error
      window.location.href = window.location.origin;
    }
  } else {
    // Clear tokens even if no keycloak instance
    clearStoredTokens();
  }
};

/**
 * Check if the user is authenticated
 */
export const isAuthenticated = () => {
  const kc = getKeycloak();
  return !!kc?.authenticated;
};

/**
 * Get user info from the Keycloak token
 */
export const getUserInfo = () => {
  const kc = getKeycloak();
  if (!kc || !kc.tokenParsed) {
    return null;
  }
  
  return {
    id: kc.subject,
    username: kc.tokenParsed.preferred_username,
    email: kc.tokenParsed.email,
    name: kc.tokenParsed.name,
    givenName: kc.tokenParsed.given_name,
    familyName: kc.tokenParsed.family_name,
    roles: kc.tokenParsed.realm_access?.roles || [],
  };
};

/**
 * Get the JWT token from Keycloak
 */
export const getToken = () => {
  const kc = getKeycloak();
  return kc?.token || null;
};

export const handleAuthCallback = async () => {
  const kc = getKeycloak();
  if (kc && !kc.authenticated && window.location.hash) {
    try {
      await kc.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        pkceMethod: 'S256',
      });
      
      if (!kc.authenticated) {
        console.log('Processing Keycloak callback...');
        await kc.login({ 
          redirectUri: window.location.origin,
          prompt: 'none'
        });
      }
      
      return kc.authenticated;
    } catch (error) {
      console.error('Error processing auth callback:', error);
      return false;
    }
  }
  return kc?.authenticated || false;
}; 