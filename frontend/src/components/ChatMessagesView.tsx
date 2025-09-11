import type React from "react";
import type { Message } from "@langchain/langgraph-sdk";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Copy, CopyCheck } from "lucide-react";
import { InputForm } from "./InputForm";
import { Button } from "@/components/ui/button";
import { useState, ReactNode, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ActivityTimeline,
  ProcessedEvent,
} from "./ActivityTimeline"; // Assuming ActivityTimeline is in the same dir or adjust path
import { Domain } from "@/lib/types";

// Markdown component props type from former ReportView
type MdComponentProps = {
  className?: string;
  children?: ReactNode;
  [key: string]: unknown;
};

// Markdown components (from former ReportView.tsx)
const mdComponents = {
  h1: ({ className, children, ...props }: MdComponentProps) => (
    <h1 className={cn("text-2xl font-bold mt-4 mb-2", className)} {...props}>
      {children}
    </h1>
  ),
  h2: ({ className, children, ...props }: MdComponentProps) => (
    <h2 className={cn("text-xl font-bold mt-3 mb-2", className)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }: MdComponentProps) => (
    <h3 className={cn("text-lg font-bold mt-3 mb-1", className)} {...props}>
      {children}
    </h3>
  ),
  p: ({ className, children, ...props }: MdComponentProps) => (
    <p className={cn("mb-3 leading-7", className)} {...props}>
      {children}
    </p>
  ),
  a: ({ className, children, href, ...props }: MdComponentProps) => (
    <Badge className="text-xs mx-0.5">
      <a
        className={cn("text-blue-600 hover:text-blue-700 text-xs", className)}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    </Badge>
  ),
  ul: ({ className, children, ...props }: MdComponentProps) => (
    <ul className={cn("list-disc pl-6 mb-3", className)} {...props}>
      {children}
    </ul>
  ),
  ol: ({ className, children, ...props }: MdComponentProps) => (
    <ol className={cn("list-decimal pl-6 mb-3", className)} {...props}>
      {children}
    </ol>
  ),
  li: ({ className, children, ...props }: MdComponentProps) => (
    <li className={cn("mb-1", className)} {...props}>
      {children}
    </li>
  ),
  blockquote: ({ className, children, ...props }: MdComponentProps) => (
    <blockquote
      className={cn(
        "border-l-4 border-gray-300 pl-4 italic my-3 text-sm",
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }: MdComponentProps) => (
    <code
      className={cn(
        "bg-gray-100 rounded px-1 py-0.5 font-mono text-xs text-gray-800",
        className
      )}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ className, children, ...props }: MdComponentProps) => (
    <pre
      className={cn(
        "bg-gray-100 p-3 rounded-lg overflow-x-auto font-mono text-xs my-3 text-gray-800",
        className
      )}
      {...props}
    >
      {children}
    </pre>
  ),
  hr: ({ className, ...props }: MdComponentProps) => (
    <hr className={cn("border-gray-300 my-4", className)} {...props} />
  ),
  table: ({ className, children, ...props }: MdComponentProps) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className={cn("border-collapse w-full bg-white", className)} {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ className, children, ...props }: MdComponentProps) => (
    <thead className={cn("bg-gray-50", className)} {...props}>
      {children}
    </thead>
  ),
  tbody: ({ className, children, ...props }: MdComponentProps) => (
    <tbody className={cn("divide-y divide-gray-200", className)} {...props}>
      {children}
    </tbody>
  ),
  tr: ({ className, children, ...props }: MdComponentProps) => (
    <tr className={cn("hover:bg-gray-50", className)} {...props}>
      {children}
    </tr>
  ),
  th: ({ className, children, ...props }: MdComponentProps) => (
    <th
      className={cn(
        "border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50",
        className
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ className, children, ...props }: MdComponentProps) => (
    <td
      className={cn("border-b border-gray-200 px-4 py-3 text-sm text-gray-900", className)}
      {...props}
    >
      {children}
    </td>
  ),
};

// Props for HumanMessageBubble
interface HumanMessageBubbleProps {
  message: Message;
  mdComponents: typeof mdComponents;
}

