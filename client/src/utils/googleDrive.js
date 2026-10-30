const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';
const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

let identityScriptPromise;

function loadGoogleIdentity() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (identityScriptPromise) return identityScriptPromise;

  identityScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);
    const script = existing || document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => {
      identityScriptPromise = undefined;
      reject(new Error('Google Drive could not be reached. Check your connection and try again.'));
    };
    if (!existing) document.head.append(script);
  });
  return identityScriptPromise;
}

export async function prepareGoogleDrive() {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return false;
  await loadGoogleIdentity();
  return true;
}

export function requestGoogleDriveAccessToken() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || !window.google?.accounts?.oauth2) {
    return Promise.reject(new Error('Google Drive is not ready. Please try again shortly.'));
  }
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (response) => {
        if (response.error) reject(new Error(response.error_description || 'Google Drive authorization was not completed.'));
        else resolve(response.access_token);
      },
      error_callback: () => reject(new Error('Google sign-in was closed before completing.')),
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export async function saveBlobToGoogleDrive(blob, filename, accessToken) {

  const boundary = `filewiz_${crypto.randomUUID()}`;
  const contentType = blob.type || 'application/octet-stream';
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify({ name: filename }),
    `\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`,
    blob,
    `\r\n--${boundary}--`,
  ], { type: `multipart/related; boundary=${boundary}` });

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Google Drive could not save this file. Please try again.');
  }
  return response.json();
}
