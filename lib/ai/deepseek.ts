import { TRPCError } from "@trpc/server";

type ChatOptions = {
  system?: string;
  temperature?: number;
  maxTokens?: number;
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatResult = {
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

const API_URL =
  process.env.SILICONFLOW_API_URL ??
  process.env.DEEPSEEK_API_URL ??
  "https://api.siliconflow.cn/v1/chat/completions";

function getApiKey() {
  const key = process.env.SILICONFLOW_API_KEY ?? process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "缺少模型 API Key，请设置 SILICONFLOW_API_KEY（或兼容的 DEEPSEEK_API_KEY）",
    });
  }
  return key;
}

export async function callDeepseekChat(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<ChatResult> {
  const apiKey = getApiKey();
  const model =
    process.env.SILICONFLOW_MODEL ||
    process.env.DEEPSEEK_MODEL ||
    "deepseek-ai/DeepSeek-V3.2";
  const payload = {
    model,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 600,
    messages: [
      ...(options.system
        ? [{ role: "system", content: options.system } as ChatMessage]
        : []),
      ...messages,
    ],
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `调用 DeepSeek 失败: ${res.status} ${text}`,
    });
  }

  const data = (await res.json()) as any;
  const content: string = data?.choices?.[0]?.message?.content?.trim?.() ?? "";
  return {
    content,
    model,
    usage: {
      promptTokens: data?.usage?.prompt_tokens,
      completionTokens: data?.usage?.completion_tokens,
      totalTokens: data?.usage?.total_tokens,
    },
  };
}

export function buildSummaryPrompt({
  title,
  text,
  tags,
}: {
  title: string;
  text: string;
  tags: string[];
}) {
  return [
    {
      role: "user" as const,
      content: `你是一个中文笔记助手，请用不超过 80 字的中文总结下方笔记要点，避免格式符号。\n\n标题：${title}\n标签：${tags.join(", ") || "无"}\n正文：${text}`,
    },
  ];
}

export function buildEnhancePrompt({
  title,
  text,
  tags,
}: {
  title: string;
  text: string;
  tags: string[];
}) {
  return [
    {
      role: "user" as const,
      content: `你是一个中文笔记“排版助手”，只做极轻量润色，不扩写内容。

规则：
- 不新增句子，不扩写，保持原意与大致长度。
- 保持原有段落顺序，必要时仅做轻微分段。
- 适度添加贴切的 emoji，每段 0~2 个。
- 仅使用轻量 Markdown（普通段落、少量强调），不要代码块/表格/HTML/JSON。
- 输出即为最终文本，不要额外说明。

标题：${title}
标签：${tags.join(", ") || "无"}
正文：
${text}`,
    },
  ];
}
