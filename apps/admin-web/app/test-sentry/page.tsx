'use client';

import { useEffect } from 'react';

export default function TestSentry() {
  useEffect(() => {
    throw new Error('Sentry Frontend Test Error!');
  }, []);

  return null;
}
