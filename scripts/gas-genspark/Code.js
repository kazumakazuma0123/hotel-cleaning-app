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
  },
  {
    name: "その他",
    folder: "Genspark/その他",
    tags: ["Genspark"],
    keywords: []
  },
  {
    name: "指示",
    folder: null,
    tags: ["指示", "Genspark"],
    keywords: []
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
    var htmlBody = lastMessage.getBody();
    var plainBody = lastMessage.getPlainBody();
    var date = lastMessage.getDate();
    var title = subject.replace(/^Meeting Notes:\s*/i, "").trim();

    // カテゴリ判定（プレーンテキストで判定）
    var result = detectCategory_(title, plainBody);

    if (result.confident) {
      // 自信あり → 直接保存 + Slack通知
      Logger.log("自動振り分け: " + result.category.name + " → " + title);
      saveToObsidian_(title, htmlBody, date, result.category);
      sendSlackSaved_(title, result.category);
      // タスクの場合はGoogleカレンダーにも追加
      if (result.category.name === "タスク") {
        addTasksToCalendar_(title, htmlBody, date);
      }
    } else {
      // 迷い → 保留 + Slack/LINEで質問
      Logger.log("カテゴリ不明、質問送信: " + title);
      savePendingAndAsk_(title, htmlBody, date);
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
    if (category.name === "タスク") {
      addTasksToCalendar_(item.title, item.body, new Date(item.email_date));
    }

    // 処理済みに更新
    markPendingProcessed_(item.id);
  });
}

// ===================================================
// カテゴリ判定（自信度つき）
// ===================================================

/**
 * カテゴリを判定し、自信度を返す
 * - タイトルにキーワードが含まれる → そのカテゴリを優先（confident: true）
 * - 本文で1カテゴリだけヒット → confident: true
 * - 0ヒット or 複数ヒット → confident: false
 */
