import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';

/** Blocks the gender step until the 18+ confirmation has passed. */
export function RequireAge({ children }: { children: ReactNode }) {
  const { state } = useOnboarding();
  if (!state.ageConfirmed) return <Navigate to="/age" replace />;
  return children;
}
