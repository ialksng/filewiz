import { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { getToolComponent } from '../features/ToolRegistry';
import { recordToolUsage } from '../services/recentTools';
import { tools } from '../services/toolDefinitions';
import NotFound from './NotFound';
import useSeoMetadata from '../services/useSeoMetadata';

export default function ToolWorkspace() {
  const { type, tool } = useParams();
  const toolComponent = getToolComponent(tool);
  const hasTool = Boolean(toolComponent);
  const toolDefinition = tools.find(({ engine, id }) => engine === tool || id === tool);

  const formatToolTitle = (id) => {
    if (!id) return '';
    return id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  useEffect(() => {
    if (tool && type && hasTool) {
      recordToolUsage(tool, formatToolTitle(tool), type, '⚡');
    }
  }, [tool, type, hasTool]);

  useSeoMetadata({
    title: `${toolDefinition?.name || formatToolTitle(tool)} · FileWiz`,
    description: toolDefinition?.description || `Use the ${formatToolTitle(tool)} tool online with FileWiz.`,
    canonicalPath: hasTool && type && tool ? `/tools/${type}/${tool}` : undefined,
    robots: hasTool ? 'index, follow' : 'noindex, nofollow',
  });

  if (!tool) {
    return <Navigate to={`/tools/${type || 'pdf'}`} replace />;
  }

  if (!hasTool) return <NotFound />;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/tools/${type}`} className="capitalize hover:text-purple-600 transition-colors">{type} Tools</Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{formatToolTitle(tool)}</span>
        </div>

        {toolComponent}
      </div>
    </div>
  );
}
