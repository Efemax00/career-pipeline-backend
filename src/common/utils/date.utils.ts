export const toISOString = (date: Date): string => date.toISOString();

export const formatDate = (date: Date, locale = 'en-US'): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const isPastDate = (date: Date): boolean => {
  return new Date() > date;
};