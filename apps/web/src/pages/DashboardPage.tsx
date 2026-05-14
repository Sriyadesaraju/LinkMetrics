import { useState } from "react";
import { useAuthStore } from "../store/auth.store";
import { useWorkspaceStore } from "../store/workspace.store";
import { UTMBuilder } from "../components/UTMBuilder";

import {
  useWorkspaces,
  useLinks,
  useCreateLink,
  useCreateWorkspace,
} from "../lib/hooks";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  const [showUtm, setShowUtm] = useState(false);
  const [finalUrl, setFinalUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: workspaces, isLoading: loadingWorkspaces } = useWorkspaces();
  const { data: links, isLoading: loadingLinks } = useLinks();
  const { mutate: createLink, isPending: creatingLink } = useCreateLink();
  const { mutate: createWorkspace } = useCreateWorkspace();

  // Auto-select first workspace if none selected
  if (workspaces?.length && !activeWorkspace) {
    setActiveWorkspace(workspaces[0]);
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateLink = () => {
    const urlToShorten = finalUrl || urlInput;
    if (!urlToShorten) return;
    createLink(
      {
        originalUrl: urlToShorten,
        customSlug: slugInput || undefined,
        expiresAt: expiresAt || undefined,
      },
      {
        onSuccess: () => {
          setUrlInput("");
          setSlugInput("");
          setExpiresAt("");
          setFinalUrl("");
          setShowUtm(false);
          setShowCreateLink(false);
        },
      },
    );
  };

  const handleCopy = (shortUrl: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(shortUrl);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">LinkMetrics</h1>
          {/* Workspace selector */}
          {workspaces?.length > 0 && (
            <select
              className="text-sm border rounded-lg px-2 py-1"
              value={activeWorkspace?.id || ""}
              onChange={(e) => {
                const ws = workspaces.find((w: any) => w.id === e.target.value);
                if (ws) setActiveWorkspace(ws);
              }}
            >
              {workspaces.map((ws: any) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* No workspace state */}
        {!loadingWorkspaces && !workspaces?.length && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">
              You don't have a workspace yet.
            </p>
            <button
              onClick={() => createWorkspace({ name: "My Workspace" })}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Create workspace
            </button>
          </div>
        )}

        {/* Main content */}
        {activeWorkspace && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your links</h2>
              <button
                onClick={() => setShowCreateLink(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                + Shorten URL
              </button>
            </div>

            {/* Create link form */}
            {showCreateLink && (
              <div className="bg-white border rounded-xl p-4 mb-6 space-y-3">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://your-long-url.com"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowUtm(!showUtm)}
                  className="text-xs text-blue-600 hover:underline text-left"
                >
                  {showUtm
                    ? "− Hide UTM parameters"
                    : "+ Add UTM tracking parameters"}
                </button>

                {showUtm && (
                  <UTMBuilder
                    baseUrl={urlInput}
                    onChange={(tagged) => setFinalUrl(tagged)}
                  />
                )}
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  placeholder="Custom slug (optional)"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Expiry date (optional)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateLink}
                    disabled={creatingLink || !urlInput}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creatingLink ? "Creating..." : "Create link"}
                  </button>
                  <button
                    onClick={() => setShowCreateLink(false)}
                    className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Links table */}
            {loadingLinks ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : links?.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No links yet. Create your first one.
              </p>
            ) : (
              <div className="bg-white border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        Short URL
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        Original
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        Clicks
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {links?.map((link: any) => (
                      <tr key={link.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-blue-600">
                          {link.shortUrl}
                        </td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-xs">
                          {link.originalUrl}
                        </td>
                        <td className="px-4 py-3 font-medium">{link.clicks}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleCopy(link.shortUrl)}
                            className="text-xs text-gray-500 hover:text-gray-900 border rounded px-2 py-1"
                          >
                            {copied === link.shortUrl ? "Copied!" : "Copy"}
                          </button>
                          <button
                            onClick={() => navigate(`/analytics/${link.slug}`)}
                            className="text-xs text-gray-500 hover:text-gray-900 border rounded px-2 py-1 ml-1"
                          >
                            Analytics
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
