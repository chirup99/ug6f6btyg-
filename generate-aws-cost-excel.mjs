import ExcelJS from 'exceljs';

const wb = new ExcelJS.Workbook();
wb.creator = 'Perala Platform';
wb.lastModifiedBy = 'Perala Platform';
wb.created = new Date();
wb.modified = new Date();
wb.properties.date1904 = false;

// ─── Style helpers ────────────────────────────────────────────────────────────
const COLORS = {
  primaryBg:    '1A237E',
  accentBg:     '0D47A1',
  headerBg:     '1565C0',
  subHeaderBg:  '1976D2',
  sectionBg:    'E3F2FD',
  totalBg:      'FFF9C4',
  grandTotalBg: 'C8E6C9',
  redBg:        'FFEBEE',
  orangeBg:     'FFF3E0',
  greenBg:      'E8F5E9',
  whiteBg:      'FFFFFF',
  rowEven:      'F5F9FF',
  rowOdd:       'FFFFFF',
  warningBg:    'FFF3CD',
  savingBg:     'D4EDDA',
  primaryFont:  '1A237E',
  darkFont:     '212121',
  redFont:      'B71C1C',
  greenFont:    '1B5E20',
  orangeFont:   'E65100',
  whiteFont:    'FFFFFF',
  grayFont:     '757575',
};

function hFont(wb, size, bold, color) {
  return { name: 'Calibri', size: size || 10, bold: bold || false, color: { argb: 'FF' + (color || COLORS.darkFont) } };
}

function hFill(color) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + color } };
}

function hBorder(style = 'thin') {
  const s = { style, color: { argb: 'FFB0BEC5' } };
  return { top: s, left: s, bottom: s, right: s };
}

function hAlign(h = 'left', v = 'middle', wrap = false) {
  return { horizontal: h, vertical: v, wrapText: wrap };
}

function setColWidths(ws, widths) {
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
}

function applyHeader(row, fills, fonts, aligns, borders) {
  row.eachCell((cell, c) => {
    if (fills && fills[c - 1]) cell.fill = hFill(fills[c - 1]);
    if (fonts && fonts[c - 1]) cell.font = fonts[c - 1];
    if (aligns && aligns[c - 1]) cell.alignment = aligns[c - 1];
    if (borders) cell.border = hBorder();
  });
  row.height = 20;
}

function titleRow(ws, text, cols) {
  ws.mergeCells(ws.rowCount + 1, 1, ws.rowCount, cols);
  const r = ws.lastRow;
  r.getCell(1).value = text;
  r.getCell(1).fill = hFill(COLORS.primaryBg);
  r.getCell(1).font = hFont(wb, 13, true, COLORS.whiteFont);
  r.getCell(1).alignment = hAlign('center', 'middle');
  r.getCell(1).border = hBorder('medium');
  r.height = 26;
}

function sectionRow(ws, text, cols, color = COLORS.accentBg) {
  const r = ws.addRow([text]);
  ws.mergeCells(r.number, 1, r.number, cols);
  r.getCell(1).fill = hFill(color);
  r.getCell(1).font = hFont(wb, 11, true, COLORS.whiteFont);
  r.getCell(1).alignment = hAlign('left', 'middle');
  r.getCell(1).border = hBorder();
  r.height = 22;
}

function noteRow(ws, text, cols, bgColor = COLORS.sectionBg, fontColor = COLORS.primaryFont) {
  const r = ws.addRow([text]);
  ws.mergeCells(r.number, 1, r.number, cols);
  r.getCell(1).fill = hFill(bgColor);
  r.getCell(1).font = hFont(wb, 9, false, fontColor);
  r.getCell(1).alignment = hAlign('left', 'middle', true);
  r.getCell(1).border = hBorder();
  r.height = 16;
}

function blankRow(ws) {
  const r = ws.addRow(['']);
  r.height = 8;
}

function dataRow(ws, values, isEven, bold = false, bgOverride = null) {
  const r = ws.addRow(values);
  const bg = bgOverride || (isEven ? COLORS.rowEven : COLORS.rowOdd);
  r.eachCell((cell, c) => {
    cell.fill = hFill(bg);
    cell.font = hFont(wb, 9, bold, bold ? COLORS.primaryFont : COLORS.darkFont);
    cell.alignment = hAlign(c === 1 ? 'left' : 'center', 'middle');
    cell.border = hBorder();
  });
  r.height = 17;
  return r;
}

function totalRow(ws, values, bg = COLORS.grandTotalBg) {
  const r = ws.addRow(values);
  r.eachCell((cell) => {
    cell.fill = hFill(bg);
    cell.font = hFont(wb, 10, true, COLORS.primaryFont);
    cell.alignment = hAlign('center', 'middle');
    cell.border = hBorder('medium');
  });
  r.height = 20;
  return r;
}

