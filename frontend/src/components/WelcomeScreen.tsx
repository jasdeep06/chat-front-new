import { InputForm } from "./InputForm";
import { Loader2 } from "lucide-react";
import { Domain } from "@/lib/types";

interface WelcomeScreenProps {
  handleSubmit: (submittedInputValue: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  domains: Domain[];
  selectedWorkspace: string | null;
  selectedDomains: string | null;
  loading: boolean;
  loadingChatHistory: boolean;
  handleWorkspaceSelect: (workspaceId: string) => void;
  handleDomainSelect: (domainId: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  handleSubmit,
  onCancel,
  isLoading,
  domains,
  selectedWorkspace,
  selectedDomains,
  loading,
  loadingChatHistory,
  handleWorkspaceSelect,
  handleDomainSelect,
}) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-6 flex-1 w-full max-w-4xl mx-auto gap-8">
   {!loadingChatHistory && <div className="relative">
      {/* Animated background elements */}
      <div className="absolute -top-8 -left-8 w-4 h-4 bg-purple-400/30 rounded-full animate-ping animation-delay-200" />
      <div className="absolute -top-4 -right-12 w-2 h-2 bg-cyan-400/40 rounded-full animate-ping animation-delay-600" />
      <div className="absolute -bottom-6 -left-4 w-3 h-3 bg-purple-300/20 rounded-full animate-ping animation-delay-800" />
      
      <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-6 animate-fadeInUp">
        Welcome.
      </h1>
      <p className="text-xl md:text-2xl text-gray-300 leading-relaxed animate-fadeInUp animation-delay-200">
        How can I help you today?
      </p>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5 blur-3xl -z-10" />
    </div>}

    {/* Loader Section */}
    {loadingChatHistory && (
      <div className="flex flex-col items-center justify-center gap-6 mt-8">
        <div className="relative">
          {/* Multiple glowing rings */}
          <div className="absolute inset-0 rounded-full animate-ping bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 opacity-20 blur-xl"></div>
          <div className="absolute inset-2 rounded-full animate-ping bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 opacity-30 blur-lg animation-delay-200"></div>
          <div className="absolute inset-4 rounded-full animate-ping bg-gradient-to-r from-purple-300 via-cyan-300 to-purple-300 opacity-40 blur-md animation-delay-400"></div>

          {/* Main Loader */}
          <Loader2 className="h-16 w-16 text-purple-400 animate-spin relative z-10 drop-shadow-lg" />
        </div>
        <div className="glass-card px-6 py-3 rounded-full">
          <p className="text-sm text-gray-300 animate-pulse font-medium">Loading, please wait...</p>
        </div>
      </div>
    )}

    {!loadingChatHistory && <div className="w-full mt-8 animate-fadeInUp animation-delay-400">
      <div className="glass-card rounded-3xl p-6 max-w-4xl mx-auto smooth-transition hover:shadow-2xl">
        <InputForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={onCancel}
          hasHistory={false}
          domains={domains}
          selectedWorkspace={selectedWorkspace}
          selectedDomains={selectedDomains}
          loading={loading}
          handleWorkspaceSelect={handleWorkspaceSelect}
          handleDomainSelect={handleDomainSelect}
        />
      </div>
    </div>}
  </div>
);