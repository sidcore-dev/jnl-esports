// Members-only content. This file runs on the server and is never sent to the
// browser directly; it is only returned by /api/members after Discord login.
// Edit the values below and redeploy.

export const memberContent = {
  announcements: [
    // { date: "2026-10-01", title: "Title", body: "Details for members." },
  ],
  schedule: [
    { day: "Weekdays", time: "Soon", activity: "Scrims" },
    { day: "Weekends", time: "Soon", activity: "VOD review" },
  ],
  resources: [
    // { title: "Strategy document", description: "Attack and defense plans.", href: "https://..." },
  ],
};
