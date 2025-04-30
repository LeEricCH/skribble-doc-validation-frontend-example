import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

// Default locale is English
const DEFAULT_LOCALE = 'en';
const SUPPORTED_LOCALES = ['en', 'de', 'fr'];

export default getRequestConfig(async ({locale}) => {
  // Try to get locale from cookies for server-side rendering
  let preferredLocale = locale || DEFAULT_LOCALE;
  
  try {
    // Check if a locale cookie is set
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('locale')?.value;
    
    // Use cookie locale if it's supported
    if (localeCookie && SUPPORTED_LOCALES.includes(localeCookie)) {
      preferredLocale = localeCookie;
    }
  } catch (error) {
    console.error('Error reading locale cookie:', error);
  }
  
  return {
    locale: preferredLocale,
    messages: (await import(`../messages/${preferredLocale}.json`)).default
  };
}); 