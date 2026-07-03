import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = "You are a helpful coding teacher who explains simply with intuition first.";
const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = "google/gemma-3-1b-it:featherless-ai";
const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface HFResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Validate request
    if (!HF_TOKEN) {
      return NextResponse.json(
        { error: "HF_TOKEN environment variable is not set" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Prepare messages for API
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: message.trim(),
      },
    ];

    const requestBody = {
      model: HF_MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    };

    console.info("[chat/route] request start", {
      HF_API_URL,
      HF_MODEL,
      requestBody,
    });

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[chat/route] HF API error", {
        status: response.status,
        errorData,
      });
      return NextResponse.json(
        {
          error: `Hugging Face API error: ${response.status}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data: HFResponse = await response.json();
    console.info("[chat/route] HF response received", { data });

    // Extract reply from response
    const reply =
      data.choices?.[0]?.message?.content || "No response from AI model";

    return NextResponse.json({
      reply: reply.trim(),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
