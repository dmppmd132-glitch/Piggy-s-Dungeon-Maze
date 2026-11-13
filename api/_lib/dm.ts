import { GoogleGenAI, Type } from '@google/genai';

export const MODEL_NAME = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export const DM_SYSTEM_INSTRUCTION = `你是奇幻文字 RPG《泥巴王國》的 AI 地下城主 (DM)，語氣風趣、生動、偶爾帶點冷幽默。
玩家扮演一隻勇敢但有點貪吃的小豬，在充滿「會說話的森林動物」、「哥布林廚師」、「大野狼強盜」的泥巴王國裡冒險，目標是尋找傳說中的「黃金黑松露」。

請嚴格遵守以下規則並只輸出符合 Schema 的繁體中文 JSON：
1. story（80-150 字繁體中文）：生動描繪這個回合的遭遇、小豬可愛又貪吃的反應與結果，偶爾穿插冷幽默旁白。
2. 數值變化規則：
   - 開局第一回合 (isStart=true)：hp_change 必須是 0，hunger_change 必須是 0，coins_change 必須是 0，new_item 必須是 null，lost_item 必須是 null。
   - 一般回合 (isStart=false)：每次行動飽食度通常會自然減少 -5 到 -10 點（hunger_change 介於 -10 到 -5）；若小豬吃下食物或料理，則恢復 +15 到 +40 點；若小豬當前飽食度已經是 0 且本回合沒有吃到食物，會因為飢餓導致體力流失（hp_change 額外扣 -8 到 -15 點）。
   - 遇到戰鬥、陷阱、大野狼或毒蘑菇會扣血（hp_change 為負整數）；休息、療傷、好心動物幫助可補血（hp_change 為正整數）。
   - 交易、拾獲或被搶劫會改變豬豬幣（coins_change 為整數，不可讓玩家金幣變成負數：若金幣不足請改用其他搞笑代價）。
3. 道具規則：
   - new_item：獲得的單一新物品名稱（繁體中文，簡潔有梗，如「蒜香烤松露」、「哥布林平底鍋」），沒有則回傳 null。
   - lost_item：消耗、吃掉或被搶走的背包現有物品名稱（必須與玩家背包現有物品名稱完全一致），沒有則回傳 null。
4. choices：剛好 3 個符合當前情境的繁體中文行動選項，分別以「A. 」、「B. 」、「C. 」開頭，風格要有區別（例如：勇敢衝撞、貪吃試探、機智嘴砲/裝死）。
5. image_prompt：12-25 字的英文簡短場景描述，必須包含關鍵字 "cute pixel art, fantasy RPG style, 16-bit"，並具體寫出場景地點（如 mud village, magic forest, goblin kitchen, wolf ambush, truffle cavern, campfire）、出現的 NPC 或物件與小豬正在做的動作。`;

const dmTurnSchema = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description: '這回合發生的劇情描述，約 80-150 個繁體中文字，生動有趣帶冷幽默。',
    },
    hp_change: {
      type: Type.INTEGER,
      description: '生命值增減數值（整數）。',
    },
    hunger_change: {
      type: Type.INTEGER,
      description: '飽食度增減數值（整數）。',
    },
    coins_change: {
      type: Type.INTEGER,
      description: '豬豬幣增減數值（整數）。',
    },
    new_item: {
      type: Type.STRING,
      nullable: true,
      description: '獲得的新物品名稱，若無則為 null。',
    },
    lost_item: {
      type: Type.STRING,
      nullable: true,
      description: '消耗或失去的物品名稱（需符合背包現有物品），若無則為 null。',
    },
    choices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '提供剛好 3 個符合當前情境的行動選項，例如 A. ..., B. ..., C. ...',
    },
    image_prompt: {
      type: Type.STRING,
      description:
        'Short English prompt describing the current scene, characters, and piglet action. Must include: cute pixel art, fantasy RPG style, 16-bit',
    },
  },
  required: [
    'story',
    'hp_change',
    'hunger_change',
    'coins_change',
    'new_item',
    'lost_item',
    'choices',
    'image_prompt',
  ],
};

const epitaphSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: '搞笑的墓誌銘稱號（8-14字），例如「在鍋邊流口水的勇豬」。',
    },
    epitaph: {
      type: Type.STRING,
      description: '一段 40-80 字的搞笑死因評價，充滿冷幽默。',
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
  stats?: {
    hp: number;
    hunger: number;
    coins: number;
    inventory: string[];
  };
  history?: HistoryItem[];
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

async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function generateDmTurn(body: TurnRequestBody) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      status: 500,
      payload: {
        error: '尚未設定 GEMINI_API_KEY，請於環境變數或 Vercel Project Settings 中設定。',
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
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

  if (!isStart && !action) {
    return {
      status: 400,
      payload: { error: '請輸入或選擇一個行動！' },
    };
  }

  const historySummary =
    history.length > 0
      ? history
          .map(
            (h) =>
              `[第${h.turn}回合] 行動：${h.action ?? '踏出村莊'} -> 劇情：${h.story}`
          )
          .join('\n')
      : '尚無先前紀錄（冒險剛開始）。';

  const userPrompt = isStart
    ? `【開始新冒險 - 第 1 回合】
小豬主角目前狀態：
- 生命值 (HP): ${stats.hp}/100
- 飽食度 (Hunger): ${stats.hunger}/100
- 豬豬幣 (Coins): ${stats.coins}
- 背包物品: ${stats.inventory.join('、') || '空無一物'}

請撰寫泥巴王國冒險的開場第一回合！小豬剛帶著「生鏽的木湯匙」和「半顆蘋果」離開泥巴村莊，準備去尋找傳說中的「黃金黑松露」，並在路上遇到第一個有趣的森林奇遇或角色。記住第一回合所有數值變化皆為 0，new_item 與 lost_item 皆為 null。`
    : `【第 ${turn} 回合】
最近冒險摘要：
${historySummary}

小豬目前狀態：
- 生命值 (HP): ${stats.hp}/100
- 飽食度 (Hunger): ${stats.hunger}/100 ${stats.hunger <= 0 ? '（警告：飽食度已歸零，沒吃到東西會開始飢餓扣血！）' : ''}
- 豬豬幣 (Coins): ${stats.coins}
- 背包物品: ${stats.inventory.join('、') || '空無一物'}

本回合玩家的行動：「${action}」

請根據玩家行動推進泥巴王國的奇幻劇情，計算合理的 HP / 飽食度 / 豬豬幣變化與物品得失，並給出 3 個有趣的新選項與對應英文像素場景提示詞。`;

  try {
    const ai = getAiClient();
    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: userPrompt,
        config: {
          systemInstruction: DM_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: dmTurnSchema,
        },
      })
    );

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      throw new Error('AI 地下城主一時詞窮，沒有回傳任何內容。');
    }

    const parsed = JSON.parse(rawText);

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
      status: 200,
      payload: {
        story: String(parsed.story || '小豬在泥巴路上打了一個響亮的噴嚏，冒險繼續前行！'),
        hp_change: isStart ? 0 : Math.trunc(Number(parsed.hp_change) || 0),
        hunger_change: isStart ? 0 : Math.trunc(Number(parsed.hunger_change) || 0),
        coins_change: isStart ? 0 : Math.trunc(Number(parsed.coins_change) || 0),
        new_item: isStart ? null : normalizeNullableItem(parsed.new_item),
        lost_item: isStart ? null : normalizeNullableItem(parsed.lost_item),
        choices: choices as [string, string, string],
        image_prompt: imagePrompt,
      },
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

export async function generateDmEpitaph(body: EpitaphRequestBody) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      title: '永遠都在找零食的泥巴勇者',
      epitaph:
        '這隻勇敢的小豬在泥巴王國走到了盡頭，據說牠閉上眼睛前最後一個念頭，還在想著那顆沒吃到的黃金黑松露。',
    };
  }

  try {
    const ai = getAiClient();
    const prompt = `小豬冒險者在第 ${body.turn ?? 1} 回合生命值歸零陣亡了！
最後的行動：${body.lastAction ?? '未知的勇敢之舉'}
最後的劇情：${body.lastStory ?? '在泥巴王國倒下了'}
遺留豬豬幣：${body.coins ?? 0} 枚
背包遺物：${(body.inventory ?? []).join('、') || '只剩空氣與豬蹄印'}

請為牠寫一個搞笑、充滿冷幽默與泥巴王國風味的墓誌銘稱號與死因評價。`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction:
          '你是幽默風趣的《泥巴王國》墓碑雕刻師，專為陣亡的貪吃小豬撰寫搞笑又帶點同情的墓誌銘（繁體中文）。',
        responseMimeType: 'application/json',
        responseSchema: epitaphSchema,
      },
    });

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
