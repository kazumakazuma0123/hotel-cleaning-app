/**
 * Google Apps Script for syncing booking emails to the Hotel Cleaning App.
 * Instructions:
 * 1. Open https://script.google.com and create a new project.
 * 2. Paste this code.
 * 3. Replace WEBHOOK_URL and WEBHOOK_SECRET.
 * 4. Set a time-driven trigger (e.g., every 5-10 minutes).
 */

const WEBHOOK_URL = "YOUR_APP_URL/api/webhook/email"; // Replace with your actual URL
const WEBHOOK_SECRET = "YOUR_SECRET"; // Replace with your secret

function syncBookingEmails() {
  // 1. Limit search to the last 2 days and exclude processed threads
  // This prevents processing thousands of old emails at once.
  const query = 'subject:(予約通知 OR 予約確定 OR キャンセル OR "Booking.com" OR Airbnb OR Agoda) -label:processed newer_than:2d';
  const threads = GmailApp.search(query, 0, 10); // Process 10 threads at a time

  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      // Skip if thread is already labeled (double check)
      if (thread.getLabels().some(l => l.getName() === "processed")) return;

      const subject = message.getSubject();
      const body = message.getPlainBody();

      // Skip extremely large emails if any
      if (body.length > 50000) {
        console.warn("Skipping large email: " + subject);
        return;
      }

      const options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'X-Webhook-Secret': WEBHOOK_SECRET
        },
        payload: JSON.stringify({
          subject: subject,
          body: body
        }),
        muteHttpExceptions: true
      };

      try {
        const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
        if (response.getResponseCode() === 200) {
          markAsProcessed(thread);
        }
        
        // 2. Add Throttling: Pause for 1 second between requests to avoid "Bandwidth quota exceeded"
        Utilities.sleep(1000); 
        
      } catch (e) {
        console.error("Sync Error: " + e.toString());
      }
    });
  });
}

function markAsProcessed(thread) {
  let label = GmailApp.getUserLabelByName("processed");
  if (!label) label = GmailApp.createLabel("processed");
  thread.addLabel(label);
}

