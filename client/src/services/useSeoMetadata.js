import { useEffect } from 'react';

export default function useSeoMetadata({ title, description, canonicalPath, robots = 'index, follow' }) {
  useEffect(() => {
    document.title = title;
    const setMeta = (selector, attributes, content) => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        for (const [name, value] of Object.entries(attributes)) meta.setAttribute(name, value);
        document.head.append(meta);
      }
      meta.content = content;
    };

    setMeta('meta[name="description"]', { name: 'description' }, description);
    setMeta('meta[name="robots"]', { name: 'robots' }, robots);
    setMeta('meta[property="og:title"]', { property: 'og:title' }, title);
    setMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    setMeta('meta[property="og:type"]', { property: 'og:type' }, 'website');

    if (canonicalPath) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
      }
      canonical.href = `https://ialksng.me${import.meta.env.BASE_URL}${canonicalPath.replace(/^\//, '')}`;
      setMeta('meta[property="og:url"]', { property: 'og:url' }, canonical.href);
    } else {
      document.querySelector('link[rel="canonical"]')?.remove();
      document.querySelector('meta[property="og:url"]')?.remove();
    }
  }, [title, description, canonicalPath, robots]);
}
