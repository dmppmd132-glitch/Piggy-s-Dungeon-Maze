import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

export const FAST_MODEL_NAME = 'gemini-3.1-flash-lite';
export const FALLBACK_MODEL_NAME = 'gemini-4-hydrogen';

let cachedAiClient: GoogleGenAI | null = null;
let cachedApiKey: string | undefined;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!cachedAiClient || cachedApiKey !== apiKey) {
    cachedApiKey = apiKey;
    cachedAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

export const DM_SYSTEM_INSTRUCTION = `你是奇幻文字 RPG《泥巴王國》的 AI 地下城主 (DM)，語氣風趣、生動、偶爾帶點冷幽默。
玩家扮演一隻勇敢又貪吃的小豬，在充滿「會說話的森林動物」、「哥布林廚師」、「大野狼強盜」的泥巴王國冒險，目標是尋找傳說中的「黃金黑松露」。

請嚴格遵守規則並只輸出符合 Schema 的繁體中文 JSON（story 欄位務必放第一個）：
1. story（60-110 字繁體中文）：精煉生動地描繪本回合遭遇、小豬貪吃反應與結果，偶爾穿插冷幽默。
2. 數值規則：
   - 開局 (isStart=true)：hp_change、hunger_change、coins_change 皆為 0；new_item、lost_item、interacted_npc 皆為 null；affinity_change 為 0。
   - 一般回合 (isStart=false)：普通行動飽食度自然減少 -10 到 -5；吃食物恢復 +15 到 +40；若飽食度已 0 且沒吃到東西，hp_change 額外扣 -8 到 -15。戰鬥／陷阱扣血（負整數）；療傷／休息補血（正整數）；交易／拾獲／搶劫改變豬豬幣（不可令總金幣變負數）。
3. 道具：new_item 為獲得的單一新物品名稱（無則 null）；lost_item 為消耗或失去的背包現有物品名稱（須完全一致，無則 null）。
4. choices：剛好 3 個繁體中文行動選項，分別以「A. 」、「B. 」、「C. 」開頭且風格各異。
5. image_prompt：12-22 字英文簡短場景描述，須含 "cute pixel art, fantasy RPG style, 16-bit" 與地點、角色及小豬動作。
6. NPC 好感度：若有與主要 NPC（「哥布林大廚「鍋蓋」」、「迷糊松鼠郵差「栗子」」、「老烏龜村長「慢吞吞」」、「泥巴獾商人「亮晶晶」」、「失眠貓頭鷹學者「咕嚕」」）互動，回傳名稱並給定 affinity_change（友善 +4~+15、冒犯 -15~-4、無則 0）；高好感 NPC 應提供交易折扣或實用線索。`;

const dmTurnSchema = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description: '本回合劇情描述（60-110 繁體中文字，生動有趣帶冷幽默）。',
    },
    hp_change: {
      type: Type.INTEGER,
      description: '生命值增減整數。',
    },
    hunger_change: {
      type: Type.INTEGER,
      description: '飽食度增減整數。',
    },
    coins_change: {
      type: Type.INTEGER,
      description: '豬豬幣增減整數。',
    },
    new_item: {
      type: Type.STRING,
      nullable: true,
      description: '獲得的新物品名稱，無則 null。',
    },
    lost_item: {
      type: Type.STRING,
      nullable: true,
      description: '失去的背包現有物品名稱，無則 null。',
    },
    interacted_npc: {
      type: Type.STRING,
      nullable: true,
      description: '本回合互動的 NPC 名稱，無則 null。',
    },
    affinity_change: {
      type: Type.INTEGER,
      description: '與該 NPC 的好感度變化整數（無互動則 0）。',
    },
    choices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '剛好 3 個行動選項（A. ..., B. ..., C. ...）。',
    },
    image_prompt: {
      type: Type.STRING,
      description: 'Short English prompt with: cute pixel art, fantasy RPG style, 16-bit',
    },
  },
  required: [
    'story',
    'hp_change',
    'hunger_change',
    'coins_change',
    'new_item',
    'lost_item',
    'interacted_npc',
    'affinity_change',
    'choices',
    'image_prompt',
  ],
  propertyOrdering: [
    'story',
    'hp_change',
    'hunger_change',
    'coins_change',
    'new_item',
    'lost_item',
    'interacted_npc',
    'affinity_change',
    'choices',
    'image_prompt',
  ],
};

const epitaphSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: '搞笑的墓誌銘稱號（8-14字）。',
    },
    epitaph: {
      type: Type.STRING,
      description: '40-80 字的搞笑死因評價。',
    },
  },
  required: ['title', 'epitaph'],
};

export interface HistoryItem {
  turn: number;
  action: string | null;
  story: string;
}

export interface TurnRequestBody {
  isStart?: boolean;
  action?: string;
  turn?: number;
  stream?: boolean;
  stats?: {
    hp: number;
    hunger: number;
    coins: number;
    inventory: string[];
  };
  history?: HistoryItem[];
  randomEvent?: {
    title?: string;
    category?: string;
    dmInstruction?: string;
  } | null;
  worldCycle?: {
    shortStatus?: string;
    effectSummary?: string;
    dmDirective?: string;
  } | null;
  questContext?: {
    mode: 'ACCEPTED' | 'SEARCH_SUCCESS' | 'ONGOING' | 'COMPLETED';
    npcName: string;
    title: string;
    description: string;
    targetItem: string;
    rewardCoins: number;
    rewardItem: string | null;
  } | null;
  equipment?: {
    mainHand: string | null;
    offHand: string | null;
    attackBonus: number;
    defenseBonus: number;
    hungerSaveBonus: number;
    coinBonus: number;
  } | null;
  skills?: {
    level: number;
    learnedNames: string[];
    itemDiscoveryBonusPercent: number;
    hungerReductionPercent: number;
  } | null;
  npcAffinities?: Array<{
    name: string;
    affinity: number;
    tierLabel: string;
    perkLabel: string;
  }> | null;
}

export interface EpitaphRequestBody {
  turn?: number;
  coins?: number;
  inventory?: string[];
  lastAction?: string;
  lastStory?: string;
}

function normalizeNullableItem(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed === '無' || trimmed === 'none') {
    return null;
  }
  return trimmed;
}

function isNonRetryableClientError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return typeof status === 'number' && status >= 400 && status < 500 && status !== 429 && status !== 404;
}