function detectCategory_(title, body) {
  var titleLower = title.toLowerCase();
  var text = (title + " " + body).toLowerCase();

  // 1. タイトルにキーワードがあれば最優先
  for (var i = 0; i < CATEGORIES.length; i++) {
    var cat = CATEGORIES[i];
    for (var j = 0; j < cat.keywords.length; j++) {
      if (titleLower.indexOf(cat.keywords[j].toLowerCase()) !== -1) {
        return { confident: true, category: cat };
      }
    }
  }

  // 2. タイトルにない場合は本文含め全体で判定
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

function formatAsMarkdown_(title, htmlBody, date, category) {
  var dateStr = Utilities.formatDate(date, "Asia/Tokyo", "yyyy-MM-dd HH:mm");
  var cleanBody = htmlToMarkdown_(htmlBody);

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

/**
 * GensparkのHTML本文をMarkdownに変換
 * 実際のHTML構造: summary-content div内に h2, ul>li, strong, p 等
 */
function htmlToMarkdown_(html) {
  // 1. summary-content div の中身を全て抽出
  var contents = [];
  var regex = /<div class="summary-content">([\s\S]*?)<\/div>/gi;
  var match;
  while ((match = regex.exec(html)) !== null) {
    contents.push(match[1]);
  }

  var content;
  if (contents.length > 0) {
    content = contents.join("\n\n");
  } else {
    // summary-content が見つからない場合、body全体からヘッダー/フッターを除去
    content = html;
    content = content.replace(/<div class="header">[\s\S]*?<\/div>\s*<\/div>/i, "");
    content = content.replace(/<div class="footer">[\s\S]*?<\/div>\s*<\/div>/i, "");
    content = content.replace(/<div class="meeting-details">[\s\S]*?<\/div>\s*<\/div>/i, "");
  }

  // 2. HTML → Markdown変換

  // 見出し
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n\n");
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n\n");
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n\n");

  // 太字・斜体
  content = content.replace(/<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>/gi, "**$1**");
  content = content.replace(/<(?:em|i)>([\s\S]*?)<\/(?:em|i)>/gi, "*$1*");

  // リスト
  content = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1");
  content = content.replace(/<\/?(?:ul|ol)[^>]*>/gi, "\n");

  // 段落・改行
  content = content.replace(/<br\s*\/?>/gi, "\n");
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n");

  // リンク
  content = content.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // 残りのHTMLタグを除去
  content = content.replace(/<[^>]+>/g, "");

  // HTMLエンティティをデコード
  content = content.replace(/&amp;/g, "&");
  content = content.replace(/&lt;/g, "<");
  content = content.replace(/&gt;/g, ">");
  content = content.replace(/&quot;/g, '"');
  content = content.replace(/&#39;/g, "'");
  content = content.replace(/&nbsp;/g, " ");

  // 3行以上の連続空行を2行に
  content = content.replace(/\n{3,}/g, "\n\n");

  return content.trim();
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
// Googleカレンダー連携
// ===================================================

/**
 * タスクをGoogleカレンダーに追加
 * HTMLからタスク項目（<li>）を抽出し、空き時間に30分枠で入れる
 */
function addTasksToCalendar_(title, htmlBody, date) {
  var calendar = CalendarApp.getDefaultCalendar();
  var tasks = extractTasks_(htmlBody);

  if (tasks.length === 0) {
    var slot = findNextFreeSlot_(calendar, date, 1);
    if (slot) {
      var end = new Date(slot.getTime() + 30 * 60 * 1000);
      calendar.createEvent("📋 " + title, slot, end, { description: "Genspark議事録より自動追加" });
    }
    Logger.log("カレンダー追加（全体）: " + title);
    return;
  }

  // タスク数分の空き枠を探して順番に入れる
  var slots = findNextFreeSlot_(calendar, date, tasks.length);
  for (var i = 0; i < tasks.length; i++) {
    var task = tasks[i];
    var eventTitle = "📋 " + task.name;
    var description = "Genspark議事録「" + title + "」より自動追加";
    if (task.detail) description += "\n\n" + task.detail;

    var startTime;
    if (task.date) {
      // 日付指定ありの場合はその日の空き時間を探す
      var taskSlot = findNextFreeSlot_(calendar, task.date, 1);
      startTime = taskSlot;
    } else if (Array.isArray(slots)) {
      startTime = slots[i];
    } else {
      startTime = slots;
    }

    if (startTime) {
      var endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
      calendar.createEvent(eventTitle, startTime, endTime, { description: description });
      Logger.log("カレンダー追加: " + task.name + " @ " + Utilities.formatDate(startTime, "Asia/Tokyo", "HH:mm"));
    }
  }
}

/**
 * カレンダーの空き時間を探す（9:00-18:00の範囲で30分刻み）
 * count: 必要なスロット数。連続した空きを返す
 */
function findNextFreeSlot_(calendar, date, count) {
  var targetDate = new Date(date);
  var now = new Date();

  // 対象日の9:00から開始（過去の場合は現在時刻の次の30分区切りから）
  var searchStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 9, 0, 0);
  if (searchStart < now) {
    searchStart = new Date(now);
    // 次の30分区切りに切り上げ
    var mins = searchStart.getMinutes();
    if (mins > 0 && mins <= 30) {
      searchStart.setMinutes(30, 0, 0);
    } else if (mins > 30) {
      searchStart.setHours(searchStart.getHours() + 1, 0, 0, 0);
    }
  }

  var searchEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 24, 0, 0);
  // 検索開始が18時以降なら翌日の9時から
  if (searchStart >= searchEnd) {
    searchStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1, 9, 0, 0);
    searchEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1, 18, 0, 0);
  }

  // 対象日の全イベントを取得
  var events = calendar.getEvents(searchStart, searchEnd);

  // 30分スロットを生成して空きを探す
  var foundSlots = [];
  var current = new Date(searchStart);

  while (current.getTime() + 30 * 60 * 1000 <= searchEnd.getTime() && foundSlots.length < count) {
    var slotEnd = new Date(current.getTime() + 30 * 60 * 1000);
    var isFree = true;

    for (var i = 0; i < events.length; i++) {
      var evStart = events[i].getStartTime();
      var evEnd = events[i].getEndTime();
      // 重なりチェック
      if (current < evEnd && slotEnd > evStart) {
        isFree = false;
        // このイベントの終了時刻まで飛ばす
        current = new Date(evEnd);
        // 30分区切りに切り上げ
        var m = current.getMinutes();
        if (m > 0 && m <= 30) {
          current.setMinutes(30, 0, 0);
        } else if (m > 30) {
          current.setHours(current.getHours() + 1, 0, 0, 0);
        }
        break;
      }
    }

    if (isFree) {
      foundSlots.push(new Date(current));
      current = new Date(current.getTime() + 30 * 60 * 1000);
    }
  }

  if (count === 1) return foundSlots.length > 0 ? foundSlots[0] : searchStart;
  return foundSlots.length > 0 ? foundSlots : [searchStart];
}