function headerRow(ws, values, bg = COLORS.headerBg) {
  const r = ws.addRow(values);
  r.eachCell((cell) => {
    cell.fill = hFill(bg);
    cell.font = hFont(wb, 9, true, COLORS.whiteFont);
    cell.alignment = hAlign('center', 'middle', true);
    cell.border = hBorder();
  });
  r.height = 20;
  return r;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHEET 1 — COVER / SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
{
  const ws = wb.addWorksheet('📊 Summary', { tabColor: { argb: 'FF1A237E' } });
  setColWidths(ws, [28, 18, 18, 18, 18, 18, 18]);

  // Title
  ws.addRow(['']);
  ws.mergeCells('A1:G2');
  ws.getCell('A1').value = 'AWS COST ANALYSIS REPORT — PERALA TRADING PLATFORM';
  ws.getCell('A1').fill = hFill(COLORS.primaryBg);
  ws.getCell('A1').font = hFont(wb, 16, true, COLORS.whiteFont);
  ws.getCell('A1').alignment = hAlign('center', 'middle');
  ws.getRow(1).height = 36;
  ws.getRow(2).height = 36;

  ws.addRow(['']);
  ws.mergeCells('A3:G3');
  ws.getCell('A3').value = `Region: ap-south-1 (Mumbai)  |  Exchange Rate: $1 = ₹83.5  |  Analysis Period: 30 Days  |  Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  ws.getCell('A3').fill = hFill(COLORS.subHeaderBg);
  ws.getCell('A3').font = hFont(wb, 9, false, COLORS.whiteFont);
  ws.getCell('A3').alignment = hAlign('center', 'middle');
  ws.getRow(3).height = 18;

  blankRow(ws);

  // KPI Section
  sectionRow(ws, '  KEY METRICS AT A GLANCE', 7);
  headerRow(ws, ['Metric', 'Old Bill', '1 User', '100 Users', '1,000 Users', '10,000 Users', '1,00,000 Users']);
  const kpiData = [
    ['Monthly Cost (WITH NAT Gateway)',   '₹7,463',  '₹4,021',  '₹4,996',  '₹11,960',  '₹57,511',  '₹4,62,752'],
    ['Monthly Cost (WITHOUT NAT Gateway)','₹7,463',  '₹1,315',  '₹2,290',  '₹9,066',   '₹52,926',  '₹4,41,259'],
    ['Per-User Variable Cost (DynamoDB+S3)','—',     '₹1.67',   '₹2.57',   '₹25.72',   '₹25.73',   '₹25.73'],
    ['Cost Per User (WITH NAT)',          '—',       '₹4,021',  '₹49.96',  '₹11.96',   '₹5.75',    '₹4.63'],
    ['Cost Per User (WITHOUT NAT)',       '—',       '₹1,315',  '₹22.90',  '₹9.07',    '₹5.29',    '₹4.41'],
    ['DynamoDB Cost',                     '₹417',    '₹0',      '₹62',     '₹616',     '₹6,158',   '₹61,581'],
    ['S3 Cost',                           '₹167',    '₹1.67',   '₹195',    '₹1,944',   '₹19,439',  '₹1,94,388'],
    ['EC2 + EBS Cost',                    '₹2,004',  '₹784',    '₹1,426',  '₹5,389',   '₹20,922',  '₹1,03,014'],
    ['ALB Cost',                          '₹1,503',  '₹487',    '₹536',    '₹975',     '₹5,364',   '₹49,251'],
    ['NAT Gateway Cost',                  '₹2,705',  '₹2,705',  '₹2,723',  '₹2,893',   '₹4,584',   '₹21,492'],
    ['Cognito Cost',                      '₹0',      '₹0',      '₹0',      '₹0',       '₹0',       '₹22,963'],
    ['Route 53 Cost',                     '₹417',    '₹42',     '₹52',     '₹142',     '₹1,044',   '₹10,062'],
  ];
  kpiData.forEach((row, i) => dataRow(ws, row, i % 2 === 0));

  blankRow(ws);

  // Old vs New comparison
  sectionRow(ws, '  OLD BILL vs NEW BILL — ROOT CAUSE OF ₹7,500 CHARGE', 7);
  headerRow(ws, ['Cost Driver', 'Root Cause', 'Old Monthly Cost', 'After Cleanup', 'Saving', '', '']);
  const oldBillData = [
    ['NAT Gateway', 'Auto-created by EB in 2 regions. Never deleted. Ran 24/7 with zero users.', '$32.40 → ₹2,705', '$0 (deleted)', '₹2,705', '', ''],
    ['EC2 Instances', 'EB spun up t3.small in Mumbai + Stockholm (eu-north-1) simultaneously.', '$24.00 → ₹2,004', '$7–$121 (single region)', '₹900+', '', ''],
    ['App Load Balancer', 'ALB auto-created by EB in both regions. $0.008/hr regardless of traffic.', '$18.00 → ₹1,503', '$5.84 (single region)', '₹1,016', '', ''],
    ['Route 53 DNS', 'Hosted zone for perala.in + DNS queries running after app moved to Replit.', '$5.00 → ₹417', '$0.50 (if kept)', '₹375', '', ''],
    ['DynamoDB Scans', 'getAllUserPosts() full table SCAN on every feed load. No GSI = expensive reads.', '$5.00 → ₹417', '₹0 (free tier)', '₹417', '', ''],
    ['S3 Junk Buckets', '6+ elasticbeanstalk-* and deploy buckets with old ZIP files.', '$2.00 → ₹167', '$0 (deleted)', '₹167', '', ''],
    ['eu-north-1 Duplicates', 'Stockholm region had full duplicate: NAT + EC2 + ALB running alongside Mumbai.', '$3.00 → ₹250', '$0 (deleted)', '₹250', '', ''],
    ['TOTAL OLD BILL', '', '$89.40 → ₹7,463', '₹1,315 (1 user, no NAT)', '₹6,148 saved (82%)', '', ''],
  ];
  oldBillData.forEach((row, i) => {
    const isLast = i === oldBillData.length - 1;
    dataRow(ws, row, i % 2 === 0, isLast, isLast ? COLORS.grandTotalBg : null);
  });

  blankRow(ws);
  noteRow(ws, '⚠️  The ₹7,500 charge was 100% idle infrastructure — NOT from user activity. The app ran on Replit with zero users, yet AWS charged for 2 regions.', 7, COLORS.redBg, COLORS.redFont);
  noteRow(ws, '✅  After cleanup: Single region (Mumbai), no NAT Gateway, no duplicate ALBs. Real cost for 1 active user = ₹1,315/month.', 7, COLORS.greenBg, COLORS.greenFont);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHEET 2 — AWS PRICING RATES
// ═══════════════════════════════════════════════════════════════════════════════
{
  const ws = wb.addWorksheet('💰 AWS Pricing Rates', { tabColor: { argb: 'FF0D47A1' } });
  setColWidths(ws, [28, 22, 16, 16, 30]);

  ws.mergeCells('A1:E2');
  ws.getCell('A1').value = 'AWS PRICING RATES — ap-south-1 (Mumbai)';
  ws.getCell('A1').fill = hFill(COLORS.primaryBg);
  ws.getCell('A1').font = hFont(wb, 14, true, COLORS.whiteFont);
  ws.getCell('A1').alignment = hAlign('center', 'middle');
  ws.getRow(1).height = 32; ws.getRow(2).height = 32;

  blankRow(ws);

  const sections = [
    {
      title: 'EC2 INSTANCES (ap-south-1)',
      header: ['Instance Type', 'Specs', 'Rate (USD/hr)', 'Rate (INR/hr)', 'Monthly Cost (730 hrs)'],
      rows: [
        ['t3.nano',   '2 vCPU, 0.5 GB RAM',  '$0.0052',  '₹0.43',  '~₹381/month'],
        ['t3.micro',  '2 vCPU, 1 GB RAM',    '$0.0104',  '₹0.87',  '~₹635/month'],
        ['t3.small',  '2 vCPU, 2 GB RAM',    '$0.0208',  '₹1.74',  '~₹1,267/month'],
        ['t3.medium', '2 vCPU, 4 GB RAM',    '$0.0416',  '₹3.47',  '~₹2,536/month'],
        ['t3.large',  '2 vCPU, 8 GB RAM',    '$0.0832',  '₹6.95',  '~₹5,072/month'],
        ['t3.xlarge', '4 vCPU, 16 GB RAM',   '$0.1664',  '₹13.89', '~₹10,143/month'],
        ['c5.xlarge', '4 vCPU, 8 GB RAM',    '$0.1700',  '₹14.20', '~₹10,366/month'],
      ]
    },
    {
      title: 'EBS STORAGE (gp3)',
      header: ['Storage Type', 'Spec', 'Rate (USD)', 'Rate (INR)', 'Example'],
      rows: [
        ['gp3 SSD', 'Per GB/month', '$0.0952/GB', '₹7.95/GB', '20 GB = ₹159/month'],
        ['gp3 IOPS', 'Above 3,000 IOPS', '$0.006/IOPS', '₹0.50/IOPS', 'Default 3K included free'],
        ['Snapshot', 'Per GB/month stored', '$0.05/GB', '₹4.18/GB', 'Backup storage'],
      ]
    },
    {
      title: 'ELASTIC IP (EIP)',
      header: ['State', 'Condition', 'Rate (USD/hr)', 'Rate (INR/hr)', 'Monthly'],
      rows: [
        ['Attached to running EC2', 'Normal usage', '$0.00',   '₹0',      '₹0/month — FREE'],
        ['Not attached (idle)',     'Wasted IP',    '$0.005',  '₹0.42',   '₹306/month — AVOID'],
        ['Attached to stopped EC2', 'EC2 stopped',  '$0.005',  '₹0.42',   '₹306/month — AVOID'],
      ]
    },
    {
      title: 'APPLICATION LOAD BALANCER (ALB)',
      header: ['Component', 'Description', 'Rate (USD)', 'Rate (INR)', 'Notes'],
      rows: [
        ['Base charge', 'Always-on per hour', '$0.008/hr', '₹0.67/hr', '$5.84/month fixed'],
        ['LCU — New connections', '25 new connections/sec = 1 LCU', '$0.008/LCU-hr', '₹0.67/LCU-hr', 'Dominant for REST APIs'],
        ['LCU — Active connections', '3,000 active connections = 1 LCU', '$0.008/LCU-hr', '₹0.67/LCU-hr', 'Dominant for WebSockets'],
        ['LCU — Processed bytes', '1 GB/hr = 1 LCU', '$0.008/LCU-hr', '₹0.67/LCU-hr', 'Dominant for large files'],
        ['Rule evaluations', '1,000 rule evals/sec = 1 LCU', '$0.008/LCU-hr', '₹0.67/LCU-hr', 'Usually not dominant'],
      ]
    },
    {
      title: 'NAT GATEWAY',
      header: ['Component', 'Description', 'Rate (USD)', 'Rate (INR)', 'Monthly Impact'],
      rows: [
        ['Fixed hourly charge', 'Regardless of traffic', '$0.045/hr', '₹3.76/hr', '₹2,705/month — ALWAYS ON'],
        ['Data processing — IN', 'Data into NAT from internet', '$0.045/GB', '₹3.76/GB', 'Incoming downloads'],
        ['Data processing — OUT', 'Data from private subnet through NAT', '$0.045/GB', '₹3.76/GB', 'API calls, DynamoDB (if no endpoint)'],
        ['VPC Gateway Endpoint — DynamoDB', 'Bypass NAT for DynamoDB traffic', 'FREE', '₹0', 'Must enable — major saving!'],
        ['VPC Gateway Endpoint — S3', 'Bypass NAT for S3 traffic', 'FREE', '₹0', 'Must enable — major saving!'],
      ]
    },
    {
      title: 'ROUTE 53',
      header: ['Component', 'Description', 'Rate (USD)', 'Rate (INR)', 'Example'],
      rows: [
        ['Hosted Zone', 'Per zone per month', '$0.50/zone', '₹41.75/zone', '1 zone = ₹42/month'],
        ['DNS Queries (first 1B)', 'Standard queries', '$0.40/million', '₹33.40/million', '10M queries = ₹334'],
        ['DNS Queries (above 1B)', 'Above 1 billion', '$0.20/million', '₹16.70/million', 'Discount above 1B'],
        ['Health Checks', 'Per health check/month', '$0.50/check', '₹41.75/check', 'Optional'],
      ]
    },
    {
      title: 'DYNAMODB (On-Demand)',
      header: ['Component', 'Description', 'Rate (USD)', 'Rate (INR)', 'Free Tier'],
      rows: [
        ['Write Request Unit (WRU)', '1 WRU = 1 write of item ≤1KB', '$1.25/million', '₹104.38/million', '1M WRU/month FREE'],
        ['Read Request Unit (RRU)', '1 RRU = 1 strongly consistent read ≤4KB', '$0.25/million', '₹20.88/million', '1M RRU/month FREE'],
        ['Eventually Consistent Read', 'Half the cost of strong read', '$0.125/million', '₹10.44/million', '2M/month FREE equiv.'],
        ['Storage', 'Per GB per month', '$0.25/GB', '₹20.88/GB', '25 GB FREE always'],
        ['Global Tables replicas', 'Per million WRU replicated', '$1.875/million', '₹156.56/million', 'Additional if multi-region'],
        ['DynamoDB Streams', 'Per million read requests', '$0.02/million', '₹1.67/million', 'For real-time triggers'],
      ]
    },
    {
      title: 'S3 — STANDARD STORAGE',
      header: ['Component', 'Description', 'Rate (USD)', 'Rate (INR)', 'Notes'],
      rows: [
        ['Storage — First 50 TB', 'Per GB per month', '$0.023/GB', '₹1.92/GB', '75 TB → ₹1,44,022'],
        ['Storage — Next 450 TB', 'Per GB per month', '$0.022/GB', '₹1.84/GB', 'Slight discount above 50 TB'],
        ['PUT / COPY / POST', 'Write operations', '$0.005/1,000', '₹0.42/1,000', 'Per upload'],
        ['GET / SELECT', 'Read / download operations', '$0.0004/1,000', '₹0.033/1,000', 'Per download'],
        ['Data Transfer OUT — First 100 GB', 'Data leaving S3 to internet', '$0.00', '₹0', 'First 100 GB free/month'],
        ['Data Transfer OUT — Next 9.9 TB', 'After 100 GB free', '$0.09/GB', '₹7.52/GB', 'Significant at scale'],
        ['S3 Glacier Instant', 'Archival — still instant access', '$0.004/GB', '₹0.33/GB', '83% cheaper than Standard'],
        ['S3 Lifecycle Rule', 'Automatic move to Glacier', 'FREE', '₹0', 'Set after 90 days'],
      ]
    },
    {
      title: 'COGNITO — USER AUTHENTICATION',
      header: ['MAU Range', 'Description', 'Rate (USD)', 'Rate (INR)', 'Example'],
      rows: [
        ['0 – 50,000 MAU', 'Free forever', '$0.00/MAU', '₹0/MAU', 'Up to 50K users = ₹0'],
        ['50,001 – 100,000 MAU', 'Per MAU above 50K', '$0.0055/MAU', '₹0.46/MAU', '100K users = $275 = ₹22,963'],
        ['100,001 – 1,000,000 MAU', 'Per MAU above 100K', '$0.0046/MAU', '₹0.38/MAU', 'Volume discount'],
        ['Above 1,000,000 MAU', 'Per MAU above 1M', '$0.0032/MAU', '₹0.27/MAU', 'Enterprise volume'],
        ['Advanced Security', 'Optional add-on', '$0.050/MAU', '₹4.18/MAU', 'Risk scoring, adaptive auth'],
      ]
    },
  ];

  sections.forEach(s => {
    blankRow(ws);
    sectionRow(ws, `  ${s.title}`, 5, COLORS.accentBg);
    headerRow(ws, s.header);
    s.rows.forEach((row, i) => dataRow(ws, row, i % 2 === 0));
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHEET 3 — USER ACTIVITY MODEL
// ═══════════════════════════════════════════════════════════════════════════════
{
  const ws = wb.addWorksheet('👤 Per-User Activity', { tabColor: { argb: 'FF388E3C' } });
  setColWidths(ws, [32, 18, 18, 18, 22, 22]);

  ws.mergeCells('A1:F2');
  ws.getCell('A1').value = 'PER-USER MONTHLY ACTIVITY MODEL — 30 Days';
  ws.getCell('A1').fill = hFill(COLORS.primaryBg);
  ws.getCell('A1').font = hFont(wb, 14, true, COLORS.whiteFont);
  ws.getCell('A1').alignment = hAlign('center', 'middle');
  ws.getRow(1).height = 32; ws.getRow(2).height = 32;

  blankRow(ws);
  noteRow(ws, 'Model: One average active user posting all types of content daily — Social Feed (all post types) + Trading Journal. This is a genuine heavy user, not an extreme edge case.', 6, COLORS.sectionBg, COLORS.primaryFont);
  blankRow(ws);

  // Social Feed
  sectionRow(ws, '  SOCIAL FEED ACTIVITY (30 Days)', 6);
  headerRow(ws, ['Post Type', 'Daily Volume', 'Monthly Total', 'DynamoDB Writes', 'DynamoDB Reads', 'S3 Storage']);
  const socialRows = [
    ['Normal text posts',              '5 posts/day',         '150 posts',      '300 WRU',              '15,000 RRU',          'None'],
    ['Image posts (3 images each)',    '3 posts, 9 images',   '90 posts, 270 images', '180 WRU',        '9,000 RRU',           '405 MB (avg 1.5 MB/image)'],
    ['Audio MiniCast (limit: 3/day)',  '3 audio posts/day',   '90 audio posts', '270 WRU',              '2,700 RRU',           '180 MB (avg 2 MB/audio)'],
    ['Range / Curated posts',          '3 posts/day',         '90 posts',       '90 WRU',               '2,700 RRU',           'None'],
    ['Social engagement (likes/comments/reposts)', '~30 writes/day', '900 interactions', '900 WRU', '4,050 RRU', 'None'],
    ['Feed page loads (100 items each)','10 loads/day',       '300 loads',      '—',                    '30,000 RRU',          '—'],
    ['Profile lookups & enrichment',   '~10 times/day',       '300 lookups',    '—',                    '900 RRU',             '—'],
  ];
  socialRows.forEach((row, i) => dataRow(ws, row, i % 2 === 0));
  totalRow(ws, ['SOCIAL FEED TOTALS', '14 posts/day', '420 posts/month', '1,740 WRU', '64,350 RRU', '585 MB (~0.57 GB)']);

  blankRow(ws);

  // Journal
  sectionRow(ws, '  TRADING JOURNAL ACTIVITY (30 Days)', 6);
  headerRow(ws, ['Activity', 'Daily Volume', 'Monthly Total', 'DynamoDB Writes', 'DynamoDB Reads', 'S3 Storage']);
  const journalRows = [
    ['Trade entries saved',            '10 trades/day',       '300 trades',     '150 WRU (daily JSON blob)', '—',           'None'],
    ['Trade tags',                     '5 tags/trade',        '1,500 tags',     '(included in trade WCU)',   '—',           'None'],
    ['Chart screenshots attached',     '3 images/day',        '90 images',      '—',                '—',                   '180 MB (avg 2 MB/image)'],
    ['Journal page loads (30 days data)','5 loads/day',       '150 loads',      '—',                '22,500 RRU',          '—'],
    ['Individual trade queries',       '~10 queries/day',     '300 queries',    '—',                '15,000 RRU',          '—'],
  ];
  journalRows.forEach((row, i) => dataRow(ws, row, i % 2 === 0));
  totalRow(ws, ['JOURNAL TOTALS', '10 trades/day', '300 trades/month', '150 WRU', '37,500 RRU', '180 MB (~0.18 GB)']);

  blankRow(ws);

  // Combined
  sectionRow(ws, '  COMBINED TOTALS — SOCIAL + JOURNAL (Per User Per Month)', 6);
  headerRow(ws, ['Metric', 'Value', 'Free Tier Limit', 'Above Free Tier?', 'Cost', 'Notes']);
  const combinedRows = [
    ['Total DynamoDB Writes (WRU)', '1,890 WRU', '1,000,000 WRU free', 'NO — 0.19% of free tier', '₹0', 'Fully within free tier'],
    ['Total DynamoDB Reads (RRU)', '101,850 RRU', '1,000,000 RRU free', 'NO — 10.2% of free tier', '₹0', 'Fully within free tier'],
    ['Total S3 Storage added', '0.75 GB/month', '5 GB free (12 months)', 'NO (early); YES (after)', '₹1.44/month', '$0.023/GB after free tier'],
    ['S3 PUT requests', '~450 requests', '2,000 free (12 months)', 'Possibly', '₹0.002', 'Negligible'],
    ['S3 GET requests', '~9,450 requests', '20,000 free (12 months)', 'Partially', '₹0.004', 'Negligible'],
    ['Route 53 DNS queries', '~3,000 queries', '—', 'Billed always', '₹0.001', 'Negligible'],
    ['TOTAL VARIABLE COST (1 user)', '', '', '', '₹1.67/month', 'DynamoDB + S3 only'],
  ];
  combinedRows.forEach((row, i) => {
    const isLast = i === combinedRows.length - 1;
    dataRow(ws, row, i % 2 === 0, isLast, isLast ? COLORS.grandTotalBg : null);
  });

  blankRow(ws);
  noteRow(ws, '💡 KEY INSIGHT: The per-user variable cost (DynamoDB + S3) is only ₹1.67/month for one very active user. Infrastructure (EC2 + ALB) is what dominates the bill.', 6, COLORS.greenBg, COLORS.greenFont);
  noteRow(ws, '💡 DynamoDB stays in the free tier until you cross ~530 active users. After that: $1.25/million WRU and $0.25/million RRU scale linearly.', 6, COLORS.sectionBg, COLORS.primaryFont);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHEET 4 — COST BY USER TIER
// ═══════════════════════════════════════════════════════════════════════════════
{
  const ws = wb.addWorksheet('📈 Cost By User Tier', { tabColor: { argb: 'FF1565C0' } });
  setColWidths(ws, [30, 18, 18, 18, 18, 18, 20]);

  ws.mergeCells('A1:G2');
  ws.getCell('A1').value = 'COMPLETE COST BREAKDOWN BY USER TIER — ALL SERVICES';
  ws.getCell('A1').fill = hFill(COLORS.primaryBg);
  ws.getCell('A1').font = hFont(wb, 14, true, COLORS.whiteFont);
  ws.getCell('A1').alignment = hAlign('center', 'middle');
  ws.getRow(1).height = 32; ws.getRow(2).height = 32;

  blankRow(ws);

  const tiers = [
    { label: '1 USER', ec2: '1 × t3.micro', ebs: '20 GB × 1', alb: 'Base only', nat: 'Fixed + ~0 GB data', r53: '1 zone + 3K queries', dynamo: '1,890 WRU + 101,850 RRU', s3: '0.75 GB + 450 PUT + 9,450 GET', cognito: '1 MAU (free)', costs: { ec2: 625, ebs: 159, eip: 0, alb: 487, nat: 2705, r53: 42, dynamo: 0, s3: 2, cognito: 0, infra: 0 } },
    { label: '100 USERS', ec2: '1 × t3.small', ebs: '20 GB × 1', alb: 'Base + 0.1 LCU', nat: 'Fixed + ~5 GB data', r53: '1 zone + 300K queries', dynamo: '189K WRU + 10.2M RRU', s3: '75 GB + 45K PUT + 945K GET', cognito: '100 MAU (free)', costs: { ec2: 1267, ebs: 159, eip: 0, alb: 536, nat: 2723, r53: 52, dynamo: 62, s3: 195, cognito: 0, infra: 0 } },
    { label: '1,000 USERS', ec2: '2 × t3.medium', ebs: '20 GB × 2', alb: 'Base + 1 LCU', nat: 'Fixed + ~50 GB data', r53: '1 zone + 3M queries', dynamo: '1.89M WRU + 101.9M RRU', s3: '750 GB + 450K PUT + 9.45M GET', cognito: '1K MAU (free)', costs: { ec2: 5072, ebs: 317, eip: 0, alb: 975, nat: 2893, r53: 142, dynamo: 616, s3: 1944, cognito: 0, infra: 0 } },
    { label: '10,000 USERS', ec2: '4 × t3.large', ebs: '20 GB × 4', alb: 'Base + 10 LCU', nat: 'Fixed + ~500 GB data', r53: '1 zone + 30M queries', dynamo: '18.9M WRU + 1.02B RRU', s3: '7,500 GB + 4.5M PUT + 94.5M GET', cognito: '10K MAU (free)', costs: { ec2: 20287, ebs: 635, eip: 0, alb: 5364, nat: 4584, r53: 1044, dynamo: 6158, s3: 19439, cognito: 0, infra: 0 } },
    { label: '1,00,000 USERS', ec2: '10 × t3.xlarge', ebs: '20 GB × 10', alb: 'Base + 100 LCU', nat: 'Fixed + ~5,000 GB data', r53: '1 zone + 300M queries', dynamo: '189M WRU + 10.185B RRU', s3: '75,000 GB + 45M PUT + 945M GET', cognito: '100K MAU (50K paid)', costs: { ec2: 101427, ebs: 1587, eip: 0, alb: 49251, nat: 21492, r53: 10062, dynamo: 61581, s3: 194388, cognito: 22963, infra: 0 } },
  ];

  tiers.forEach(tier => {
    blankRow(ws);
    sectionRow(ws, `  TIER: ${tier.label}`, 7);
    headerRow(ws, ['Service', 'Configuration', 'Calculation Detail', 'USD/Month', 'INR/Month', 'INR (No NAT)', 'Notes']);

    const c = tier.costs;
    const totalWithNat = c.ec2 + c.ebs + c.eip + c.alb + c.nat + c.r53 + c.dynamo + c.s3 + c.cognito;
    const totalNoNat = totalWithNat - c.nat;

    const rows = [
      ['EC2',              tier.ec2,     `Per instance rate × 730 hrs`, `$${(c.ec2/83.5).toFixed(2)}`,      `₹${c.ec2.toLocaleString('en-IN')}`,  `₹${c.ec2.toLocaleString('en-IN')}`,     'Auto-scales via Elastic Beanstalk'],
      ['EBS Disk',         tier.ebs,     `$0.0952/GB × 20 GB × instances`, `$${(c.ebs/83.5).toFixed(2)}`,  `₹${c.ebs.toLocaleString('en-IN')}`,  `₹${c.ebs.toLocaleString('en-IN')}`,     'SSD disk per EC2 instance'],
      ['EIP',              'Attached',   'Free when attached to running EC2', '$0.00',                      '₹0',                                 '₹0',                                    'Free if always attached'],
      ['ALB',              tier.alb,     '$0.008/hr base + LCU charges',  `$${(c.alb/83.5).toFixed(2)}`,   `₹${c.alb.toLocaleString('en-IN')}`,  `₹${c.alb.toLocaleString('en-IN')}`,     '1 LCU = 25 new conn/sec'],
      ['NAT Gateway',      tier.nat,     '$0.045/hr + $0.045/GB data',    `$${(c.nat/83.5).toFixed(2)}`,   `₹${c.nat.toLocaleString('en-IN')}`,  '₹0 (delete if public subnet)',          '⚠️ Biggest cost at small scale'],
      ['Route 53',         tier.r53,     '$0.50/zone + $0.40/million queries', `$${(c.r53/83.5).toFixed(2)}`, `₹${c.r53.toLocaleString('en-IN')}`, `₹${c.r53.toLocaleString('en-IN')}`,  'Custom domain DNS'],
      ['DynamoDB',         tier.dynamo,  '$1.25/M WRU + $0.25/M RRU',    `$${(c.dynamo/83.5).toFixed(2)}`, `₹${c.dynamo.toLocaleString('en-IN')}`, `₹${c.dynamo.toLocaleString('en-IN')}`, 'Free tier: 1M WRU + 1M RRU'],
      ['S3',               tier.s3,      '$0.023/GB + $0.005/1K PUT + $0.0004/1K GET', `$${(c.s3/83.5).toFixed(2)}`, `₹${c.s3.toLocaleString('en-IN')}`, `₹${c.s3.toLocaleString('en-IN')}`, 'Storage cumulative over time'],
      ['Cognito',          tier.cognito, 'Free ≤50K MAU | $0.0055 above', `$${(c.cognito/83.5).toFixed(2)}`, `₹${c.cognito.toLocaleString('en-IN')}`, `₹${c.cognito.toLocaleString('en-IN')}`, 'Free for most tiers'],
      ['VPC / SG / TG / EB','Networking','Always free',                   '$0.00',                         '₹0',                                 '₹0',                                    ''],
    ];

    rows.forEach((row, i) => dataRow(ws, row, i % 2 === 0));

    const trWithNat = ws.addRow(['TOTAL WITH NAT GATEWAY', '', '', `$${(totalWithNat/83.5).toFixed(2)}`, `₹${totalWithNat.toLocaleString('en-IN')}`, `₹${totalNoNat.toLocaleString('en-IN')} (no NAT)`, `Per user: ₹${(totalWithNat / parseInt(tier.label)).toFixed(2)}`]);
    trWithNat.eachCell((cell) => {
      cell.fill = hFill(COLORS.redBg);
      cell.font = hFont(wb, 10, true, COLORS.redFont);
      cell.alignment = hAlign('center', 'middle');
      cell.border = hBorder('medium');
    });
    trWithNat.height = 20;

    const trNoNat = ws.addRow(['TOTAL WITHOUT NAT GATEWAY', '', '', `$${(totalNoNat/83.5).toFixed(2)}`, `₹${totalNoNat.toLocaleString('en-IN')}`, '← USE THIS', `Per user: ₹${(totalNoNat / parseInt(tier.label)).toFixed(2)}`]);
    trNoNat.eachCell((cell) => {
      cell.fill = hFill(COLORS.grandTotalBg);
      cell.font = hFont(wb, 10, true, COLORS.greenFont);
      cell.alignment = hAlign('center', 'middle');
      cell.border = hBorder('medium');
    });
    trNoNat.height = 20;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHEET 5 — MASTER COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════
{
  const ws = wb.addWorksheet('🔢 Master Comparison', { tabColor: { argb: 'FFE65100' } });
  setColWidths(ws, [28, 16, 16, 16, 16, 16, 22]);

  ws.mergeCells('A1:G2');
  ws.getCell('A1').value = 'MASTER COST COMPARISON — ALL USER TIERS SIDE BY SIDE';
  ws.getCell('A1').fill = hFill(COLORS.primaryBg);
  ws.getCell('A1').font = hFont(wb, 14, true, COLORS.whiteFont);
  ws.getCell('A1').alignment = hAlign('center', 'middle');
  ws.getRow(1).height = 32; ws.getRow(2).height = 32;

  blankRow(ws);
  sectionRow(ws, '  MONTHLY COST (INR) — WITH NAT GATEWAY', 7);
  headerRow(ws, ['Service', '1 User', '100 Users', '1,000 Users', '10,000 Users', '1,00,000 Users', 'Scales With']);
  const withNatData = [
    ['EC2',                   '₹625',      '₹1,267',   '₹5,072',    '₹20,287',    '₹1,01,427',  'User load / concurrent sessions'],
    ['EBS Disk',              '₹159',      '₹159',     '₹317',      '₹635',       '₹1,587',     'Number of EC2 instances'],
    ['EIP',                   '₹0',        '₹0',       '₹0',        '₹0',         '₹0',         'Free (attached)'],
    ['ALB',                   '₹487',      '₹536',     '₹975',      '₹5,364',     '₹49,251',    'Concurrent connections (LCU)'],
    ['NAT Gateway',           '₹2,705',    '₹2,723',   '₹2,893',    '₹4,584',     '₹21,492',    'Fixed + Data processed'],
    ['Route 53',              '₹42',       '₹52',      '₹142',      '₹1,044',     '₹10,062',    'DNS query volume'],
    ['DynamoDB',              '₹0',        '₹62',      '₹616',      '₹6,158',     '₹61,581',    'Read/write request count'],
    ['S3',                    '₹2',        '₹195',     '₹1,944',    '₹19,439',    '₹1,94,388',  'Storage volume + request count'],
    ['Cognito',               '₹0',        '₹0',       '₹0',        '₹0',         '₹22,963',    'MAU above 50,000'],
    ['VPC / SG / TG / EB',   '₹0',        '₹0',       '₹0',        '₹0',         '₹0',         'Always free'],
    ['TOTAL (WITH NAT)',      '₹4,020',    '₹4,994',   '₹11,960',   '₹57,511',    '₹4,62,751',  ''],
  ];
  withNatData.forEach((row, i) => {
    const isLast = i === withNatData.length - 1;
    dataRow(ws, row, i % 2 === 0, isLast, isLast ? COLORS.redBg : null);
  });

  blankRow(ws);
  sectionRow(ws, '  MONTHLY COST (INR) — WITHOUT NAT GATEWAY (Recommended)', 7, COLORS.greenFont === '1B5E20' ? '2E7D32' : '2E7D32');
  headerRow(ws, ['Service', '1 User', '100 Users', '1,000 Users', '10,000 Users', '1,00,000 Users', 'Saving vs With NAT']);
  const noNatData = [
    ['EC2',                   '₹625',      '₹1,267',   '₹5,072',    '₹20,287',    '₹1,01,427',  '—'],
    ['EBS Disk',              '₹159',      '₹159',     '₹317',      '₹635',       '₹1,587',     '—'],
    ['ALB',                   '₹487',      '₹536',     '₹975',      '₹5,364',     '₹49,251',    '—'],
    ['NAT Gateway',           '₹0',        '₹0',       '₹0',        '₹0',         '₹0',         'DELETE IT'],
    ['Route 53',              '₹42',       '₹52',      '₹142',      '₹1,044',     '₹10,062',    '—'],
    ['DynamoDB',              '₹0',        '₹62',      '₹616',      '₹6,158',     '₹61,581',    '—'],
    ['S3',                    '₹2',        '₹195',     '₹1,944',    '₹19,439',    '₹1,94,388',  '—'],
    ['Cognito',               '₹0',        '₹0',       '₹0',        '₹0',         '₹22,963',    '—'],
    ['TOTAL (NO NAT)',        '₹1,315',    '₹2,271',   '₹9,066',    '₹52,927',    '₹4,41,259',  ''],
    ['NAT Saving',            '₹2,705',    '₹2,723',   '₹2,894',    '₹4,584',     '₹21,492',    'Delete NAT → instant saving'],
  ];
  noNatData.forEach((row, i) => {
    const isTotal = i === noNatData.length - 2;
    const isSaving = i === noNatData.length - 1;
    dataRow(ws, row, i % 2 === 0, isTotal || isSaving, isTotal ? COLORS.grandTotalBg : isSaving ? COLORS.savingBg : null);
  });

  blankRow(ws);
  sectionRow(ws, '  PER-USER ECONOMICS', 7);
  headerRow(ws, ['Metric', '1 User', '100 Users', '1,000 Users', '10,000 Users', '1,00,000 Users', 'Trend']);
  const perUserData = [
    ['Cost/user WITH NAT',        '₹4,020',   '₹49.94',    '₹11.96',   '₹5.75',    '₹4.63',    'Drops sharply as users grow'],
    ['Cost/user WITHOUT NAT',     '₹1,315',   '₹22.71',    '₹9.07',    '₹5.29',    '₹4.41',    'Economies of scale kick in'],
    ['Variable cost/user (DynamoDB+S3)', '₹1.67', '₹1.67', '₹2.56',   '₹2.56',    '₹2.56',    'Stays nearly constant per user'],
    ['Fixed infra % of bill',     '99.9%',    '98.7%',     '90.8%',    '62.0%',    '32.0%',    'Fixed % drops at scale'],
    ['Variable % of bill',        '0.1%',     '1.3%',      '9.2%',     '38.0%',    '68.0%',    'Variable % rises at scale'],
    ['Break-even users (No NAT)', '—',        '—',         '~53 users', '~530 users','5,300 users','DynamoDB exits free tier'],
  ];
  perUserData.forEach((row, i) => dataRow(ws, row, i % 2 === 0));

  blankRow(ws);
  sectionRow(ws, '  COST vs OLD BILL COMPARISON', 7);
  headerRow(ws, ['Scenario', 'Old Bill (₹)', '1 User (₹)', '100 Users (₹)', '1,000 Users (₹)', '10,000 Users (₹)', 'Saving vs Old Bill']);
  const vsOldData = [
    ['With NAT Gateway',    '₹7,463', '₹4,020', '₹4,994',  '₹11,960', '₹57,511', 'Variable — depends on user tier'],
    ['Without NAT Gateway', '₹7,463', '₹1,315', '₹2,271',  '₹9,066',  '₹52,927', '₹6,148 saved at 1 user'],
    ['After All Optimizations', '₹7,463', '₹900', '₹1,400', '₹4,200', '₹20,000', '₹6,563 saved — 88% reduction'],
  ];
  vsOldData.forEach((row, i) => dataRow(ws, row, i % 2 === 0));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHEET 6 — COST OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════════
{
  const ws = wb.addWorksheet('⚡ Optimizations', { tabColor: { argb: 'FF388E3C' } });
  setColWidths(ws, [30, 35, 16, 16, 18, 14]);

  ws.mergeCells('A1:F2');
  ws.getCell('A1').value = 'COST OPTIMIZATION RECOMMENDATIONS';
  ws.getCell('A1').fill = hFill(COLORS.primaryBg);
  ws.getCell('A1').font = hFont(wb, 14, true, COLORS.whiteFont);
  ws.getCell('A1').alignment = hAlign('center', 'middle');
  ws.getRow(1).height = 32; ws.getRow(2).height = 32;

  blankRow(ws);

  const optSections = [
    {
      title: 'PRIORITY 1 — Immediate Actions (Do Today — No Code Changes)',
      bg: COLORS.redBg,
      header: ['Action', 'How To Do It', 'Saving (1 User)', 'Saving (100K Users)', 'Estimated Time', 'Difficulty'],
      rows: [
        ['Delete NAT Gateway', 'AWS Console → VPC → NAT Gateways → Select all → Actions → Delete. Wait for "deleted" state. Then update EB to use public subnets.', '₹2,705/month', '₹21,492/month', '30 minutes', 'Easy'],
        ['Check eu-north-1 (Stockholm)', 'AWS Console → Switch region to eu-north-1 → Check EC2, ALB, VPC, NAT, S3 → Delete everything found.', '₹0–₹3,000/month', '₹0–₹3,000/month', '15 minutes', 'Easy'],
        ['Delete junk S3 buckets', 'AWS Console → S3 → Find elasticbeanstalk-*, perala-ai-deployments, trading-platform-deployments-* → Empty → Delete.', '₹100–₹500/month', '₹100–₹500/month', '20 minutes', 'Easy'],
        ['Remove unused Route 53 zone', 'If not using custom domain: Route 53 → Hosted Zones → Delete zone. Saves $0.50/month.', '₹42/month', '₹42/month', '5 minutes', 'Easy'],
        ['Detach unused EIPs', 'EC2 → Elastic IPs → Release any not attached to running instances. Each costs $3.60/month when idle.', '₹0–₹300/month', '₹0–₹300/month', '5 minutes', 'Easy'],
      ]
    },
    {
      title: 'PRIORITY 2 — Code Changes (This Week — High ROI)',
      bg: COLORS.orangeBg,
      header: ['Action', 'Technical Detail', 'Saving (1K Users)', 'Saving (100K Users)', 'Dev Time', 'Difficulty'],
      rows: [
        ['Add DynamoDB GSI on authorUsername', 'In neofeed-user-posts table, add GSI with PK=authorUsername, SK=sk (timestamp). Replace getAllUserPosts() SCAN with Query using GSI. Reduces reads by 90–95%.', '₹554/month', '₹55,423/month', '4 hours', 'Medium'],
        ['Add VPC Gateway Endpoints', 'AWS Console → VPC → Endpoints → Create → Choose DynamoDB → attach to route table. Also do same for S3. FREE — traffic bypasses NAT.', '₹400/month', '₹4,000/month', '1 hour', 'Easy'],
        ['S3 Lifecycle Policies', 'S3 Console → Bucket → Management → Lifecycle rules → Add rule: move to Glacier Instant after 90 days. Saves 83% on storage (₹1.92 → ₹0.33/GB).', '₹1,611/month', '₹1,61,100/month', '1 hour', 'Easy'],
        ['Image compression before upload', 'Compress images to max 300 KB before S3 upload (use sharp or browser canvas API). Reduces S3 storage by 70–80%.', '₹1,360/month', '₹1,36,000/month', '3 hours', 'Medium'],
        ['CloudFront CDN for S3 media', 'Create CloudFront distribution pointing to S3. Update image/audio URLs. Reduces GET requests by 70% and data transfer cost.', '₹50/month', '₹5,000/month', '3 hours', 'Medium'],
      ]
    },
    {
      title: 'PRIORITY 3 — Architecture (For 10K+ Users)',
      bg: COLORS.sectionBg,
      header: ['Action', 'Technical Detail', 'Saving (10K Users)', 'Saving (100K Users)', 'Dev Time', 'Difficulty'],
      rows: [
        ['EC2 Reserved Instances (1-year)', '1-year commitment in AWS → 30–40% discount on EC2. Only commit once you have stable load. Can combine Standard + Convertible.', '₹8,115/month', '₹40,571/month', 'Billing action', 'Easy'],
        ['ElastiCache Redis for feed caching', 'Cache DynamoDB reads for social feed. Feed data cached for 60 seconds reduces DynamoDB RRU by 70%. Redis t3.micro = $12/month.', '₹4,311/month', '₹43,107/month', '8 hours', 'Hard'],
        ['EB Auto-Scaling schedules', 'Scale down EC2 from 10pm–7am IST (Indian market closed). Trading platform has clear peak/off-peak pattern.', '₹5,000/month', '₹50,000/month', '2 hours', 'Medium'],
        ['DynamoDB Provisioned + Auto-Scaling', 'Switch from on-demand to provisioned with Auto-Scaling at predictable load. Saves 40–70% on DynamoDB at high usage.', '₹2,463/month', '₹24,632/month', '2 hours', 'Medium'],
        ['S3 Transfer Acceleration', 'For users uploading from across India, S3 Transfer Acceleration speeds uploads via CloudFront edge nodes.', 'Speed, not savings', 'UX improvement', '1 hour', 'Easy'],
      ]
    }
  ];

  optSections.forEach(s => {
    blankRow(ws);
    sectionRow(ws, `  ${s.title}`, 6, s.title.includes('1') ? '1565C0' : s.title.includes('2') ? 'E65100' : '388E3C');
    headerRow(ws, s.header);
    s.rows.forEach((row, i) => dataRow(ws, row, i % 2 === 0));
  });

  blankRow(ws);
  sectionRow(ws, '  OPTIMIZED COST PROJECTIONS AFTER ALL IMPROVEMENTS', 6, '2E7D32');
  headerRow(ws, ['Users', 'Current Bill (with NAT)', 'After Priority 1', 'After Priority 1+2', 'After All 3 Priorities', 'Total Saving', 'Saving %']);
  const optimizedData = [
    ['1 User',       '₹4,020',    '₹1,315',    '₹1,100',     '₹900',       '₹3,120',    '78%'],
    ['100 Users',    '₹4,994',    '₹2,289',    '₹1,850',     '₹1,400',     '₹3,594',    '72%'],
    ['1,000 Users',  '₹11,960',   '₹9,066',    '₹6,300',     '₹4,200',     '₹7,760',    '65%'],
    ['10,000 Users', '₹57,511',   '₹52,927',   '₹30,000',    '₹20,000',    '₹37,511',   '65%'],
    ['1,00,000 Users','₹4,62,751','₹4,41,259', '₹2,40,000',  '₹1,40,000',  '₹3,22,751', '70%'],
  ];
  optimizedData.forEach((row, i) => dataRow(ws, row, i % 2 === 0));

  blankRow(ws);
  noteRow(ws, '🏆 SINGLE BEST INVESTMENT: Add DynamoDB GSI on authorUsername. 4 hours of work → ₹55,000/month saving at 1 lakh users. 90% reduction in read cost.', 6, COLORS.greenBg, COLORS.greenFont);
  noteRow(ws, '⚡ FASTEST WIN: Delete NAT Gateway. 30 minutes → ₹2,705/month saved immediately, every single month.', 6, COLORS.orangeBg, COLORS.orangeFont);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHEET 7 — EC2 SIZING GUIDE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const ws = wb.addWorksheet('🖥️ EC2 Sizing Guide', { tabColor: { argb: 'FF7B1FA2' } });
  setColWidths(ws, [22, 16, 16, 22, 18, 18, 22]);

  ws.mergeCells('A1:G2');
  ws.getCell('A1').value = 'EC2 INSTANCE SIZING GUIDE — WHEN TO UPGRADE';
  ws.getCell('A1').fill = hFill(COLORS.primaryBg);
  ws.getCell('A1').font = hFont(wb, 14, true, COLORS.whiteFont);
  ws.getCell('A1').alignment = hAlign('center', 'middle');
  ws.getRow(1).height = 32; ws.getRow(2).height = 32;

  blankRow(ws);
  noteRow(ws, 'For a WebSocket-heavy trading platform with real-time price streaming and SSE broadcasts, concurrent connections drive instance size — not just total users.', 7, COLORS.sectionBg, COLORS.primaryFont);
  blankRow(ws);

  sectionRow(ws, '  EC2 SIZING RECOMMENDATIONS BY USER COUNT', 7);
  headerRow(ws, ['Total MAU', 'Est. Concurrent Users', 'Recommended EC2', 'Instance Count', 'Monthly EC2 Cost', 'Monthly EBS Cost', 'Notes']);
  const sizingData = [
    ['1 – 50',         '1 – 5',          't3.micro',   '1 instance',   '₹625',      '₹159',    'Good for dev/test. Single instance OK.'],
    ['50 – 200',       '5 – 20',         't3.small',   '1 instance',   '₹1,267',    '₹159',    'Handles light production traffic.'],
    ['200 – 500',      '20 – 50',        't3.small',   '1 instance',   '₹1,267',    '₹159',    'Add EB health check. Monitor CPU.'],
    ['500 – 1,500',    '50 – 150',       't3.medium',  '1–2 instances','₹2,536–₹5,072','₹159–₹317','Add 2nd instance for HA (high availability).'],
    ['1,500 – 5,000',  '150 – 500',      't3.large',   '2 instances',  '₹10,143',   '₹317',    'EB auto-scale between 2 instances. Monitor WebSocket load.'],
    ['5,000 – 15,000', '500 – 1,500',    't3.large',   '2–4 instances','₹10,143–₹20,287','₹317–₹635','Scale horizontally. Consider Redis cache.'],
    ['15,000 – 30,000','1,500 – 3,000',  't3.xlarge',  '4 instances',  '₹40,571',   '₹635',    'Add ElastiCache. DynamoDB reads become dominant cost.'],
    ['30,000 – 60,000','3,000 – 6,000',  't3.xlarge',  '6 instances',  '₹60,856',   '₹953',    'S3 costs spike. Enable lifecycle policies NOW.'],
    ['60,000 – 1,00,000','6,000–10,000', 't3.xlarge',  '8–10 instances','₹81,141–₹1,01,427','₹1,270–₹1,587','Consider c5.xlarge for CPU-intensive analytics.'],
    ['1,00,000+',      '10,000+',        'c5.2xlarge', '8+ instances', '₹1,60,000+','₹1,587+', 'Dedicated architect review needed at this scale.'],
  ];
  sizingData.forEach((row, i) => dataRow(ws, row, i % 2 === 0));

  blankRow(ws);
  sectionRow(ws, '  EC2 MONTHLY COSTS — QUICK REFERENCE (ap-south-1)', 7);
  headerRow(ws, ['Instance', 'vCPU', 'RAM', 'On-Demand/hr (USD)', 'On-Demand/hr (INR)', '1-Month (USD)', '1-Month (INR)']);
  const ec2Prices = [
    ['t3.nano',    '2', '0.5 GB', '$0.0052', '₹0.43', '$3.80',    '₹317'],
    ['t3.micro',   '2', '1 GB',   '$0.0104', '₹0.87', '$7.59',    '₹634'],
    ['t3.small',   '2', '2 GB',   '$0.0208', '₹1.74', '$15.18',   '₹1,268'],
    ['t3.medium',  '2', '4 GB',   '$0.0416', '₹3.47', '$30.37',   '₹2,536'],
    ['t3.large',   '2', '8 GB',   '$0.0832', '₹6.95', '$60.74',   '₹5,072'],
    ['t3.xlarge',  '4', '16 GB',  '$0.1664', '₹13.89','$121.47',  '₹10,143'],
    ['t3.2xlarge', '8', '32 GB',  '$0.3328', '₹27.79','$242.94',  '₹20,285'],
    ['c5.large',   '2', '4 GB',   '$0.085',  '₹7.10', '$62.05',   '₹5,181'],
    ['c5.xlarge',  '4', '8 GB',   '$0.170',  '₹14.20','$124.10',  '₹10,362'],
    ['c5.2xlarge', '8', '16 GB',  '$0.340',  '₹28.39','$248.20',  '₹20,725'],
  ];
  ec2Prices.forEach((row, i) => dataRow(ws, row, i % 2 === 0));

  blankRow(ws);
  noteRow(ws, '💡 Reserved Instances (1-year): Save 30–40% on EC2. Example: t3.large on-demand = ₹5,072/month → Reserved = ₹3,043/month. Only commit when load is stable.', 7, COLORS.greenBg, COLORS.greenFont);
  noteRow(ws, '💡 Spot Instances: Up to 90% savings — but instances can be terminated by AWS. NOT suitable for your trading platform (need always-on reliability).', 7, COLORS.orangeBg, COLORS.orangeFont);
}

// ─── Save ────────────────────────────────────────────────────────────────────
await wb.xlsx.writeFile('./aws-cost-analysis.xlsx');
console.log('Excel file generated: aws-cost-analysis.xlsx');
