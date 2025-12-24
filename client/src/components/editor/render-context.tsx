import React, { createContext, useContext, useState, useCallback } from "react";
import type { PixelAssetContent } from "@shared/types/pixel-asset";

interface RenderContextValue {
  content: PixelAssetContent;
  setContent: (content: PixelAssetContent) => void;
  isDirty: boolean;
  markDirty: () => void;
  markClean: () => void;
}

const RenderContext = createContext<RenderContextValue | null>(null);

export interface RenderContextProviderProps {
  initialContent: PixelAssetContent;
  children: React.ReactNode;
}

export function RenderContextProvider({
  initialContent,
  children,
}: RenderContextProviderProps) {
  const [content, setContent] = useState<PixelAssetContent>(initialContent);
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);

  const value: RenderContextValue = {
    content,
    setContent,
    isDirty,
    markDirty,
    markClean,
  };

  return <RenderContext.Provider value={value}>{children}</RenderContext.Provider>;
}

export function useRenderContext(): RenderContextValue {
  const context = useContext(RenderContext);
  if (!context) {
    throw new Error("useRenderContext must be used within RenderContextProvider");
  }
  return context;
}
