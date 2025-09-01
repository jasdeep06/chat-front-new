import { useCallback, useMemo, useRef, useState } from "react";
import type { Message } from "@langchain/langgraph-sdk";

type TimelineEvent = { title: string; data: string };

type UseExternalStreamOptions = {
    apiUrl: string;
    streamPath: string;
    onUpdateEvent?: (e: TimelineEvent) => void;
    onFinish?: () => void;
};

type SubmitValues = {
    messages: Message[];
    [key: string]: any;
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

function readJsonFromDataLine(line: string): any | null {
    try {
        return JSON.parse(line);
    } catch {
        return null;
    }
}

export function useExternalStream(options: UseExternalStreamOptions) {
    const { apiUrl, streamPath, onUpdateEvent, onFinish } = options;

    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const abortRef = useRef<AbortController | null>(null);
    const aiMsgIdRef = useRef<string | null>(null);
    const artifactBufferRef = useRef<string>("");

    const clientUrl = useMemo(
        () => `${apiUrl.replace(/\/$/, "")}${streamPath}`,
        [apiUrl, streamPath]
    );

    const stop = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = null;
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

            const controller = new AbortController();
            abortRef.current = controller;

            const res = await fetch(clientUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
                signal: controller.signal,
            });

            const reader = res.body?.getReader();
            if (!reader) {
                setIsLoading(false);
                return;
            }

            const decoder = new TextDecoder();
            let buf = "";

            const flushSseChunk = (chunk: string) => {
                const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
                const dataLine = lines.find((l) => l.startsWith("data:"))?.slice(5).trim();
                if (!dataLine) return;

                const payload = readJsonFromDataLine(dataLine);
                if (!payload || typeof payload !== "object") return;

                const result = payload.result ?? {};
                const kind = result.kind; // "status-update" | "artifact-update"
                const finalFlag = !!result.final;

                if (kind === "artifact-update") {
                    const parts = result.artifact?.parts ?? [];
                    const chunkText = parts
                        .filter((p: any) => p?.kind === "text" && typeof p.text === "string")
                        .map((p: any) => p.text)
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
                        (p: any) => p?.kind === "text" && typeof p.text === "string"
                    );

                    if (textPart) {
                        const eventType = textPart?.metadata?.eventType as string | undefined;
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
                for (; ;) {
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
                // ignored (abort/network)
            } finally {
                setIsLoading(false);
                abortRef.current = null;
            }
        },
        [clientUrl, onFinish, onUpdateEvent]
    );

    return { messages, isLoading, submit, stop };
}