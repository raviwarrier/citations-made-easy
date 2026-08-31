import { jsPDF } from 'jspdf';
import { ResearchDocument } from '../types';

/**
 * Generate a real, multi-page authentic scholarly PDF ArrayBuffer for the sample quantum paper
 */
export function generateSamplePdfBuffer(doc: ResearchDocument): ArrayBuffer {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 54;
  const contentWidth = pageWidth - (margin * 2);

  doc.pages.forEach((page, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    // Header rule & Journal info
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);
    pdf.text(doc.journalOrBookTitle ? doc.journalOrBookTitle.toUpperCase() : 'PHYSICAL REVIEW LETTERS', margin, 40);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${doc.publicationDate || 'March 2024'} • Vol. ${doc.volume || '132'}, Iss. ${doc.issue || '4'}`, pageWidth - margin, 40, { align: 'right' });

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.75);
    pdf.line(margin, 46, pageWidth - margin, 46);

    let y = 70;

    // First page title & author block
    if (index === 0) {
      pdf.setFont('times', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(20, 20, 20);
      const titleLines = pdf.splitTextToSize(doc.title.toUpperCase(), contentWidth);
      pdf.text(titleLines, margin, y);
      y += (titleLines.length * 18) + 12;

      pdf.setFont('times', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(50, 50, 50);
      pdf.text(doc.authors.join(', '), margin, y);
      y += 15;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(doc.instituteOrOrg || 'Oxford Quantum Institute & MIT Center for Theoretical Physics', margin, y);
      y += 18;

      if (doc.doi) {
        pdf.setFont('courier', 'normal');
        pdf.setFontSize(8);
        pdf.text(`DOI: ${doc.doi}`, margin, y);
        y += 20;
      }

      // Abstract box
      pdf.setFillColor(248, 248, 248);
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(margin, y, contentWidth, 65, 3, 3, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(30, 30, 30);
      pdf.text('ABSTRACT', margin + 12, y + 16);

      pdf.setFont('times', 'normal');
      pdf.setFontSize(9.5);
      const abstractLines = pdf.splitTextToSize(
        doc.abstract || 'We present a rigorous topological framework for establishing high-fidelity non-local entanglement across distributed quantum nodes subject to stochastic Pauli noise channels.',
        contentWidth - 24
      );
      pdf.text(abstractLines, margin + 12, y + 30);
      y += 80;
    }

    // Chapter / Section Heading
    if (page.chapterTitle) {
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(30, 30, 30);
      pdf.text(page.chapterTitle, margin, y);
      y += 18;
    }

    // Body Text in 2-Column Academic Layout or clean structured lines
    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(40, 40, 40);

    const paragraphs = page.text.split('\n\n');
    paragraphs.forEach((para) => {
      if (y > pageHeight - 60) return;
      const cleanPara = para.replace(/\n/g, ' ').trim();
      if (!cleanPara) return;

      const lines = pdf.splitTextToSize(cleanPara, contentWidth);
      if (y + (lines.length * 13) < pageHeight - 50) {
        pdf.text(lines, margin, y);
        y += (lines.length * 13) + 8;
      }
    });

    // Page footer
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Page ${page.pageNumber}`, pageWidth / 2, pageHeight - 22, { align: 'center' });
  });

  return pdf.output('arraybuffer');
}
