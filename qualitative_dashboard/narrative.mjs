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

export function normalizeDiaryNarrative(text) {
  return String(text || "").replace(
    /^(\s*\*\*[^*\r\n]+\*\*)[^\S\r\n]+(?=\S)/,
    "$1\n",
  );
}

export function removeReflectionSections(text) {
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

export function removeGeneratedSessionSummary(text) {
  return String(text || "")
    .replace(GENERATED_ENGLISH_SESSION_SUMMARY, "")
    .replace(GENERATED_CHINESE_SESSION_SUMMARY, "")
    .replace(GENERATED_ENGLISH_SUMMARY_SENTENCE, "")
    .replace(GENERATED_CHINESE_SUMMARY_SENTENCE, "")
    .replace(/[ \t]+\r?\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function removeGeneratedReflectionClosers(text) {
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

export function extractDiaryTitle(text, fallback = "") {
  const normalized = normalizeDiaryNarrative(text);
  const markedTitle = normalized.match(/^\s*\*\*([^*\r\n]+)\*\*/);
  if (markedTitle) return markedTitle[1].trim();
  const first = normalized.split(/\r?\n/)[0] || fallback;
  return first.replace(/\*/g, "").trim();
}

export async function translateDiaryNarrative(translator, text, onProgress) {
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

export async function translateLongText(translator, text, onProgress) {
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
