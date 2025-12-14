import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Spinner } from "../components/ui/spinner";

interface ChatInputProps {
  onAnalysis: (repoUrl: string) => void;
  loading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onAnalysis, loading }) => {
  const [repoUrl, setRepoUrl] = useState("");

  const handleAnalysis = () => {
    onAnalysis(repoUrl);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleAnalysis();
    }
  };

  return (
    <div className="flex w-full items-center space-x-2 p-4">
      <Input
        id="repoUrl"
        placeholder="https://github.com/vercel/next.js"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <Button onClick={handleAnalysis} disabled={loading}>
        {loading ? <Spinner /> : "Analyze"}
      </Button>
    </div>
  );
};

export default ChatInput;
