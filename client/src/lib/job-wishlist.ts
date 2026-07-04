export const getWishlistStorageKey = (candidateId: string) =>
  `career-scope:candidate:${candidateId}:job-wishlist`;

export const readWishlist = (storageKey: string) => {
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsedValue)) {
      return new Set<number>();
    }

    return new Set(
      parsedValue
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    );
  } catch {
    return new Set<number>();
  }
};

export const writeWishlist = (storageKey: string, jobIds: Set<number>) => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...jobIds]));
  } catch {
    // localStorage can be unavailable in private browsing or restricted environments.
  }
};