async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (isNonRetryableClientError(err)) {
        break;
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Incrementally extracts and unescapes the partial string value of a JSON field
 * from an incomplete streaming JSON response buffer.
 */
export function extractPartialJsonStringField(rawJson: string, fieldName: string): string {
  const keyPattern = new RegExp(`"${fieldName}"\\s*:\\s*"`);
  const match = keyPattern.exec(rawJson);
  if (!match) return '';

  let i = match.index + match[0].length;
  let out = '';

  while (i < rawJson.length) {
    const ch = rawJson[i];
    if (ch === '"') {
      break;
    }
    if (ch === '\\') {
      if (i + 1 >= rawJson.length) break;
      const next = rawJson[i + 1];
      if (next === '"' || next === '\\' || next === '/') {
        out += next;
        i += 2;
      } else if (next === 'n') {
        out += '\n';
        i += 2;
      } else if (next === 'r') {
        out += '\r';
        i += 2;
      } else if (next === 't') {
        out += '\t';
        i += 2;
      } else if (next === 'b') {
        out += '\b';
        i += 2;
      } else if (next === 'f') {
        out += '\f';
        i += 2;
      } else if (next === 'u') {
        if (i + 5 >= rawJson.length) break;
        const hex = rawJson.slice(i + 2, i + 6);
        const code = Number.parseInt(hex, 16);
        if (!Number.isNaN(code)) {
          out += String.fromCharCode(code);
        }
        i += 6;
      } else {
        out += next;
        i += 2;
      }
    } else {
      out += ch;
      i += 1;
    }
  }

  return out;
}

function buildTurnPrompt(body: TurnRequestBody): {
  errorResult?: { status: number; payload: { error: string } };
  isStart: boolean;
  userPrompt: string;
} {
  if (!process.env.GEMINI_API_KEY) {
    return {
      isStart: Boolean(body.isStart),
      userPrompt: '',
      errorResult: {
        status: 500,
        payload: {
          error: '尚未設定 GEMINI_API_KEY，請於環境變數或 Vercel Project Settings 中設定。',
        },
      },
    };
  }

  const isStart = Boolean(body.isStart);
  const turn = typeof body.turn === 'number' ? body.turn : 1;
  const action = typeof body.action === 'string' ? body.action.trim() : '';
  const stats = body.stats ?? {
    hp: 100,
    hunger: 80,
    coins: 20,
    inventory: ['生鏽的木湯匙', '半顆蘋果'],
  };
  const history = Array.isArray(body.history) ? body.history.slice(-3) : [];

  if (!isStart && !action) {
    return {
      isStart,
      userPrompt: '',
      errorResult: {
        status: 400,
        payload: { error: '請輸入或選擇一個行動！' },
      },
    };
  }

  const historySummary =
    history.length > 0
      ? history
          .map((h) => {
            const snippet = h.story.length > 90 ? `${h.story.slice(0, 90)}…` : h.story;
            return `[R${h.turn}] ${h.action ?? '出發'} -> ${snippet}`;
          })
          .join('\n')
      : '尚無先前紀錄（冒險剛開始）。';

  const worldCyclePrompt = body.worldCycle?.dmDirective
    ? `\n【天時季節】${body.worldCycle.dmDirective}\n`
    : '';

  const randomEventPrompt =
    !isStart && body.randomEvent?.dmInstruction
      ? `\n【隨機事件：${body.randomEvent.title ?? '旅途插曲'}】${body.randomEvent.dmInstruction}（系統已結算額外數值與臨時道具，請專注劇情反映。）\n`
      : '';

  let questPrompt = '';
  if (!isStart && body.questContext) {
    const q = body.questContext;
    if (q.mode === 'ACCEPTED') {
      questPrompt = `\n【觸發 NPC 委託：${q.npcName}「${q.title}」】${q.description} 目標：「${q.targetItem}」。請讓${q.npcName}登場求助，並在 1 個選項提供搜尋線索。\n`;
    } else if (q.mode === 'SEARCH_SUCCESS') {
      questPrompt = `\n【委託線索成功】小豬尋獲「${q.targetItem}」，請將 new_item 設為「${q.targetItem}」並在選項提示可交給${q.npcName}領賞。\n`;
    } else if (q.mode === 'COMPLETED') {
      questPrompt = `\n【委託達成】小豬將「${q.targetItem}」交給${q.npcName}完成「${q.title}」，請描寫致謝反應（系統已發放報酬，勿重複計入 coins_change 或 new_item）。\n`;
    } else if (q.mode === 'ONGOING') {
      questPrompt = `\n【進行中委託】${q.npcName}「${q.title}」（目標：${q.targetItem}）。若行動正好仔細搜尋線索，可將 new_item 設為「${q.targetItem}」。\n`;
    }
  }

  const eq = body.equipment;
  const equipmentText =
    eq && (eq.mainHand || eq.offHand)
      ? `- 裝備：主「${eq.mainHand ?? '空'}」/副「${eq.offHand ?? '空'}」（攻+${eq.attackBonus} 防+${eq.defenseBonus} 省糧+${eq.hungerSaveBonus} 尋寶+${eq.coinBonus}）`
      : '- 裝備：無';

  const sk = body.skills;
  const skillText = sk
    ? `- Lv.${sk.level}｜技能：${sk.learnedNames.join('、') || '無'}${
        sk.itemDiscoveryBonusPercent > 0 ? `（尋寶+${sk.itemDiscoveryBonusPercent}%）` : ''
      }`
    : '';

  const npcAffinitiesText =
    Array.isArray(body.npcAffinities) && body.npcAffinities.length > 0
      ? `- NPC好感：${body.npcAffinities
          .map((n) => `${n.name}:${n.affinity}(${n.tierLabel})`)
          .join('｜')}`
      : '';

  const userPrompt = isStart
    ? `【第 1 回合開局】
狀態：HP ${stats.hp}/100｜飽食 ${stats.hunger}/100｜豬豬幣 ${stats.coins}｜背包：${stats.inventory.join('、')}
${equipmentText}
${skillText}
${npcAffinitiesText}${worldCyclePrompt}
撰寫小豬剛離開泥巴村莊尋找黃金黑松露的第 1 回合奇遇（所有數值變化與物品增減皆須為 0 / null）。`
    : `【第 ${turn} 回合】
近期紀錄：
${historySummary}

狀態：HP ${stats.hp}/100｜飽食 ${stats.hunger}/100${stats.hunger <= 0 ? '（飢餓扣血中！）' : ''}｜豬豬幣 ${stats.coins}｜背包：${stats.inventory.join('、') || '空'}
${equipmentText}
${skillText}
${npcAffinitiesText}${worldCyclePrompt}${randomEventPrompt}${questPrompt}
玩家行動：「${action}」
推進劇情、結算合理數值與道具變化，並給出 3 個新選項與英文像素場景提示詞。`;

  return { isStart, userPrompt };
}

function normalizeDmTurnResponse(parsed: Record<string, unknown>, isStart: boolean) {
  const choices = Array.isArray(parsed.choices)
    ? parsed.choices.slice(0, 3).map((c: unknown) => String(c))
    : [];
  while (choices.length < 3) {
    const defaults = [
      'A. 挺起圓滾滾的肚子向前衝',
      'B. 四處嗅嗅有沒有吃的',
      'C. 假裝自己是一顆會呼吸的馬鈴薯',
    ];
    choices.push(defaults[choices.length]);
  }

  const imagePromptRaw =
    typeof parsed.image_prompt === 'string' && parsed.image_prompt.trim()
      ? parsed.image_prompt.trim()
      : 'A brave little piglet exploring the Mud Kingdom forest, cute pixel art, fantasy RPG style, 16-bit';

  const imagePrompt = imagePromptRaw.toLowerCase().includes('16-bit')
    ? imagePromptRaw
    : `${imagePromptRaw}, cute pixel art, fantasy RPG style, 16-bit`;

  return {
    story: String(parsed.story || '小豬在泥巴路上打了一個響亮的噴嚏，冒險繼續前行！'),
    hp_change: isStart ? 0 : Math.trunc(Number(parsed.hp_change) || 0),
    hunger_change: isStart ? 0 : Math.trunc(Number(parsed.hunger_change) || 0),
    coins_change: isStart ? 0 : Math.trunc(Number(parsed.coins_change) || 0),
    new_item: isStart ? null : normalizeNullableItem(parsed.new_item),
    lost_item: isStart ? null : normalizeNullableItem(parsed.lost_item),
    choices: choices as [string, string, string],
    image_prompt: imagePrompt,
    interacted_npc: isStart ? null : normalizeNullableItem(parsed.interacted_npc),
    affinity_change: isStart
      ? 0
      : Math.max(-25, Math.min(25, Math.trunc(Number(parsed.affinity_change) || 0))),
  };
}

export async function generateDmTurn(body: TurnRequestBody) {
  const built = buildTurnPrompt(body);
  if (built.errorResult) return built.errorResult;

  const { isStart, userPrompt } = built;

  const invokeModel = async (model: string, thinkingLevel: ThinkingLevel) => {
    const ai = getAiClient();
    return ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: DM_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: dmTurnSchema,
        thinkingConfig: { thinkingLevel },
      },
    });
  };

  try {
    let response;
    try {
      response = await callGeminiWithRetry(() =>
        invokeModel(FAST_MODEL_NAME, ThinkingLevel.MINIMAL)
      );
    } catch (primaryErr) {
      if (isNonRetryableClientError(primaryErr)) throw primaryErr;
      response = await callGeminiWithRetry(() =>
        invokeModel(FALLBACK_MODEL_NAME, ThinkingLevel.LOW)
      );
    }

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      throw new Error('AI 地下城主一時詞窮，沒有回傳任何內容。');
    }

    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    return {
      status: 200,
      payload: normalizeDmTurnResponse(parsed, isStart),
    };
  } catch (error) {
    console.error('Gemini DM Turn Error:', error);
    const message =
      error instanceof Error ? error.message : '地下城主連線失敗，請稍後再試。';
    return {
      status: 502,
      payload: {
        error: `地下城主擲骰時手滑了：${message}`,
      },
    };
  }
}

