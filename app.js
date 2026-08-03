const OVERALL_REFLECTION_HEADING =
  /\*{2,3}\s*(?:Overall\s+reflection\s+and\s+actions?|(?:整体|总体)反思(?:和|与)?行动)\s*[:：]\s*\*{2,3}/i;
const REFLECTION_HEADING =
  /\*{2,3}\s*(?:Reflection|反思|反射)\s*[:：]\s*\*{2,3}/i;
const GENERATED_ENGLISH_SESSION_SUMMARY =
  /(?:\r?\n[ \t]*){2}(?:(?:There was no obvious harassment today, but I still noticed how much attention I paid to the possibility of interruption\.)|(?:There was a mild rude interruption from someone passing by\. I felt uncomfortable, but it did not completely destroy the conversation\.)|(?:There was a severe toxic comment in the room\. I felt the same discomfort as in the early pilot session, because anonymity seemed to allow real world bias to return quickly\.))[ \t]+In total, I encountered around \d+ people, and about \d+ conversations? lasted more than five minutes\. The session lasted \d+ minutes, which felt (?:longer than usual|shorter than usual|close to my normal rhythm)\.\s*$/i;
const GENERATED_CHINESE_SESSION_SUMMARY =
  /\s*今天没有明显的骚扰，但我仍然注意到我对中断的可能性给予了多少关注。\s*我总共遇到了大约\s*\d+\s*个人，大约\s*\d+\s*次对话持续了五分钟以上。\s*会议持续了\s*\d+\s*分钟，感觉(?:比平时更长|比平时更短|接近我的正常节奏)。\s*$/u;
const GENERATED_ENGLISH_SUMMARY_SENTENCE =
  /\s*(?:There was no obvious harassment today, but I still noticed how much attention I paid to the possibility of interruption\.|There was a mild rude interruption from someone passing by\. I felt uncomfortable, but it did not completely destroy the conversation\.|There was a severe toxic comment in the room\. I felt the same discomfort as in the early pilot session, because anonymity seemed to allow real world bias to return quickly\.|I always notice how much attention I give to the possibility of interruption\.)\s*$/i;
const GENERATED_CHINESE_SUMMARY_SENTENCE =
  /\s*(?:今天没有明显的骚扰，但我仍然注意到我对中断的可能性给予了多少关注。|我总会注意到我对中断的可能性给予了多少关注。)\s*$/u;
const GENERATED_REFLECTION_CLOSERS = [
  "I kept asking myself whether this was a norm of the room, a norm of the platform, or simply the habit of this small group.",
  "I have been asking myself, is this the specification of the room, the standard of the platform, or is it just the habit of this small group.",
  "It was difficult to tell whether I should treat the moment as play, politeness, or avoidance.",
  "This made me wonder whether I was reading the room correctly, or whether I was still bringing too many real life assumptions into VRChat.",
  "This makes me wonder if I read the room correctly, or if I'm still bringing too many real-life hypotheses into VRCChat.",
  "I checked the safety menu again and realised that these settings were not only technical, but part of how I decided whether a room felt safe.",
  "我一直在问自己，这是否是房间的规范，平台的规范，还是只是这个小团体的习惯。",
  "很难说我应该将这一刻视为游戏、礼貌还是回避。",
  "这让我想知道我是否正确地阅读了房间，或者我是否仍在将太多的现实生活假设带入 vrchat。",
  "这让我想知道我是否正确地阅读了房间，或者我是否仍在将太多的现实生活假设带入 VRChat。",
  "我再次查看了安全菜单，意识到这些设置不仅是技术性的，而且是我决定房间是否安全的一部分。",
  ", which immediately changed how I expected the conversation to go",
  ", which immediately changed my expectations for the conversation",
  "A small part of the conversation stayed with me:",
  "It changes by world, but people notice when you are careful.",
  "It will change with the world, but when you are careful, people will notice.",
  "，这立即改变了我对谈话的预期",
  "谈话的一小部分留在我身边：",
  "它因世界而改变，但当你小心时，人们会注意到。",
  "它会随着世界而改变，但当你小心时，人们会注意到。",
];

function normalizeDiaryNarrative(text) {
  return String(text || "").replace(
    /^(\s*\*\*[^*\r\n]+\*\*)[^\S\r\n]+(?=\S)/,
    "$1\n",
  );
}

