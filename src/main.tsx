import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { getGpt } from '@/lib/gpt';
import '@/styles/globals.css';

// Boot Google Ad Manager as soon as this entry module runs — before React
// mounts — so GPT's services are enabled and the out-of-page rewarded and the
// pre-filled interstitial fire their first request the moment gpt.js (async in
// <head>) is ready, instead of waiting for the first ad component's effect.
// This reuses the single existing boot path (`getGpt`), so it adds no duplicate
// script, slot or request, and it is a no-op when VITE_GAM_ENABLED is off.
void getGpt();

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
