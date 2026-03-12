import { createContext, useContext, useState, ReactNode } from 'react';

export interface SelectedTextSnippet {
  id: string;
  postId: string | number;
  text: string;
  authorUsername: string;
  authorDisplayName: string;
  timestamp: number;
}

interface AudioModeContextType {
  isAudioMode: boolean;
  setIsAudioMode: (mode: boolean) => void;
  selectedTextSnippets: SelectedTextSnippet[];
  addTextSnippet: (snippet: Omit<SelectedTextSnippet, 'id' | 'timestamp'>) => void;
  removeTextSnippet: (id: string) => void;
  clearSelection: () => void;
}

const AudioModeContext = createContext<AudioModeContextType | undefined>(undefined);

export function AudioModeProvider({ children }: { children: ReactNode }) {
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [selectedTextSnippets, setSelectedTextSnippets] = useState<SelectedTextSnippet[]>([]);

  const addTextSnippet = (snippet: Omit<SelectedTextSnippet, 'id' | 'timestamp'>) => {
    if (selectedTextSnippets.length >= 5) {
      return;
    }
    
    const newSnippet: SelectedTextSnippet = {
      ...snippet,
      id: `${snippet.postId}-${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    };
    
    setSelectedTextSnippets(prev => [...prev, newSnippet]);
  };

  const removeTextSnippet = (id: string) => {
    setSelectedTextSnippets(prev => prev.filter(snippet => snippet.id !== id));
  };

  const clearSelection = () => {
    setSelectedTextSnippets([]);
  };

  return (
    <AudioModeContext.Provider
      value={{
        isAudioMode,
        setIsAudioMode,
        selectedTextSnippets,
        addTextSnippet,
        removeTextSnippet,
        clearSelection
      }}
    >
      {children}
    </AudioModeContext.Provider>
  );
}

export function useAudioMode() {
  const context = useContext(AudioModeContext);
  if (!context) {
    throw new Error('useAudioMode must be used within AudioModeProvider');
  }
  return context;
}
