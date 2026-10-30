import { Search } from "lucide-react";

export default function Dashboard() {
  useSeoMetadata({ title: 'Dashboard · FileWiz', description: 'Manage your FileWiz account and recent tools.', robots: 'noindex, nofollow' });
  return (
    <div className="flex h-screen bg-gray-50">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r p-5 flex flex-col">
        <h1 className="text-xl font-bold text-purple-600 mb-8">FileWiz</h1>

        <nav className="space-y-3 text-sm">
          <SidebarItem label="Home" />
          <SidebarItem label="My Documents" />
          <SidebarItem label="Recent" />
          <SidebarItem label="Favorites" />
          <SidebarItem label="Trash" />
        </nav>

        <div className="mt-10">
          <p className="text-xs text-gray-400 mb-2">Categories</p>
          <SidebarItem label="Images" />
          <SidebarItem label="PDFs" />
          <SidebarItem label="Word Docs" />
          <SidebarItem label="Spreadsheets" />
        </div>

        <div className="mt-auto pt-6">
          <div className="text-xs text-gray-500 mb-2">Workspace Storage</div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div className="bg-purple-600 h-2 rounded-full w-1/4"></div>
          </div>
          <p className="text-xs mt-2 text-gray-500">Local Cache: 1.2MB</p>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2 w-[400px]">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              placeholder="Search documents..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-purple-600"></div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex flex-1 p-6 gap-6">

          {/* LEFT MAIN */}
          <div className="flex-1">

            {/* HERO CARD */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-slate-100">
              <h2 className="text-xl font-semibold mb-2 text-slate-800">
                Everything your documents need
              </h2>
              <p className="text-gray-500 text-sm">
                Fast browser-based processing, zero server storage needed.
              </p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard title="Processed Files" value="0" />
              <StatCard title="Processing" value="Browser-based" />
              <StatCard title="Available Tools" value="25+" />
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold mb-4 text-slate-800">Recent Tasks</h3>

              <div className="text-center py-12 text-slate-400 text-sm">
                No recent files yet. Start using any tool from the menu to see your local history here.
              </div>
            </div>

          </div>

          {/* RIGHT PANEL */}
          <aside className="w-72">

            <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 border border-slate-100">
              <h3 className="font-semibold mb-4 text-slate-800">Quick Tools</h3>

              {[
                { name: "Merge PDF", link: "/tools/pdf/merge-pdf" },
                { name: "Split PDF", link: "/tools/pdf/split-pdf" },
                { name: "Compress PDF", link: "/tools/pdf/compress-pdf" },
                { name: "Rotate PDF", link: "/tools/pdf/rotate-pdf" },
              ].map((tool) => (
                <a
                  key={tool.name}
                  href={tool.link}
                  className="block py-2 px-3 hover:bg-purple-50 hover:text-purple-700 rounded-lg text-sm text-slate-600 transition-colors"
                >
                  {tool.name}
                </a>
              ))}
            </div>

            <div className="bg-purple-600 text-white rounded-2xl p-5 text-center">
              <p className="font-semibold mb-2">
                Your documents are safe
              </p>
              <p className="text-xs text-purple-100 mb-4">
                FileWiz file tools process files in your browser. Some other utilities may contact external providers.
              </p>
              <a href={`${import.meta.env.BASE_URL}tools/pdf`} className="inline-block bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors">
                Explore Tools
              </a>
            </div>

          </aside>

        </div>
      </div>
    </div>
  );
}

/* COMPONENTS */

function SidebarItem({ label }) {
  return (
    <div className="px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer text-slate-600">
      {label}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-gray-400">{title}</p>
      <p className="text-lg font-semibold mt-1 text-slate-800">{value}</p>
    </div>
  );
}
import useSeoMetadata from '../services/useSeoMetadata';
