import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

// Default locale is English
const DEFAULT_LOCALE = 'en';

export default getRequestConfig(async () => {
  // Get locale from cookies
  let locale = DEFAULT_LOCALE;
  
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('locale');
    if (localeCookie?.value) {
      locale = localeCookie.value;
    }
  } catch (error) {
    // Fallback to default locale if there's any error
    console.error('Error getting locale from cookies:', error);
  }
  
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
}); 