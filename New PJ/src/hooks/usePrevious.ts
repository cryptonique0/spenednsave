import { useEffect, useRef } from 'react';

/**
 * Hook to get the previous value of a prop or state
 */
export const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T | undefined>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

export default usePrevious;
