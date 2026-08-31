import { ReadingTheme } from '../types';

export interface ThemeColors {
  name: ReadingTheme;
  label: string;
  // App Root
  rootBg: string;
  rootText: string;
  selection: string;
  
  // Header, Footers, and Bars
  headerBg: string;
  headerText: string;
  headerBorder: string;
  headerMuted: string;
  
  // Brand & Action Button
  btnPrimary: string;
  btnSecondary: string;
  btnSecondaryHover: string;
  
  // Sidebars & Drawers (Left Metadata & Right Extracts)
  sidebarBg: string;
  sidebarText: string;
  sidebarBorder: string;
  sidebarMuted: string;
  sidebarSubtleHeaderBg: string;
  
  // Input fields & Dropdowns
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  
  // Cards & Surfaces
  cardBg: string;
  cardBorder: string;
  cardHoverBorder: string;
  cardSelectedBorder: string;
  cardText: string;
  
  // Reader View Sheet
  readerCanvasBg: string;
  sheetBg: string;
  sheetBorder: string;
  sheetText: string;
  sheetHeading: string;
  sheetMuted: string;
  sheetHighlight: string;
  sheetHighlightBorder: string;
  sheetQuoteCalloutBg: string;
  sheetQuoteCalloutBorder: string;
  
  // Tag & Mini Badges
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  
  // Quote Extract in Card
  quoteBlockBg: string;
  quoteBlockBorder: string;
  quoteBlockText: string;
  
  // Code / BibTeX / In-Text preview boxes
  codeBoxBg: string;
  codeBoxBorder: string;
  codeBoxText: string;
  
  // Modals
  modalOverlay: string;
  modalBg: string;
  modalBorder: string;
  modalText: string;
  modalHeaderBg: string;
  modalFooterBg: string;
  
  // Floating Toolbars & Toasts
  floatingToolbarBg: string;
  floatingToolbarBorder: string;
  toastBg: string;
  toastBorder: string;
  toastText: string;
  
  // Progress Bars
  progressTrack: string;
  progressFill: string;
}

