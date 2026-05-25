export default function DashboardPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-400 text-sm">Monitoring a TODO app like it&apos;s a Fortune 500 company.</p>
        </div>
        <a href="/tasks" className="text-sm text-blue-400 hover:text-blue-300">← Back to Tasks</a>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-400">System Overview</h2>
          <iframe
            src="http://localhost:3100/d/system-overview?orgId=1&refresh=5s&kiosk"
            className="w-full h-96 rounded-lg border border-gray-800 bg-gray-900"
          />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-400">Task Pipeline</h2>
          <iframe
            src="http://localhost:3100/d/task-pipeline?orgId=1&refresh=5s&kiosk"
            className="w-full h-96 rounded-lg border border-gray-800 bg-gray-900"
          />
        </div>
      </div>
      <p className="text-xs text-gray-600 text-center">
        Grafana running at <a href="http://localhost:3100" className="text-blue-500">localhost:3100</a> · admin / overengineered
      </p>
    </div>
  );
}
