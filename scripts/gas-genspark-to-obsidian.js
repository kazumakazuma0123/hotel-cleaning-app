/**
 * Google Apps Script — Genspark AI → Obsidian 自動格納スクリプト
 *
 * 使い方:
 * 1. Google Apps Script (https://script.google.com) で新規プロジェクトを作成
 * 2. このコードを貼り付け
 * 3. 設定セクションの値を埋める
 * 4. トリガーを設定: processGensparkEmails を「時間主導型 → 5分おき」で実行
 *
 * フロー:
 * 1. team@genspark.ai からの Meeting Notes メールを検知
 * 2. 件名・本文からカテゴリを自動判定（議事録 / タスク / 振り返り / 日報）
 * 3. 判定に自信がある → そのままObsidian（GitHub）へ保存
 * 4. 判定に迷う → Supabaseに保留 + LINEで「どこに振り分けますか？」と質問
 * 5. ユーザーがLINEのボタンをタップ → Vercelがカテゴリ確定
 * 6. 次回実行時に確定済みの保留を処理 → Obsidianへ保存
 */

// ========== 設定 ==========
// GASの「プロジェクトの設定 → スクリプトプロパティ」に以下を登録:
//   GITHUB_TOKEN, LINE_CHANNEL_ACCESS_TOKEN, SUPABASE_ANON_KEY, SLACK_WEBHOOK_URL
var GITHUB_TOKEN = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
var GITHUB_REPO = "kazumakazuma0123/obsidian-project";

var LINE_CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty("LINE_CHANNEL_ACCESS_TOKEN");
var LINE_USER_ID = "U056564d2708941ab8359008895dfff26";

var SLACK_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty("SLACK_WEBHOOK_URL");

var SUPABASE_URL = "https://xldmgjhllvtwjividgfi.supabase.co";
var SUPABASE_ANON_KEY = PropertiesService.getScriptProperties().getProperty("SUPABASE_ANON_KEY");

var VERCEL_BASE_URL = "https://hotel-cleaning-app.vercel.app";

var LABEL_PROCESSED = "genspark-processed";
// ==========================

// カテゴリ定義
var CATEGORIES = [
  {
    name: "タスク",
    folder: "Genspark/タスク",
    tags: ["タスク", "Genspark"],
    keywords: ["タスク", "todo", "やること", "作業リスト", "作業一覧", "アクションアイテム"]
  },
  {
    name: "振り返り",
    folder: "Genspark/振り返り",
    tags: ["振り返り", "Genspark"],
    keywords: ["振り返り", "反省", "kpt", "レトロ", "retrospective", "改善点", "良かった点", "次回に向けて"]
  },
  {
    name: "日報",
    folder: "Genspark/日報",
    tags: ["日報", "Genspark"],
    keywords: ["日報", "daily report", "本日の業務", "今日の作業", "業務報告"]
  },
  {
    name: "議事録",
    folder: "Genspark/議事録",
    tags: ["議事録", "Genspark"],
    keywords: ["会議", "打ち合わせ", "ミーティング", "mtg", "議事録", "フィードバック", "報告", "共有"]
  }
];

// ===================================================
// メイン関数
// ===================================================

/**
 * メイン — トリガーで5分おきに実行
 */
function processGensparkEmails() {
  // 1. 保留中で回答済みのものを先に処理
  processPendingEmails_();

  // 2. 新しいメールを処理
  processNewEmails_();
}

/**
 * 新着メールを処理
 */
function processNewEmails_() {
  var label = getOrCreateLabel_(LABEL_PROCESSED);
  var query = 'from:team@genspark.ai subject:"Meeting Notes" -label:' + LABEL_PROCESSED;
  var threads = GmailApp.search(query, 0, 10);

  if (threads.length === 0) {
    Logger.log("新しいGensparkメールはありません");
    return;
  }

  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    var lastMessage = messages[messages.length - 1];

    var subject = lastMessage.getSubject();
    var body = lastMessage.getPlainBody();
    var date = lastMessage.getDate();
    var title = subject.replace(/^Meeting Notes:\s*/i, "").trim();

    // カテゴリ判定
    var result = detectCategory_(title, body);

    if (result.confident) {
      // 自信あり → 直接保存 + Slack通知
      Logger.log("自動振り分け: " + result.category.name + " → " + title);
      saveToObsidian_(title, body, date, result.category);
      sendSlackSaved_(title, result.category);
    } else {
      // 迷い → 保留 + Slack/LINEで質問
      Logger.log("カテゴリ不明、質問送信: " + title);
      savePendingAndAsk_(title, body, date);
    }

    thread.addLabel(label);
  });
}

/**
 * 回答済みの保留メールを処理
 */