// HumanMessageBubble Component
const HumanMessageBubble: React.FC<HumanMessageBubbleProps> = ({
  message,
  mdComponents,
}) => {
  return (
    <div
      className={`message-bubble-user text-white rounded-2xl break-words min-h-7 max-w-[100%] sm:max-w-[90%] px-6 py-4 rounded-br-lg smooth-transition hover:shadow-xl animate-fadeInUp`}
    >
      <ReactMarkdown 
        components={{
          ...mdComponents,
          p: ({ className, children, ...props }: MdComponentProps) => (
            <p className={cn("mb-2 last:mb-0 leading-7 text-white", className)} {...props}>
              {children}
            </p>
          ),
          h1: ({ className, children, ...props }: MdComponentProps) => (
            <h1 className={cn("text-2xl font-bold mt-4 mb-2 text-white", className)} {...props}>
              {children}
            </h1>
          ),
          h2: ({ className, children, ...props }: MdComponentProps) => (
            <h2 className={cn("text-xl font-bold mt-3 mb-2 text-white", className)} {...props}>
              {children}
            </h2>
          ),
          h3: ({ className, children, ...props }: MdComponentProps) => (
            <h3 className={cn("text-lg font-bold mt-3 mb-1 text-white", className)} {...props}>
              {children}
            </h3>
          ),
        }}
        remarkPlugins={[remarkGfm]}
      >
        {typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content)}
      </ReactMarkdown>
    </div>
  );
};

// Props for AiMessageBubble
interface AiMessageBubbleProps {
  message: Message;
  historicalActivity: ProcessedEvent[] | undefined;
  liveActivity: ProcessedEvent[] | undefined;
  isLastMessage: boolean;
  isOverallLoading: boolean;
  mdComponents: typeof mdComponents;
  handleCopy: (text: string, messageId: string) => void;
  copiedMessageId: string | null;
}

