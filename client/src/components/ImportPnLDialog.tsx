import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Plus, ChevronDown, RotateCw, Hammer } from "lucide-react";
import { parseBrokerTrades, ParseError } from "@/utils/trade-parser";

export type FormatData = {
  id?: string;
  label?: string;
  sampleLine: string;
  positions: {
    time: number[];
    order: number[];
    symbol: number[];
    type: number[];
    qty: number[];
    price: number[];
  };
  displayValues: {
    time: string;
    order: string;
    symbol: string;
    type: string;
    qty: string;
    price: string;
  };
};

type ParseResult = {
  trades: any[];
  errors: ParseError[];
};

interface ImportPnLDialogProps {
  showImportModal: boolean;
  setShowImportModal: (v: boolean) => void;
  importData: string;
  setImportData: (v: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeFormat: FormatData | null;
  setActiveFormat: (f: FormatData | null) => void;
  detectedFormatLabel: string | null;
  setDetectedFormatLabel: (l: string | null) => void;
  isBuildMode: boolean;
  setIsBuildMode: (v: boolean) => void;
  brokerSearchInput: string;
  setBrokerSearchInput: (v: string) => void;
  showBrokerSuggestions: boolean;
  setShowBrokerSuggestions: (v: boolean) => void;
  filteredBrokers: string[];
  buildModeData: FormatData;
  setBuildModeData: React.Dispatch<React.SetStateAction<FormatData>>;
  allColumnsFilledForSave: boolean;
  missingColumns: string[];
  saveFormatToUniversalLibrary: (label: string, format: FormatData, brokerName: string) => Promise<boolean>;
  currentUser: { userId: string } | null;
  getCognitoToken: () => Promise<string | null>;
  setSavedFormats: React.Dispatch<React.SetStateAction<Record<string, FormatData>>>;
  savedFormats: Record<string, FormatData>;
  showSavedFormatsDropdown: boolean;
  setShowSavedFormatsDropdown: (v: boolean) => void;
  formatsLoading: boolean;
  setFormatsLoading: (v: boolean) => void;
  userSelectedFormatId: string | null;
  setUserSelectedFormatId: (v: string | null) => void;
  importDataTextareaRef: React.RefObject<HTMLTextAreaElement>;
  importError: string;
  setImportError: (v: string) => void;
  parseErrors: ParseError[];
  setParseErrors: (v: ParseError[]) => void;
  handleImportData: () => void;
  parseTradesWithFormat: (data: string, format: FormatData) => ParseResult;
  recalculateFormatPositions: (format: FormatData, currentFirstLine: string) => FormatData;
  toast: (props: any) => void;
  saveFormatsToAWS?: (formats: Record<string, FormatData>) => Promise<void>;
}

export function ImportPnLDialog({
  showImportModal,
  setShowImportModal,
  importData,
  setImportData,
  handleFileUpload,
  activeFormat,
  setActiveFormat,
  detectedFormatLabel,
  setDetectedFormatLabel,
  isBuildMode,
  setIsBuildMode,
  brokerSearchInput,
  setBrokerSearchInput,
  showBrokerSuggestions,
  setShowBrokerSuggestions,
  filteredBrokers,
  buildModeData,
  setBuildModeData,
  allColumnsFilledForSave,
  missingColumns,
  saveFormatToUniversalLibrary,
  currentUser,
  getCognitoToken,
  setSavedFormats,
  savedFormats,
  showSavedFormatsDropdown,
  setShowSavedFormatsDropdown,
  formatsLoading,
  setFormatsLoading,
  userSelectedFormatId,
  setUserSelectedFormatId,
  importDataTextareaRef,
  importError,
  setImportError,
  parseErrors,
  setParseErrors,
  handleImportData,
  parseTradesWithFormat,
  recalculateFormatPositions,
  toast,
  saveFormatsToAWS,
}: ImportPnLDialogProps) {
  return (
        <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto custom-thin-scrollbar p-0 rounded-2xl">
            {/* Compact Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Import P&L Data</span>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="csv-upload" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Upload CSV
                </Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="mt-1.5 h-8 text-xs"
                  data-testid="input-csv-upload"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Expected: date, symbol, action, qty, entry, exit, pnl, duration
                </p>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Or Paste Data
                </Label>
                <div className="flex items-center gap-2 mb-2">
                  {activeFormat && detectedFormatLabel && (
                    <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium">
                      Format: {detectedFormatLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  {activeFormat 
                    ? `Using "${detectedFormatLabel}" format`
                    : "Paste your trade data. Format will be auto-detected if saved."
                  }
                </p>

                <div className="border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900/30 p-3 mb-3">
                  {isBuildMode ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Build Mode - Select text, click +, X to delete
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Input
                              placeholder="Type broker name or custom name (e.g., Zerodha, Coinbase, MyBroker...)"
                              value={brokerSearchInput}
                              onChange={(e) => {
                                setBrokerSearchInput(e.target.value);
                                setShowBrokerSuggestions(true);
                              }}
                              onFocus={() => setShowBrokerSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowBrokerSuggestions(false), 200)}
                              className="h-8 w-56 text-xs"
                              data-testid="input-broker-search"
                            />
                            {showBrokerSuggestions && filteredBrokers.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-md z-50 max-h-64 overflow-y-auto">
                                {filteredBrokers.map((broker) => (
                                  <button
                                    key={broker}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                                    onMouseDown={() => {
                                      setBrokerSearchInput(broker);
                                      setShowBrokerSuggestions(false);
                                    }}
                                  >
                                    {broker}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!currentUser?.userId || !brokerSearchInput.trim() || !allColumnsFilledForSave}
                            title={
                              !currentUser?.userId ? "Log in to save formats" :
                              !brokerSearchInput.trim() ? "Enter broker or custom name" :
                              !allColumnsFilledForSave ? `Fill all columns: ${missingColumns.join(", ")}` :
                              ""
                            }
                            onClick={async () => {
                              if (!brokerSearchInput.trim()) {
                                alert("Please enter a broker name");
                                return;
                              }
                              if (!allColumnsFilledForSave) {
                                alert(`Please fill all columns: ${missingColumns.join(", ")}`);
                                return;
                              }
                              const brokerName = brokerSearchInput.trim();
                              const formatLabel = `${brokerName} Format`;
                              // Save to universal library
                              const saved = await saveFormatToUniversalLibrary(formatLabel, buildModeData, brokerName);
                              if (saved) {
                                setActiveFormat(buildModeData);
                                setBrokerSearchInput("");
                                console.log("✅ Format saved to library for:", brokerName, buildModeData.positions);

                                // Reload saved formats immediately to trigger auto-apply
                                if (currentUser?.userId) {
                                  try {
                                    const idToken = await getCognitoToken();
                                    if (idToken) {
                                      const response = await fetch(`/api/user-formats/${currentUser.userId}`, {
                                        headers: { 'Authorization': `Bearer ${idToken}` }
                                      });
                                      if (response.ok) {
                                        const updatedFormats = await response.json();
                                        setSavedFormats(updatedFormats);

                                        // IMMEDIATELY apply first saved format to live preview
                                        if (Object.keys(updatedFormats).length > 0) {
                                          const firstLabel = Object.keys(updatedFormats)[0];
                                          const firstFormat = updatedFormats[firstLabel];
                                          setActiveFormat(firstFormat);
                                          console.log("✨ Live preview auto-applying first format:", firstLabel);
                                        }
                                        console.log("🔄 Saved formats reloaded - live preview updated:", Object.keys(updatedFormats).length);
                                      }
                                    }
                                  } catch (err) {
                                    console.error("❌ Failed to reload formats after save:", err);
                                  }
                                }
                              }
                            }}
                            data-testid="button-save-format"
                            className="h-8 text-xs px-2"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsBuildMode(false)}
                            data-testid="button-close-build-mode"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-background rounded border overflow-hidden">
                        <table className="w-full font-mono text-xs">
                          <thead>
                            <tr className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Time</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Order</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Symbol</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Type</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Qty</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              {/* Time Column */}
                              <td 
                                className="px-2 py-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const sourceField = e.dataTransfer.getData("sourceField") as keyof typeof buildModeData.positions;
                                  if (sourceField && sourceField !== "time") {
                                    // Swap: exchange data between source and destination
                                    setBuildModeData(prev => ({
                                      ...prev,
                                      positions: {
                                        ...prev.positions,
                                        time: prev.positions[sourceField],
                                        [sourceField]: prev.positions.time
                                      },
                                      displayValues: {
                                        ...prev.displayValues!,
                                        time: prev.displayValues[sourceField],
                                        [sourceField]: prev.displayValues.time
                                      }
                                    }));
                                  }
                                }}
                              >
                                {buildModeData.positions.time.length > 0 ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("sourceField", "time");
                                      e.dataTransfer.setData("sourceValue", buildModeData.displayValues.time);
                                    }}
                                    className="inline-flex flex-col gap-0.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs cursor-move"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">[Pos {buildModeData.positions.time.join(", ")}]</span>
                                      <button
                                        onClick={() => setBuildModeData(prev => ({ 
                                          ...prev, 
                                          positions: { ...prev.positions, time: [] },
                                          displayValues: { ...prev.displayValues!, time: "" }
                                        }))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5"
                                        data-testid="delete-time"
                                        title="Delete all"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-medium text-xs">{buildModeData.displayValues.time}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const textarea = importDataTextareaRef.current;
                                      if (textarea) {
                                        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
                                        const firstLine = textarea.value.trim().split('\n')[0] || "";
                                        if (selectedText && firstLine) {
                                          const selectedWords = selectedText.split(/\s+/);
                                          const words = firstLine.split(/\t+/).flatMap(part => part.split(/\s+/)).filter(w => w.trim());
                                          const newPositions = selectedWords.map(word => words.findIndex(w => w === word || w.includes(word) || word.includes(w))).filter(p => p >= 0);
                                          if (newPositions.length > 0) {
                                            setBuildModeData(prev => ({ 
                                              ...prev,
                                              sampleLine: firstLine,
                                              positions: { ...prev.positions, time: [...prev.positions.time, ...newPositions] },
                                              displayValues: { ...prev.displayValues!, time: prev.displayValues.time ? `${prev.displayValues.time} ${selectedText}` : selectedText }
                                            }));
                                          } else {
                                            alert("Could not find selected text in first line!");
                                          }
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    data-testid="add-time"
                                    title="Select text and click +"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </td>

                              {/* Order Column */}
                              <td 
                                className="px-2 py-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const sourceField = e.dataTransfer.getData("sourceField") as keyof typeof buildModeData.positions;
                                  if (sourceField && sourceField !== "order") {
                                    // Swap: exchange data between source and destination
                                    setBuildModeData(prev => ({
                                      ...prev,
                                      positions: {
                                        ...prev.positions,
                                        order: prev.positions[sourceField],
                                        [sourceField]: prev.positions.order
                                      },
                                      displayValues: {
                                        ...prev.displayValues!,
                                        order: prev.displayValues[sourceField],
                                        [sourceField]: prev.displayValues.order
                                      }
                                    }));
                                  }
                                }}
                              >
                                {buildModeData.positions.order.length > 0 ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("sourceField", "order");
                                      e.dataTransfer.setData("sourceValue", buildModeData.displayValues.order);
                                    }}
                                    className="inline-flex flex-col gap-0.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs cursor-move"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">[Pos {buildModeData.positions.order.join(", ")}]</span>
                                      <button
                                        onClick={() => setBuildModeData(prev => ({ 
                                          ...prev, 
                                          positions: { ...prev.positions, order: [] },
                                          displayValues: { ...prev.displayValues!, order: "" }
                                        }))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5"
                                        data-testid="delete-order"
                                        title="Delete all"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-medium text-xs">{buildModeData.displayValues.order}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const textarea = importDataTextareaRef.current;
                                      if (textarea) {
                                        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
                                        const firstLine = textarea.value.trim().split('\n')[0] || "";
                                        if (selectedText && firstLine) {
                                          const selectedWords = selectedText.split(/\s+/);
                                          const words = firstLine.split(/\t+/).flatMap(part => part.split(/\s+/)).filter(w => w.trim());
                                          const newPositions = selectedWords.map(word => words.findIndex(w => w === word || w.includes(word) || word.includes(w))).filter(p => p >= 0);
                                          if (newPositions.length > 0) {
                                            setBuildModeData(prev => ({ 
                                              ...prev,
                                              sampleLine: firstLine,
                                              positions: { ...prev.positions, order: [...prev.positions.order, ...newPositions] },
                                              displayValues: { ...prev.displayValues!, order: prev.displayValues.order ? `${prev.displayValues.order} ${selectedText}` : selectedText }
                                            }));
                                          } else {
                                            alert("Could not find selected text in first line!");
                                          }
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    data-testid="add-order"
                                    title="Select text and click +"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </td>

                              {/* Symbol Column */}
                              <td 
                                className="px-2 py-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const sourceField = e.dataTransfer.getData("sourceField") as keyof typeof buildModeData.positions;
                                  if (sourceField && sourceField !== "symbol") {
                                    // Swap: exchange data between source and destination
                                    setBuildModeData(prev => ({
                                      ...prev,
                                      positions: {
                                        ...prev.positions,
                                        symbol: prev.positions[sourceField],
                                        [sourceField]: prev.positions.symbol
                                      },
                                      displayValues: {
                                        ...prev.displayValues!,
                                        symbol: prev.displayValues[sourceField],
                                        [sourceField]: prev.displayValues.symbol
                                      }
                                    }));
                                  }
                                }}
                              >
                                {buildModeData.positions.symbol.length > 0 ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("sourceField", "symbol");
                                      e.dataTransfer.setData("sourceValue", buildModeData.displayValues.symbol);
                                    }}
                                    className="inline-flex flex-col gap-0.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs cursor-move"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">[Pos {buildModeData.positions.symbol.join(", ")}]</span>
                                      <button
                                        onClick={() => setBuildModeData(prev => ({ 
                                          ...prev, 
                                          positions: { ...prev.positions, symbol: [] },
                                          displayValues: { ...prev.displayValues!, symbol: "" }
                                        }))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5"
                                        data-testid="delete-symbol"
                                        title="Delete all"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-medium text-xs">{buildModeData.displayValues.symbol}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const textarea = importDataTextareaRef.current;
                                      if (textarea) {
                                        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
                                        const firstLine = textarea.value.trim().split('\n')[0] || "";
                                        if (selectedText && firstLine) {
                                          const selectedWords = selectedText.split(/\s+/);
                                          const words = firstLine.split(/\t+/).flatMap(part => part.split(/\s+/)).filter(w => w.trim());
                                          const newPositions = selectedWords.map(word => words.findIndex(w => w === word || w.includes(word) || word.includes(w))).filter(p => p >= 0);
                                          if (newPositions.length > 0) {
                                            setBuildModeData(prev => ({ 
                                              ...prev,
                                              sampleLine: firstLine,
                                              positions: { ...prev.positions, symbol: [...prev.positions.symbol, ...newPositions] },
                                              displayValues: { ...prev.displayValues!, symbol: prev.displayValues.symbol ? `${prev.displayValues.symbol} ${selectedText}` : selectedText }
                                            }));
                                          } else {
                                            alert("Could not find selected text in first line!");
                                          }
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    data-testid="add-symbol"
                                    title="Select text and click +"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </td>

                              {/* Type Column */}
                              <td 
                                className="px-2 py-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const sourceField = e.dataTransfer.getData("sourceField") as keyof typeof buildModeData.positions;
                                  if (sourceField && sourceField !== "type") {
                                    // Swap: exchange data between source and destination
                                    setBuildModeData(prev => ({
                                      ...prev,
                                      positions: {
                                        ...prev.positions,
                                        type: prev.positions[sourceField],
                                        [sourceField]: prev.positions.type
                                      },
                                      displayValues: {
                                        ...prev.displayValues!,
                                        type: prev.displayValues[sourceField],
                                        [sourceField]: prev.displayValues.type
                                      }
                                    }));
                                  }
                                }}
                              >
                                {buildModeData.positions.type.length > 0 ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("sourceField", "type");
                                      e.dataTransfer.setData("sourceValue", buildModeData.displayValues.type);
                                    }}
                                    className="inline-flex flex-col gap-0.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs cursor-move"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">[Pos {buildModeData.positions.type.join(", ")}]</span>
                                      <button
                                        onClick={() => setBuildModeData(prev => ({ 
                                          ...prev, 
                                          positions: { ...prev.positions, type: [] },
                                          displayValues: { ...prev.displayValues!, type: "" }
                                        }))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5"
                                        data-testid="delete-type"
                                        title="Delete all"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-medium text-xs">{buildModeData.displayValues.type}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const textarea = importDataTextareaRef.current;
                                      if (textarea) {
                                        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
                                        const firstLine = textarea.value.trim().split('\n')[0] || "";
                                        if (selectedText && firstLine) {
                                          const selectedWords = selectedText.split(/\s+/);
                                          const words = firstLine.split(/\t+/).flatMap(part => part.split(/\s+/)).filter(w => w.trim());
                                          const newPositions = selectedWords.map(word => words.findIndex(w => w === word || w.includes(word) || word.includes(w))).filter(p => p >= 0);
                                          if (newPositions.length > 0) {
                                            setBuildModeData(prev => ({ 
                                              ...prev,
                                              sampleLine: firstLine,
                                              positions: { ...prev.positions, type: [...prev.positions.type, ...newPositions] },
                                              displayValues: { ...prev.displayValues!, type: prev.displayValues.type ? `${prev.displayValues.type} ${selectedText}` : selectedText }
                                            }));
                                          } else {
                                            alert("Could not find selected text in first line!");
                                          }
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    data-testid="add-type"
                                    title="Select text and click +"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </td>

                              {/* Qty Column */}
                              <td 
                                className="px-2 py-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const sourceField = e.dataTransfer.getData("sourceField") as keyof typeof buildModeData.positions;
                                  if (sourceField && sourceField !== "qty") {
                                    // Swap: exchange data between source and destination
                                    setBuildModeData(prev => ({
                                      ...prev,
                                      positions: {
                                        ...prev.positions,
                                        qty: prev.positions[sourceField],
                                        [sourceField]: prev.positions.qty
                                      },
                                      displayValues: {
                                        ...prev.displayValues!,
                                        qty: prev.displayValues[sourceField],
                                        [sourceField]: prev.displayValues.qty
                                      }
                                    }));
                                  }
                                }}
                              >
                                {buildModeData.positions.qty.length > 0 ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("sourceField", "qty");
                                      e.dataTransfer.setData("sourceValue", buildModeData.displayValues.qty);
                                    }}
                                    className="inline-flex flex-col gap-0.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs cursor-move"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">[Pos {buildModeData.positions.qty.join(", ")}]</span>
                                      <button
                                        onClick={() => setBuildModeData(prev => ({ 
                                          ...prev, 
                                          positions: { ...prev.positions, qty: [] },
                                          displayValues: { ...prev.displayValues!, qty: "" }
                                        }))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5"
                                        data-testid="delete-qty"
                                        title="Delete all"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-medium text-xs">{buildModeData.displayValues.qty}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const textarea = importDataTextareaRef.current;
                                      if (textarea) {
                                        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
                                        const firstLine = textarea.value.trim().split('\n')[0] || "";
                                        if (selectedText && firstLine) {
                                          const selectedWords = selectedText.split(/\s+/);
                                          const words = firstLine.split(/\t+/).flatMap(part => part.split(/\s+/)).filter(w => w.trim());
                                          const newPositions = selectedWords.map(word => words.findIndex(w => w === word || w.includes(word) || word.includes(w))).filter(p => p >= 0);
                                          if (newPositions.length > 0) {
                                            setBuildModeData(prev => ({ 
                                              ...prev,
                                              sampleLine: firstLine,
                                              positions: { ...prev.positions, qty: [...prev.positions.qty, ...newPositions] },
                                              displayValues: { ...prev.displayValues!, qty: prev.displayValues.qty ? `${prev.displayValues.qty} ${selectedText}` : selectedText }
                                            }));
                                          } else {
                                            alert("Could not find selected text in first line!");
                                          }
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    data-testid="add-qty"
                                    title="Select text and click +"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </td>

                              {/* Price Column */}
                              <td 
                                className="px-2 py-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const sourceField = e.dataTransfer.getData("sourceField") as keyof typeof buildModeData.positions;
                                  if (sourceField && sourceField !== "price") {
                                    // Swap: exchange data between source and destination
                                    setBuildModeData(prev => ({
                                      ...prev,
                                      positions: {
                                        ...prev.positions,
                                        price: prev.positions[sourceField],
                                        [sourceField]: prev.positions.price
                                      },
                                      displayValues: {
                                        ...prev.displayValues!,
                                        price: prev.displayValues[sourceField],
                                        [sourceField]: prev.displayValues.price
                                      }
                                    }));
                                  }
                                }}
                              >
                                {buildModeData.positions.price.length > 0 ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("sourceField", "price");
                                      e.dataTransfer.setData("sourceValue", buildModeData.displayValues.price);
                                    }}
                                    className="inline-flex flex-col gap-0.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs cursor-move"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">[Pos {buildModeData.positions.price.join(", ")}]</span>
                                      <button
                                        onClick={() => setBuildModeData(prev => ({ 
                                          ...prev, 
                                          positions: { ...prev.positions, price: [] },
                                          displayValues: { ...prev.displayValues!, price: "" }
                                        }))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5"
                                        data-testid="delete-price"
                                        title="Delete all"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-medium text-xs">{buildModeData.displayValues.price}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const textarea = importDataTextareaRef.current;
                                      if (textarea) {
                                        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
                                        const firstLine = textarea.value.trim().split('\n')[0] || "";
                                        if (selectedText && firstLine) {
                                          const selectedWords = selectedText.split(/\s+/);
                                          const words = firstLine.split(/\t+/).flatMap(part => part.split(/\s+/)).filter(w => w.trim());
                                          const newPositions = selectedWords.map(word => words.findIndex(w => w === word || w.includes(word) || word.includes(w))).filter(p => p >= 0);
                                          if (newPositions.length > 0) {
                                            setBuildModeData(prev => ({ 
                                              ...prev,
                                              sampleLine: firstLine,
                                              positions: { ...prev.positions, price: [...prev.positions.price, ...newPositions] },
                                              displayValues: { ...prev.displayValues!, price: prev.displayValues.price ? `${prev.displayValues.price} ${selectedText}` : selectedText }
                                            }));
                                          } else {
                                            alert("Could not find selected text in first line!");
                                          }
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    data-testid="add-price"
                                    title="Select text and click +"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Saved Formats Table - Shows all saved formats with their original trade lines */}
                      {Object.keys(savedFormats).length > 0 && (
                        <div className="mt-4 space-y-2">
                          <button
                            onClick={() => setShowSavedFormatsDropdown(!showSavedFormatsDropdown)}
                            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                            data-testid="button-toggle-saved-formats"
                          >
                            <ChevronDown 
                              className={`w-3 h-3 transition-transform ${showSavedFormatsDropdown ? "rotate-180" : ""}`}
                            />
                            📚 Saved Formats ({Object.keys(savedFormats).length})
                          </button>
                          {showSavedFormatsDropdown && (
                          <div className="bg-background rounded border overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-muted/50 border-b">
                                  <th className="px-3 py-2 text-left font-semibold">Format Label</th>
                                  <th className="px-3 py-2 text-left font-semibold">Original Trade Line</th>
                                  <th className="px-3 py-2 text-left font-semibold">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(savedFormats).map(([formatId, format]) => {
                                  const displayLabel = format.label || formatId;
                                  return (
                                  <tr key={formatId} className="border-b last:border-b-0 hover-elevate">
                                    <td className="px-3 py-2 font-medium">{displayLabel}</td>
                                    <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-md">
                                      {format.sampleLine || "No sample line saved"}
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={() => {
                                            // Set user's manual selection
                                            setUserSelectedFormatId(formatId);
                                            setBuildModeData(format);
                                            setActiveFormat(format);
                                            setDetectedFormatLabel(displayLabel);
                                            console.log("✅ Format loaded from table:", displayLabel, format);
                                          }}
                                          data-testid={`button-use-format-${displayLabel}`}
                                        >
                                          Use
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={!currentUser?.userId}
                                          title={!currentUser?.userId ? "Log in to delete formats" : ""}
                                          onClick={async () => {if (confirm(`Delete format "${displayLabel}"?`)) {
                                              const newFormats = { ...savedFormats };
                                              delete newFormats[formatId];
                                              setSavedFormats(newFormats);
                                              await saveFormatsToAWS?.(newFormats);
                                              if (activeFormat === format) {
                                                setActiveFormat(null);
                                              }
                                              // Clear user selection if deleted format was selected
                                              if (userSelectedFormatId === formatId) {
                                                setUserSelectedFormatId(null);
                                              }
                                              console.log("🗑️ Format deleted:", displayLabel);
                                            }
                                          }}
                                          data-testid={`button-delete-format-${displayLabel}`}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Live Demo - How Your First Trade Will Import:
                      </div>
                      <div className="bg-background rounded border overflow-hidden">
                        <table className="w-full font-mono text-xs">
                          <thead>
                            <tr className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Time</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Order</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Symbol</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Type</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Qty</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              // Parse first trade from pasted data
                              if (!importData.trim()) {
                                return (
                                  <tr className="border-b last:border-b-0">
                                    <td colSpan={6} className="px-2 py-3 text-center text-muted-foreground italic">
                                      Paste trade data below to see live preview...
                                    </td>
                                  </tr>
                                );
                              }

                              // Use format-based parser if active format is set, otherwise use default parser
                              const { trades, errors } = activeFormat 
                                ? parseTradesWithFormat(importData, activeFormat)
                                : parseBrokerTrades(importData);

                              if (trades.length === 0) {
                                return (
                                  <tr className="border-b last:border-b-0">
                                    <td colSpan={6} className="px-2 py-3 text-center text-orange-600 dark:text-orange-400">
                                      ⚠️ Unable to parse - check format
                                    </td>
                                  </tr>
                                );
                              }

                              const firstTrade = trades[0];
                              return (
                                <tr className="border-b last:border-b-0 bg-green-50/50 dark:bg-green-950/20">
                                  <td className="px-2 py-2 text-foreground">{firstTrade.time}</td>
                                  <td className="px-2 py-2 text-foreground">{firstTrade.order}</td>
                                  <td className="px-2 py-2 text-foreground">{firstTrade.symbol}</td>
                                  <td className="px-2 py-2 text-foreground">{firstTrade.type}</td>
                                  <td className="px-2 py-2 text-foreground">{firstTrade.qty}</td>
                                  <td className="px-2 py-2 text-foreground">{firstTrade.price}</td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-start mt-2">
                        <div className="flex items-center gap-2">
                          <select
                            className="h-9 text-xs border border-input bg-background rounded-md px-2 py-1 cursor-pointer"
                            onChange={(e) => {
                              const formatId = e.target.value;
                              if (formatId && savedFormats[formatId]) {
                                const loadedFormat = savedFormats[formatId];
                                // Set user's manual selection
                                setUserSelectedFormatId(formatId);

                                // Apply to textarea content
                                const textarea = importDataTextareaRef.current;
                                if (textarea && loadedFormat) {
                                  const currentFirstLine = textarea.value.trim().split('\n')[0] || "";
                                  if (currentFirstLine) {
                                    const recalculatedFormat = recalculateFormatPositions(loadedFormat, currentFirstLine);
                                    setBuildModeData(recalculatedFormat);
                                    setActiveFormat(recalculatedFormat);
                                    setDetectedFormatLabel(loadedFormat.label || formatId);
                                  } else {
                                    setBuildModeData(loadedFormat);
                                    setActiveFormat(loadedFormat);
                                    setDetectedFormatLabel(loadedFormat.label || formatId);
                                  }
                                } else {
                                  setBuildModeData(loadedFormat);
                                  setActiveFormat(loadedFormat);
                                  setDetectedFormatLabel(loadedFormat.label || formatId);
                                }
                                setIsBuildMode(true);
                                console.log("✅ Format manually selected:", loadedFormat.label || formatId, loadedFormat);
                              }
                            }}
                            defaultValue=""
                            data-testid="select-load-format"
                            disabled={formatsLoading}
                          >
                            <option value="">
                              {formatsLoading 
                                ? "Loading formats..." 
                                : `Load Saved Format${Object.keys(savedFormats).length > 0 ? ` (${Object.keys(savedFormats).length})` : ""}`}
                            </option>
                            {Object.entries(savedFormats).map(([formatId, format]) => (
                              <option key={formatId} value={formatId}>
                                {format.label || formatId}
                              </option>
                            ))}
                          </select>
                          {currentUser?.userId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-2"
                              onClick={async () => {
                                console.log("🔃 Manually refreshing formats...");
                                setFormatsLoading(true);
                                try {
                                  const idToken = await getCognitoToken();
                                  if (idToken) {
                                    const response = await fetch(`/api/user-formats/${currentUser.userId}`, {
                                      headers: { 'Authorization': `Bearer ${idToken}` }
                                    });
                                    if (response.ok) {
                                      const formats = await response.json();
                                      console.log("✅ Formats refreshed:", Object.keys(formats).length);
                                      setSavedFormats(formats);
                                      toast({
                                        title: "Refreshed",
                                        description: `Loaded ${Object.keys(formats).length} format(s)`
                                      });
                                    }
                                  }
                                } catch (err) {
                                  console.error("❌ Refresh failed:", err);
                                  toast({
                                    title: "Refresh Failed",
                                    description: "Could not load formats",
                                    variant: "destructive"
                                  });
                                } finally {
                                  setFormatsLoading(false);
                                }
                              }}
                              data-testid="button-refresh-formats"
                              title="Refresh saved formats"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                              // Auto-extract from first line - using WORD POSITIONS not character positions
                              const firstLine = importData.trim().split('\n')[0] || "";
                              const parts = firstLine.split(/\s+/);

                              // Find positions by matching patterns (track found state to avoid reusing parts)
                              let timePos = -1, orderPos = -1, symbolPos = -1, typePos = -1, qtyPos = -1, pricePos = -1;
                              let timeVal = "", orderVal = "", symbolVal = "", typeVal = "", qtyVal = "", priceVal = "";
                              let foundTime = false, foundOrder = false, foundSymbol = false;

                              // Identify price and qty first (they're at the end) - use array INDEX, not character position!
                              const lastIdx = parts.length - 1;
                              if (lastIdx >= 0 && /^\d+(\.\d+)?$/.test(parts[lastIdx])) {
                                qtyPos = lastIdx;
                                qtyVal = parts[lastIdx];
                              }
                              if (lastIdx >= 1 && /^\d+(\.\d+)?$/.test(parts[lastIdx - 1])) {
                                pricePos = lastIdx - 1;
                                priceVal = parts[lastIdx - 1];
                              }

                              // Now scan left to right for time, order, symbol, type
                              for (let i = 0; i < parts.length; i++) {
                                const part = parts[i];

                                // Time pattern: HH:MM:SS - use index i, not indexOf!
                                if (!foundTime && /^\d{1,2}:\d{2}:\d{2}$/.test(part)) {
                                  timePos = i;
                                  timeVal = part;
                                  foundTime = true;
                                  continue;
                                }

                                // Order: BUY/SELL - use index i, not indexOf!
                                if (!foundOrder && /^(BUY|SELL)$/i.test(part)) {
                                  orderPos = i;
                                  orderVal = part;
                                  foundOrder = true;
                                  continue;
                                }

                                // Symbol: longest string token (often NIFTY25JANFUT or INFY)
                                if (!foundSymbol && /^[A-Z][A-Z0-9]+$/.test(part) && part.length > 2 && i !== orderPos) {
                                  symbolPos = i;
                                  symbolVal = part;
                                  foundSymbol = true;
                                  continue;
                                }

                                // Type: MIS, NRML, CNC etc.
                                if (/^(MIS|NRML|CNC|INTRADAY|DELIVERY|MARGIN)$/i.test(part)) {
                                  typePos = i;
                                  typeVal = part;
                                }
                              }

                              setBuildModeData({
                                sampleLine: firstLine,
                                positions: {
                                  time: timePos >= 0 ? [timePos] : [],
                                  order: orderPos >= 0 ? [orderPos] : [],
                                  symbol: symbolPos >= 0 ? [symbolPos] : [],
                                  type: typePos >= 0 ? [typePos] : [],
                                  qty: qtyPos >= 0 ? [qtyPos] : [],
                                  price: pricePos >= 0 ? [pricePos] : []
                                },
                                displayValues: {
                                  time: timeVal,
                                  order: orderVal,
                                  symbol: symbolVal,
                                  type: typeVal,
                                  qty: qtyVal,
                                  price: priceVal
                                }
                              });
                              setIsBuildMode(true);
                              console.log("🔨 Build mode - auto-extracted from first line with CORRECT word positions", { positions: { timePos, orderPos, symbolPos, typePos, qtyPos, pricePos }, displayValues: { timeVal, orderVal, symbolVal, typeVal, qtyVal, priceVal } });
                            }}
                            data-testid="button-build"
                          >
                            <Hammer className="w-3.5 h-3.5" />
                            Build
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Textarea
                  ref={importDataTextareaRef}
                  id="paste-data"
                  placeholder="Paste your trade data..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="min-h-32 text-xs"
                  data-testid="textarea-paste-data"
                />
              </div>

              {importError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <p className="text-xs text-red-600 dark:text-red-400">{importError}</p>
                </div>
              )}

              {parseErrors.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-3 max-h-40 overflow-y-auto custom-thin-scrollbar">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {parseErrors.length} line(s) could not be parsed
                  </p>
                  <div className="space-y-1">
                    {parseErrors.map((error, index) => (
                      <div key={index} className="bg-white dark:bg-slate-900 rounded p-2 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-start items-start gap-2">
                          <span className="font-mono text-yellow-700">
                            Line {error.line}:
                          </span>
                          <span className="text-red-600 font-medium">
                            {error.reason}
                          </span>
                        </div>
                        <div className="mt-1 text-gray-600 font-mono truncate">
                          {error.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportData("");
                    setImportError("");
                    setParseErrors([]);
                    // Reset user format selection for fresh start next time
                    setUserSelectedFormatId(null);
                  }}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleImportData}
                  className="h-8 text-xs"
                >
                  Import
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
  );
}
