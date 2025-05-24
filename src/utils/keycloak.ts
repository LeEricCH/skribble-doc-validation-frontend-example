import Keycloak from 'keycloak-js';

// Create a Keycloak instance once
let keycloakInstance: Keycloak | null = null;

/**
 * Initialize Keycloak instance
 */
export const initKeycloak = async () => {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering check
  }

  if (!keycloakInstance) {
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
    
    try {
      // Initialize Keycloak with check-sso
      const authenticated = await keycloakInstance.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
        checkLoginIframe: false,  // Turn this off to avoid issues with iframes
        enableLogging: true, // Enable logging for debugging
      });
      
      console.log('Keycloak init success, authenticated:', authenticated);
      
      if (authenticated) {
        // Set up token refresh
        setInterval(() => {
          keycloakInstance?.updateToken(70).catch(() => {
            console.log('Failed to refresh token, logging out');
            logout();
          });
        }, 60000); // Check every minute
      }
      
      return keycloakInstance;
    } catch (error) {
      console.error('Failed to initialize Keycloak', error);
      keycloakInstance = null;
      return null;
    }
  }
  
  return keycloakInstance;
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
      await kc.logout({
        redirectUri: window.location.origin,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect to home page in case of logout error
      window.location.href = window.location.origin;
    }
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
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
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