// AiMessageBubble Component
const AiMessageBubble: React.FC<AiMessageBubbleProps> = ({
  message,
  historicalActivity,
  liveActivity,
  isLastMessage,
  isOverallLoading,
  mdComponents,
  handleCopy,
  copiedMessageId,
}) => {
  // Determine which activity events to show and if it's for a live loading message
  const activityForThisBubble =
    isLastMessage && isOverallLoading ? liveActivity : historicalActivity;
  const isLiveActivityForThisBubble = isLastMessage && isOverallLoading;

  return (
    <div className={`message-bubble-ai rounded-2xl break-words flex flex-col w-full max-w-[85%] md:max-w-[80%] px-6 py-4 smooth-transition hover:shadow-xl animate-fadeInUp`}>
      {activityForThisBubble && activityForThisBubble.length > 0 && (
        <div className="mb-4 border-b border-gray-600/30 pb-4 text-xs">
          <ActivityTimeline
            processedEvents={activityForThisBubble}
            isLoading={isLiveActivityForThisBubble}
          />
        </div>
      )}
      <ReactMarkdown 
        components={{
          ...mdComponents,
          p: ({ className, children, ...props }: MdComponentProps) => (
            <p className={cn("mb-3 last:mb-0 leading-7 text-gray-200", className)} {...props}>
              {children}
            </p>
          ),
          h1: ({ className, children, ...props }: MdComponentProps) => (
            <h1 className={cn("text-2xl font-bold mt-4 mb-2 text-white", className)} {...props}>
              {children}
            </h1>
          ),
          h2: ({ className, children, ...props }: MdComponentProps) => (
            <h2 className={cn("text-xl font-bold mt-3 mb-2 text-white", className)} {...props}>
              {children}
            </h2>
          ),
          h3: ({ className, children, ...props }: MdComponentProps) => (
            <h3 className={cn("text-lg font-bold mt-3 mb-1 text-white", className)} {...props}>
              {children}
            </h3>
          ),
          a: ({ className, children, href, ...props }: MdComponentProps) => (
            <Badge className="text-xs mx-0.5 bg-purple-500/20 text-purple-300 border-purple-400/30">
              <a
                className={cn("text-purple-300 hover:text-purple-200 text-xs", className)}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            </Badge>
          ),
        }}
        remarkPlugins={[remarkGfm]}
        className="text-sm md:text-base leading-6 space-y-2 mb-4"
      >
        {typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content)}
      </ReactMarkdown>
      <Button
        variant="outline"
        className={`glass-button cursor-pointer text-gray-300 hover:text-white self-end hover:glow-accent smooth-transition px-3 py-2 rounded-lg text-sm ${
          message.content.length > 0 ? "visible" : "hidden"
        }`}
        onClick={() =>
          handleCopy(
            typeof message.content === "string"
              ? message.content
              : JSON.stringify(message.content),
            message.id!
          )
        }
      >
        <span className="mr-2">{copiedMessageId === message.id ? "Copied" : "Copy"}</span>
        {copiedMessageId === message.id ? <CopyCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
};

interface ChatMessagesViewProps {
  messages: Message[];
  isLoading: boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  onSubmit: (inputValue: string) => void;
  onCancel: () => void;
  liveActivityEvents: ProcessedEvent[];
  historicalActivities: Record<string, ProcessedEvent[]>;
  domains: Domain[];
  selectedWorkspace: string | null;
  selectedDomains: string | null;
  loading: boolean;
  handleWorkspaceSelect: (workspaceId: string) => void;
  handleDomainSelect: (domainId: string) => void;
}

export function ChatMessagesView({
  messages,
  isLoading,
  scrollAreaRef,
  onSubmit,
  onCancel,
  liveActivityEvents,
  historicalActivities,
  domains,
  selectedWorkspace,
  selectedDomains,
  loading,
  handleWorkspaceSelect,
  handleDomainSelect,
}: ChatMessagesViewProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enhanced auto-scroll functionality
  useEffect(() => {
    const scrollToBottom = () => {
      // Try multiple scroll methods for better reliability
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end' 
        });
      }
      
      if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollViewport) {
          scrollViewport.scrollTo({
            top: scrollViewport.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    };

    // Multiple attempts to ensure scrolling works
    scrollToBottom();
    setTimeout(scrollToBottom, 50);
    setTimeout(scrollToBottom, 200);
  }, [messages, liveActivityEvents, isLoading, scrollAreaRef]);

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  return (
    <div className="flex flex-col h-full w-full">
      <ScrollArea className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
        <div className="p-6 md:p-8 space-y-4 max-w-5xl mx-auto pt-8">
          {messages.map((message, index) => {
            const isLast = index === messages.length - 1;
            return (
              <div key={message.id || `msg-${index}`} className="space-y-3">
                <div
                  className={`flex items-start gap-3 ${
                    message.type === "human" ? "justify-end" : ""
                  }`}
                >
                  {message.type === "human" ? (
                    <HumanMessageBubble
                      message={message}
                      mdComponents={mdComponents}
                    />
                  ) : (
                    <AiMessageBubble
                      message={message}
                      historicalActivity={historicalActivities[message.id!]}
                      liveActivity={liveActivityEvents} // Pass global live events
                      isLastMessage={isLast}
                      isOverallLoading={isLoading} // Pass global loading state
                      mdComponents={mdComponents}
                      handleCopy={handleCopy}
                      copiedMessageId={copiedMessageId}
                    />
                  )}
                </div>
              </div>
            );
          })}
          {isLoading &&
            (messages.length === 0 ||
              messages[messages.length - 1].type === "human") && (
              <div className="flex items-start gap-3 mt-4">
                <div className="message-bubble-ai rounded-2xl px-6 py-4 shadow-lg break-words max-w-[85%] md:max-w-[80%] w-full min-h-[64px] animate-fadeInUp">
                  {liveActivityEvents.length > 0 ? (
                    <div className="text-xs">
                      <ActivityTimeline
                        processedEvents={liveActivityEvents}
                        isLoading={true}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-start h-full">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-400 mr-3" />
                      <span className="text-gray-300 font-medium">Processing your request...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4">
        <div className="glass-card rounded-3xl p-6 max-w-5xl mx-auto smooth-transition hover:shadow-2xl">
          <InputForm
            onSubmit={onSubmit}
            isLoading={isLoading}
            onCancel={onCancel}
            hasHistory={messages.length > 0}
            domains={domains}
            selectedWorkspace={selectedWorkspace}
            selectedDomains={selectedDomains}
            loading={loading}
            handleWorkspaceSelect={handleWorkspaceSelect}
            handleDomainSelect={handleDomainSelect}
          />
        </div>
      </div>
    </div>
  );
}
