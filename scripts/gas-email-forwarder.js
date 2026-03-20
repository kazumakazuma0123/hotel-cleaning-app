/**
 * Google Apps Script — 予約メール転送スクリプト
 *
 * 使い方:
 * 1. Google Apps Script (https://script.google.com) で新規プロジェクトを作成
 * 2. このコードを貼り付け
 * 3. WEBHOOK_URL と WEBHOOK_SECRET を設定
 * 4. トリガーを設定: forwardBookingEmails を「時間主導型 → 1分おき」で実行
 *
 * 対応メール:
 * - 件名に「予約通知」「予約確定」を含む → 新規予約として処理
 * - 件名に「キャンセル」を含む → キャンセルとして処理
 */

// ========== 設定 ==========
var WEBHOOK_URL = "https://hotel-cleaning-app.vercel.app/api/webhook/email";
var WEBHOOK_SECRET = "REDACTED_WEBHOOK_SECRET";
var LABEL_PROCESSED = "webhook-processed";
// ==========================

function forwardBookingEmails() {
  // 処理済みラベルを取得（なければ作成）
  var label = GmailApp.getUserLabelByName(LABEL_PROCESSED);
  if (!label) {
    label = GmailApp.createLabel(LABEL_PROCESSED);
  }

  // 予約関連メールを検索（未処理のもの）
  var query = '(subject:"予約通知" OR subject:"予約確定" OR subject:"キャンセル") -label:' + LABEL_PROCESSED;
  var threads = GmailApp.search(query, 0, 10);

  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    var lastMessage = messages[messages.length - 1];

    var subject = lastMessage.getSubject();
    var body = lastMessage.getPlainBody();

    // Webhookに送信
    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "X-Webhook-Secret": WEBHOOK_SECRET
      },
      payload: JSON.stringify({
        subject: subject,
        body: body
      }),
      muteHttpExceptions: true
    };

    try {
      var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
      var code = response.getResponseCode();

      if (code === 200) {
        Logger.log("OK: " + subject);
      } else {
        Logger.log("Error " + code + ": " + response.getContentText());
      }
    } catch (e) {
      Logger.log("Fetch failed: " + e.message);
    }

    // 処理済みラベルを付ける
    thread.addLabel(label);
  });
}
