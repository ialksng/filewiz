/** Download a generated file through the browser instead of opening the OS share sheet. */
export function downloadFile(blob, filename) {
  if (blob instanceof Blob) {
    window.dispatchEvent(new CustomEvent('filewiz:download-ready', { detail: { blob, filename } }));
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Mobile browsers may start consuming the Blob URL after the click event returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Trigger a download for a Blob URL already owned by a preview component. */
export function downloadFileUrl(url, filename) {
  if (!url) return;
  fetch(url).then(response => response.blob()).then(blob => {
    window.dispatchEvent(new CustomEvent('filewiz:download-ready', { detail: { blob, filename } }));
  }).catch(() => {});
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
