// ========== 設定 ==========
var WEBHOOK_URL = "https://hotel-cleaning-app.vercel.app/api/webhook/email";
var WEBHOOK_SECRET = "25059dbc1c639f232603816fe0d7c6541e090463cc4beafeb6a93f176d21796f";
var LABEL_PROCESSED = "webhook-processed";
// ==========================

/**
 * メイン関数 — 予約メールを検索してWebhookに転送する
 * トリガー: 時間主導型 → 1分おき
 */
function forwardBookingEmails() {
  var label = GmailApp.getUserLabelByName(LABEL_PROCESSED);
  if (!label) {
    label = GmailApp.createLabel(LABEL_PROCESSED);
  }

  var query = '(subject:"予約通知" OR subject:"予約確定" OR subject:"キャンセル") -label:' + LABEL_PROCESSED;
  var threads = GmailApp.search(query, 0, 10);

  if (threads.length === 0) {
    Logger.log("新しい予約メールはありません");
    return;
  }

  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    var lastMessage = messages[messages.length - 1];

    var subject = lastMessage.getSubject();
    var body = lastMessage.getPlainBody();

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
        Logger.log("転送成功: " + subject + " → " + response.getContentText());
      } else {
        Logger.log("エラー " + code + ": " + response.getContentText());
      }
    } catch (e) {
      Logger.log("送信失敗: " + e.message);
    }

    thread.addLabel(label);
  });

  Logger.log(threads.length + "件のメールを処理しました");
}

/**
 * 初回セットアップ — 手動で1回実行して権限を承認する
 */
function setup() {
  var label = GmailApp.getUserLabelByName(LABEL_PROCESSED);
  if (!label) {
    label = GmailApp.createLabel(LABEL_PROCESSED);
  }
  Logger.log("セットアップ完了: ラベル「" + LABEL_PROCESSED + "」を作成しました");
  Logger.log("次のステップ: トリガーを設定してください");
}

/**
 * トリガーを自動作成する（1分間隔）
 */
function createTrigger() {
  // 既存のトリガーを削除
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === "forwardBookingEmails") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 1分間隔のトリガーを作成
  ScriptApp.newTrigger("forwardBookingEmails")
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log("トリガーを作成しました: forwardBookingEmails（1分間隔）");
}
