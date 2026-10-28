import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA Offline Capabilities & Transaction Queueing
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('TLGS Canteen POS ServiceWorker registration successful with scope: ', registration.scope);

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_OFFLINE_TRANSACTIONS') {
          triggerOfflineQueueSync();
        }
      });
    } catch (error) {
      console.error('ServiceWorker registration failed: ', error);
    }
  });
}

// Offline Transaction Queue Management Helper
export function queueOfflineTransaction(transactionData: any) {
  const queue = JSON.parse(localStorage.getItem('tlgs_offline_tx_queue') || '[]');
  queue.push({
    ...transactionData,
    queuedAt: new Date().toISOString(),
    id: `offline-tx-${Date.now()}`
  });
  localStorage.setItem('tlgs_offline_tx_queue', JSON.stringify(queue));
  console.log('Transaction queued offline:', transactionData);
}

async function triggerOfflineQueueSync() {
  const queue = JSON.parse(localStorage.getItem('tlgs_offline_tx_queue') || '[]');
  if (queue.length === 0) return;

  console.log(`Syncing ${queue.length} offline POS transactions...`);
  const remainingQueue = [];

  for (const tx of queue) {
    try {
      // Simulate sync or dispatch to backend
      console.log('Synced offline transaction:', tx);
    } catch (err) {
      console.error('Failed to sync transaction:', tx, err);
      remainingQueue.push(tx);
    }
  }

  localStorage.setItem('tlgs_offline_tx_queue', JSON.stringify(remainingQueue));
  if (remainingQueue.length === 0) {
    window.dispatchEvent(new CustomEvent('tlgs_offline_sync_complete'));
  }
}

window.addEventListener('online', () => {
  console.log('Network connection restored. Triggering offline transaction sync...');
  triggerOfflineQueueSync();
});

createRoot(document.getElementById('root')!).render(<App />);
