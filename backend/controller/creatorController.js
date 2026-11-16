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

const makePdf = (creators) => {
  const pages = [];
  const lines = creators.map((creator, index) => `${index + 1}. ${creator.fullName || ''} | ${creator.email || ''} | ${creator.mobile || ''}`);
  for (let i = 0; i < Math.max(lines.length, 1); i += 48) pages.push(lines.slice(i, i + 48));
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const pageIds = [];
  for (const [index, pageLines] of pages.entries()) {
    const pageId = objects.length + 1;
    const streamId = pageId + 1;
    pageIds.push(pageId);
    const text = ['BT /F1 14 Tf 40 800 Td (Creators) Tj', '/F1 9 Tf', ...pageLines.map((line) => `0 -15 Td (${pdfEscape(line.slice(0, 110))}) Tj`), `0 -20 Td (Page ${index + 1} of ${pages.length}) Tj ET`].join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`);
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
