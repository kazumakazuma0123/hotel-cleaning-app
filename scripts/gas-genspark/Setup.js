/**
 * 初期セットアップ — 1回だけ手動実行してスクリプトプロパティを設定
 * 設定完了後、このファイルは削除してOK
 */
function setupProperties() {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    "GITHUB_TOKEN": "YOUR_GITHUB_TOKEN",
    "LINE_CHANNEL_ACCESS_TOKEN": "YOUR_LINE_CHANNEL_ACCESS_TOKEN",
    "SUPABASE_ANON_KEY": "YOUR_SUPABASE_ANON_KEY",
    "SLACK_WEBHOOK_URL": "YOUR_SLACK_WEBHOOK_URL"
  });
  Logger.log("スクリプトプロパティ設定完了");
  Logger.log(props.getProperties());
}

/**
 * トリガー設定 — 1回だけ手動実行
 * processGensparkEmails を5分おきに実行するトリガーを作成
 */
function setupTrigger() {
  // 既存トリガーを削除（重複防止）
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === "processGensparkEmails") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 5分おきのトリガーを作成
  ScriptApp.newTrigger("processGensparkEmails")
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log("トリガー設定完了: processGensparkEmails を5分おきに実行");
}