function processPendingEmails_() {
  var pending = fetchAnsweredPending_();

  if (pending.length === 0) return;

  pending.forEach(function(item) {
    var category = findCategoryByName_(item.category);
    if (!category) {
      Logger.log("不明なカテゴリ: " + item.category);
      return;
    }

    Logger.log("保留処理: " + category.name + " → " + item.title);
    saveToObsidian_(item.title, item.body, new Date(item.email_date), category);
    sendSlackSaved_(item.title, category);

    // 処理済みに更新
    markPendingProcessed_(item.id);
  });
}

// ===================================================
// カテゴリ判定（自信度つき）
// ===================================================

/**
 * カテゴリを判定し、自信度を返す
 * - 1カテゴリだけヒット → confident: true
 * - 0ヒット or 複数ヒット → confident: false
 */
function detectCategory_(title, body) {
  var text = (title + " " + body).toLowerCase();
  var matched = [];

  for (var i = 0; i < CATEGORIES.length; i++) {
    var cat = CATEGORIES[i];
    for (var j = 0; j < cat.keywords.length; j++) {
      if (text.indexOf(cat.keywords[j].toLowerCase()) !== -1) {
        matched.push(cat);
        break;
      }
    }
  }

  if (matched.length === 1) {
    return { confident: true, category: matched[0] };
  }

  // 複数マッチ or 0マッチ → 迷い
  // 複数マッチの場合、最初にマッチしたものをデフォルト候補に
  return {
    confident: false,
    category: matched.length > 0 ? matched[0] : CATEGORIES[CATEGORIES.length - 1]
  };
}

function findCategoryByName_(name) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].name === name) return CATEGORIES[i];
  }
  return null;
}

// ===================================================
// Obsidian保存（GitHub API）
// ===================================================

function saveToObsidian_(title, body, date, category) {
  var dateStr = Utilities.formatDate(date, "Asia/Tokyo", "yyyy-MM-dd");
  var safeTitle = sanitizeFilename_(title);
  var fileName = dateStr + "_" + safeTitle + ".md";
  var markdown = formatAsMarkdown_(title, body, date, category);

  var success = createFileOnGitHub_(category.folder, fileName, markdown);
  if (success) {
    Logger.log("Obsidian保存OK: " + category.folder + "/" + fileName);
  } else {
    Logger.log("Obsidian保存NG: " + category.folder + "/" + fileName);
  }
}

// ===================================================
// Markdown整形
// ===================================================

function formatAsMarkdown_(title, body, date, category) {
  var dateStr = Utilities.formatDate(date, "Asia/Tokyo", "yyyy-MM-dd HH:mm");
  var cleanBody = parseGensparkBody_(body);

  var md = "---\n";
  md += "title: \"" + title.replace(/"/g, '\\"') + "\"\n";
  md += "date: " + dateStr + "\n";
  md += "category: " + category.name + "\n";
  md += "source: Genspark\n";
  md += "tags:\n";
  for (var i = 0; i < category.tags.length; i++) {
    md += "  - " + category.tags[i] + "\n";
  }
  md += "---\n\n";
  md += "# " + title + "\n\n";
  md += "**日時**: " + dateStr + "  \n";
  md += "**カテゴリ**: " + category.name + "\n\n";
  md += "---\n\n";
  md += cleanBody + "\n";

  return md;
}

function parseGensparkBody_(body) {
  var lines = body.split("\n");
  var result = [];
  var inContent = false;
  var skipPatterns = [
    /^Genspark AI Meeting Notes$/,
    /^Generated$/,
    /^Date$/,
    /^Duration$/,
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d+ min$/
  ];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();

    if (line === "") {
      if (inContent) result.push("");
      continue;
    }

    var skip = false;
    for (var j = 0; j < skipPatterns.length; j++) {
      if (skipPatterns[j].test(line)) { skip = true; break; }
    }
    if (skip) continue;

    if (/^ミーティングサマリー/.test(line)) {
      result.push("## ミーティングサマリー");
      inContent = true;
      continue;
    }

    if (inContent) {
      if (isSectionHeading_(line)) {
        result.push("");
        result.push("## " + line);
        continue;
      }
      result.push(line);
    }
  }

  return result.length > 0 ? result.join("\n").trim() : body.trim();
}

function isSectionHeading_(line) {
  var headings = [
    "指摘事項", "決定事項", "決定事項と今後の対応", "議題", "参加者", "次回予定", "まとめ",
    "アクションアイテム", "今後の対応", "担当", "期限", "優先度", "完了済み", "未完了",
    "良かった点", "改善点", "次回に向けて", "Keep", "Problem", "Try",
    "背景", "概要", "詳細", "補足", "備考", "結論"
  ];
  for (var i = 0; i < headings.length; i++) {
    if (line.indexOf(headings[i]) === 0) return true;
  }
  return false;
}

