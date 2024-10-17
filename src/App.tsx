import React, { useEffect, useState } from 'react';
import { Clock, Monitor } from 'lucide-react';

interface ActivityData {
  url: string;
  title: string;
  startTime: number;
  endTime?: number;
  isVideo: boolean;
  isBackground: boolean;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
}

function App() {
  const [activities, setActivities] = useState<ActivityData[]>([]);

  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getActivities' }, (response) => {
      setActivities(response.activities);
    });
  }, []);

  const groupedActivities = activities.reduce((acc, activity) => {
    const domain = new URL(activity.url).hostname;
    if (!acc[domain]) {
      acc[domain] = { totalTime: 0, activities: [] };
    }
    const duration = (activity.endTime || Date.now()) - activity.startTime;
    acc[domain].totalTime += duration;
    acc[domain].activities.push(activity);
    return acc;
  }, {} as Record<string, { totalTime: number; activities: ActivityData[] }>);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Browser Activity Tracker</h1>
      {Object.entries(groupedActivities).map(([domain, data]) => (
        <div key={domain} className="mb-4 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <Monitor className="mr-2" />
            {domain}
          </h2>
          <p className="text-gray-600 mb-2">
            Total time: {formatDuration(data.totalTime)}
          </p>
          <ul className="space-y-2">
            {data.activities.map((activity, index) => (
              <li key={index} className="flex items-center">
                <Clock className="mr-2" />
                <span className="flex-grow">{activity.title}</span>
                <span className="text-gray-500">
                  {formatDuration((activity.endTime || Date.now()) - activity.startTime)}
                </span>
                {activity.isVideo && (
                  <span className="ml-2 text-blue-500">Video</span>
                )}
                {activity.isBackground && (
                  <span className="ml-2 text-yellow-500">Background</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default App;