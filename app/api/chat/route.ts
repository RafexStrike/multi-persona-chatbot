import { NextRequest, NextResponse } from "next/server";
import { getPersonaSystemPrompt, type Persona } from "@/lib/personas";

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct:novita";
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
    if (!HF_TOKEN) {
      return NextResponse.json(
        { error: "HF_TOKEN is not set" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, history = [], persona = "piyush" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid message" },
        { status: 400 }
      );
    }

    // Validate persona
    if (!["piyush", "hitesh"].includes(persona)) {
      return NextResponse.json(
        { error: "Invalid persona" },
        { status: 400 }
      );
    }

    // Get the system prompt for the selected persona
    const systemPrompt = getPersonaSystemPrompt(persona as Persona);

    // Build conversation with history
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },

      // keep memory (last messages)
      ...history.slice(-10),

      { role: "user", content: message.trim() },
    ];

    const requestBody = {
      model: HF_MODEL,
      messages,
      max_tokens: 600,
      temperature: 0.8,
    };

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: "HF API error", details: error },
        { status: 500 }
      );
    }

    const data: HFResponse = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ?? "No response";

    return NextResponse.json({
      reply: reply.trim(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
