'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/lib/error-emitter';
import { useAuth } from '@/hooks/use-auth';

export function FirebaseErrorListener() {
  const { user } = useAuth();

  useEffect(() => {
    const handleError = async (error: any) => {
      // Add user auth context to the error
      if (user) {
        const token = await user.getIdTokenResult();
        error.setAuthContext({ uid: user.uid, token: token.claims });
      }
      
      // We are in a dev environment, throw an unhandled exception
      // to see the Next.js error overlay with rich error details.
      if (process.env.NODE_ENV === 'development') {
         // Use setTimeout to break out of the current event loop tick.
         // This ensures the error is caught by the global error handler
         // and displayed in the Next.js error overlay.
        setTimeout(() => {
          throw error;
        });
      } else {
        // In production, you might want to log this to a service
        // like Sentry, but for now we just log to console.
        console.error('Firestore Permission Error:', error.request);
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [user]);

  return null;
}
