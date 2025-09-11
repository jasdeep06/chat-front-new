import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SquarePen, Send, StopCircle, Zap, Cpu, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Domain } from "@/lib/types";

// Updated InputFormProps
interface InputFormProps {
  onSubmit: (inputValue: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  hasHistory: boolean;
  domains: Domain[];
  selectedWorkspace: string | null;
  selectedDomains: string | null;
  loading: boolean;
  handleWorkspaceSelect: (workspaceId: string) => void;
  handleDomainSelect: (domainId: string) => void;
}

export const InputForm: React.FC<InputFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  hasHistory,
  domains,
  selectedDomains,
  loading,
  handleDomainSelect,
}) => {
  const [internalInputValue, setInternalInputValue] = useState("");

  console.log("domains", domains);
  
  const handleInternalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!internalInputValue.trim()) return;
    onSubmit(internalInputValue);
    setInternalInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        // Submit with just Enter
        e.preventDefault();
        handleInternalSubmit();
      }
    }
  };

  const isSubmitDisabled = !internalInputValue.trim() || isLoading;

  return (
    <form
      onSubmit={handleInternalSubmit}
      className={`flex flex-col gap-4`}
    >
      <div
        className={`glass-input flex flex-row items-center justify-between text-white rounded-2xl break-words min-h-7 px-6 pt-4 pb-2 smooth-transition hover:shadow-lg`}
      >
        <Textarea
          value={internalInputValue}
          onChange={(e) => setInternalInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          className={`w-full text-white placeholder-gray-400 resize-none border-0 focus:outline-none focus:ring-0 outline-none focus-visible:ring-0 shadow-none bg-transparent
                        md:text-base font-medium min-h-[56px] max-h-[200px] placeholder:text-gray-400/70`}
          rows={1}
        />
        <div className="flex items-center gap-3 -mt-2">
          {isLoading ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-3 cursor-pointer rounded-full smooth-transition glow-accent"
              onClick={onCancel}
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="submit"
              className={`glass-button ${
                isSubmitDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:glow-primary"
              } px-6 py-3 cursor-pointer rounded-xl font-medium text-white smooth-transition flex items-center gap-2`}
              disabled={selectedDomains === null || isSubmitDisabled}
            >
              <span>Search</span>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-row gap-3">
          <div className="glass-card flex items-center gap-3 text-white rounded-xl px-4 py-3 max-w-[100%] sm:max-w-[90%] smooth-transition hover:shadow-lg">
            <Cpu className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-gray-300">Domain:</span>
            <Select 
              value={selectedDomains || undefined} 
              onValueChange={handleDomainSelect}
            >
              <SelectTrigger className="w-auto min-w-[120px] bg-transparent border-none shadow-none p-0 h-auto focus:ring-0 text-white font-medium">
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent className="glass-card border border-gray-600/30 shadow-2xl rounded-xl min-w-[200px] backdrop-blur-xl">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-purple-400" />
                    <span className="text-sm text-gray-300">Loading domains...</span>
                  </div>
                ) : domains.length > 0 ? (
                  domains.map((domain) => (
                    <SelectItem
                      value={domain.domain_id}
                      key={domain.domain_id}
                      className="hover:bg-purple-500/20 focus:bg-purple-500/20 cursor-pointer py-3 px-4 transition-colors text-white rounded-lg mx-1"
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                        <span className="text-gray-200 font-medium">{domain.domain_name}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-4 text-sm text-gray-400">
                    No domains available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasHistory && (
          <Button
            className="glass-button text-white hover:glow-accent shadow-lg smooth-transition rounded-xl px-4 py-3 font-medium"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <SquarePen className="h-4 w-4 mr-2" />
            New Search
          </Button>
        )}
      </div>
    </form>
  );
};
