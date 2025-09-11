"use client";

import type { Message } from "@langchain/langgraph-sdk";
import { useState, useEffect, useRef, useCallback } from "react";
import { ProcessedEvent } from "@/components/ActivityTimeline";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatMessagesView } from "@/components/ChatMessagesView";
import { Button } from "@/components/ui/button";
import { useExternalStream } from "@/lib/useExternalStream";
import { Domain } from "@/lib/types";
import { getDomain } from "@/lib/service";

export default function App() {
  const [processedEventsTimeline, setProcessedEventsTimeline] = useState<ProcessedEvent[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasFinalizeEventOccurredRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);

  const handleWorkspaceSelect = useCallback((workspaceId: string) => {
    setSelectedWorkspace(workspaceId);
  }, []);

  const handleDomainSelect = useCallback((domainId: string) => {
    setSelectedDomains(domainId);
  }, []);

  useEffect(() => {
    const fetchDomains = async () => {
      const domains = await getDomain();
      setDomains(domains);
    };
    fetchDomains();
  }, []);

  const thread = useExternalStream({
    onUpdateEvent: (evt) => {
      setProcessedEventsTimeline((prev) => [
        ...prev,
        { title: evt.title, data: evt.data },
      ]);
    },
    onFinish: () => {
      hasFinalizeEventOccurredRef.current = true;
    },
    onError: (error: string) => {
      setError(error);
    },
  });

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollViewport) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
      }
    };

    setTimeout(scrollToBottom, 100);
  }, [thread.messages, processedEventsTimeline, thread.isLoading]);

  // Merge live events with historical activities for current conversation
  const mergedHistoricalActivities = {
    ...thread.historicalActivities,
    ...(hasFinalizeEventOccurredRef.current &&
      !thread.isLoading &&
      thread.messages.length > 0
      ? (() => {
          const lastMessage = thread.messages[thread.messages.length - 1];
          if (lastMessage && lastMessage.type === "ai" && lastMessage.id) {
            return { [lastMessage.id]: [...processedEventsTimeline] };
          }
          return {};
        })()
      : {})
  };

  useEffect(() => {
    if (
      hasFinalizeEventOccurredRef.current &&
      !thread.isLoading &&
      thread.messages.length > 0
    ) {
      hasFinalizeEventOccurredRef.current = false;
    }
  }, [thread.messages, thread.isLoading, processedEventsTimeline]);

  const handleSubmit = useCallback(
    (submittedInputValue: string) => {
      if (!submittedInputValue.trim()) return;
      setProcessedEventsTimeline([]);
      hasFinalizeEventOccurredRef.current = false;

      const newMessages: Message[] = [
        ...(thread.messages || []),
        {
          type: "human",
          content: submittedInputValue,
          id: Date.now().toString(),
        },
      ];
      thread.submit({
        messages: newMessages,
      });
    },
    [thread]
  );

  const handleCancel = useCallback(() => {
    thread.stop();
    // window.location.reload();
  }, [thread]);


  return (
      <div
        className="flex text-gray-900 font-sans antialiased bg-white overflow-hidden"
        style={{ height: "calc(100vh - 65px)" }}
      >
        <main
          className={`h-full w-full max-w-4xl mx-auto transition-all duration-300`}
        >
          {thread.messages.length === 0 ? (
            <WelcomeScreen
              handleSubmit={handleSubmit}
              isLoading={thread.isLoading}
              onCancel={handleCancel}
              domains={domains}
              selectedWorkspace={selectedWorkspace}
              selectedDomains={selectedDomains}
              loading={loading}
              loadingChatHistory={false}
              handleWorkspaceSelect={handleWorkspaceSelect}
              handleDomainSelect={handleDomainSelect}
            />
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl text-red-600 font-bold">Error</h1>
                <p className="text-red-600">{JSON.stringify(error)}</p>

                <Button
                  variant="destructive"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <ChatMessagesView
              messages={thread.messages}
              isLoading={thread.isLoading}
              scrollAreaRef={scrollAreaRef}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              liveActivityEvents={processedEventsTimeline}
              historicalActivities={mergedHistoricalActivities}
              domains={domains}
              selectedWorkspace={selectedWorkspace}
              selectedDomains={selectedDomains}
              loading={loading}
              handleWorkspaceSelect={handleWorkspaceSelect}
              handleDomainSelect={handleDomainSelect}
            />
          )}
        </main>
      </div>
  );
}
