import apiBase from './apiBase';
import { getAuthToken } from './auth';

export async function billingRequest(path, options = {}) {
  const token = getAuthToken();
  let response;
  try {
    response = await fetch(`${apiBase}/billing${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
  } catch (cause) {
    if (cause instanceof TypeError) {
      throw new Error('Could not reach the FileWiz API. Check that the API is online and its CORS settings allow this site and request method.', { cause });
    }
    throw cause;
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Billing service is unavailable.');
  return body;
}

export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve,reject) => {
    const existing = document.querySelector('script[data-filewiz-razorpay]');
    const script = existing || document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.dataset.filewizRazorpay = 'true';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Razorpay Checkout could not be loaded.'));
    if (!existing) document.head.append(script);
  });
}
