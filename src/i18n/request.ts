import {getRequestConfig} from 'next-intl/server';

// Default locale is English
const DEFAULT_LOCALE = 'en';

export default getRequestConfig(async () => {
  // For static generation, we'll use the default locale
  // The actual locale switching will happen client-side
  const locale = DEFAULT_LOCALE;
  
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
}); 