export async function generateDmTurnStream(
  body: TurnRequestBody,
  onStoryUpdate: (storySoFar: string) => void
) {
  const built = buildTurnPrompt(body);
  if (built.errorResult) return built.errorResult;

  const { isStart, userPrompt } = built;

  const runStreamWithModel = async (model: string, thinkingLevel: ThinkingLevel) => {
    const ai = getAiClient();
    const stream = await ai.models.generateContentStream({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: DM_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: dmTurnSchema,
        thinkingConfig: { thinkingLevel },
      },
    });

    let fullJson = '';
    let lastStory = '';

    for await (const chunk of stream) {
      const piece = chunk.text ?? '';
      if (!piece) continue;
      fullJson += piece;

      const partialStory = extractPartialJsonStringField(fullJson, 'story');
      if (partialStory.length > lastStory.length) {
        lastStory = partialStory;
        onStoryUpdate(partialStory);
      }
    }

    return fullJson.trim();
  };

  try {
    let rawText = '';
    try {
      rawText = await runStreamWithModel(FAST_MODEL_NAME, ThinkingLevel.MINIMAL);
    } catch (primaryErr) {
      if (isNonRetryableClientError(primaryErr)) throw primaryErr;
      rawText = await runStreamWithModel(FALLBACK_MODEL_NAME, ThinkingLevel.LOW);
    }

    if (!rawText) {
      throw new Error('AI 地下城主一時詞窮，沒有回傳任何內容。');
    }

    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    const normalized = normalizeDmTurnResponse(parsed, isStart);
    onStoryUpdate(normalized.story);

    return {
      status: 200,
      payload: normalized,
    };
  } catch (error) {
    console.error('Gemini DM Turn Stream Error:', error);
    const message =
      error instanceof Error ? error.message : '地下城主連線失敗，請稍後再試。';
    return {
      status: 502,
      payload: {
        error: `地下城主擲骰時手滑了：${message}`,
      },
    };
  }
}

