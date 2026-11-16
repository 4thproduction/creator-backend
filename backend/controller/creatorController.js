const { creatorFilters } = require('../utils/creatorFilters');
const Creator = require('../Models/Creator');

const FILE_FIELDS = ['file_insights', 'file_demo', 'file_reach'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const FIELD_LABELS = { fullName: 'Full name', email: 'Email', mobile: 'Mobile', city: 'City', category: 'Category', consent1: 'Creator database consent', consent2: 'Campaign contact consent', consent3: 'Accuracy confirmation' };
const fileLabel = (field) => ({ file_insights: 'Instagram insights upload', file_demo: 'Audience demographics upload', file_reach: 'Last 30 days reach upload' })[field] || field;

const normalizeFile = (file, field) => {
  if (!file) return undefined;
  if (typeof file.name !== 'string' || !file.name || typeof file.type !== 'string' || typeof file.data !== 'string' || !file.data) {
    throw new Error(`${fileLabel(field)} is incomplete`);
  }
  if (!ALLOWED_FILE_TYPES.has(file.type)) throw new Error(`${fileLabel(field)} must be a JPEG, PNG, WebP, or PDF file`);
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.data)) {
    throw new Error(`${fileLabel(field)} contains invalid file data`);
  }
  const data = Buffer.from(file.data, 'base64');
  if (!data.length || data.length > MAX_FILE_BYTES) throw new Error(`${fileLabel(field)} must be between 1 byte and 5 MB`);
  return { name: file.name, type: file.type, data };
};

const findDuplicate = async ({ email, mobile }, excludeId) => {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedMobile = mobile === undefined || mobile === null ? '' : String(mobile).trim();
  const conditions = [];
  if (normalizedEmail) conditions.push({ email: normalizedEmail });
  if (normalizedMobile) conditions.push({ mobile: normalizedMobile });
  if (!conditions.length) return null;
  const query = { $or: conditions };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await Creator.findOne(query).select('email mobile').lean();
  if (!existing) return null;
  return existing.email === normalizedEmail
    ? 'A creator with this email already exists'
    : 'A creator with this mobile number already exists';
};

const createCreator = async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;

    if (![payload.igLink, payload.ytLink, payload.fbLink, payload.liLink].some(Boolean)) {
      return res.status(422).json({ message: 'At least one social media profile link is required' });
    }
    if (![payload.consent1, payload.consent2, payload.consent3].every((value) => value === true)) {
      return res.status(422).json({ message: 'All consent fields must be accepted' });
    }
    for (const field of FILE_FIELDS) payload[field] = normalizeFile(payload[field], field);
    const duplicate = await findDuplicate(payload);
    if (duplicate) return res.status(409).json({ message: duplicate });

    const creator = await Creator.create(payload);
    return res.status(201).json({ id: creator._id, message: 'Application received' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((item) => {
        const label = FIELD_LABELS[item.path] || item.path;
        if (item.kind === 'required') return `${label} is required`;
        if (item.kind === 'enum') return `${label} has an invalid value`;
        return item.message.replace(item.path, label);
      });
      return res.status(422).json({ message: messages.join('. ') });
    }
    if (/upload|file data|file type|5 MB/.test(error.message)) {
      return res.status(422).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Could not save creator application' });
  }
};

const updateCreator = async (req, res) => {
  try {
    const creator = await Creator.findById(req.params.id).select('+file_insights.data +file_demo.data +file_reach.data');
    if (!creator) return res.status(404).json({ message: 'Creator not found' });

    const payload = { ...req.body };
    for (const field of ['_id', 'createdAt', 'updatedAt', '__v']) delete payload[field];
    if (![payload.igLink, payload.ytLink, payload.fbLink, payload.liLink].some(Boolean)) {
      return res.status(422).json({ message: 'At least one social media profile link is required' });
    }
    if (![payload.consent1, payload.consent2, payload.consent3].every((value) => value === true)) {
      return res.status(422).json({ message: 'All consent fields must be accepted' });
    }
    const duplicate = await findDuplicate(payload, creator._id);
    if (duplicate) return res.status(409).json({ message: duplicate });
    for (const field of FILE_FIELDS) {
      if (payload[field]) payload[field] = normalizeFile(payload[field], field);
      else delete payload[field];
    }
    creator.set(payload);
    await creator.save();
    return res.json({ id: creator._id, message: 'Creator updated' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((item) => {
        const label = FIELD_LABELS[item.path] || item.path;
        if (item.kind === 'required') return `${label} is required`;
        if (item.kind === 'enum') return `${label} has an invalid value`;
        return item.message.replace(item.path, label);
      });
      return res.status(422).json({ message: messages.join('. ') });
    }
    if (/upload|file data|file type|5 MB/.test(error.message)) return res.status(422).json({ message: error.message });
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid creator ID' });
    return res.status(500).json({ message: 'Could not update creator' });
  }
};

const downloadCreatorFile = async (req, res) => {
  try {
    if (!FILE_FIELDS.includes(req.params.field)) return res.status(404).json({ message: 'File not found' });
    const creator = await Creator.findById(req.params.id).select(`+${req.params.field}.data`).lean();
    const file = creator?.[req.params.field];
    if (!file?.data) return res.status(404).json({ message: 'File not found' });
    const safeName = file.name.replace(/[\r\n"]/g, '_');
    res.set({ 'Content-Type': file.type, 'Content-Disposition': `attachment; filename="${safeName}"` });
    return res.send(file.data);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid creator ID' });
  }
};

const fields = [
  ['Full Name', (c) => c.fullName],
  ['Email', (c) => c.email],
  ['Mobile', (c) => c.mobile],
  ['City', (c) => c.city],
  ['Category', (c) => (c.category || []).join(', ')],
  ['Submitted (IST)', (c) => c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: '2-digit' }) : ''],
];

const xmlEscape = (value) => String(value ?? '').replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]);
const pdfEscape = (value) => String(value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '?').replace(/[\\()]/g, '\\$&');

