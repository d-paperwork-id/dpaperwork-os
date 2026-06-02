"use client";

import { Bot, MessageSquarePlus } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full text-center px-6">
      <div className="flex flex-col items-center gap-5 max-w-xs">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center">
            <MessageSquarePlus className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Your AI team is ready
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select a thread from the sidebar or start a new conversation to get things done.
          </p>
        </div>
      </div>
    </div>
  );
}