export async function generateDmEpitaph(body: EpitaphRequestBody) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      title: '永遠都在找零食的泥巴勇者',
      epitaph:
        '這隻勇敢的小豬在泥巴王國走到了盡頭，據說牠閉上眼睛前最後一個念頭，還在想著那顆沒吃到的黃金黑松露。',
    };
  }

  const prompt = `小豬冒險者在第 ${body.turn ?? 1} 回合生命值歸零陣亡了！
最後的行動：${body.lastAction ?? '未知的勇敢之舉'}
最後的劇情：${body.lastStory ?? '在泥巴王國倒下了'}
遺留豬豬幣：${body.coins ?? 0} 枚
背包遺物：${(body.inventory ?? []).join('、') || '只剩空氣與豬蹄印'}

請為牠寫一個搞笑、充滿冷幽默與泥巴王國風味的墓誌銘稱號與死因評價。`;

  const invokeEpitaph = async (model: string, thinkingLevel: ThinkingLevel) => {
    const ai = getAiClient();
    return ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction:
          '你是幽默風趣的《泥巴王國》墓碑雕刻師，專為陣亡的貪吃小豬撰寫搞笑又帶點同情的墓誌銘（繁體中文）。',
        responseMimeType: 'application/json',
        responseSchema: epitaphSchema,
        thinkingConfig: { thinkingLevel },
      },
    });
  };

  try {
    let response;
    try {
      response = await invokeEpitaph(FAST_MODEL_NAME, ThinkingLevel.MINIMAL);
    } catch {
      response = await invokeEpitaph(FALLBACK_MODEL_NAME, ThinkingLevel.LOW);
    }

    const parsed = JSON.parse((response.text ?? '{}').trim());
    return {
      title: String(parsed.title || '倒在美食路上的泥巴戰士'),
      epitaph: String(
        parsed.epitaph ||
          '小豬英勇地撐到了最後一刻，只可惜胃袋與血條同時發出抗議，泥巴王國的森林動物決定替牠立一座松露形狀的紀念碑。'
      ),
    };
  } catch (error) {
    console.error('Gemini Epitaph Error:', error);
    return {
      title: '被命運燉煮的傳奇小豬',
      epitaph:
        '雖然沒有帶著黃金黑松露凱旋歸來，但牠留下的豬蹄印與貪吃精神，將永遠在泥巴王國的晚餐桌上傳頌。',
    };
  }
}
