import { useEffect, useRef } from 'react';
import jazzicon from '@metamask/jazzicon';

export function AvatarBlockie({ address, size = 32, className = '' }: { address: string; size?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && address) {
      ref.current.innerHTML = '';
      ref.current.appendChild(jazzicon(size, parseInt(address.slice(2, 10), 16)));
    }
  }, [address, size]);
  return <div ref={ref} className={className} style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden' }} />;
}