/**
 * HTMLからタスク項目を抽出
 * <li>タグの中身をパースして、タスク名・詳細・日付を取得
 */
function extractTasks_(html) {
  var tasks = [];
  var liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  var match;

  while ((match = liRegex.exec(html)) !== null) {
    var content = match[1];

    // HTMLタグを除去してプレーンテキスト化
    var plain = content.replace(/<[^>]+>/g, "").trim();
    if (!plain) continue;

    // "タスク名: 詳細" or "タスク名 - 詳細" のパターンを分離
    var parts = plain.match(/^(.+?)[:\uff1a\-]\s*(.+)$/);
    var name = parts ? parts[1].trim() : plain;
    var detail = parts ? parts[2].trim() : "";

    // 日付を検出（「3/28」「3月28日」「午後2時半」等）
    var taskDate = parseTaskDate_(detail || plain);

    tasks.push({
      name: name,
      detail: detail,
      date: taskDate
    });
  }

  return tasks;
}

/**
 * テキストから日付を推定
 * 「3/28」「3月28日」「明日」「来週」等のパターンに対応
 */
function parseTaskDate_(text) {
  var now = new Date();
  var year = now.getFullYear();

  // 「X月X日」パターン
  var match = text.match(/(\d{1,2})月(\d{1,2})日/);
  if (match) {
    return new Date(year, parseInt(match[1]) - 1, parseInt(match[2]));
  }

  // 「X/X」パターン
  match = text.match(/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    return new Date(year, parseInt(match[1]) - 1, parseInt(match[2]));
  }

  // 「明日」
  if (text.indexOf("明日") !== -1) {
    var tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // 「今日」「本日」
  if (text.indexOf("今日") !== -1 || text.indexOf("本日") !== -1) {
    return now;
  }

  // 日付が見つからない場合はnull（呼び出し元でメール日付を使用）
  return null;
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

/**
 * 再処理: 処理済みラベルを外して全メールを再処理
 * Code.gsを更新した後に1回だけ実行する
 */
function reprocessAll() {
  var label = GmailApp.getUserLabelByName(LABEL_PROCESSED);
  if (label) {
    var threads = label.getThreads();
    threads.forEach(function(thread) {
      thread.removeLabel(label);
    });
    Logger.log(threads.length + "件のラベルを除去しました");
  }
  // ラベル除去後に再処理
  processNewEmails_();
}

/**
 * デバッグ: GensparkメールのHTML構造を確認
 */
/**
 * デバッグ: HTMLパース結果をログに出力（実際に保存はしない）
 */
function debugParse() {
  var query = 'from:team@genspark.ai subject:"Meeting Notes"';
  var threads = GmailApp.search(query, 0, 1);
  if (threads.length === 0) { Logger.log("メールなし"); return; }

  var msg = threads[0].getMessages()[threads[0].getMessages().length - 1];
  var html = msg.getBody();
  var plain = msg.getPlainBody();

  Logger.log("=== getBody() の長さ: " + html.length + " ===");
  Logger.log("=== getPlainBody() の長さ: " + plain.length + " ===");
  Logger.log("=== HTMLか? " + (html.indexOf("<div") !== -1 ? "YES" : "NO") + " ===");

  var result = htmlToMarkdown_(html);
  Logger.log("=== パース結果 ===");
  Logger.log(result.substring(0, 3000));
}

function debugHtml() {
  var query = 'from:team@genspark.ai subject:"Meeting Notes"';
  var threads = GmailApp.search(query, 0, 1);
  if (threads.length === 0) { Logger.log("メールなし"); return; }

  var msg = threads[0].getMessages()[threads[0].getMessages().length - 1];
  var html = msg.getBody();

  // <style>タグを除去してbody部分だけ表示
  var body = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  body = body.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");

  // 4000文字ずつログ
  for (var i = 0; i < body.length && i < 16000; i += 4000) {
    Logger.log("=== HTML BODY (" + i + "-" + (i+4000) + ") ===");
    Logger.log(body.substring(i, i + 4000));
  }
}
