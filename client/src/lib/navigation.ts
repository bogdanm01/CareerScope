export const getPanelHomePath = (role?: string) => (role === 'Admin' ? '/panel/admin' : '/panel');

export const getSafeReturnTo = (value: string | null | undefined, fallback: string) => {
  const trimmedValue = value?.trim();

  if (
    !trimmedValue ||
    !trimmedValue.startsWith('/') ||
    trimmedValue.startsWith('//') ||
    trimmedValue.includes('\\') ||
    Array.from(trimmedValue).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  ) {
    return fallback;
  }

  return trimmedValue;
};

export const getPostAuthRedirectPath = (role?: string, returnTo?: string | null) =>
  getSafeReturnTo(returnTo, getPanelHomePath(role));