export const THEMES: Record<ReadingTheme, ThemeColors> = {
  sepia: {
    name: 'sepia',
    label: 'Sepia',
    rootBg: 'bg-[#F4F1EA]',
    rootText: 'text-[#2C2C2C]',
    selection: 'selection:bg-[#FBBF24] selection:text-[#2C2C2C]',
    
    headerBg: 'bg-[#EBE8E0]',
    headerText: 'text-[#2C2C2C]',
    headerBorder: 'border-[#D1D1D1]',
    headerMuted: 'text-[#8E9299]',
    
    btnPrimary: 'bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white',
    btnSecondary: 'bg-white hover:bg-[#F9F7F2] text-[#2C2C2C] border-[#D1D1D1]',
    btnSecondaryHover: 'hover:bg-[#E5E2D9]',
    
    sidebarBg: 'bg-[#EBE8E0]',
    sidebarText: 'text-[#2C2C2C]',
    sidebarBorder: 'border-[#D1D1D1]',
    sidebarMuted: 'text-[#6B7280]',
    sidebarSubtleHeaderBg: 'bg-[#E2DFD6]',
    
    inputBg: 'bg-white',
    inputBorder: 'border-[#D1D1D1] focus:border-[#4A5568]',
    inputText: 'text-[#2C2C2C]',
    inputPlaceholder: 'placeholder-[#8E9299]',
    
    cardBg: 'bg-white',
    cardBorder: 'border-[#D1D1D1]',
    cardHoverBorder: 'hover:border-[#8E9299]',
    cardSelectedBorder: 'border-[#2C2C2C] ring-1 ring-[#2C2C2C]',
    cardText: 'text-[#2C2C2C]',
    
    readerCanvasBg: 'bg-[#F4F1EA]',
    sheetBg: 'bg-white',
    sheetBorder: 'border-[#D1D1D1]',
    sheetText: 'text-[#2C2C2C]',
    sheetHeading: 'text-[#1A1A1A]',
    sheetMuted: 'text-[#8E9299]',
    sheetHighlight: 'bg-[#FEF3C7] text-[#1F2937]',
    sheetHighlightBorder: 'border-[#F59E0B]',
    sheetQuoteCalloutBg: 'bg-[#FAF9F5]',
    sheetQuoteCalloutBorder: 'border-[#EFECE6]',
    
    badgeBg: 'bg-[#EBE8E0]',
    badgeText: 'text-[#6B7280]',
    badgeBorder: 'border-[#D1D1D1]',
    
    quoteBlockBg: 'bg-[#FAF9F5]',
    quoteBlockBorder: 'border-[#EFECE6]',
    quoteBlockText: 'text-[#4A5568]',
    
    codeBoxBg: 'bg-[#2C2C2C]',
    codeBoxBorder: 'border-[#1F1F1F]',
    codeBoxText: 'text-[#F4F1EA]',
    
    modalOverlay: 'bg-black/50',
    modalBg: 'bg-[#F9F7F2]',
    modalBorder: 'border-[#D1D1D1]',
    modalText: 'text-[#2C2C2C]',
    modalHeaderBg: 'bg-[#EBE8E0]',
    modalFooterBg: 'bg-[#EBE8E0]',
    
    floatingToolbarBg: 'bg-[#2C2C2C]',
    floatingToolbarBorder: 'border-[#1F1F1F]',
    toastBg: 'bg-[#2C2C2C]',
    toastBorder: 'border-[#1F1F1F]',
    toastText: 'text-white',
    
    progressTrack: 'bg-[#D1D1D1]',
    progressFill: 'bg-[#4A5568]',
  },

  paper: {
    name: 'paper',
    label: 'White',
    rootBg: 'bg-[#F8F9FA]',
    rootText: 'text-[#1A1D20]',
    selection: 'selection:bg-[#FEF08A] selection:text-[#1A1D20]',
    
    headerBg: 'bg-[#FFFFFF]',
    headerText: 'text-[#1A1D20]',
    headerBorder: 'border-[#E2E8F0]',
    headerMuted: 'text-[#64748B]',
    
    btnPrimary: 'bg-[#0F172A] hover:bg-[#1E293B] text-white',
    btnSecondary: 'bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#1E293B] border-[#CBD5E1]',
    btnSecondaryHover: 'hover:bg-[#E2E8F0]',
    
    sidebarBg: 'bg-[#FFFFFF]',
    sidebarText: 'text-[#1A1D20]',
    sidebarBorder: 'border-[#E2E8F0]',
    sidebarMuted: 'text-[#64748B]',
    sidebarSubtleHeaderBg: 'bg-[#F1F5F9]',
    
    inputBg: 'bg-[#FFFFFF]',
    inputBorder: 'border-[#CBD5E1] focus:border-[#0F172A]',
    inputText: 'text-[#1A1D20]',
    inputPlaceholder: 'placeholder-[#94A3B8]',
    
    cardBg: 'bg-[#FFFFFF]',
    cardBorder: 'border-[#E2E8F0]',
    cardHoverBorder: 'hover:border-[#94A3B8]',
    cardSelectedBorder: 'border-[#0F172A] ring-1 ring-[#0F172A]',
    cardText: 'text-[#1A1D20]',
    
    readerCanvasBg: 'bg-[#F1F5F9]',
    sheetBg: 'bg-[#FFFFFF]',
    sheetBorder: 'border-[#E2E8F0]',
    sheetText: 'text-[#1E293B]',
    sheetHeading: 'text-[#0F172A]',
    sheetMuted: 'text-[#64748B]',
    sheetHighlight: 'bg-[#FEF08A] text-[#1E293B]',
    sheetHighlightBorder: 'border-[#EAB308]',
    sheetQuoteCalloutBg: 'bg-[#F8FAFC]',
    sheetQuoteCalloutBorder: 'border-[#E2E8F0]',
    
    badgeBg: 'bg-[#F1F5F9]',
    badgeText: 'text-[#475569]',
    badgeBorder: 'border-[#CBD5E1]',
    
    quoteBlockBg: 'bg-[#F8FAFC]',
    quoteBlockBorder: 'border-[#E2E8F0]',
    quoteBlockText: 'text-[#334155]',
    
    codeBoxBg: 'bg-[#0F172A]',
    codeBoxBorder: 'border-[#1E293B]',
    codeBoxText: 'text-[#F8FAFC]',
    
    modalOverlay: 'bg-black/50',
    modalBg: 'bg-[#FFFFFF]',
    modalBorder: 'border-[#CBD5E1]',
    modalText: 'text-[#1E293B]',
    modalHeaderBg: 'bg-[#F8FAFC]',
    modalFooterBg: 'bg-[#F8FAFC]',
    
    floatingToolbarBg: 'bg-[#0F172A]',
    floatingToolbarBorder: 'border-[#334155]',
    toastBg: 'bg-[#0F172A]',
    toastBorder: 'border-[#334155]',
    toastText: 'text-white',
    
    progressTrack: 'bg-[#E2E8F0]',
    progressFill: 'bg-[#0F172A]',
  },

  slate: {
    name: 'slate',
    label: 'Gray',
    rootBg: 'bg-[#1E232A]',
    rootText: 'text-[#E2E8F0]',
    selection: 'selection:bg-[#3B82F6] selection:text-white',
    
    headerBg: 'bg-[#181C22]',
    headerText: 'text-[#E2E8F0]',
    headerBorder: 'border-[#2E3642]',
    headerMuted: 'text-[#94A3B8]',
    
    btnPrimary: 'bg-[#3B82F6] hover:bg-[#2563EB] text-white',
    btnSecondary: 'bg-[#252B35] hover:bg-[#2F3744] text-[#E2E8F0] border-[#3E4856]',
    btnSecondaryHover: 'hover:bg-[#2E3642]',
    
    sidebarBg: 'bg-[#181C22]',
    sidebarText: 'text-[#E2E8F0]',
    sidebarBorder: 'border-[#2E3642]',
    sidebarMuted: 'text-[#94A3B8]',
    sidebarSubtleHeaderBg: 'bg-[#21262F]',
    
    inputBg: 'bg-[#12151A]',
    inputBorder: 'border-[#3E4856] focus:border-[#3B82F6]',
    inputText: 'text-[#E2E8F0]',
    inputPlaceholder: 'placeholder-[#64748B]',
    
    cardBg: 'bg-[#252B35]',
    cardBorder: 'border-[#363F4D]',
    cardHoverBorder: 'hover:border-[#60A5FA]',
    cardSelectedBorder: 'border-[#60A5FA] ring-1 ring-[#60A5FA]',
    cardText: 'text-[#E2E8F0]',
    
    readerCanvasBg: 'bg-[#14171D]',
    sheetBg: 'bg-[#1E232A]',
    sheetBorder: 'border-[#2E3642]',
    sheetText: 'text-[#E2E8F0]', // Fully visible light gray text on dark gray canvas!
    sheetHeading: 'text-[#F8FAFC]',
    sheetMuted: 'text-[#94A3B8]',
    sheetHighlight: 'bg-[#3B82F6]/30 text-[#BFDBFE]',
    sheetHighlightBorder: 'border-[#60A5FA]',
    sheetQuoteCalloutBg: 'bg-[#181C22]',
    sheetQuoteCalloutBorder: 'border-[#2E3642]',
    
    badgeBg: 'bg-[#2E3642]',
    badgeText: 'text-[#CBD5E1]',
    badgeBorder: 'border-[#3E4856]',
    
    quoteBlockBg: 'bg-[#14171D]',
    quoteBlockBorder: 'border-[#2E3642]',
    quoteBlockText: 'text-[#CBD5E1]',
    
    codeBoxBg: 'bg-[#0D1014]',
    codeBoxBorder: 'border-[#2E3642]',
    codeBoxText: 'text-[#93C5FD]',
    
    modalOverlay: 'bg-black/70',
    modalBg: 'bg-[#1E232A]',
    modalBorder: 'border-[#363F4D]',
    modalText: 'text-[#E2E8F0]',
    modalHeaderBg: 'bg-[#181C22]',
    modalFooterBg: 'bg-[#181C22]',
    
    floatingToolbarBg: 'bg-[#181C22]',
    floatingToolbarBorder: 'border-[#3E4856]',
    toastBg: 'bg-[#252B35]',
    toastBorder: 'border-[#3E4856]',
    toastText: 'text-[#F8FAFC]',
    
    progressTrack: 'bg-[#2E3642]',
    progressFill: 'bg-[#3B82F6]',
  },

  onyx: {
    name: 'onyx',
    label: 'Onyx',
    rootBg: 'bg-[#090A0C]',
    rootText: 'text-[#F1F3F5]',
    selection: 'selection:bg-[#F59E0B] selection:text-[#090A0C]',
    
    headerBg: 'bg-[#101216]',
    headerText: 'text-[#F1F3F5]',
    headerBorder: 'border-[#1F232B]',
    headerMuted: 'text-[#8C93A0]',
    
    btnPrimary: 'bg-[#F59E0B] hover:bg-[#D97706] text-[#090A0C] font-bold',
    btnSecondary: 'bg-[#181B22] hover:bg-[#222630] text-[#F1F3F5] border-[#292E38]',
    btnSecondaryHover: 'hover:bg-[#1E222A]',
    
    sidebarBg: 'bg-[#101216]',
    sidebarText: 'text-[#F1F3F5]',
    sidebarBorder: 'border-[#1F232B]',
    sidebarMuted: 'text-[#8C93A0]',
    sidebarSubtleHeaderBg: 'bg-[#16181E]',
    
    inputBg: 'bg-[#090A0C]',
    inputBorder: 'border-[#292E38] focus:border-[#F59E0B]',
    inputText: 'text-[#F1F3F5]',
    inputPlaceholder: 'placeholder-[#5A606D]',
    
    cardBg: 'bg-[#14161C]',
    cardBorder: 'border-[#22262E]',
    cardHoverBorder: 'hover:border-[#F59E0B]',
    cardSelectedBorder: 'border-[#F59E0B] ring-1 ring-[#F59E0B]',
    cardText: 'text-[#F1F3F5]',
    
    readerCanvasBg: 'bg-[#060708]',
    sheetBg: 'bg-[#101216]',
    sheetBorder: 'border-[#1F232B]',
    sheetText: 'text-[#F1F3F5]', // Fully visible crisp text on deep midnight background!
    sheetHeading: 'text-[#FFFFFF]',
    sheetMuted: 'text-[#8C93A0]',
    sheetHighlight: 'bg-[#F59E0B]/25 text-[#FDE68A]',
    sheetHighlightBorder: 'border-[#F59E0B]',
    sheetQuoteCalloutBg: 'bg-[#0C0D10]',
    sheetQuoteCalloutBorder: 'border-[#1F232B]',
    
    badgeBg: 'bg-[#1F232B]',
    badgeText: 'text-[#D0D4DC]',
    badgeBorder: 'border-[#292E38]',
    
    quoteBlockBg: 'bg-[#090A0C]',
    quoteBlockBorder: 'border-[#1F232B]',
    quoteBlockText: 'text-[#D0D4DC]',
    
    codeBoxBg: 'bg-[#050506]',
    codeBoxBorder: 'border-[#1F232B]',
    codeBoxText: 'text-[#FCD34D]',
    
    modalOverlay: 'bg-black/80',
    modalBg: 'bg-[#101216]',
    modalBorder: 'border-[#22262E]',
    modalText: 'text-[#F1F3F5]',
    modalHeaderBg: 'bg-[#0C0D10]',
    modalFooterBg: 'bg-[#0C0D10]',
    
    floatingToolbarBg: 'bg-[#14161C]',
    floatingToolbarBorder: 'border-[#292E38]',
    toastBg: 'bg-[#181B22]',
    toastBorder: 'border-[#292E38]',
    toastText: 'text-[#FFFFFF]',
    
    progressTrack: 'bg-[#1F232B]',
    progressFill: 'bg-[#F59E0B]',
  },
};
