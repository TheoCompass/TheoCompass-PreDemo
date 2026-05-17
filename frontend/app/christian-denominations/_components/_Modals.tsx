"use client";

import { useState } from "react";

interface ModalsProps {
  showBackModal: boolean;
  showDevModal: boolean;
  showRestartModal: boolean;
  devCode: string;
  onUnlockDevTools: () => void;
  onCloseBackModal: () => void;
  onCloseDevModal: () => void;
  onCloseRestartModal: () => void;
  onConfirmBack: () => void;
  onConfirmDev: () => void;
  onConfirmRestart: () => void;
  onDevDenomFill: (denomId: string) => void;
  onSetDevCode: (code: string) => void;
  backModalMessage?: string;
  showDevTools?: boolean;
}

export function Modals({
  showBackModal,
  showDevModal,
  showRestartModal,
  devCode,
  onUnlockDevTools,
  onCloseBackModal,
  onCloseDevModal,
  onCloseRestartModal,
  onConfirmBack,
  onConfirmDev,
  onConfirmRestart,
  onDevDenomFill,
  onSetDevCode,
  backModalMessage = "Your progress is saved automatically. You can resume later.",
  showDevTools = true,
}: ModalsProps) {
  const [customDenomId, setCustomDenomId] = useState("DENOM_001");
  const [showCustomIdInput, setShowCustomIdInput] = useState(false);

  const handleCustomDenomSubmit = () => {
    const trimmed = customDenomId.trim();
    if (trimmed) {
      onDevDenomFill(trimmed);
      setShowCustomIdInput(false);
    }
  };

  return (
    <>
      {/* Back Modal */}
      {showBackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Leave Quiz?</h3>
            <p className="text-slate-600 mb-6">{backModalMessage}</p>
            <div className="flex justify-end gap-3">
              <button onClick={onCloseBackModal} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition">Cancel</button>
              <button onClick={onConfirmBack} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition">Yes, go back</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Dev Modal (Updated with API Testing) */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Developer Tools</h3>
            <p className="text-slate-600 mb-4 text-sm">Select how you want to auto-complete the quiz for testing.</p>

            <div className="flex flex-col gap-2">
              <button
                onClick={onConfirmDev}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
              >
                Generate Random Answers
              </button>
              <button
                onClick={() => onDevDenomFill("DENOM_032")}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition"
              >
                Test: Perfect Catholic (DENOM_032)
              </button>

              {/* Custom Denomination ID Input */}
              {!showCustomIdInput ? (
                <button
                  onClick={() => setShowCustomIdInput(true)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-md transition"
                >
                  Test: Custom Denomination ID
                </button>
              ) : (
                <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-md border border-slate-200">
                  <label className="text-xs font-medium text-slate-600">Enter Denomination ID:</label>
                  <input
                    type="text"
                    value={customDenomId}
                    onChange={(e) => setCustomDenomId(e.target.value)}
                    placeholder="e.g., DENOM_001"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCustomDenomSubmit();
                      if (e.key === "Escape") setShowCustomIdInput(false);
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCustomDenomSubmit}
                      className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => setShowCustomIdInput(false)}
                      className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={onCloseDevModal}
                className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restart Modal */}
      {showRestartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Restart Quiz?</h3>
            <p className="text-slate-600 mb-6">This will delete your saved progress and start from the beginning.</p>
            {/* SECRET CODE INPUT */}
            <div className="mb-4 border-t pt-4 border-slate-100">
              <input
                type="password"
                autoComplete="new-password"
                data-form-type="other"
                placeholder="Enter code..."
                value={devCode}
                onChange={(e) => onSetDevCode(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2 py-1 text-slate-400 focus:outline-none focus:border-slate-400"
              />

              {/* IF CORRECT CODE, SHOW DEV BUTTON */}
              {devCode === "mod" && (
                <button
                  onClick={onUnlockDevTools}
                  className="w-full mt-2 bg-purple-100 text-purple-700 text-xs font-bold py-1.5 rounded hover:bg-purple-200 transition"
                >
                  🚀 Unlock Dev Tools
                </button>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  onCloseRestartModal();
                  onSetDevCode(""); // Reset code on close
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmRestart}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}