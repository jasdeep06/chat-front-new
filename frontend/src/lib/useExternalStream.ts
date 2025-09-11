import { useCallback, useRef, useState } from "react";
import type { Message } from "@langchain/langgraph-sdk";
import { chat } from "./service";

type TimelineEvent = { title: string; data: string };

type MessagePart = {
  kind: string;
  text?: string;
  metadata?: {
    eventType?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type HistoryItem = {
  role: string;
  parts?: MessagePart[];
  messageId?: string;
  [key: string]: unknown;
};

type ChatResult = {
  kind?: string;
  contextId?: string;
  artifactId?: string;
  taskId?: string;
  final?: boolean;
  title?: string;
  history?: HistoryItem[];
  artifact?: {
    parts?: MessagePart[];
    [key: string]: unknown;
  };
  status?: {
    message?: {
      parts?: MessagePart[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type UseExternalStreamOptions = {
  onUpdateEvent?: (e: TimelineEvent) => void;
  onFinish?: () => void;
  onError?: (error: string) => void;
};

type SubmitValues = {
  messages: Message[];
  workspace_id?: string;
  domain_id?: string;
  [key: string]: unknown;
};

function mapEventTypeToTitle(eventType?: string): string {
  switch ((eventType || "").toLowerCase()) {
    case "reasoning":
      return "Reasoning";
    case "tool_call":
      return "Calling tool";
    case "tool_result":
      return "Tool Executed";
    case "agent_transfer":
      return "Agent transfer";
    default:
      return "Update";
  }
}

function readJsonFromDataLine(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

export function useExternalStream(options: UseExternalStreamOptions) {
  const { onUpdateEvent, onFinish, onError } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [historicalActivities, setHistoricalActivities] = useState<Record<string, TimelineEvent[]>>({});

  const abortRef = useRef<AbortController | null>(null);
  const aiMsgIdRef = useRef<string | null>(null);
  const artifactBufferRef = useRef<string>("");
  const contextIdRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    contextIdRef.current = null;
    setCurrentThreadId(null);
    setCurrentTitle(null);
    setHistoricalActivities({});
    artifactBufferRef.current = "";
    aiMsgIdRef.current = null;
  }, []);

  const submit = useCallback(
    async (values: SubmitValues) => {
      const last = values.messages?.at(-1);
      if (last && last.type === "human") {
        setMessages((prev) => [...prev, last]);
      }

      setIsLoading(true);
      artifactBufferRef.current = "";
      aiMsgIdRef.current = null;
      
      // Use currentThreadId if available, otherwise contextIdRef for thread continuity
      const threadId = currentThreadId || contextIdRef.current;

      const controller = new AbortController();
      abortRef.current = controller;

      let res;
      try {
        res = await chat({
          payload: {
            user_query: (last?.content as string) || "",
            workspace_id: values.workspace_id,
            domain_id: values.domain_id,
            response_type: ["all"],
            ...(threadId && { thread_id: threadId }),
          },
          controller: controller,
        });
      } catch (error) {
        console.error(error);
        onError?.("Error");
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        onError?.("No reader");
        setIsLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let buf = "";

      const flushSseChunk = (chunk: string) => {
        const lines = chunk
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const dataLine = lines
          .find((l) => l.startsWith("data:"))
          ?.slice(5)
          .trim();
        if (!dataLine) return;

        const payload = readJsonFromDataLine(dataLine);
        if (!payload || typeof payload !== "object") return;

        const result = (payload as { result?: ChatResult }).result ?? {} as ChatResult;
        const kind = result.kind; // "status-update" | "artifact-update"
        const finalFlag = !!result.final;

        // Capture contextId for thread continuity
        if (result.contextId && !contextIdRef.current) {
          contextIdRef.current = result.contextId;
        }

        // Capture title from stream if available
        if (result.title && !currentTitle && result.title !== undefined) {
            setCurrentTitle(result.title);
        }

        if (kind === "artifact-update") {
          const parts = result.artifact?.parts ?? [];
          const chunkText = parts
            .filter(
              (p: MessagePart) => p?.kind === "text" && typeof p.text === "string"
            )
            .map((p: MessagePart) => p.text)
            .join("");

          if (chunkText.length > 0) {
            artifactBufferRef.current += chunkText;

            if (!aiMsgIdRef.current) {
              aiMsgIdRef.current =
                result.taskId || result.contextId || crypto.randomUUID();
              setMessages((prev) => [
                ...prev,
                {
                  id: aiMsgIdRef.current!,
                  type: "ai",
                  content: artifactBufferRef.current,
                } as Message,
              ]);
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgIdRef.current
                    ? ({ ...m, content: artifactBufferRef.current } as Message)
                    : m
                )
              );
            }
          }
          return;
        }

        if (kind === "status-update") {
          const parts = Array.isArray(result?.status?.message?.parts)
            ? result.status.message.parts
            : [];

          // take first text part with metadata.eventType
          const textPart = parts.find(
            (p: MessagePart) => p?.kind === "text" && typeof p.text === "string"
          );

          if (textPart) {
            const eventType = textPart?.metadata?.eventType as
              | string
              | undefined;
            const title = mapEventTypeToTitle(eventType);
            const data = textPart.text as string;
            onUpdateEvent?.({ title, data });
          }

          if (finalFlag) {
            setIsLoading(false);
            onFinish?.();
          }
        }
      };

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buf.indexOf("\n\n")) >= 0) {
            const chunk = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            if (chunk.trim().length > 0) {
              flushSseChunk(chunk);
            }
          }
        }
      } catch {
        onError?.("Abort/network");
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [onFinish, onUpdateEvent, onError, currentThreadId, currentTitle]
  );

  return { messages, isLoading, submit, stop, startNewConversation, currentThreadId, currentTitle, setCurrentTitle, historicalActivities };
}