function removeReflectionSections(text) {
  let cleaned = String(text || "");
  const overall = cleaned.match(OVERALL_REFLECTION_HEADING);
  if (overall) cleaned = cleaned.slice(0, overall.index);

  let reflection = cleaned.match(REFLECTION_HEADING);
  while (reflection) {
    const before = cleaned.slice(0, reflection.index).trimEnd();
    const afterHeading = cleaned.slice(reflection.index + reflection[0].length);
    const paragraphBoundary = afterHeading.match(/\r?\n[ \t]*\r?\n/);
    if (!paragraphBoundary) {
      cleaned = before;
      break;
    }
    const afterSection = afterHeading
      .slice(paragraphBoundary.index + paragraphBoundary[0].length)
      .trimStart();
    cleaned = [before, afterSection].filter(Boolean).join("\n\n");
    reflection = cleaned.match(REFLECTION_HEADING);
  }

  return cleaned
    .replace(/[ \t]+\r?\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function removeGeneratedSessionSummary(text) {
  return String(text || "")
    .replace(GENERATED_ENGLISH_SESSION_SUMMARY, "")
    .replace(GENERATED_CHINESE_SESSION_SUMMARY, "")
    .replace(GENERATED_ENGLISH_SUMMARY_SENTENCE, "")
    .replace(GENERATED_CHINESE_SUMMARY_SENTENCE, "")
    .replace(/[ \t]+\r?\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function removeGeneratedReflectionClosers(text) {
  const original = String(text || "");
  let cleaned = original;
  for (const phrase of GENERATED_REFLECTION_CLOSERS) {
    cleaned = cleaned.split(phrase).join("");
  }
  if (cleaned === original) return original;
  return cleaned
    .replace(/^[^\r\n:：]{1,40}[:：]\s*["“”']{0,2}\s*$/gm, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trimEnd())
    .join("\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractDiaryTitle(text, fallback = "") {
  const normalized = normalizeDiaryNarrative(text);
  const markedTitle = normalized.match(/^\s*\*\*([^*\r\n]+)\*\*/);
  if (markedTitle) return markedTitle[1].trim();
  const first = normalized.split(/\r?\n/)[0] || fallback;
  return first.replace(/\*/g, "").trim();
}

async function translateDiaryNarrative(translator, text, onProgress) {
  const normalized = normalizeDiaryNarrative(text);
  const parts = splitDiaryNarrative(normalized);
  if (!parts.hasMarkedTitle) {
    return translateLongText(translator, normalized, onProgress);
  }

  onProgress?.(0);
  const translatedTitle = stripBoldMarkers(await translator.translate(parts.title));
  onProgress?.(10);
  const translatedBody = await translateLongText(translator, parts.body, (progress) => {
    onProgress?.(10 + Math.round(progress * 0.9));
  });
  onProgress?.(100);

  const safeTitle = translatedTitle || parts.title;
  return `**${safeTitle}**${translatedBody ? `\n${translatedBody}` : ""}`;
}

async function translateLongText(translator, text, onProgress) {
  if (!String(text || "").trim()) {
    onProgress?.(100);
    return "";
  }
  const chunks = chunkText(String(text || ""), 1600);
  const translated = [];
  for (let index = 0; index < chunks.length; index += 1) {
    translated.push(await translator.translate(chunks[index]));
    onProgress?.(Math.round(((index + 1) / chunks.length) * 100));
  }
  return translated.join("\n\n");
}

function splitDiaryNarrative(text) {
  const marked = String(text || "").match(
    /^\s*\*\*([^*\r\n]+)\*\*[ \t]*(?:\r?\n+|$)([\s\S]*)$/,
  );
  if (!marked) {
    return {
      hasMarkedTitle: false,
      title: "",
      body: String(text || ""),
    };
  }
  return {
    hasMarkedTitle: true,
    title: marked[1].trim(),
    body: marked[2],
  };
}

function stripBoldMarkers(text) {
  return String(text || "")
    .trim()
    .replace(/^\*\*\s*/, "")
    .replace(/\s*\*{2}$/, "")
    .trim();
}

function chunkText(text, maxLength) {
  if (!text) return [""];
  const paragraphs = text.split(/\n{2,}/);
  const chunks = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (paragraph.length > maxLength) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (let start = 0; start < paragraph.length; start += maxLength) {
        chunks.push(paragraph.slice(start, start + maxLength));
      }
      continue;
    }
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > maxLength && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text];
}


/* --- END NARRATIVE MODULE --- */



const data = window.VRCHAT_DIARY_DATA;
const STORAGE_KEYS = {
  edits: "social-vr-diary-edits-v2",
  drafts: "social-vr-diary-drafts-v1",
  language: "social-vr-diary-language-v1",
  eyeCare: "social-vr-diary-eye-care-v1",
  translations: "social-vr-diary-translations-v4",
};
const persistedEdits = readStoredMap(STORAGE_KEYS.edits);
const persistedDrafts = readStoredMap(STORAGE_KEYS.drafts);
const persistedTranslations = readStoredMap(STORAGE_KEYS.translations);
let draftSaveTimer;

data.diary = data.diary
  .map((row) => {
    const merged = {
      ...row,
      ...(persistedTranslations[String(row.Session)] || {}),
      ...(persistedEdits[String(row.Session)] || {}),
    };
    merged["Diary Note"] = normalizeDiaryNarrative(
      removeGeneratedReflectionClosers(merged["Diary Note"]),
    );
    merged["Diary Note (Chinese)"] = normalizeDiaryNarrative(
      removeGeneratedReflectionClosers(merged["Diary Note (Chinese)"]),
    );
    return merged;
  })
  .sort(compareDiaryRows);

const state = {
  selectedSession: data.diary[0]?.Session,
  chartStart: data.diary[0]?.Date,
  chartEnd: data.diary.at(-1)?.Date,
  chartPoints: [],
  editorSession: null,
  editorDraft: null,
  editorDirty: false,
  saveNotice: "",
  language: null === "zh" ? "zh" : "en",
  eyeCare: false,
  sourceAvailable: false,
  sourceStatus: "checking",
  translators: {},
  translatorPromise: null,
  translationSession: null,
  translationNotice: "",
  translationError: false,
  translationErrorSession: null,
  filters: {
    search: "",
    norm: "All",
    avatarStrategy: "All",
    toxicity: "All",
    sort: "dateAsc",
  },
};

const els = {
  kpiStrip: (document.querySelector("#kpiStrip") || document.createElement("div")),
  trendChart: (document.querySelector("#trendChart") || document.createElement("div")),
  chartStart: (document.querySelector("#chartStart") || document.createElement("div")),
  chartEnd: (document.querySelector("#chartEnd") || document.createElement("div")),
  chartWindowLabel: (document.querySelector("#chartWindowLabel") || document.createElement("div")),
  rangeStart: (document.querySelector("#rangeStart") || document.createElement("div")),
  rangeEnd: (document.querySelector("#rangeEnd") || document.createElement("div")),
  rangeFill: (document.querySelector("#rangeFill") || document.createElement("div")),
  chartTooltip: (document.querySelector("#chartTooltip") || document.createElement("div")),
  diaryList: (document.querySelector("#diaryList") || document.createElement("div")),
  diaryDetail: (document.querySelector("#diaryDetail") || document.createElement("div")),
  resultCount: (document.querySelector("#resultCount") || document.createElement("div")),
  searchInput: (document.querySelector("#searchInput") || document.createElement("div")),
  normFilter: (document.querySelector("#normFilter") || document.createElement("div")),
  avatarStrategyFilter: (document.querySelector("#avatarStrategyFilter") || document.createElement("div")),
  toxicityFilter: (document.querySelector("#toxicityFilter") || document.createElement("div")),
  sortSelect: (document.querySelector("#sortSelect") || document.createElement("div")),
  languageToggle: (document.querySelector("#languageToggle") || document.createElement("div")),
  eyeCareToggle: (document.querySelector("#eyeCareToggle") || document.createElement("div")),
  eyeCareLabel: (document.querySelector("#eyeCareLabel") || document.createElement("div")),
  sourceStatus: (document.querySelector("#sourceStatus") || document.createElement("div")),
  pageTitle: (document.querySelector("#pageTitle") || document.createElement("div")),
  eyebrow: (document.querySelector("#eyebrow") || document.createElement("div")),
  datasetLink: (document.querySelector("#datasetLink") || document.createElement("div")),
  searchLabel: (document.querySelector("#searchLabel") || document.createElement("div")),
  normLabel: (document.querySelector("#normLabel") || document.createElement("div")),
  avatarStrategyLabel: (document.querySelector("#avatarStrategyLabel") || document.createElement("div")),
  toxicityLabel: (document.querySelector("#toxicityLabel") || document.createElement("div")),
  sortLabel: (document.querySelector("#sortLabel") || document.createElement("div")),
  sortDateAsc: (document.querySelector("#sortDateAsc") || document.createElement("div")),
  sortDateDesc: (document.querySelector("#sortDateDesc") || document.createElement("div")),
  sortInteractionsDesc: (document.querySelector("#sortInteractionsDesc") || document.createElement("div")),
  sortDurationDesc: (document.querySelector("#sortDurationDesc") || document.createElement("div")),
  trendTitle: (document.querySelector("#trendTitle") || document.createElement("div")),
  rangeAll: (document.querySelector("#rangeAll") || document.createElement("div")),
  range90: (document.querySelector("#range90") || document.createElement("div")),
  range45: (document.querySelector("#range45") || document.createElement("div")),
  range30: (document.querySelector("#range30") || document.createElement("div")),
  fromLabel: (document.querySelector("#fromLabel") || document.createElement("div")),
  toLabel: (document.querySelector("#toLabel") || document.createElement("div")),
  timelineTitle: (document.querySelector("#timelineTitle") || document.createElement("div")),
};

const STRINGS = {
  en: {
    eyebrow: "Social VR Autoethnography",
    pageTitle: "Social VR Autoethnography Diary",
    dataset: "Dataset",
    languageButton: "中文",
    languageAria: "Switch to Chinese",
    eyeCareOff: "Eye care",
    eyeCareOn: "Eye care: On",
    eyeCareEnableAria: "Enable eye-care reading mode",
    eyeCareDisableAria: "Disable eye-care reading mode",
    sourceChecking: "Checking source data…",
    sourceConnected: "Excel source connected",
    sourceOffline: "Source write-back unavailable",
    search: "Search",
    searchPlaceholder: "world, norm, diary text",
    norm: "Norm",
    avatarStrategy: "Avatar Identity Strategy",
    harassment: "Harassment",
    sort: "Sort",
    sortDateAsc: "Date ascending",
    sortDateDesc: "Date descending",
    sortInteractionsDesc: "Interactions high to low",
    sortDurationDesc: "Duration high to low",
    trendTitle: "Interaction Times Over Time",
    all: "All",
    days90: "90 days",
    days45: "45 days",
    days30: "30 days",
    from: "From",
    to: "To",
    timeline: "Diary Timeline",
    shown: "{count} shown",
    noMatches: "No matching sessions.",
    noSelection: "No session selected.",
    sessions: "Sessions",
    dateRange: "Date Range",
    totalHours: "Total Hours",
    avgInteractions: "Avg Interactions people",
    avgConversations: "Avg 5+ min Conversations",
    harassmentRate: "Harassment Rate",
    chartInteractions: "interaction times",
    chartSmoothed: "smoothed interactions",
    tooltipInteractions: "Interaction times",
    draft: "Draft",
    edited: "Edited",
    editedSource: "Saved to source",
    machineTranslation: "Machine translation",
    pendingTranslation: "Not translated",
    session: "Session",
    sourceContext:
      "Changes are saved to the Excel source dataset. Chinese edits are back-translated and update the English source text.",
    offlineContext: "Open with start_dashboard.cmd to save changes to the Excel source.",
    continueEditing: "Continue editing",
    editDiary: "Edit diary",
    draftReady: "An autosaved draft is ready to continue.",
    translating: "Translating this diary locally in your browser…",
    translationDownloading: "Preparing the local Chinese language pack… {progress}",
    translationUnavailable:
      "Local translation is unavailable in this browser. Open the dashboard in current Chrome, or enter a Chinese version manually.",
    translationFailed: "The local translation did not finish. You can retry without changing the English original.",
    retryTranslation: "Retry translation",
    englishFallback: "The English original is shown until the Chinese version is ready.",
    date: "Date",
    time: "Time",
    world: "World",
    avatar: "Avatar",
    interactions: "Interactions",
    conversations: "5+ min Conversations",
    editingSession: "Editing session #{session}",
    draftHelp: "Your draft saves in this browser as you type.",
    startTime: "Start time",
    endTime: "End time",
    diaryEntry: "Diary entry",
    draftRestored: "Draft restored from this browser.",
    readyEdit: "Ready to edit.",
    saveShortcut: "Tip: Ctrl/⌘ + S saves changes",
    discardDraft: "Discard draft",
    saveChanges: "Save changes",
    savingDraft: "Saving draft…",
    draftSaved: "Draft saved locally.",
    draftSessionOnly: "Draft is available until this page closes.",
    sourceRequired: "Source write-back is unavailable. Start the dashboard with start_dashboard.cmd, then try again.",
    backTranslating: "Back-translating your Chinese edit to English… {progress}",
    backTranslationDownloading: "Preparing the local Chinese–English language pack… {progress}",
    backTranslationFailed:
      "The Chinese edit could not be back-translated. Nothing was changed in the source dataset; try again in current Chrome.",
    savingSource: "Saving to the Excel source dataset…",
    savedSource: "Changes saved to the Excel source dataset and dashboard.",
    saveFailed: "The source file could not be updated. Close it in Excel if it is open, then try again.",
    draftDiscarded: "Draft discarded. The last saved version is shown.",
    requiredFields: "Please complete the required fields before saving.",
    countsNegative: "Interaction counts cannot be negative.",
    conversationsExceeded: "5+ minute conversations cannot exceed the total interactions.",
    untitled: "Untitled session",
  },
  zh: {
    eyebrow: "社会虚拟现实自我民族志",
    pageTitle: "Social VR 自我民族志研究日记",
    dataset: "源数据",
    languageButton: "English",
    eyeCareOff: "护眼",
    eyeCareOn: "护眼：开",
    eyeCareEnableAria: "开启护眼阅读模式",
    eyeCareDisableAria: "关闭护眼阅读模式",
    languageAria: "切换为英文",
    sourceChecking: "正在检查源数据…",
    sourceConnected: "已连接 Excel 源数据",
    sourceOffline: "暂时无法写回源数据",
    search: "搜索",
    searchPlaceholder: "搜索世界、规范或日记内容",
    norm: "观察到的规范",
    avatarStrategy: "虚拟形象身份策略",
    harassment: "骚扰情况",
    sort: "排序",
    sortDateAsc: "日期从早到晚",
    sortDateDesc: "日期从晚到早",
    sortInteractionsDesc: "互动人数从高到低",
    sortDurationDesc: "时长从高到低",
    trendTitle: "互动人数随时间变化",
    all: "全部",
    days90: "90 天",
    days45: "45 天",
    days30: "30 天",
    from: "开始",
    to: "结束",
    timeline: "日记时间线",
    shown: "显示 {count} 篇",
    noMatches: "没有符合条件的日记。",
    noSelection: "尚未选择日记。",
    sessions: "日记篇数",
    dateRange: "日期范围",
    totalHours: "总时长",
    avgInteractions: "平均互动人数",
    avgConversations: "平均 5 分钟以上对话",
    harassmentRate: "骚扰发生率",
    chartInteractions: "互动人数",
    chartSmoothed: "互动人数平滑趋势",
    tooltipInteractions: "互动人数",
    draft: "草稿",
    edited: "已编辑",
    editedSource: "已写回源数据",
    machineTranslation: "机器翻译待校订",
    pendingTranslation: "待翻译",
    session: "第 {session} 次",
    sourceContext: "中文编辑会自动回译成英文，并更新源数据中的英文正文；中文版本同时保留用于核对。",
    offlineContext: "请通过 start_dashboard.cmd 打开看板，才能把修改写入 Excel 源数据。",
    continueEditing: "继续编辑",
    editDiary: "编辑日记",
    draftReady: "浏览器里有一份自动保存的草稿，可以继续编辑。",
    translating: "正在浏览器本地翻译这篇日记…",
    translationDownloading: "正在准备本地中文语言包… {progress}",
    translationUnavailable: "当前浏览器不支持本地翻译。请用最新版 Chrome 打开，或手动录入中文版本。",
    translationFailed: "本地翻译没有完成；英文原文没有被改动，可以重试。",
    retryTranslation: "重新翻译",
    englishFallback: "中文版本准备好之前，暂时显示英文原文。",
    date: "日期",
    time: "时间",
    world: "世界",
    avatar: "虚拟形象",
    interactions: "互动人数",
    conversations: "5 分钟以上对话",
    editingSession: "正在编辑第 {session} 次日记",
    draftHelp: "输入内容会自动作为草稿保存在本浏览器中。",
    startTime: "开始时间",
    endTime: "结束时间",
    diaryEntry: "日记正文（中文）",
    draftRestored: "已恢复本浏览器中的草稿。",
    readyEdit: "可以开始编辑。",
    saveShortcut: "提示：Ctrl/⌘ + S 可保存修改",
    discardDraft: "放弃草稿",
    saveChanges: "保存到源数据",
    savingDraft: "正在保存草稿…",
    draftSaved: "草稿已保存在本浏览器。",
    draftSessionOnly: "草稿会保留到本页面关闭。",
    sourceRequired: "暂时无法写回源数据。请通过 start_dashboard.cmd 启动看板后再试。",
    backTranslating: "正在把中文修改回译成英文… {progress}",
    backTranslationDownloading: "正在准备本地中英语言包… {progress}",
    backTranslationFailed: "中文修改未能回译，源数据没有被改动。请用最新版 Chrome 重试。",
    savingSource: "正在写入 Excel 源数据…",
    savedSource: "修改已写入 Excel 源数据并同步到看板。",
    saveFailed: "源文件写入失败。如果 Excel 正开着这个文件，请关闭后重试。",
    draftDiscarded: "草稿已放弃，正在显示上一次保存的版本。",
    requiredFields: "保存前请填写所有必填项。",
    countsNegative: "互动人数不能是负数。",
    conversationsExceeded: "5 分钟以上对话数不能超过总互动人数。",
    untitled: "未命名日记",
  },
};

const VALUE_TRANSLATIONS = {
  All: "全部",
  None: "无",
  Severe: "严重",
  Mild: "轻微",
  Wednesday: "星期三",
  Thursday: "星期四",
  Friday: "星期五",
  Saturday: "星期六",
  Sunday: "星期日",
  Monday: "星期一",
  Tuesday: "星期二",
  "Congruent self": "与现实自我一致",
  Nonhuman: "非人类形象",
  Abstract: "抽象形象",
  "Different gender performance": "不同性别呈现",
  "Different race performance": "不同种族呈现",
  "Default to congruent self": "默认与现实自我一致",
  "Period 1: Entry and Orientation": "阶段 1：进入与适应",
  "Period 2: Embodied Boundaries": "阶段 2：具身边界",
  "Period 3: Avatar Visibility": "阶段 3：虚拟形象可见性",
  "Period 4: Offline Spillover": "阶段 4：线下延伸影响",
  "Period 5: Situated Etiquette": "阶段 5：情境化礼仪",
  "Proximity and gaze etiquette": "距离与凝视礼仪",
  "Contextual avatar choice": "依情境选择虚拟形象",
  "Screenshot consent": "截图同意",
  "Group entry etiquette": "加入群体的礼仪",
  "Disruptive avatar avoidance": "避免干扰性虚拟形象",
  "Event hosting norms": "活动主持规范",
  "Touch and hug etiquette": "触碰与拥抱礼仪",
  "Portal invitation etiquette": "传送门邀请礼仪",
  "Avatar performance constraints": "虚拟形象呈现限制",
  "Group fit through avatar appearance": "通过虚拟形象外观融入群体",
  "Real world turn taking spillover": "现实世界轮流发言影响",
  "Safety rank and permissions": "安全等级与权限",
  "Virtual personal space": "虚拟个人空间",
  "Avatar discovery": "探索虚拟形象",
  "Avatar size and comfort": "虚拟形象尺寸与舒适度",
  "Mirror etiquette": "镜子使用礼仪",
  "Real world gaze awareness": "现实世界凝视意识",
  "Voice and turn taking etiquette": "语音与轮流发言礼仪",
  "World instance norms": "世界实例规范",
  "Blocking and muting": "屏蔽与静音",
  "Mic etiquette": "麦克风礼仪",
  "Privacy through avatar choice": "通过虚拟形象选择保护隐私",
  "Real world distance spillover": "现实世界距离感影响",
  "World entry and greeting etiquette": "进入世界与问候礼仪",
  "Friend request etiquette": "好友请求礼仪",
};

function t(key, replacements = {}) {
  let value = STRINGS[state.language]?.[key] ?? STRINGS.en[key] ?? key;
  for (const [name, replacement] of Object.entries(replacements)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}

function displayValue(value) {
  if (state.language !== "zh") return value;
  return VALUE_TRANSLATIONS[String(value)] || value;
}

function chineseField(field) {
  return field === "Diary Note" ? "Diary Note (Chinese)" : "";
}

function localizedNarrative(row, field) {
  const value = state.language !== "zh" ? row[field] || "" : row[chineseField(field)] || row[field] || "";
  return field === "Diary Note" ? normalizeDiaryNarrative(value) : value;
}

function hasChineseNarrative(row) { return row["Diary Note (Chinese)"] && row["Diary Note (Chinese)"].trim() !== ""; }

function draftKey(session, language = state.language) {
  return `${session}:${language}`;
}

function getStoredDraft(session, language = state.language) {
  return persistedDrafts[draftKey(session, language)] || (language === "en" ? persistedDrafts[String(session)] : null);
}

function applyInterfaceLanguage() {
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  document.title = t("pageTitle");
  els.eyebrow.textContent = t("eyebrow");
  els.pageTitle.textContent = t("pageTitle");
  els.datasetLink.textContent = t("dataset");
  els.languageToggle.textContent = t("languageButton");
  els.languageToggle.setAttribute("aria-label", t("languageAria"));
  applyEyeCareMode();
  els.searchLabel.textContent = t("search");
  els.searchInput.placeholder = t("searchPlaceholder");
  els.normLabel.textContent = t("norm");
  els.avatarStrategyLabel.textContent = t("avatarStrategy");
  els.toxicityLabel.textContent = t("harassment");
  els.sortLabel.textContent = t("sort");
  els.sortDateAsc.textContent = t("sortDateAsc");
  els.sortDateDesc.textContent = t("sortDateDesc");
  els.sortInteractionsDesc.textContent = t("sortInteractionsDesc");
  els.sortDurationDesc.textContent = t("sortDurationDesc");
  els.trendTitle.textContent = t("trendTitle");
  els.rangeAll.textContent = t("all");
  els.range90.textContent = t("days90");
  els.range45.textContent = t("days45");
  els.range30.textContent = t("days30");
  els.fromLabel.textContent = t("from");
  els.toLabel.textContent = t("to");
  els.timelineTitle.textContent = t("timeline");
  els.kpiStrip.setAttribute("aria-label", state.language === "zh" ? "数据集摘要" : "Dataset summary");
  updateSourceStatus();
}

function applyEyeCareMode() {
  document.documentElement.dataset.eyeCare = state.eyeCare ? "true" : "false";
  els.eyeCareToggle.setAttribute("aria-pressed", String(state.eyeCare));
  els.eyeCareToggle.setAttribute(
    "aria-label",
    t(state.eyeCare ? "eyeCareDisableAria" : "eyeCareEnableAria"),
  );
  els.eyeCareLabel.textContent = t(state.eyeCare ? "eyeCareOn" : "eyeCareOff");
}

function updateSourceStatus() {
  const key =
    state.sourceStatus === "connected"
      ? "sourceConnected"
      : state.sourceStatus === "offline"
        ? "sourceOffline"
        : "sourceChecking";
  els.sourceStatus.textContent = t(key);
  els.sourceStatus.classList.toggle("checking", state.sourceStatus === "checking");
  els.sourceStatus.classList.toggle("offline", state.sourceStatus === "offline");
}

function initLanguageControl() {
  els.languageToggle.addEventListener("click", () => {
    flushDraftSave();
    state.language = state.language === "en" ? "zh" : "en";
    
    state.editorSession = null;
    state.editorDraft = null;
    state.editorDirty = false;
    state.saveNotice = "";
    state.translationNotice = "";
    state.translationError = false;
    state.translationErrorSession = null;
    applyInterfaceLanguage();
    refreshFilterOptions();
    renderKpis();
    renderSessions();
    if (state.language === "zh") {
      const row = data.diary.find((item) => item.Session === state.selectedSession);
      if (row && !hasChineseNarrative(row)) ensureChineseTranslation(row);
    }
  });
}

function initEyeCareControl() {
  els.eyeCareToggle.addEventListener("click", () => {
    state.eyeCare = !state.eyeCare;
    
    applyEyeCareMode();
    renderTrendChart(filteredDiary());
  });
}

async function checkSourceConnection() {
  if (window.location.protocol === "file:") {
    state.sourceAvailable = false;
    state.sourceStatus = "offline";
    updateSourceStatus();
    return;
  }
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    if (!response.ok) throw new Error("Health check failed");
    const result = await response.json();
    state.sourceAvailable = Boolean(result.sourceWriteBack);
    state.sourceStatus = state.sourceAvailable ? "connected" : "offline";
  } catch {
    state.sourceAvailable = false;
    state.sourceStatus = "offline";
  }
  updateSourceStatus();
  if (!state.editorSession) renderSessions();
}

function uniqueValues(field) {
  return [...new Set(data.diary.map((row) => row[field]).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b)),
  );
}

function fillSelect(select, values) {
  select.innerHTML = ["All", ...values]
    .map((value) => `<option value="${escapeAttr(value)}">${escapeHtml(displayValue(value))}</option>`)
    .join("");
}

function refreshFilterOptions() {
  [
    [els.normFilter, "Norm Observed", "norm"],
    [els.avatarStrategyFilter, "Avatar Identity Strategy", "avatarStrategy"],
    [els.toxicityFilter, "Harassment/Toxicity", "toxicity"],
  ].forEach(([select, field, stateKey]) => {
    const currentValue = state.filters[stateKey];
    fillSelect(select, uniqueValues(field));
    const optionExists = [...select.options].some((option) => option.value === currentValue);
    state.filters[stateKey] = optionExists ? currentValue : "All";
    select.value = state.filters[stateKey];
  });
}

function initFilters() {}

function initChartControls() {
  const minDate = data.diary[0].Date;
  const maxDate = data.diary.at(-1).Date;
  const maxIndex = data.diary.length - 1;
  for (const input of [els.chartStart, els.chartEnd]) {
    input.min = minDate;
    input.max = maxDate;
  }
  for (const input of [els.rangeStart, els.rangeEnd]) {
    input.min = 0;
    input.max = maxIndex;
  }
  setChartRange(minDate, maxDate);

  els.chartStart.addEventListener("change", () => {
    setChartRange(els.chartStart.value, state.chartEnd);
    clearPresetButtons();
  });
  els.chartEnd.addEventListener("change", () => {
    setChartRange(state.chartStart, els.chartEnd.value);
    clearPresetButtons();
  });
  document.querySelectorAll(".range-button").forEach((button) => {
    button.addEventListener("click", () => {
      const range = button.dataset.range;
      const currentMinDate = data.diary[0].Date;
      const currentMaxDate = data.diary.at(-1).Date;
      const end = currentMaxDate;
      const start = range === "all" ? currentMinDate : addDaysIso(end, -Number(range) + 1);
      setChartRange(start < currentMinDate ? currentMinDate : start, end);
      document.querySelectorAll(".range-button").forEach((item) => item.classList.toggle("active", item === button));
    });
  });
  els.rangeStart.addEventListener("input", () => {
    const startIndex = Math.min(Number(els.rangeStart.value), Number(els.rangeEnd.value) - 1);
    setChartRange(data.diary[startIndex].Date, state.chartEnd);
    clearPresetButtons();
  });
  els.rangeEnd.addEventListener("input", () => {
    const endIndex = Math.max(Number(els.rangeEnd.value), Number(els.rangeStart.value) + 1);
    setChartRange(state.chartStart, data.diary[endIndex].Date);
    clearPresetButtons();
  });
}

function setChartRange(start, end) {
  const minDate = data.diary[0].Date;
  const maxDate = data.diary.at(-1).Date;
  let nextStart = start || minDate;
  let nextEnd = end || maxDate;
  if (dateMs(nextStart) < dateMs(minDate)) nextStart = minDate;
  if (dateMs(nextEnd) > dateMs(maxDate)) nextEnd = maxDate;
  if (dateMs(nextStart) > dateMs(nextEnd)) {
    [nextStart, nextEnd] = [nextEnd, nextStart];
  }
  state.chartStart = nextStart;
  state.chartEnd = nextEnd;
  els.chartStart.value = nextStart;
  els.chartEnd.value = nextEnd;
  syncRangeInputs();
  renderTrendChart(filteredDiary());
}

function syncRangeInputs() {
  const startIndex = nearestSessionIndex(state.chartStart);
  const endIndex = nearestSessionIndex(state.chartEnd);
  els.rangeStart.value = startIndex;
  els.rangeEnd.value = endIndex;
  const maxIndex = Math.max(1, data.diary.length - 1);
  const left = (startIndex / maxIndex) * 100;
  const right = 100 - (endIndex / maxIndex) * 100;
  els.rangeFill.style.left = `${left}%`;
  els.rangeFill.style.right = `${right}%`;
}

function clearPresetButtons() {
  document.querySelectorAll(".range-button").forEach((item) => item.classList.remove("active"));
}

function filteredDiary() { return data.diary; }

function matches(value, filter) {
  return filter === "All" || value === filter;
}

function renderKpis() {
  const rows = data.diary;
  const firstDate = rows[0]?.Date || "—";
  const lastDate = rows.at(-1)?.Date || "—";
  const total = Math.max(1, rows.length);
  const totalHours = rows.reduce((sum, row) => sum + Number(row["Duration (min)"] || 0), 0) / 60;
  const averageInteractions =
    rows.reduce((sum, row) => sum + Number(row["Interactions (people)"] || 0), 0) / total;
  const averageConversations =
    rows.reduce((sum, row) => sum + Number(row["Conversations 5+ min"] || 0), 0) / total;
  const harassmentCount = rows.filter((row) => {
    const value = String(row["Harassment/Toxicity"] || "").trim().toLowerCase();
    return value && !["none", "no", "n/a"].includes(value);
  }).length;
  const items = [
    [t("sessions"), rows.length],
    [t("dateRange"), `${firstDate} ${state.language === "zh" ? "至" : "to"} ${lastDate}`],
    [t("totalHours"), formatMetric(totalHours, 0)],
    [t("avgInteractions"), formatMetric(averageInteractions, 2)],
    [t("avgConversations"), formatMetric(averageConversations, 2)],
    [t("harassmentRate"), `${formatMetric((harassmentCount / total) * 100, 1)}%`],
  ];
  els.kpiStrip.innerHTML = items
    .map(
      ([label, value]) => `
        <div class="kpi">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `,
    )
    .join("");
}

function cssColor(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function renderTrendChart(rows = data.diary) {
  const svg = els.trendChart;
  const width = Math.max(620, svg.clientWidth || 620);
  const height = 330;
  const pad = { top: 28, right: 34, bottom: 42, left: 58 };
  const chartPalette = {
    dot: cssColor("--chart-dot", "#93c5fd"),
    grid: cssColor("--chart-grid", "#eef2f7"),
    axis: cssColor("--chart-axis", "#d9ded6"),
    label: cssColor("--chart-label", "#475467"),
    ink: cssColor("--ink", "#1b2330"),
    line: cssColor("--chart-line", "#2563eb"),
    marker: cssColor("--chart-marker", "#94a3b8"),
    markerDot: cssColor("--chart-marker-dot", "#1d4ed8"),
    markerRing: cssColor("--chart-marker-ring", "#ffffff"),
  };
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const startMs = dateMs(state.chartStart);
  const endMs = dateMs(state.chartEnd);
  const visible = rows.filter((row) => dateMs(row.Date) >= startMs && dateMs(row.Date) <= endMs);
  const series = [...(visible.length ? visible : rows.length ? rows : data.diary)].sort((a, b) =>
    String(a.Date).localeCompare(String(b.Date)),
  );
  const domainStart = visible.length ? startMs : Math.min(...series.map((row) => dateMs(row.Date)));
  const domainEnd = visible.length ? endMs : Math.max(...series.map((row) => dateMs(row.Date)));
  const maxInteraction = Math.max(...series.map((row) => Number(row["Interactions (people)"])), 1);
  const yMax = Math.max(5, Math.ceil(maxInteraction / 5) * 5);
  const x = (date) =>
    pad.left +
    ((dateMs(date) - domainStart) / Math.max(1, domainEnd - domainStart)) *
      (width - pad.left - pad.right);
  const yInteraction = (value) => height - pad.bottom - (value / yMax) * (height - pad.top - pad.bottom);

  const smoothed = smoothSeries(series.map((row) => Number(row["Interactions (people)"])));
  const points = series.map((row, index) => ({
    x: x(row.Date),
    y: yInteraction(smoothed[index]),
    rawY: yInteraction(Number(row["Interactions (people)"])),
    value: Number(row["Interactions (people)"]),
    date: row.Date,
    session: row.Session,
  }));
  state.chartPoints = points;
  const smoothPath = buildSmoothPath(points);
  const rawDots = points
    .map(
      (point) =>
        `<circle cx="${point.x.toFixed(1)}" cy="${point.rawY.toFixed(1)}" r="1.8" fill="${chartPalette.dot}" opacity="0.5"></circle>`,
    )
    .join("");
  const tickValues = yTicks(yMax);
  const grid = tickValues
    .map((value) => {
      const y = yInteraction(value);
      return `
        <line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${width - pad.right}" y2="${y.toFixed(1)}" stroke="${chartPalette.grid}" />
        <text x="${pad.left - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="${chartPalette.label}">${value}</text>
      `;
    })
    .join("");

  els.chartWindowLabel.textContent = `${formatShortDate(series[0].Date)} to ${formatShortDate(series.at(-1).Date)}`;
  svg.innerHTML = `
    ${grid}
    <line x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}" stroke="${chartPalette.axis}" />
    <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}" stroke="${chartPalette.axis}" />
    <text x="${pad.left}" y="${pad.top - 10}" font-size="12" font-weight="700" fill="${chartPalette.label}">${escapeHtml(t("chartInteractions"))}</text>
    ${rawDots}
    <path d="${smoothPath}" fill="none" stroke="${chartPalette.line}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    <g id="hoverMarker" opacity="0" pointer-events="none">
      <line id="hoverLine" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}" stroke="${chartPalette.marker}" stroke-width="1" stroke-dasharray="3 4" />
      <circle id="hoverDot" cx="${pad.left}" cy="${height - pad.bottom}" r="4" fill="${chartPalette.markerDot}" stroke="${chartPalette.markerRing}" stroke-width="2"></circle>
    </g>
    <text x="${pad.left}" y="${height - 12}" font-size="11" fill="${chartPalette.label}">${formatShortDate(series[0].Date)}</text>
    <text x="${width - pad.right - 72}" y="${height - 12}" font-size="11" fill="${chartPalette.label}">${formatShortDate(series.at(-1).Date)}</text>
    <circle cx="${width - 144}" cy="18" r="4" fill="${chartPalette.line}"></circle>
    <text x="${width - 134}" y="22" font-size="12" fill="${chartPalette.ink}">${escapeHtml(t("chartSmoothed"))}</text>
  `;
  hideChartTooltip();
}

function renderSessions() {
  const rows = filteredDiary();
  if (!rows.some((row) => row.Session === state.selectedSession)) {
    state.selectedSession = rows[0]?.Session;
  }
  els.resultCount.textContent = t("shown", { count: rows.length });
  renderTrendChart(rows);
  renderDiaryList(rows);
  renderDiaryDetail(rows.find((row) => row.Session === state.selectedSession) ?? rows[0]);
}

function renderDiaryList(rows) {
  if (!rows.length) {
    els.diaryList.innerHTML = `<div class="empty-state">${escapeHtml(t("noMatches"))}</div>`;
    return;
  }
  els.diaryList.innerHTML = rows
    .map((row) => {
      const title = extractTitle(localizedNarrative(row, "Diary Note"));
      const hasDraft = Boolean(getStoredDraft(row.Session));
      const wasEdited = Boolean(persistedEdits[String(row.Session)] || row["Last Edited At"]);
      const translationPending = state.language === "zh" && !hasChineseNarrative(row);
      return `
        <button class="diary-row ${row.Session === state.selectedSession ? "active" : ""}" data-session="${row.Session}">
          <span class="session-id">
            #${row.Session}
            ${
              hasDraft
                ? `<span class="row-state draft">${escapeHtml(t("draft"))}</span>`
                : translationPending
                  ? `<span class="row-state draft">${escapeHtml(t("pendingTranslation"))}</span>`
                  : ""
            }
          </span>
          <span>
            <span class="row-title">${escapeHtml(title)}</span>
            <span class="row-meta">${escapeHtml(row.Date)} &middot; ${escapeHtml(row.World)} &middot; ${escapeHtml(row["Avatar Name"])}</span>
          </span>
        </button>
      `;
    })
    .join("");

  els.diaryList.querySelectorAll(".diary-row").forEach((button) => {
    button.addEventListener("click", () => {
      flushDraftSave();
      state.selectedSession = Number(button.dataset.session);
      state.editorSession = null;
      state.editorDraft = null;
      state.editorDirty = false;
      state.saveNotice = "";
      state.translationNotice = "";
      state.translationError = false;
      state.translationErrorSession = null;
      renderSessions();
      const selectedRow = data.diary.find((row) => row.Session === state.selectedSession);
      if (state.language === "zh" && selectedRow && !hasChineseNarrative(selectedRow)) {
        ensureChineseTranslation(selectedRow);
      }
    });
  });
}

function renderDiaryDetail(row) {
  if (!row) {
    els.diaryDetail.innerHTML = `<div class="empty-state">${escapeHtml(t("noSelection"))}</div>`;
    return;
  }
  if (state.editorSession === row.Session) {
    renderDiaryEditor(row);
    return;
  }
  const hasDraft = Boolean(getStoredDraft(row.Session));
  const wasEdited = Boolean(persistedEdits[String(row.Session)] || row["Last Edited At"]);
  const diaryNote = localizedNarrative(row, "Diary Note");
  const missingChinese = state.language === "zh" && !hasChineseNarrative(row);
  const sourceContext = state.sourceAvailable ? t("sourceContext") : t("offlineContext");
  els.diaryDetail.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="detail-title-line">
          <h2>${escapeHtml(extractTitle(diaryNote))}</h2>
          
        </div>
        <p class="detail-context">${escapeHtml(t("session", { session: row.Session }))}</p>
      </div>
      
    </div>
    ${
      state.saveNotice
        ? `<div class="save-feedback" role="status">${escapeHtml(state.saveNotice)}</div>`
        : hasDraft
          ? `<div class="draft-feedback" role="status">${escapeHtml(t("draftReady"))}</div>`
          : ""
    }
    ${missingChinese ? translationBanner(row) : ""}
    <div class="detail-grid">
      ${detailCell(t("date"), `${row.Date}, ${displayValue(row.Day)}`)}
      ${detailCell(t("world"), row.World)}
      ${detailCell(t("avatar"), row["Avatar Name"])}
    </div>
    <div class="diary-text">${formatDiary(diaryNote)}</div>
  `;
  
  
}

function translationBanner(row) {
  const active = state.translationSession === row.Session;
  const failed = state.translationErrorSession === row.Session;
  const message = active
    ? state.translationNotice || t("translating")
    : failed
      ? state.translationNotice || t("translationFailed")
      : t("englishFallback");
  return `
    <div class="translation-feedback ${failed ? "error" : ""}" role="status">
      <div class="translation-actions">
        <span>${escapeHtml(message)}</span>
        ${
          active
            ? ""
            : `<button class="secondary-button" id="retryTranslation" type="button">${escapeHtml(t("retryTranslation"))}</button>`
        }
      </div>
    </div>
  `;
}

function renderDiaryEditor(row) {
  const draft = state.editorDraft || editableFields(row);
  const normOptions = uniqueValues("Norm Observed")
    .map((value) => `<option value="${escapeAttr(value)}"></option>`)
    .join("");
  els.diaryDetail.innerHTML = `
    <form class="diary-editor" id="diaryEditForm">
      <div class="editor-header">
        <div>
          <p class="editor-eyebrow">${escapeHtml(t("editingSession", { session: row.Session }))}</p>
          <h2>${escapeHtml(extractTitle(draft["Diary Note"]))}</h2>
        </div>
        <p class="editor-help">${escapeHtml(t("draftHelp"))}</p>
      </div>

      <div class="editor-grid">
        ${editorInput(t("date"), "date", "date", draft.Date, { required: true })}
        ${editorInput(t("startTime"), "timeStart", "time", draft["Time Start"])}
        ${editorInput(t("endTime"), "timeEnd", "time", draft["Time End"])}
        ${editorInput(t("world"), "world", "text", draft.World, { required: true })}
        ${editorInput(t("avatar"), "avatarName", "text", draft["Avatar Name"], { required: true })}
        ${editorInput(t("norm"), "normObserved", "text", draft["Norm Observed"], {
          required: true,
          list: "normOptions",
        })}
        ${editorInput(t("interactions"), "interactions", "number", draft["Interactions (people)"], {
          min: 0,
          step: 1,
        })}
        ${editorInput(t("conversations"), "conversations", "number", draft["Conversations 5+ min"], {
          min: 0,
          step: 1,
        })}
      </div>
      <datalist id="normOptions">${normOptions}</datalist>

      <label class="editor-field editor-wide" for="diaryNote">
        <span>${escapeHtml(t("diaryEntry"))}</span>
        <textarea id="diaryNote" name="diaryNote" rows="15" required>${escapeHtml(draft["Diary Note"])}</textarea>
      </label>

      <div class="editor-message" id="editorMessage" role="status" aria-live="polite">
        ${getStoredDraft(row.Session) ? escapeHtml(t("draftRestored")) : escapeHtml(t("readyEdit"))}
      </div>

      <div class="editor-actions">
        <span class="shortcut-hint">${escapeHtml(t("saveShortcut"))}</span>
        <div class="editor-action-buttons">
          <button class="secondary-button" id="cancelDiaryEdit" type="button">${escapeHtml(t("discardDraft"))}</button>
          <button class="primary-button" type="submit">${escapeHtml(t("saveChanges"))}</button>
        </div>
      </div>
    </form>
  `;

  const form = (document.querySelector("#diaryEditForm") || document.createElement("div"));
  form.addEventListener("input", () => {
    state.editorDraft = collectEditorDraft(form);
    state.editorDirty = true;
    scheduleDraftSave();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveDiaryChanges(row, form);
  });
  form.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  (document.querySelector("#cancelDiaryEdit") || document.createElement("div")).addEventListener("click", () => discardDiaryDraft(row.Session));
}

function editorInput(label, name, type, value, options = {}) {
  const attributes = [
    options.required ? "required" : "",
    options.list ? `list="${escapeAttr(options.list)}"` : "",
    options.min !== undefined ? `min="${escapeAttr(options.min)}"` : "",
    options.step !== undefined ? `step="${escapeAttr(options.step)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `
    <label class="editor-field" for="${escapeAttr(name)}">
      <span>${escapeHtml(label)}</span>
      <input id="${escapeAttr(name)}" name="${escapeAttr(name)}" type="${escapeAttr(type)}" value="${escapeAttr(value)}" ${attributes} />
    </label>
  `;
}

async function startDiaryEditor(row) {
  if (state.language === "zh" && !hasChineseNarrative(row) && state.translationErrorSession !== row.Session) {
    await ensureChineseTranslation(row);
  }
  const restoredDraft = getStoredDraft(row.Session);
  state.editorSession = row.Session;
  state.editorDraft = restoredDraft ? { ...editableFields(row), ...restoredDraft } : editableFields(row);
  state.editorDirty = false;
  state.saveNotice = "";
  renderDiaryDetail(row);
  (document.querySelector("#diaryNote") || document.createElement("div"))?.focus();
}

function collectEditorDraft(form) {
  const formData = new FormData(form);
  const date = String(formData.get("date") || "");
  return {
    Date: date,
    Day: dayName(date),
    "Time Start": String(formData.get("timeStart") || ""),
    "Time End": String(formData.get("timeEnd") || ""),
    World: String(formData.get("world") || "").trim(),
    "Avatar Name": String(formData.get("avatarName") || "").trim(),
    "Norm Observed": String(formData.get("normObserved") || "").trim(),
    "Interactions (people)": Number(formData.get("interactions") || 0),
    "Conversations 5+ min": Number(formData.get("conversations") || 0),
    "Diary Note": normalizeDiaryNarrative(String(formData.get("diaryNote") || "")),
  };
}

function scheduleDraftSave() {
  window.clearTimeout(draftSaveTimer);
  setEditorMessage(t("savingDraft"));
  draftSaveTimer = window.setTimeout(() => {
    if (state.editorSession === null || !state.editorDraft) return;
    persistedDrafts[draftKey(state.editorSession)] = state.editorDraft;
    const stored = writeStoredMap(STORAGE_KEYS.drafts, persistedDrafts);
    if (stored) state.editorDirty = false;
    setEditorMessage(stored ? t("draftSaved") : t("draftSessionOnly"));
  }, 250);
}

function flushDraftSave() {
  window.clearTimeout(draftSaveTimer);
  if (state.editorSession === null || !state.editorDraft || !state.editorDirty) return;
  persistedDrafts[draftKey(state.editorSession)] = state.editorDraft;
  if (writeStoredMap(STORAGE_KEYS.drafts, persistedDrafts)) state.editorDirty = false;
}

async function saveDiaryChanges(row, form) {
  const nextDraft = collectEditorDraft(form);
  const validationMessage = validateDiaryDraft(nextDraft);
  if (validationMessage) {
    setEditorMessage(validationMessage, true);
    return;
  }

  if (!state.sourceAvailable) {
    setEditorMessage(t("sourceRequired"), true);
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  window.clearTimeout(draftSaveTimer);
  const sessionKey = String(row.Session);
  let backTranslation = null;

  if (state.language === "zh") {
    try {
      setEditorMessage(t("backTranslating", { progress: "0%" }));
      const translator = await getBrowserTranslator("zh", "en", (progress) => {
        setEditorMessage(t("backTranslationDownloading", { progress }));
      });
      backTranslation = {
        "Diary Note": await translateDiaryNarrative(translator, nextDraft["Diary Note"], (progress) => {
          setEditorMessage(t("backTranslating", { progress: `${Math.round(progress * 100)}%` }));
        }),
      };
    } catch {
      submitButton.disabled = false;
      setEditorMessage(t("backTranslationFailed"), true);
      return;
    }
  }

  setEditorMessage(t("savingSource"));
  try {
    const response = await fetch(`/api/sessions/${encodeURIComponent(row.Session)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "edit",
        language: state.language,
        fields: nextDraft,
        backTranslation,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Save failed");

    const rowIndex = data.diary.findIndex((item) => item.Session === row.Session);
    data.diary[rowIndex] = { ...data.diary[rowIndex], ...(result.record || {}) };
    data.diary.sort(compareDiaryRows);
    if (state.language === "zh") {
      persistedTranslations[sessionKey] = {
        "Diary Note (Chinese)": data.diary.find((item) => item.Session === row.Session)["Diary Note (Chinese)"],
      };
      writeStoredMap(STORAGE_KEYS.translations, persistedTranslations);
    }
    delete persistedEdits[sessionKey];
    writeStoredMap(STORAGE_KEYS.edits, persistedEdits);
    delete persistedDrafts[draftKey(row.Session)];
    delete persistedDrafts[sessionKey];
  } catch (error) {
    submitButton.disabled = false;
    setEditorMessage(error?.message || t("saveFailed"), true);
    return;
  }

  writeStoredMap(STORAGE_KEYS.drafts, persistedDrafts);

  state.editorSession = null;
  state.editorDraft = null;
  state.editorDirty = false;
  state.saveNotice = t("savedSource");
  refreshFilterOptions();
  refreshChartBounds();
  renderKpis();
  renderSessions();
}

function discardDiaryDraft(session) {
  window.clearTimeout(draftSaveTimer);
  delete persistedDrafts[draftKey(session)];
  delete persistedDrafts[String(session)];
  writeStoredMap(STORAGE_KEYS.drafts, persistedDrafts);
  state.editorSession = null;
  state.editorDraft = null;
  state.editorDirty = false;
  state.saveNotice = t("draftDiscarded");
  renderSessions();
}

function validateDiaryDraft(draft) {
  if (!draft.Date || !draft.World || !draft["Avatar Name"] || !draft["Norm Observed"] || !draft["Diary Note"].trim()) {
    return t("requiredFields");
  }
  if (draft["Interactions (people)"] < 0 || draft["Conversations 5+ min"] < 0) {
    return t("countsNegative");
  }
  if (draft["Conversations 5+ min"] > draft["Interactions (people)"]) {
    return t("conversationsExceeded");
  }
  return "";
}

function setEditorMessage(message, isError = false) {
  const messageElement = (document.querySelector("#editorMessage") || document.createElement("div"));
  if (!messageElement) return;
  messageElement.textContent = message;
  messageElement.classList.toggle("error", isError);
}

function editableFields(row) {
  return {
    Date: row.Date,
    Day: row.Day,
    "Time Start": row["Time Start"],
    "Time End": row["Time End"],
    World: row.World,
    "Avatar Name": row["Avatar Name"],
    "Norm Observed": row["Norm Observed"],
    "Interactions (people)": row["Interactions (people)"],
    "Conversations 5+ min": row["Conversations 5+ min"],
    "Diary Note": normalizeDiaryNarrative(
      state.language === "zh" ? row["Diary Note (Chinese)"] || "" : row["Diary Note"],
    ),
  };
}

async function ensureChineseTranslation(row, force = false) {
  if (hasChineseNarrative(row) && !force) return true;
  if (state.translationSession === row.Session && state.translatorPromise) return state.translatorPromise;
  if (state.translationSession !== null && state.translatorPromise) {
    return state.translatorPromise.then(() => ensureChineseTranslation(row, force));
  }

  state.translationSession = row.Session;
  state.translationNotice = t("translating");
  state.translationError = false;
  state.translationErrorSession = null;
  renderDiaryDetail(row);

  const task = (async () => {
    try {
      const translator = await getChineseTranslator();
      const translatedDiary = await translateDiaryNarrative(translator, row["Diary Note"], (progress) => {
        state.translationNotice = t("translating") + ` ${progress}%`;
        if (state.selectedSession === row.Session && state.editorSession === null) renderDiaryDetail(row);
      });
      const translatedSpillover = await translateLongText(translator, row["Real World Spillover"]);
      const localRecord = {
        "Diary Note (Chinese)": translatedDiary,
        "Chinese Translation Status": "Machine translation — review needed",
      };
      Object.assign(row, localRecord);
      persistedTranslations[String(row.Session)] = localRecord;
      writeStoredMap(STORAGE_KEYS.translations, persistedTranslations);

      if (state.sourceAvailable) {
        const response = await fetch(`/api/sessions/${encodeURIComponent(row.Session)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "translation",
            language: "zh",
            fields: {
              "Diary Note": translatedDiary,
            },
          }),
        });
        if (response.ok) {
          const result = await response.json();
          Object.assign(row, result.record || {});
        }
      }
      state.translationNotice = "";
      return true;
    } catch (error) {
      state.translationError = true;
      state.translationErrorSession = row.Session;
      state.translationNotice =
        error?.name === "NotSupportedError" || !("Translator" in self)
          ? t("translationUnavailable")
          : t("translationFailed");
      return false;
    } finally {
      state.translationSession = null;
      state.translatorPromise = null;
      renderSessions();
    }
  })();
  state.translatorPromise = task;
  return task;
}

async function getChineseTranslator() {
  return getBrowserTranslator("en", "zh", (progress) => {
    state.translationNotice = t("translationDownloading", { progress });
    const row = data.diary.find((item) => item.Session === state.translationSession);
    if (row && state.selectedSession === row.Session && state.editorSession === null) renderDiaryDetail(row);
  });
}

async function getBrowserTranslator(sourceLanguage, targetLanguage, onDownloadProgress) {
  const key = `${sourceLanguage}:${targetLanguage}`;
  if (state.translators[key]) return state.translators[key];
  if (!("Translator" in self) || !window.isSecureContext) {
    throw new DOMException("Translator API unavailable", "NotSupportedError");
  }
  state.translators[key] = await Translator.create({
    sourceLanguage,
    targetLanguage,
    monitor(monitor) {
      monitor.addEventListener("downloadprogress", (event) => {
        const progress = `${Math.round(Number(event.loaded || 0) * 100)}%`;
        onDownloadProgress?.(progress);
      });
    },
  });
  return state.translators[key];
}

function refreshChartBounds() {
  const minDate = data.diary[0].Date;
  const maxDate = data.diary.at(-1).Date;
  for (const input of [els.chartStart, els.chartEnd]) {
    input.min = minDate;
    input.max = maxDate;
  }
  for (const input of [els.rangeStart, els.rangeEnd]) {
    input.max = data.diary.length - 1;
  }
  setChartRange(minDate, maxDate);
}

function initChartTooltip() {
  els.trendChart.addEventListener("mousemove", (event) => {
    if (!state.chartPoints.length) return;
    const svg = els.trendChart;
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    const pointerX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * viewBox.width;
    const nearest = state.chartPoints.reduce((best, point) =>
      Math.abs(point.x - pointerX) < Math.abs(best.x - pointerX) ? point : best,
    );
    const marker = svg.querySelector("#hoverMarker");
    const line = svg.querySelector("#hoverLine");
    const dot = svg.querySelector("#hoverDot");
    if (marker && line && dot) {
      marker.setAttribute("opacity", "1");
      line.setAttribute("x1", nearest.x.toFixed(1));
      line.setAttribute("x2", nearest.x.toFixed(1));
      dot.setAttribute("cx", nearest.x.toFixed(1));
      dot.setAttribute("cy", nearest.rawY.toFixed(1));
    }
    const panelRect = svg.closest(".trend-panel").getBoundingClientRect();
    els.chartTooltip.innerHTML = `
      <strong>${escapeHtml(formatShortDate(nearest.date))}</strong>
      <span>${escapeHtml(t("tooltipInteractions"))}: ${escapeHtml(nearest.value)}</span>
    `;
    els.chartTooltip.style.left = `${event.clientX - panelRect.left + 14}px`;
    els.chartTooltip.style.top = `${event.clientY - panelRect.top - 8}px`;
    els.chartTooltip.classList.add("visible");
  });
  els.trendChart.addEventListener("mouseleave", hideChartTooltip);
}

function hideChartTooltip() {
  if (!els.chartTooltip) return;
  els.chartTooltip.classList.remove("visible");
  const marker = els.trendChart.querySelector("#hoverMarker");
  if (marker) marker.setAttribute("opacity", "0");
}

function detailCell(label, value) {
  return `<div class="detail-cell"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderRestDays() {
  els.restTable.innerHTML = renderTable(data.restDays, ["Date", "Day", "Reason", "Note"]);
}

function renderNotes() {
  els.notesTable.innerHTML = renderTable(data.datasetNotes, ["Item", "Note"]);
}

function renderTable(rows, columns) {
  return `
    <table>
      <thead>
        <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>${columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join("")}</tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function initTabs() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      document.querySelectorAll(".tab-button").forEach((tab) => tab.classList.toggle("active", tab === button));
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
      (document.querySelector(`#${state.view}View`) || document.createElement("div")).classList.add("active");
    });
  });
}

function readStoredMap(key) {
  try {
    const parsed = JSON.parse(null || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredMap(key, value) {
  try {
    
    return true;
  } catch {
    return false;
  }
}

function compareDiaryRows(a, b) {
  return String(a.Date).localeCompare(String(b.Date)) || Number(a.Session) - Number(b.Session);
}

function dayName(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
}

function formatMetric(value, digits) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return number
    .toFixed(digits)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

function dateMs(value) {
  return new Date(`${value}T00:00:00Z`).getTime();
}

function addDaysIso(value, days) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function nearestSessionIndex(date) {
  const target = dateMs(date);
  let bestIndex = 0;
  let bestDistance = Infinity;
  data.diary.forEach((row, index) => {
    const distance = Math.abs(dateMs(row.Date) - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function smoothSeries(values) {
  if (values.length < 4) return values;
  const windowSize = values.length > 80 ? 7 : values.length > 30 ? 5 : 3;
  const radius = Math.floor(windowSize / 2);
  return values.map((_, index) => {
    const slice = values.slice(Math.max(0, index - radius), Math.min(values.length, index + radius + 1));
    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
  });
}

function buildSmoothPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] || current;
    const following = points[index + 2] || next;
    const cp1x = current.x + (next.x - previous.x) / 6;
    const cp1y = current.y + (next.y - previous.y) / 6;
    const cp2x = next.x - (following.x - current.x) / 6;
    const cp2y = next.y - (following.y - current.y) / 6;
    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }
  return path;
}

function yTicks(maxValue) {
  const step = Math.max(1, Math.ceil(maxValue / 4));
  const ticks = [];
  for (let value = 0; value <= maxValue; value += step) ticks.push(value);
  if (ticks.at(-1) !== maxValue) ticks.push(maxValue);
  return ticks;
}

function formatShortDate(value) {
  const [year, month, day] = String(value).split("-");
  return `${year}-${month}-${day}`;
}

function extractTitle(text) {
  return extractDiaryTitle(text, t("untitled"));
}

function formatDiary(text) {
  return escapeHtml(text)
    .replace(/\*\*\*Reflection:\*\*\*/g, "<strong>Reflection:</strong>")
    .replace(/\*\*Overall reflection and actions:\*\*/g, "<strong>Overall reflection and actions:</strong>")
    .replace(/\*\*/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function init() {
  applyInterfaceLanguage();
  initFilters();
  initEyeCareControl();
  renderSessions();
}

init();
