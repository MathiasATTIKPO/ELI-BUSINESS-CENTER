const PDF_THEME = Object.freeze({
  navy: '#0F172A',
  navySoft: '#1E293B',
  emerald: '#10B981',
  emeraldDark: '#047857',
  emeraldSoft: '#ECFDF5',
  text: '#111827',
  muted: '#64748B',
  border: '#CBD5E1',
  soft: '#F8FAFC',
  white: '#FFFFFF',
});

const PDF_MARGIN = 50;

const parseAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const formatFcfa = (value) => {
  const rounded = Math.round(parseAmount(value));
  return `${rounded.toLocaleString('fr-FR')} FCFA`;
};

const formatDocumentDate = (value = new Date(), { withTime = false } = {}) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return withTime
    ? date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
};

const formatPaymentMethod = (value) => {
  const labels = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    mobile_money: 'Mobile Money',
    check: 'Chèque',
    transfer: 'Virement',
    other: 'Autre',
  };
  return labels[String(value || '').toLowerCase()] || String(value || 'Non précisé');
};

const drawDocumentHeader = (doc, {
  title,
  subtitle = '',
  number = '',
  date = new Date(),
  reference = '',
  operator = '',
} = {}) => {
  const pageWidth = doc.page.width;
  const rightX = pageWidth - PDF_MARGIN - 235;

  doc.rect(0, 0, pageWidth, 126).fill(PDF_THEME.navy);
  doc.rect(0, 122, pageWidth, 4).fill(PDF_THEME.emerald);

  doc.roundedRect(PDF_MARGIN, 28, 48, 48, 10).fill(PDF_THEME.emerald);
  doc.font('Helvetica-Bold').fontSize(16).fillColor(PDF_THEME.white)
    .text('EBC', PDF_MARGIN, 44, { width: 48, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(17).fillColor(PDF_THEME.white)
    .text('Eli Business Center', PDF_MARGIN + 62, 30);
  doc.font('Helvetica').fontSize(9).fillColor('#CBD5E1')
    .text('Lomé, Togo', PDF_MARGIN + 62, 54)
    .text('+228 90 17 84 75', PDF_MARGIN + 62, 69);

  const titleSize = String(title || '').length > 24 ? 15 : 18;
  doc.font('Helvetica-Bold').fontSize(titleSize).fillColor(PDF_THEME.white)
    .text(String(title || 'DOCUMENT'), rightX, 27, { width: 235, align: 'right' });

  if (subtitle) {
    doc.font('Helvetica').fontSize(8).fillColor('#A7F3D0')
      .text(String(subtitle), rightX, 51, { width: 235, align: 'right' });
  }

  const metadata = [];
  if (number) metadata.push(`N° ${number}`);
  metadata.push(`Date : ${formatDocumentDate(date)}`);
  if (reference) metadata.push(`Référence : ${reference}`);
  if (operator) metadata.push(String(operator));

  doc.font('Helvetica').fontSize(8.5).fillColor('#E2E8F0')
    .text(metadata.join('\n'), rightX, subtitle ? 68 : 58, {
      width: 235,
      align: 'right',
      lineGap: 2,
    });

  return 146;
};

const drawSectionTitle = (doc, title, y, { x = PDF_MARGIN, width } = {}) => {
  const resolvedWidth = width || doc.page.width - (2 * PDF_MARGIN);
  doc.roundedRect(x, y + 1, 4, 15, 2).fill(PDF_THEME.emerald);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF_THEME.navy)
    .text(String(title || ''), x + 12, y, { width: resolvedWidth - 12 });
  return y + 24;
};

const drawDocumentFooter = (doc, {
  message = 'Document généré électroniquement. Merci pour votre confiance.',
} = {}) => {
  const y = doc.page.height - 56;
  doc.moveTo(PDF_MARGIN, y).lineTo(doc.page.width - PDF_MARGIN, y)
    .strokeColor(PDF_THEME.border)
    .stroke();
  doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.muted)
    .text('Eli Business Center • Lomé, Togo • +228 90 17 84 75', PDF_MARGIN, y + 9, {
      width: doc.page.width - (2 * PDF_MARGIN),
      align: 'center',
    })
    .text(message, PDF_MARGIN, y + 21, {
      width: doc.page.width - (2 * PDF_MARGIN),
      align: 'center',
    });
};

const collectPdfBuffer = (doc, chunks) => new Promise((resolve, reject) => {
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);
});

module.exports = {
  PDF_MARGIN,
  PDF_THEME,
  collectPdfBuffer,
  drawDocumentFooter,
  drawDocumentHeader,
  drawSectionTitle,
  formatDocumentDate,
  formatFcfa,
  formatPaymentMethod,
};