// ===================================================
// LINE通知
// ===================================================

/**
 * LINEでカテゴリ選択を質問（Flex Message + URLボタン）
 */
function sendLineCategoryQuestion_(pendingId, title) {
  var buttons = [];
  for (var i = 0; i < CATEGORIES.length; i++) {
    var cat = CATEGORIES[i];
    var url = VERCEL_BASE_URL + "/api/genspark/categorize?id=" + encodeURIComponent(pendingId) + "&cat=" + encodeURIComponent(cat.name);
    buttons.push({
      type: "button",
      action: { type: "uri", label: cat.name, uri: url },
      style: "primary",
      height: "sm",
      margin: "sm",
      color: i === 0 ? "#5B8DEF" : i === 1 ? "#EF8B5B" : i === 2 ? "#8BEF5B" : "#AAAAAA"
    });
  }

  var flexMessage = {
    type: "flex",
    altText: "カテゴリ選択: " + title,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "Genspark → Obsidian", size: "xs", color: "#AAAAAA" },
          { type: "text", text: "どこに振り分けますか？", size: "md", weight: "bold", margin: "sm" }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: title, size: "sm", wrap: true, color: "#333333" },
          { type: "separator", margin: "lg" },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: buttons
          }
        ]
      }
    }
  };

  var payload = {
    to: LINE_USER_ID,
    messages: [flexMessage]
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: { "Authorization": "Bearer " + LINE_CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
    var code = response.getResponseCode();
    if (code === 200) {
      Logger.log("LINE送信OK: " + title);
    } else {
      Logger.log("LINE送信エラー " + code + ": " + response.getContentText());
    }
  } catch (e) {
    Logger.log("LINE送信失敗: " + e.message);
  }
}

// ===================================================
// Slack通知
// ===================================================

/**
 * Slack: 保存完了通知
 */
function sendSlackSaved_(title, category) {
  if (!SLACK_WEBHOOK_URL) return;

  var payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":white_check_mark: *Obsidianに保存しました*"
        }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: "*タイトル*\n" + title },
          { type: "mrkdwn", text: "*振り分け先*\n`" + category.folder + "/`" }
        ]
      }
    ]
  };

  postToSlack_(payload);
}

/**
 * Slack: カテゴリ選択を質問（ボタン付き）
 */
function sendSlackCategoryQuestion_(pendingId, title) {
  if (!SLACK_WEBHOOK_URL) return;

  var buttons = [];
  for (var i = 0; i < CATEGORIES.length; i++) {
    var cat = CATEGORIES[i];
    var url = VERCEL_BASE_URL + "/api/genspark/categorize?id=" + encodeURIComponent(pendingId) + "&cat=" + encodeURIComponent(cat.name);
    buttons.push({
      type: "button",
      text: { type: "plain_text", text: cat.name },
      url: url
    });
  }

  var payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":question: *どこに振り分けますか？*\n" + title
        }
      },
      {
        type: "actions",
        elements: buttons
      }
    ]
  };

  postToSlack_(payload);
}

function postToSlack_(payload) {
  try {
    var response = UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() === 200) {
      Logger.log("Slack送信OK");
    } else {
      Logger.log("Slackエラー " + response.getResponseCode() + ": " + response.getContentText());
    }
  } catch (e) {
    Logger.log("Slack送信失敗: " + e.message);
  }
}

// ===================================================
// Supabase（保留管理）
// ===================================================

/**
 * 保留としてSupabaseに保存 + Slack/LINEで質問
 */
function savePendingAndAsk_(title, body, date) {
  var id = generateId_();

  var record = {
    id: id,
    title: title,
    body: body,
    email_date: date.toISOString(),
    status: "pending"
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + SUPABASE_ANON_KEY,
      "Prefer": "return=minimal"
    },
    payload: JSON.stringify(record),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/genspark_pending", options);
    if (response.getResponseCode() === 201) {
      Logger.log("Supabase保存OK: " + id);
      sendSlackCategoryQuestion_(id, title);
      sendLineCategoryQuestion_(id, title);
    } else {
      Logger.log("Supabase保存エラー: " + response.getContentText());
    }
  } catch (e) {
    Logger.log("Supabase保存失敗: " + e.message);
  }
}

/**
 * 回答済みの保留を取得
 */
function fetchAnsweredPending_() {
  var url = SUPABASE_URL + "/rest/v1/genspark_pending?status=eq.answered&select=*";

  var options = {
    method: "get",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + SUPABASE_ANON_KEY
    },
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    }
  } catch (e) {
    Logger.log("Supabase取得失敗: " + e.message);
  }
  return [];
}

/**
 * 保留を処理済みに更新
 */
