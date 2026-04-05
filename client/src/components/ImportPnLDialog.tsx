import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Plus, ChevronDown, RotateCw, Hammer, Upload, FileText } from "lucide-react";
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

const COLS = ["time", "order", "symbol", "type", "qty", "price"] as const;
type ColKey = typeof COLS[number];

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

  const handleAddCol = (col: ColKey) => {
    const textarea = importDataTextareaRef.current;
    if (!textarea) return;
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
    const firstLine = textarea.value.trim().split('\n')[0] || "";
    if (selectedText && firstLine) {
      const selectedWords = selectedText.split(/\s+/);
      const words = firstLine.split(/\t+/).flatMap((part: string) => part.split(/\s+/)).filter((w: string) => w.trim());
      const newPositions = selectedWords
        .map((word: string) => words.findIndex((w: string) => w === word || w.includes(word) || word.includes(w)))
        .filter((p: number) => p >= 0);
      if (newPositions.length > 0) {
        setBuildModeData(prev => ({
          ...prev,
          sampleLine: firstLine,
          positions: { ...prev.positions, [col]: [...prev.positions[col], ...newPositions] },
          displayValues: {
            ...prev.displayValues,
            [col]: prev.displayValues[col] ? `${prev.displayValues[col]} ${selectedText}` : selectedText
          }
        }));
      } else {
        alert("Could not find selected text in first line!");
      }
    }
  };

  const handleClearCol = (col: ColKey) => {
    setBuildModeData(prev => ({
      ...prev,
      positions: { ...prev.positions, [col]: [] },
      displayValues: { ...prev.displayValues, [col]: "" }
    }));
  };

  const handleSwapCols = (from: ColKey, to: ColKey) => {
    setBuildModeData(prev => ({
      ...prev,
      positions: {
        ...prev.positions,
        [to]: prev.positions[from],
        [from]: prev.positions[to]
      },
      displayValues: {
        ...prev.displayValues,
        [to]: prev.displayValues[from],
        [from]: prev.displayValues[to]
      }
    }));
  };

  return (
    <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto custom-thin-scrollbar p-0 rounded-xl border border-gray-200 bg-white shadow-xl">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-800">Import P&L Data</span>
        </div>

        <div className="p-4 space-y-4">

          {/* CSV Upload */}
          <div className="space-y-1.5">
            <Label htmlFor="csv-upload" className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <Upload className="w-3 h-3" />
              Upload CSV
            </Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="h-8 text-xs bg-white border-gray-200 text-gray-700 file:text-gray-500 file:bg-gray-100 file:border-0 file:text-xs file:px-2 file:py-1 file:rounded file:mr-2 hover:border-gray-300 transition-colors"
              data-testid="input-csv-upload"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">or paste</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Paste Section */}
          <div className="space-y-2">
            {/* Format badge */}
            {activeFormat && detectedFormatLabel && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full font-medium">
                  {detectedFormatLabel}
                </span>
              </div>
            )}
            <p className="text-[11px] text-gray-400">
              {activeFormat
                ? `Using "${detectedFormatLabel}" format`
                : "Paste trade data — format auto-detected if saved."}
            </p>

            {/* Preview / Build Mode panel */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
              {isBuildMode ? (
                <div className="space-y-0">
                  {/* Build mode toolbar */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 bg-white">
                    <span className="text-[11px] font-medium text-gray-500">
                      Build Mode — select text, click <span className="text-indigo-500">+</span>, drag to swap
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* Broker name input */}
                      <div className="relative">
                        <Input
                          placeholder="Broker / format name..."
                          value={brokerSearchInput}
                          onChange={(e) => {
                            setBrokerSearchInput(e.target.value);
                            setShowBrokerSuggestions(true);
                          }}
                          onFocus={() => setShowBrokerSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowBrokerSuggestions(false), 200)}
                          className="h-7 w-44 text-xs bg-white border-gray-200 text-gray-700 placeholder:text-gray-400 focus:border-indigo-400"
                          data-testid="input-broker-search"
                        />
                        {showBrokerSuggestions && filteredBrokers.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                            {filteredBrokers.map((broker) => (
                              <button
                                key={broker}
                                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
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

                      {/* Save */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!currentUser?.userId || !brokerSearchInput.trim() || !allColumnsFilledForSave}
                        title={
                          !currentUser?.userId ? "Log in to save formats" :
                          !brokerSearchInput.trim() ? "Enter broker or custom name" :
                          !allColumnsFilledForSave ? `Fill all columns: ${missingColumns.join(", ")}` : ""
                        }
                        onClick={async () => {
                          if (!brokerSearchInput.trim()) { alert("Please enter a broker name"); return; }
                          if (!allColumnsFilledForSave) { alert(`Please fill all columns: ${missingColumns.join(", ")}`); return; }
                          const brokerName = brokerSearchInput.trim();
                          const formatLabel = `${brokerName} Format`;
                          const saved = await saveFormatToUniversalLibrary(formatLabel, buildModeData, brokerName);
                          if (saved) {
                            setActiveFormat(buildModeData);
                            setBrokerSearchInput("");
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
                                    if (Object.keys(updatedFormats).length > 0) {
                                      const firstLabel = Object.keys(updatedFormats)[0];
                                      setActiveFormat(updatedFormats[firstLabel]);
                                    }
                                  }
                                }
                              } catch (err) {
                                console.error("❌ Failed to reload formats after save:", err);
                              }
                            }
                          }
                        }}
                        data-testid="button-save-format"
                        className="h-7 text-xs px-2 bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>

                      {/* Close build mode */}
                      <button
                        onClick={() => setIsBuildMode(false)}
                        data-testid="button-close-build-mode"
                        className="flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Build mode mapping table */}
                  <div className="overflow-x-auto bg-white">
                    <table className="w-full font-mono text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {COLS.map(col => (
                            <th key={col} className="px-2.5 py-2 text-left text-[11px] font-semibold text-indigo-500 uppercase tracking-wide">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {COLS.map(col => (
                            <td
                              key={col}
                              className="px-2.5 py-2.5 align-top"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const sourceField = e.dataTransfer.getData("sourceField") as ColKey;
                                if (sourceField && sourceField !== col) handleSwapCols(sourceField, col);
                              }}
                            >
                              {buildModeData.positions[col].length > 0 ? (
                                <div
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("sourceField", col);
                                    e.dataTransfer.setData("sourceValue", buildModeData.displayValues[col]);
                                  }}
                                  className="inline-flex flex-col gap-0.5 px-2 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md text-xs cursor-move"
                                >
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-indigo-400 font-mono">
                                      [{buildModeData.positions[col].join(", ")}]
                                    </span>
                                    <button
                                      onClick={() => handleClearCol(col)}
                                      className="opacity-50 hover:opacity-100 hover:text-red-500 transition-opacity rounded"
                                      data-testid={`delete-${col}`}
                                      title="Clear"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                  <span className="font-medium text-[11px] text-gray-700">{buildModeData.displayValues[col]}</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAddCol(col)}
                                  className="flex items-center justify-center w-7 h-7 rounded-md border border-dashed border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                                  data-testid={`add-${col}`}
                                  title="Select text in textarea, then click +"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Saved formats */}
                  {Object.keys(savedFormats).length > 0 && (
                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => setShowSavedFormatsDropdown(!showSavedFormatsDropdown)}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors w-full px-3 py-2"
                        data-testid="button-toggle-saved-formats"
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${showSavedFormatsDropdown ? "rotate-180" : ""}`} />
                        Saved Formats ({Object.keys(savedFormats).length})
                      </button>
                      {showSavedFormatsDropdown && (
                        <div className="border-t border-gray-100 bg-white overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-400">Label</th>
                                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-400">Sample line</th>
                                <th className="px-3 py-2 text-right text-[11px] font-medium text-gray-400">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {Object.entries(savedFormats).map(([formatId, format]) => {
                                const displayLabel = format.label || formatId;
                                return (
                                  <tr key={formatId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-3 py-2 text-gray-700 font-medium">{displayLabel}</td>
                                    <td className="px-3 py-2 font-mono text-gray-400 truncate max-w-[200px]">
                                      {format.sampleLine || "—"}
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-6 text-[11px] px-2 bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                                          onClick={() => {
                                            setUserSelectedFormatId(formatId);
                                            setBuildModeData(format);
                                            setActiveFormat(format);
                                            setDetectedFormatLabel(displayLabel);
                                          }}
                                          data-testid={`button-use-format-${displayLabel}`}
                                        >
                                          Use
                                        </Button>
                                        <button
                                          className="flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                          disabled={!currentUser?.userId}
                                          title={!currentUser?.userId ? "Log in to delete formats" : "Delete"}
                                          onClick={async () => {
                                            if (confirm(`Delete format "${displayLabel}"?`)) {
                                              const newFormats = { ...savedFormats };
                                              delete newFormats[formatId];
                                              setSavedFormats(newFormats);
                                              await saveFormatsToAWS?.(newFormats);
                                              if (activeFormat === format) setActiveFormat(null);
                                              if (userSelectedFormatId === formatId) setUserSelectedFormatId(null);
                                            }
                                          }}
                                          data-testid={`button-delete-format-${displayLabel}`}
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
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
                /* Live preview */
                <div>
                  <div className="px-3 py-2 border-b border-gray-200 flex items-center bg-white">
                    <span className="text-[11px] text-gray-400 font-medium">Live preview — first trade</span>
                  </div>
                  <div className="overflow-x-auto bg-white">
                    <table className="w-full font-mono text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {COLS.map(col => (
                            <th key={col} className="px-2.5 py-2 text-left text-[11px] font-semibold text-indigo-500 uppercase tracking-wide">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          if (!importData.trim()) {
                            return (
                              <tr>
                                <td colSpan={6} className="px-3 py-4 text-center text-[11px] text-gray-400 italic">
                                  Paste trade data below to see live preview...
                                </td>
                              </tr>
                            );
                          }
                          let trades: any[] = [];
                          let detectedBroker: string | undefined;
                          if (activeFormat) {
                            trades = parseTradesWithFormat(importData, activeFormat).trades;
                          } else {
                            const result = parseBrokerTrades(importData);
                            trades = result.trades;
                            detectedBroker = result.detectedBroker;
                            if (detectedBroker && !detectedFormatLabel) {
                              setDetectedFormatLabel(`${detectedBroker} (auto)`);
                            }
                          }
                          if (trades.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="px-3 py-4 text-center text-[11px] text-amber-500">
                                  ⚠ Unable to parse — check format or use Build mode
                                </td>
                              </tr>
                            );
                          }
                          const t = trades[0];
                          return (
                            <>
                              {detectedBroker && (
                                <tr>
                                  <td colSpan={6} className="px-2.5 pt-2 pb-0">
                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded-full font-medium">
                                      ✓ {detectedBroker} format detected
                                    </span>
                                  </td>
                                </tr>
                              )}
                              <tr className="bg-indigo-50/60">
                                {COLS.map(col => (
                                  <td key={col} className="px-2.5 py-2 text-gray-700">{t[col]}</td>
                                ))}
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Format selector + Build button row */}
                  <div className="px-3 py-2 border-t border-gray-100 bg-white flex items-center gap-2 flex-wrap">
                    <select
                      className="h-7 text-xs border border-gray-200 bg-white text-gray-600 rounded-md px-2 cursor-pointer focus:outline-none focus:border-indigo-400 min-w-0"
                      onChange={(e) => {
                        const formatId = e.target.value;
                        if (formatId && savedFormats[formatId]) {
                          const loadedFormat = savedFormats[formatId];
                          setUserSelectedFormatId(formatId);
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
                        }
                      }}
                      defaultValue=""
                      data-testid="select-load-format"
                      disabled={formatsLoading}
                    >
                      <option value="">
                        {formatsLoading
                          ? "Loading..."
                          : `Load Format${Object.keys(savedFormats).length > 0 ? ` (${Object.keys(savedFormats).length})` : ""}`}
                      </option>
                      {Object.entries(savedFormats).map(([formatId, format]) => (
                        <option key={formatId} value={formatId}>
                          {format.label || formatId}
                        </option>
                      ))}
                    </select>

                    {currentUser?.userId && (
                      <button
                        className="flex items-center justify-center w-7 h-7 rounded-md border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                        onClick={async () => {
                          setFormatsLoading(true);
                          try {
                            const idToken = await getCognitoToken();
                            if (idToken) {
                              const response = await fetch(`/api/user-formats/${currentUser.userId}`, {
                                headers: { 'Authorization': `Bearer ${idToken}` }
                              });
                              if (response.ok) {
                                const formats = await response.json();
                                setSavedFormats(formats);
                                toast({ title: "Refreshed", description: `Loaded ${Object.keys(formats).length} format(s)` });
                              }
                            }
                          } catch {
                            toast({ title: "Refresh Failed", description: "Could not load formats", variant: "destructive" });
                          } finally {
                            setFormatsLoading(false);
                          }
                        }}
                        data-testid="button-refresh-formats"
                        title="Refresh saved formats"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 ml-auto bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      onClick={() => {
                        const firstLine = importData.trim().split('\n')[0] || "";
                        const parts = firstLine.split(/\s+/);
                        let timePos = -1, orderPos = -1, symbolPos = -1, typePos = -1, qtyPos = -1, pricePos = -1;
                        let timeVal = "", orderVal = "", symbolVal = "", typeVal = "", qtyVal = "", priceVal = "";
                        let foundTime = false, foundOrder = false, foundSymbol = false;
                        const lastIdx = parts.length - 1;
                        if (lastIdx >= 0 && /^\d+(\.\d+)?$/.test(parts[lastIdx])) { qtyPos = lastIdx; qtyVal = parts[lastIdx]; }
                        if (lastIdx >= 1 && /^\d+(\.\d+)?$/.test(parts[lastIdx - 1])) { pricePos = lastIdx - 1; priceVal = parts[lastIdx - 1]; }
                        for (let i = 0; i < parts.length; i++) {
                          const part = parts[i];
                          if (!foundTime && /^\d{1,2}:\d{2}:\d{2}$/.test(part)) { timePos = i; timeVal = part; foundTime = true; continue; }
                          if (!foundOrder && /^(BUY|SELL)$/i.test(part)) { orderPos = i; orderVal = part; foundOrder = true; continue; }
                          if (!foundSymbol && /^[A-Z][A-Z0-9]+$/.test(part) && part.length > 2 && i !== orderPos) { symbolPos = i; symbolVal = part; foundSymbol = true; continue; }
                          if (/^(MIS|NRML|CNC|INTRADAY|DELIVERY|MARGIN)$/i.test(part)) { typePos = i; typeVal = part; }
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
                          displayValues: { time: timeVal, order: orderVal, symbol: symbolVal, type: typeVal, qty: qtyVal, price: priceVal }
                        });
                        setIsBuildMode(true);
                      }}
                      data-testid="button-build"
                    >
                      <Hammer className="w-3 h-3" />
                      Build
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Textarea */}
            <Textarea
              ref={importDataTextareaRef}
              id="paste-data"
              placeholder="Paste your trade data here..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="min-h-28 text-xs bg-white border-gray-200 text-gray-700 placeholder:text-gray-400 focus:border-indigo-400 resize-none font-mono"
              data-testid="textarea-paste-data"
            />
          </div>

          {/* Error messages */}
          {importError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-xs text-red-500">{importError}</p>
            </div>
          )}

          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 max-h-36 overflow-y-auto custom-thin-scrollbar">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-[11px] font-medium text-gray-500">
                  {parseErrors.length} line(s) could not be parsed
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {parseErrors.map((error, index) => (
                  <div key={index} className="px-3 py-2">
                    <div className="flex gap-2 text-[11px]">
                      <span className="font-mono text-amber-500 shrink-0">Line {error.line}:</span>
                      <span className="text-red-500">{error.reason}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-400 font-mono truncate">{error.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowImportModal(false);
                setImportData("");
                setImportError("");
                setParseErrors([]);
                setUserSelectedFormatId(null);
              }}
              className="h-8 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleImportData}
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white border-0"
            >
              Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
