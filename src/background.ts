interface ActivityData {
  url: string;
  title: string;
  startTime: number;
  endTime?: number;
  isVideo: boolean;
  isBackground: boolean;
}

let currentActivity: ActivityData | null = null;
let activities: ActivityData[] = [];

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await endCurrentActivity();
  const tab = await chrome.tabs.get(activeInfo.tabId);
  startNewActivity(tab);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    await endCurrentActivity();
    startNewActivity(tab);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await endCurrentActivity();
  } else {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await endCurrentActivity();
      startNewActivity(tab);
    }
  }
});

async function endCurrentActivity() {
  if (currentActivity) {
    currentActivity.endTime = Date.now();
    activities.push(currentActivity);
    await saveActivities();
    currentActivity = null;
  }
}

function startNewActivity(tab: chrome.tabs.Tab) {
  const isVideo = tab.url?.includes('youtube.com/watch') || false;
  currentActivity = {
    url: tab.url || '',
    title: tab.title || '',
    startTime: Date.now(),
    isVideo,
    isBackground: false,
  };
}

async function saveActivities() {
  await chrome.storage.local.set({ activities });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getActivities') {
    chrome.storage.local.get('activities', (result) => {
      sendResponse({ activities: result.activities || [] });
    });
    return true;
  }
});