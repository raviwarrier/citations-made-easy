import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { ReadingTheme } from '../types';
import { THEMES } from '../utils/themeStyles';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: ReadingTheme;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  theme = 'sepia',
}) => {
  const currentTheme = THEMES[theme] || THEMES.sepia;

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Reading & Navigation',
      shortcuts: [
        { keys: ['J', '←'], desc: 'Previous Page or Section' },
        { keys: ['K', '→'], desc: 'Next Page or Section' },
        { keys: ['F'], desc: 'Toggle Distraction-Free Focus Mode' },
        { keys: ['T'], desc: 'Cycle Reading Themes (Paper / Sepia / Slate / Onyx)' },
        { keys: ['O'], desc: 'Open / Upload Document Modal' },
      ],
    },
    {
      title: 'Citation & Extraction',
      shortcuts: [
        { keys: ['E'], desc: 'Extract selected text into Citation Manager' },
        { keys: ['C'], desc: 'Quick-copy formatted citation of selected text' },
        { keys: ['S'], desc: 'Capture surrounding context & detect secondary/third-party authors' },
        { keys: ['B'], desc: 'Toggle Citations & Reference Manager Drawer' },
        { keys: ['?'], desc: 'Show this Keyboard Shortcuts cheat sheet' },
        { keys: ['Esc'], desc: 'Close open dialogs or clear active text selection' },
      ],
    },
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none ${currentTheme.modalOverlay} backdrop-blur-xs`}>
      <div className={`w-full max-w-lg rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans border ${currentTheme.modalBg} ${currentTheme.modalBorder} ${currentTheme.modalText}`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${currentTheme.modalHeaderBg} ${currentTheme.modalBorder}`}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded flex items-center justify-center ${currentTheme.btnPrimary}`}>
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.modalText}`}>
                Keyboard Shortcuts
              </h3>
              <p className={`text-[11px] ${currentTheme.sidebarMuted}`}>
                Accelerate academic reading, note-taking, and citation extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded transition font-mono text-xs cursor-pointer ${currentTheme.sidebarMuted} hover:${currentTheme.modalText}`}
          >
            [ESC]
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {shortcutGroups.map((grp) => (
            <div key={grp.title} className="space-y-2">
              <h4 className={`text-[10px] font-bold uppercase tracking-widest ${currentTheme.sidebarMuted}`}>
                {grp.title}
              </h4>
              <div className="space-y-1.5">
                {grp.shortcuts.map((sc) => (
                  <div
                    key={sc.desc}
                    className={`flex items-center justify-between p-2 rounded border text-xs ${currentTheme.cardBg} ${currentTheme.cardBorder}`}
                  >
                    <span className={currentTheme.cardText}>{sc.desc}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k) => (
                        <kbd
                          key={k}
                          className={`px-1.5 py-0.5 rounded border font-mono text-[10px] font-bold min-w-[22px] text-center shadow-2xs ${currentTheme.badgeBg} ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t text-right ${currentTheme.modalFooterBg} ${currentTheme.modalBorder}`}>
          <button
            onClick={onClose}
            className={`px-4 py-1 rounded text-xs font-bold transition shadow-2xs cursor-pointer ${currentTheme.btnPrimary}`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
