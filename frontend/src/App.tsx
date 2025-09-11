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
        className="flex text-white font-sans antialiased gradient-bg overflow-hidden relative"
        style={{ height: "100vh" }}
      >
        {/* Ambient light effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse animation-delay-400" />
        
        <main
          className={`h-full w-full max-w-5xl mx-auto transition-all duration-500 relative z-10 p-4`}
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
              <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center gap-6 max-w-md mx-auto smooth-transition">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-2xl text-red-400 font-bold">Something went wrong</h1>
                <p className="text-gray-300 text-center leading-relaxed">{JSON.stringify(error)}</p>

                <Button
                  className="glass-button text-white font-medium px-6 py-3 rounded-xl smooth-transition"
                  variant="destructive"
                  onClick={() => window.location.reload()}
                >
                  Try Again
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
