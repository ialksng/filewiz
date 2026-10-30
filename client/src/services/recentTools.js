const STORAGE_KEY = 'filewiz_recent_tools';

export function getRecentTools() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordToolUsage(toolId, toolName, category, icon) {
  try {
    const current = getRecentTools();
    const filtered = current.filter(t => t.id !== toolId);
    const updated = [
      { id: toolId, name: toolName, category, icon, timestamp: Date.now() },
      ...filtered
    ].slice(0, 8); // Keep top 8

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to record recent tool usage:', err);
  }
}
