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
      className={`flex flex-col gap-2 p-3 pb-4`}
    >
      <div
        className={`flex flex-row items-center justify-between text-gray-900 rounded-3xl rounded-bl-sm ${
          hasHistory ? "rounded-br-sm" : ""
        } break-words min-h-7 bg-gray-100 border border-gray-200 px-4 pt-3 `}
      >
        <Textarea
          value={internalInputValue}
          onChange={(e) => setInternalInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Which countries has the highest migrant population?"
          className={`w-full text-gray-900 placeholder-gray-500 resize-none border-0 focus:outline-none focus:ring-0 outline-none focus-visible:ring-0 shadow-none bg-transparent
                        md:text-base  min-h-[56px] max-h-[200px]`}
          rows={1}
        />
        <div className="-mt-3">
          {isLoading ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 cursor-pointer rounded-full transition-all duration-200"
              onClick={onCancel}
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="ghost"
              className={`${
                isSubmitDisabled
                  ? "text-gray-400"
                  : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              } p-2 cursor-pointer rounded-full transition-all duration-200 text-base`}
              disabled={selectedDomains === null || isSubmitDisabled}
            >
              Search
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-row gap-2">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-2 max-w-[100%] sm:max-w-[90%] shadow-sm hover:bg-gray-100 transition-colors">
            <Cpu className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Domain:</span>
            <Select 
              value={selectedDomains || undefined} 
              onValueChange={handleDomainSelect}
            >
              <SelectTrigger className="w-auto min-w-[120px] bg-transparent border-none shadow-none p-0 h-auto focus:ring-0 text-gray-700 font-medium">
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg min-w-[200px]">
                {loading ? (
                  <div className="flex items-center justify-center p-3">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-500" />
                    <span className="text-sm text-gray-600">Loading domains...</span>
                  </div>
                ) : domains.length > 0 ? (
                  domains.map((domain) => (
                    <SelectItem
                      value={domain.domain_id}
                      key={domain.domain_id}
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer py-2.5 px-3 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">{domain.domain_name}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-3 text-sm text-gray-500">
                    No domains available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasHistory && (
          <Button
            className="bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 shadow-sm transition-colors rounded-lg px-3 py-2"
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
