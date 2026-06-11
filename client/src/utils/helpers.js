import dayjs from 'dayjs';

export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '-';
  return dayjs(date).format(format);
}

export function formatDateTime(date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
}

export function formatRelativeTime(date) {
  if (!date) return '-';
  const diff = dayjs().diff(dayjs(date), 'day');
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff < 7) return `${diff}天前`;
  if (diff < 30) return `${Math.floor(diff / 7)}周前`;
  if (diff < 365) return `${Math.floor(diff / 30)}个月前`;
  return `${Math.floor(diff / 365)}年前`;
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatCurrency(amount, currency = '¥') {
  if (amount === null || amount === undefined) return '-';
  const num = parseFloat(amount);
  if (isNaN(num)) return '-';
  return currency + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getFileIcon(fileExt) {
  const ext = (fileExt || '').toLowerCase();
  const iconMap = {
    pdf: 'FilePdfOutlined',
    doc: 'FileWordOutlined',
    docx: 'FileWordOutlined',
    xls: 'FileExcelOutlined',
    xlsx: 'FileExcelOutlined',
    ppt: 'FilePptOutlined',
    pptx: 'FilePptOutlined',
    jpg: 'FileImageOutlined',
    jpeg: 'FileImageOutlined',
    png: 'FileImageOutlined',
    gif: 'FileImageOutlined',
    bmp: 'FileImageOutlined',
    tif: 'FileImageOutlined',
    tiff: 'FileImageOutlined',
    zip: 'FileZipOutlined',
    rar: 'FileZipOutlined',
    '7z': 'FileZipOutlined',
    txt: 'FileTextOutlined'
  };
  return iconMap[ext] || 'FileOutlined';
}

export function canPreviewInline(fileExt) {
  const ext = (fileExt || '').toLowerCase();
  return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'].includes(ext);
}

export function daysUntil(date) {
  if (!date) return null;
  const target = dayjs(date).startOf('day');
  const today = dayjs().startOf('day');
  return target.diff(today, 'day');
}

export function generateCaseNumber() {
  const now = dayjs();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `AJ${now.format('YYYYMM')}${random}`;
}
