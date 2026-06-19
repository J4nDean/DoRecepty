import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchFavorites, addFavorite, removeFavorite } from '../lib/api';

const STORAGE_PREFIX = 'rx_favorite_pharmacies';

const storageKey = (userId: string | null) =>
  userId ? `${STORAGE_PREFIX}_${userId}` : STORAGE_PREFIX;

const readFromStorage = (userId: string | null): Set<string> => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
};

const writeToStorage = (userId: string | null, ids: Set<string>) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify([...ids]));
  } catch {
    return;
  }
};

export const useFavoritePharmacies = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [favorites, setFavorites] = useState<Set<string>>(() => readFromStorage(userId));

  useEffect(() => {
    setFavorites(readFromStorage(userId));
    if (!userId) return;

    let cancelled = false;
    fetchFavorites(userId)
      .then(ids => {
        if (cancelled) return;
        const remote = new Set(ids);
        setFavorites(remote);
        writeToStorage(userId, remote);
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
  }, [userId]);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  const toggleFavorite = useCallback((pharmacyId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      const willAdd = !next.has(pharmacyId);
      if (willAdd) next.add(pharmacyId);
      else next.delete(pharmacyId);
      writeToStorage(userId, next);

      if (userId) {
        const call = willAdd ? addFavorite(userId, pharmacyId) : removeFavorite(userId, pharmacyId);
        call.catch(() => {
          setFavorites(rollback => {
            const reverted = new Set(rollback);
            if (willAdd) reverted.delete(pharmacyId);
            else reverted.add(pharmacyId);
            writeToStorage(userId, reverted);
            return reverted;
          });
        });
      }
      return next;
    });
  }, [userId]);

  return { favorites, isFavorite, toggleFavorite };
};