const makeExcel = (creators) => {
  const rows = [fields.map(([name]) => name), ...creators.map((creator) => fields.map(([, value]) => value(creator)))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Creators"><Table>${rows.map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${xmlEscape(cell)}</Data></Cell>`).join('')}</Row>`).join('')}</Table></Worksheet></Workbook>`;
};

// PDF columns mirror the Creators table in the admin UI (minus the Actions column).
const PLATFORMS = [['Instagram', 'igLink', 'igFollowers'], ['YouTube', 'ytLink', 'ytSubs'], ['Facebook', 'fbLink', 'fbFollowers'], ['LinkedIn', 'liLink', 'liFollowers']];
const parseMetric = (value) => {
  const match = String(value ?? '').replace(/[,\s%]/g, '').match(/^(\d+(?:\.\d+)?)([KMLB])?$/i);
  return match ? Number(match[1]) * ({ K: 1e3, L: 1e5, M: 1e6, B: 1e9 }[match[2]?.toUpperCase()] || 1) : null;
};
const compactNumber = (value) => (value === null ? '-' : new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value));
const activePlatforms = (c) => PLATFORMS.filter(([, link]) => String(c[link] ?? '').trim());
const totalFollowers = (c) => {
  const values = activePlatforms(c).map(([, , field]) => parseMetric(c[field])).filter((value) => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
};
const titleCase = (value = '') => String(value).trim().replace(/\s+/g, ' ').toLocaleLowerCase().replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase());

const PDF_COLUMNS = [
  { title: 'S.No.', width: 34, value: (c, i) => String(i + 1) },
  { title: 'Creator', width: 95, value: (c) => titleCase(c.fullName) || '-' },
  { title: 'Contact', width: 72, value: (c) => c.mobile || '-' },
  { title: 'Email', width: 125, value: (c) => c.email || '-' },
  { title: 'Category', width: 94, value: (c) => (Array.isArray(c.category) ? c.category.join(', ') : c.category) || '-' },
  { title: 'City', width: 62, value: (c) => c.city || '-' },
  { title: 'Platforms', width: 100, value: (c) => activePlatforms(c).map(([name]) => name).join(', ') || '-' },
  { title: 'Followers', width: 58, value: (c) => compactNumber(totalFollowers(c)) },
  { title: 'Engagement', width: 62, value: (c) => { const v = parseMetric(c.engagement); return v === null ? '-' : `${v.toFixed(1)}%`; } },
  { title: 'Avg. reel views', width: 78, value: (c) => compactNumber(parseMetric(c.avgReel)) },
];
const PDF_PAGE = { width: 842, height: 595, margin: 30 }; // A4 landscape
const PDF_FONT_SIZE = 8;
const PDF_LINE_HEIGHT = 10;
const PDF_CELL_PADDING = 5;

// Wrap text to fit a column (Helvetica averages <= 0.55em per glyph), breaking on spaces/commas/@ where possible.
const wrapText = (value, width, fontSize = PDF_FONT_SIZE) => {
  const maxChars = Math.max(Math.floor((width - PDF_CELL_PADDING * 2) / (fontSize * 0.55)), 1);
  const lines = [];
  let rest = String(value ?? '');
  while (rest.length > maxChars) {
    const slice = rest.slice(0, maxChars + 1);
    const breakAt = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf(','), slice.lastIndexOf('@') - 1);
    const cut = breakAt > 0 ? breakAt + 1 : maxChars;
    lines.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  lines.push(rest);
  return lines;
};