function markPendingProcessed_(id) {
  var url = SUPABASE_URL + "/rest/v1/genspark_pending?id=eq." + encodeURIComponent(id);

  var options = {
    method: "patch",
    contentType: "application/json",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + SUPABASE_ANON_KEY,
      "Prefer": "return=minimal"
    },
    payload: JSON.stringify({ status: "processed" }),
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(url, options);
}

// ===================================================
// GitHub API
// ===================================================

function createFileOnGitHub_(folder, fileName, content) {
  var path = folder + "/" + fileName;
  var url = "https://api.github.com/repos/" + GITHUB_REPO + "/contents/" + encodeURIComponent(path);
  var encoded = Utilities.base64Encode(Utilities.newBlob(content).getBytes());

  var options = {
    method: "put",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + GITHUB_TOKEN,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "GAS-Genspark-to-Obsidian"
    },
    payload: JSON.stringify({
      message: "Add " + folder.split("/").pop() + ": " + fileName,
      content: encoded,
      branch: "main"
    }),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    if (code === 201) return true;
    if (code === 422) return updateFileOnGitHub_(path, content);
    Logger.log("GitHub error " + code + ": " + response.getContentText());
    return false;
  } catch (e) {
    Logger.log("GitHub fetch failed: " + e.message);
    return false;
  }
}

function updateFileOnGitHub_(path, content) {
  var url = "https://api.github.com/repos/" + GITHUB_REPO + "/contents/" + encodeURIComponent(path);

  try {
    var getRes = UrlFetchApp.fetch(url, {
      method: "get",
      headers: {
        "Authorization": "Bearer " + GITHUB_TOKEN,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GAS-Genspark-to-Obsidian"
      },
      muteHttpExceptions: true
    });
    if (getRes.getResponseCode() !== 200) return false;

    var sha = JSON.parse(getRes.getContentText()).sha;
    var encoded = Utilities.base64Encode(Utilities.newBlob(content).getBytes());

    var putRes = UrlFetchApp.fetch(url, {
      method: "put",
      contentType: "application/json",
      headers: {
        "Authorization": "Bearer " + GITHUB_TOKEN,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GAS-Genspark-to-Obsidian"
      },
      payload: JSON.stringify({
        message: "Update: " + path.split("/").pop(),
        content: encoded,
        sha: sha,
        branch: "main"
      }),
      muteHttpExceptions: true
    });
    return putRes.getResponseCode() === 200;
  } catch (e) {
    Logger.log("Update failed: " + e.message);
    return false;
  }
}

// ===================================================
// ユーティリティ
// ===================================================

function sanitizeFilename_(name) {
  return name.replace(/[\/\\:*?"<>|]/g, "").replace(/\s+/g, "_").substring(0, 80);
}

function getOrCreateLabel_(labelName) {
  var label = GmailApp.getUserLabelByName(labelName);
  if (!label) label = GmailApp.createLabel(labelName);
  return label;
}

function generateId_() {
  var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  var id = "";
  for (var i = 0; i < 16; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyyMMddHHmm") + "_" + id;
}

// ===================================================
// テスト
// ===================================================

/** テスト: 自信ありのケース（フィードバック → 議事録） */
function testConfidentCase() {
  var body = buildTestBody_("清掃業務に関するフィードバックと今後の対応策", [
    "ミーティングサマリー",
    "あずまさんへの清掃業務に関するフィードバックが共有されました。",
    "指摘事項",
    "スリッパの向きが曲がっていた。"
  ]);

  var result = detectCategory_("清掃業務に関するフィードバックと今後の対応策", body);
  Logger.log("自信: " + result.confident + " / カテゴリ: " + result.category.name);
}

/** テスト: 迷いのケース（キーワード未含有） */
function testUncertainCase() {
  var body = buildTestBody_("来月のスケジュール確認", [
    "ミーティングサマリー",
    "来月のスケジュールについて確認しました。"
  ]);

  var result = detectCategory_("来月のスケジュール確認", body);
  Logger.log("自信: " + result.confident + " / カテゴリ: " + result.category.name);
  // confident: false → LINEで質問されるケース
}

/** テスト: LINE送信（実際にLINEに届く） */
function testLineSend() {
  sendLineCategoryQuestion_("test_" + new Date().getTime(), "来月のスケジュール確認");
}

/** テスト: Slack保存通知 */
function testSlackSaved() {
  sendSlackSaved_("清掃業務に関するフィードバックと今後の対応策", CATEGORIES[3]);
}

/** テスト: Slackカテゴリ質問 */
function testSlackQuestion() {
  sendSlackCategoryQuestion_("test_" + new Date().getTime(), "来月のスケジュール確認");
}

function buildTestBody_(title, contentLines) {
  return ["Genspark AI Meeting Notes", "Generated", "2026-03-25", title, "Date", "2026-03-25", "Duration", "1 min"].concat(contentLines).join("\n");
}
