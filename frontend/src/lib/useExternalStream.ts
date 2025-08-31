import { useCallback, useMemo, useRef, useState } from "react";
import type { Message } from "@langchain/langgraph-sdk";

type TimelineEvent = { title: string; data: string };

type UseExternalStreamOptions = {
    apiUrl: string;             // e.g. "http://localhost:9090"
    streamPath: string;         // e.g. "/my/runs/stream"
    onUpdateEvent?: (e: TimelineEvent) => void;
    onFinish?: () => void;      // called when final:true arrives
};

type SubmitValues = {
    messages: Message[];
    [key: string]: any;
};

function extractTitleAndDataFromText(text: string): TimelineEvent {
    // Expect formats like:
    // "Reasoning: <text>", "Calling tool: <text>", "Processing results from: <text>", "Agent transfer: <text>"
    const idx = text.indexOf(":");
    if (idx > 0) {
        return {
            title: text.slice(0, idx).trim(),
            data: text.slice(idx + 1).trim(),
        };
    }
    return { title: "Update", data: text };
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

    const clientUrl = useMemo(() => `${apiUrl.replace(/\/$/, "")}${streamPath}`, [apiUrl, streamPath]);

    const stop = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = null;
    }, []);

    const submit = useCallback(
        async (values: SubmitValues) => {
            // optimistic: take the last human from values, append locally
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

            // Basic SSE reader
            const reader = res.body?.getReader();
            if (!reader) {
                setIsLoading(false);
                return;
            }

            const decoder = new TextDecoder();
            let buf = "";

            const flushSseChunk = (chunk: string) => {
                // Parse one SSE chunk separated by \n\n
                // Lines can be: event: <name>, data: <json>
                const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
                const dataLine = lines.find((l) => l.startsWith("data:"))?.slice(5).trim();
                if (!dataLine) return;

                const payload = readJsonFromDataLine(dataLine);
                if (!payload || typeof payload !== "object") return;

                // JSON-RPC payload.result
                const result = payload.result ?? {};
                const kind = result.kind; // "status-update" | "artifact-update"
                const finalFlag = !!result.final;

                if (kind === "artifact-update") {
                    // accumulate artifact text chunks
                    const parts = result.artifact?.parts ?? [];
                    const chunkText = parts
                        .filter((p: any) => p?.kind === "text" && typeof p.text === "string")
                        .map((p: any) => p.text)
                        .join("");

                    if (chunkText.length > 0) {
                        artifactBufferRef.current += (artifactBufferRef.current ? "" : "") + chunkText;

                        // upsert a live AI message
                        if (!aiMsgIdRef.current) {
                            aiMsgIdRef.current = result.taskId || result.contextId || crypto.randomUUID();
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
                } else if (kind === "status-update") {
                    // timeline event from status.message.parts[].text
                    const text =
                        result?.status?.message?.parts
                            ?.filter((p: any) => p?.kind === "text" && typeof p.text === "string")
                            ?.map((p: any) => p.text)
                            ?.join("\n") ?? "";

                    if (text) {
                        const e = extractTitleAndDataFromText(text);
                        onUpdateEvent?.(e);
                    }

                    if (finalFlag) {
                        setIsLoading(false);
                        onFinish?.();
                    }
                }
            };

            // Stream loop
            try {
                for (; ;) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buf += decoder.decode(value, { stream: true });

                    // Process complete SSE frames separated by \n\n
                    let idx: number;
                    while ((idx = buf.indexOf("\n\n")) >= 0) {
                        const chunk = buf.slice(0, idx);
                        buf = buf.slice(idx + 2);
                        if (chunk.trim().length > 0) {
                            flushSseChunk(chunk);
                        }
                    }
                }
            } catch (e) {
                // aborted or network error
            } finally {
                setIsLoading(false);
                abortRef.current = null;
            }
        },
        [clientUrl, onFinish, onUpdateEvent]
    );

    return { messages, isLoading, submit, stop };
}