const makePdf = (creators) => {
  const { width: pageWidth, height: pageHeight, margin } = PDF_PAGE;
  const tableWidth = PDF_COLUMNS.reduce((sum, column) => sum + column.width, 0);
  const tableTop = pageHeight - margin - 34;
  const tableFloor = margin + 12;

  const toRow = (cells) => {
    const wrapped = cells.map((cell, index) => wrapText(cell, PDF_COLUMNS[index].width));
    return { wrapped, height: Math.max(...wrapped.map((lines) => lines.length)) * PDF_LINE_HEIGHT + 8 };
  };
  const header = toRow(PDF_COLUMNS.map((column) => column.title));
  const rows = creators.map((creator, index) => toRow(PDF_COLUMNS.map((column) => column.value(creator, index))));

  const pages = [[]];
  let used = header.height;
  rows.forEach((row) => {
    if (used + row.height > tableTop - tableFloor && pages[pages.length - 1].length) { pages.push([]); used = header.height; }
    pages[pages.length - 1].push(row);
    used += row.height;
  });

  const textAt = (font, size, x, y, text) => `BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfEscape(text)}) Tj ET`;
  const drawRow = (top, row, font, fill) => {
    const ops = [];
    if (fill) ops.push(`${fill} rg ${margin} ${top - row.height} ${tableWidth} ${row.height} re f`);
    ops.push('0.11 0.1 0.09 rg');
    let x = margin;
    PDF_COLUMNS.forEach((column, index) => {
      row.wrapped[index].forEach((line, lineIndex) => ops.push(textAt(font, PDF_FONT_SIZE, x + PDF_CELL_PADDING, top - 11 - lineIndex * PDF_LINE_HEIGHT, line)));
      x += column.width;
    });
    ops.push('0.8 G 0.5 w', `${margin} ${top - row.height} m ${margin + tableWidth} ${top - row.height} l S`);
    return ops;
  };

  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'];
  const pageIds = [];
  const generated = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  for (const [pageIndex, pageRows] of pages.entries()) {
    const ops = [
      textAt('F2', 16, margin, pageHeight - margin - 12, 'Creators'),
      '0.4 g',
      textAt('F1', 9, margin, pageHeight - margin - 26, `${creators.length} record${creators.length === 1 ? '' : 's'} | Generated ${generated} IST`),
      '0.8 G 0.5 w', `${margin} ${tableTop} m ${margin + tableWidth} ${tableTop} l S`,
    ];
    let top = tableTop;
    ops.push(...drawRow(top, header, 'F2', '0.91 0.89 0.85'));
    top -= header.height;
    pageRows.forEach((row, rowIndex) => {
      ops.push(...drawRow(top, row, 'F1', rowIndex % 2 ? '0.97 0.96 0.94' : null));
      top -= row.height;
    });
    if (!pageRows.length) {
      const empty = { wrapped: [['No creators match the selected filters.']], height: 22 };
      ops.push('0.4 g', textAt('F1', PDF_FONT_SIZE, margin + PDF_CELL_PADDING, top - 14, empty.wrapped[0][0]), '0.8 G 0.5 w', `${margin} ${top - empty.height} m ${margin + tableWidth} ${top - empty.height} l S`);
      ops.push(`${margin} ${tableTop} m ${margin} ${top - empty.height} l S`, `${margin + tableWidth} ${tableTop} m ${margin + tableWidth} ${top - empty.height} l S`);
    } else {
      let x = margin;
      [x, ...PDF_COLUMNS.map((column) => (x += column.width))].forEach((edge) => ops.push(`${edge} ${tableTop} m ${edge} ${top} l S`));
    }
    ops.push('0.4 g', textAt('F1', 8, pageWidth - margin - 55, margin - 10, `Page ${pageIndex + 1} of ${pages.length}`));

    const content = ops.join('\n');
    const pageId = objects.length + 1;
    pageIds.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageId + 1} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
  }
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
};

const exportCreators = async (req, res) => {
  try {
    let filter;
    try { filter = creatorFilters(req.query); }
    catch (error) { return res.status(400).json({ message: error.message }); }
    const creators = await Creator.find(filter).select('-file_insights.data -file_demo.data -file_reach.data')
      .sort({ createdAt: -1, _id: -1 }).lean();
    if (req.params.format === 'excel') {
      res.set({ 'Content-Type': 'application/vnd.ms-excel; charset=utf-8', 'Content-Disposition': 'attachment; filename="creators.xls"' });
      return res.send(makeExcel(creators));
    }
    if (req.params.format === 'pdf') {
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="creators.pdf"' });
      return res.send(makePdf(creators));
    }
    return res.status(400).json({ message: 'Unsupported export format' });
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

module.exports = { createCreator, updateCreator, downloadCreatorFile, exportCreators };
