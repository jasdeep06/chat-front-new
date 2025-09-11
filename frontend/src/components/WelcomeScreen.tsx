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
  <div className="h-full flex flex-col items-center justify-center text-center px-4 flex-1 w-full max-w-3xl mx-auto gap-4">
   {!loadingChatHistory && <div>
      <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 mb-3">
        Welcome.
      </h1>
      <p className="text-xl md:text-2xl text-gray-600">
        How can I help you today?
      </p>
    </div>}

    {/* Loader Section */}
    {loadingChatHistory && (
      <div className="flex flex-col items-center justify-center gap-3 mt-6">
        <div className="relative">
          {/* Glowing Gradient Ring */}
          <div className="absolute inset-0 rounded-full animate-ping bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-lg"></div>

          {/* Main Loader */}
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin relative z-10" />
        </div>
        <p className="text-sm text-gray-500 animate-pulse">Loading, please wait...</p>
      </div>
    )}

    {!loadingChatHistory && <div className="w-full mt-4">
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
    </div>}
  </div>
);