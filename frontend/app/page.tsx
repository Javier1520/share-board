'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAppStore();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      router.push('/rooms');
    }
  }, [user, router]);

  return null;
}
