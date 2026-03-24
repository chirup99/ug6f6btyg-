import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'AWS Cost Analysis Report — Perala Trading Platform',
    Author: 'Perala Platform',
    Subject: 'AWS Infrastructure Cost Breakdown & User Scaling Analysis',
  }
});

const OUTPUT_PATH = './aws-cost-analysis-report.pdf';
doc.pipe(fs.createWriteStream(OUTPUT_PATH));

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS = {
  primary:    '#1a237e',
  accent:     '#0d47a1',
  orange:     '#e65100',
  red:        '#b71c1c',
  green:      '#1b5e20',
  lightBlue:  '#e3f2fd',
  lightGreen: '#e8f5e9',
  lightRed:   '#ffebee',
  lightOrange:'#fff3e0',
  lightGray:  '#f5f5f5',
  midGray:    '#9e9e9e',
  darkGray:   '#424242',
  white:      '#ffffff',
  black:      '#000000',
  headerBg:   '#0d47a1',
  rowEven:    '#f0f4ff',
  rowOdd:     '#ffffff',
};

const PAGE_W = 595 - 100;  // A4 width minus margins

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pageHeader(doc, pageNum) {
  doc.save();
  doc.rect(0, 0, 595, 38).fill(COLORS.primary);
  doc.fontSize(8).fillColor(COLORS.white)
     .text('AWS Cost Analysis Report — Perala Trading Platform', 50, 14, { align: 'left' })
     .text(`Page ${pageNum}`, 0, 14, { align: 'right', width: 545 });
  doc.restore();
}

function pageFooter(doc) {
  doc.save();
  doc.rect(0, 807, 595, 35).fill(COLORS.primary);
  doc.fontSize(7).fillColor(COLORS.white)
     .text('Confidential — Perala Platform AWS Infrastructure Report  |  Region: ap-south-1 (Mumbai)  |  Rate: $1 = ₹83.5', 50, 815, { align: 'center', width: 495 });
  doc.restore();
}

function sectionTitle(doc, title, y) {
  doc.save();
  doc.rect(50, y, PAGE_W, 24).fill(COLORS.accent);
  doc.fontSize(11).fillColor(COLORS.white).font('Helvetica-Bold')
     .text(title, 58, y + 7);
  doc.restore();
  return y + 32;
}

function subTitle(doc, title, y) {
  doc.fontSize(10).fillColor(COLORS.primary).font('Helvetica-Bold').text(title, 50, y);
  doc.moveTo(50, y + 14).lineTo(545, y + 14).strokeColor(COLORS.accent).lineWidth(0.5).stroke();
  return y + 20;
}

function infoBox(doc, lines, y, bgColor = COLORS.lightBlue, borderColor = COLORS.accent) {
  const boxH = lines.length * 14 + 16;
  doc.save();
  doc.rect(50, y, PAGE_W, boxH).fill(bgColor).stroke(borderColor);
  doc.fontSize(8.5).fillColor(COLORS.darkGray).font('Helvetica');
  lines.forEach((line, i) => {
    doc.text(line, 62, y + 10 + i * 14, { lineGap: 0 });
  });
  doc.restore();
  return y + boxH + 8;
}

function table(doc, headers, rows, y, colWidths, options = {}) {
  const { headerBg = COLORS.headerBg, fontSize = 8 } = options;
  const ROW_H = 18;
  const startX = 50;

  // Header
  doc.save();
  doc.rect(startX, y, PAGE_W, ROW_H).fill(headerBg);
  let x = startX;
  headers.forEach((h, i) => {
    doc.fontSize(fontSize).fillColor(COLORS.white).font('Helvetica-Bold')
       .text(h, x + 4, y + 5, { width: colWidths[i] - 6, align: i > 0 ? 'right' : 'left' });
    x += colWidths[i];
  });
  doc.restore();
  y += ROW_H;

  // Rows
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? COLORS.rowOdd : COLORS.rowEven;
    doc.save();
    doc.rect(startX, y, PAGE_W, ROW_H).fill(bg);
    let x = startX;
    row.forEach((cell, ci) => {
      const isTotal = ri === rows.length - 1 && options.totalRow;
      doc.fontSize(fontSize)
         .fillColor(isTotal ? COLORS.primary : COLORS.darkGray)
         .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
         .text(String(cell), x + 4, y + 5, { width: colWidths[ci] - 6, align: ci > 0 ? 'right' : 'left' });
      x += colWidths[ci];
    });
    // Row border
    doc.moveTo(startX, y + ROW_H).lineTo(startX + PAGE_W, y + ROW_H)
       .strokeColor('#e0e0e0').lineWidth(0.3).stroke();
    doc.restore();
    y += ROW_H;
  });

  // Outer border
  doc.rect(startX, y - ROW_H * (rows.length + 1), PAGE_W, ROW_H * (rows.length + 1))
     .strokeColor(COLORS.accent).lineWidth(0.5).stroke();

  return y + 8;
}

function bullet(doc, text, y, indent = 60) {
  doc.fontSize(8.5).fillColor(COLORS.darkGray).font('Helvetica');
  doc.circle(indent - 8, y + 4, 2).fill(COLORS.accent);
  doc.text(text, indent, y, { width: PAGE_W - indent + 50, lineGap: 2 });
  return y + 16;
}

function kpiRow(doc, items, y) {
  const boxW = PAGE_W / items.length - 6;
  items.forEach((item, i) => {
    const x = 50 + i * (boxW + 6);
    doc.save();
    doc.rect(x, y, boxW, 52).fill(item.bg || COLORS.lightBlue).stroke(item.border || COLORS.accent);
    doc.fontSize(7).fillColor(COLORS.midGray).font('Helvetica').text(item.label, x + 6, y + 8, { width: boxW - 12 });
    doc.fontSize(13).fillColor(item.color || COLORS.primary).font('Helvetica-Bold').text(item.value, x + 6, y + 20, { width: boxW - 12 });
    doc.fontSize(7).fillColor(COLORS.midGray).font('Helvetica').text(item.sub || '', x + 6, y + 38, { width: boxW - 12 });
    doc.restore();
  });
  return y + 60;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// ═══════════════════════════════════════════════════════════════════════════════
let pg = 1;

// Cover background
doc.rect(0, 0, 595, 842).fill(COLORS.primary);
doc.rect(0, 580, 595, 262).fill(COLORS.accent);

// Logo area / icon
doc.rect(220, 80, 155, 155).fill(COLORS.accent).stroke('#ffffff');
doc.fontSize(60).fillColor(COLORS.white).font('Helvetica-Bold').text('₹', 248, 110);

// Title
doc.fontSize(26).fillColor(COLORS.white).font('Helvetica-Bold')
   .text('AWS COST ANALYSIS', 50, 270, { align: 'center', width: 495 });
doc.fontSize(14).fillColor('#90caf9').font('Helvetica')
   .text('Perala Trading Platform — Infrastructure Report', 50, 305, { align: 'center', width: 495 });

// Divider
doc.moveTo(100, 338).lineTo(495, 338).strokeColor('#90caf9').lineWidth(1).stroke();

// Meta info
const meta = [
  ['Region', 'ap-south-1 (Mumbai)'],
  ['Exchange Rate', '$1 = ₹83.5'],
  ['Analysis Period', '30 Days (1 Month)'],
  ['Report Date', new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })],
];
let metaY = 355;
meta.forEach(([k, v]) => {
  doc.fontSize(9).fillColor('#90caf9').font('Helvetica-Bold').text(k + ':', 150, metaY);
  doc.fontSize(9).fillColor(COLORS.white).font('Helvetica').text(v, 280, metaY);
  metaY += 20;
});

// Bottom section
doc.fontSize(11).fillColor(COLORS.white).font('Helvetica-Bold')
   .text('CONTENTS', 50, 600, { align: 'center', width: 495 });
const contents = [
  '01  Why Your Old Bill Was ₹7,500 — Root Cause Analysis',
  '02  New Clean Infrastructure — What You Have Now',
  '03  Per-User Activity Model — Social Feed + Journal',
  '04  Cost Breakdown — 1 User',
  '05  Cost Breakdown — 100 Users',
  '06  Cost Breakdown — 1,000 Users',
  '07  Cost Breakdown — 10,000 Users',
  '08  Cost Breakdown — 1,00,000 Users',
  '09  Master Comparison Table — All Tiers',
  '10  Cost Optimization Recommendations',
];
let cY = 625;
contents.forEach(line => {
  doc.fontSize(8.5).fillColor('#e3f2fd').font('Helvetica').text(line, 120, cY);
  cY += 17;
});

doc.addPage();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — OLD BILL ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════
pg = 2;
pageHeader(doc, pg);
pageFooter(doc);

let y = 55;

y = sectionTitle(doc, '01  WHY YOUR OLD BILL WAS ₹7,500 — ROOT CAUSE ANALYSIS', y);

y = infoBox(doc, [
  'The ₹7,500 monthly charge had NOTHING to do with real user activity.',
  'It was 100% idle infrastructure deployed via Elastic Beanstalk across TWO AWS regions that was never shut down.',
  'Your app ran on Replit with zero users, yet AWS kept charging for running servers in Mumbai + Stockholm.',
], y, COLORS.lightRed, COLORS.red);

y = subTitle(doc, 'Old Bill Breakdown', y);
y = table(doc,
  ['Service', 'Root Cause', 'Cost (USD)', 'Cost (INR)'],
  [
    ['NAT Gateway',          'Auto-created by Elastic Beanstalk VPC. Runs 24/7 at $0.045/hr even with ZERO traffic. Never stops unless manually deleted.',   '$32.40',  '₹2,705'],
    ['EC2 Instance(s)',      'EB spun up t3.small in Mumbai AND Stockholm (eu-north-1). Your deploy scripts targeted both regions accidentally.',              '$24.00',  '₹2,004'],
    ['App Load Balancer',    'Auto-created with EB. Base charge $0.008/hr regardless of traffic — whether 0 or 1,000 users.',                                '$18.00',  '₹1,503'],
    ['Route 53 DNS',         'Hosted zone for perala.in ($0.50) + DNS queries ($4). Kept running after app moved to Replit.',                                 '$5.00',   '₹417'],
    ['DynamoDB Scans',       'getAllUserPosts(), getAllUserJournalData() doing full table SCAN on every page load. No GSI indexes = expensive reads.',          '$5.00',   '₹417'],
    ['S3 Deployment Junk',   'elasticbeanstalk-eu-north-1-*, perala-ai-deployments, trading-platform-deployments-{timestamp} buckets with old ZIP files.',    '$2.00',   '₹167'],
    ['eu-north-1 Duplicate', 'Stockholm region had a full duplicate: NAT + EC2 + ALB running simultaneously with Mumbai.',                                    '$3.00',   '₹250'],
    ['TOTAL OLD BILL',       '',                                                                                                                              '$89.40',  '₹7,463'],
  ],
  y, [185, 165, 65, 65], { totalRow: true }
);

y += 5;
y = infoBox(doc, [
  'KEY INSIGHT: The DynamoDB Scan issue in getAllUserPosts() reads the ENTIRE table on every feed load.',
  'With a GSI (Global Secondary Index) on userId, this becomes a targeted Query → cost drops by 95%.',
  'The SSE broadcast every 700ms in live-price-routes.ts multiplies backend fetches if any DB calls are triggered per event.',
], y, COLORS.lightOrange, COLORS.orange);

y = subTitle(doc, 'What Was Deleted vs What Remains', y);
y = table(doc,
  ['Service', 'Old Setup', 'Status After Cleanup', 'New Monthly Cost'],
  [
    ['NAT Gateway',         'Mumbai + Stockholm',     '✓ DELETED',              '$0'],
    ['Elastic Beanstalk',   'Multi-region deployment','✓ DELETED',              '$0 (EB is free)'],
    ['EC2',                 '2–3 instances, 2 regions','REBUILT — single region','$7–$121 (scales)'],
    ['ALB',                 'Mumbai + Stockholm ALB', 'REBUILT — single region','$5.84 base'],
    ['Route 53',            'perala.in hosted zone',  'KEPT (if custom domain)', '$0.50/mo'],
    ['S3 Deploy Buckets',   '6+ junk buckets',        '✓ EMPTIED & DELETED',    '$0'],
    ['DynamoDB',            'Full SCAN on every load', 'SAME (optimization pending)','$0–$738'],
    ['Cognito',             'ap-south-1',             'KEPT — always free <50K users','$0'],
  ],
  y, [110, 130, 120, 130]
);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 3 — CURRENT INFRASTRUCTURE + PRICING RATES
// ═══════════════════════════════════════════════════════════════════════════════
pg = 3;
pageHeader(doc, pg);
pageFooter(doc);
y = 55;

y = sectionTitle(doc, '02  NEW CLEAN INFRASTRUCTURE — WHAT YOU HAVE NOW', y);

y = table(doc,
  ['AWS Service', 'What It Does', 'Billing Model'],
  [
    ['Elastic Beanstalk',    'Orchestrates EC2 + ALB + Auto Scaling. EB itself is free.',                          'FREE — pay only for underlying resources'],
    ['EC2 (via EB)',         'Your app server. Scales up/down automatically via EB Auto Scaling Groups.',          'Per hour, by instance type'],
    ['EBS (disk on EC2)',    '20 GB gp3 SSD attached to each EC2 instance for OS + app storage.',                  '$0.0952/GB/month'],
    ['EIP (Elastic IP)',     'Fixed public IP for your EC2. Free when attached to running instance.',              'FREE if attached | $0.005/hr if not'],
    ['ALB (Load Balancer)',  'Routes HTTP/HTTPS traffic to EC2. Essential for EB. Scales connections.',            '$0.008/hr base + $0.008/LCU-hr'],
    ['VPC',                  'Private network container. Required for EB deployment.',                             'FREE (VPC itself)'],
    ['NAT Gateway (in VPC)', 'Allows private-subnet EC2 to reach internet. OPTIONAL if using public subnets.',    '$0.045/hr + $0.045/GB data'],
    ['Security Groups',      'Firewall rules for EC2 and ALB. Controls inbound/outbound traffic.',                'FREE'],
    ['Target Groups',        'ALB routing targets (EC2 instances). Included with ALB.',                           'FREE'],
    ['Route 53',             'DNS for your custom domain (perala.in). Points domain to ALB.',                     '$0.50/zone + $0.40/million queries'],
    ['DynamoDB',             'NeoFeed posts, journal data, user profiles, likes, comments, follows.',             '$1.25/M writes | $0.25/M reads | $0.25/GB'],
    ['S3',                   'User images, audio MiniCasts, journal chart screenshots, profile photos.',          '$0.023/GB | $0.005/1K PUT | $0.0004/1K GET'],
    ['Cognito',              'User authentication. JWT tokens. Auto-confirmation enabled.',                        'FREE ≤50K users | $0.0055/user above 50K'],
  ],
  y, [120, 220, 155]
);

y += 5;
y = sectionTitle(doc, '03  AWS PRICING RATES — ap-south-1 (MUMBAI)', y);

y = table(doc,
  ['Service', 'Tier / Config', 'Rate (USD)', 'Rate (INR)'],
  [
    ['EC2 t3.micro',           '2 vCPU, 1 GB RAM',            '$0.0104/hr',          '₹0.87/hr'],
    ['EC2 t3.small',           '2 vCPU, 2 GB RAM',            '$0.0208/hr',          '₹1.74/hr'],
    ['EC2 t3.medium',          '2 vCPU, 4 GB RAM',            '$0.0416/hr',          '₹3.47/hr'],
    ['EC2 t3.large',           '2 vCPU, 8 GB RAM',            '$0.0832/hr',          '₹6.95/hr'],
    ['EC2 t3.xlarge',          '4 vCPU, 16 GB RAM',           '$0.1664/hr',          '₹13.89/hr'],
    ['EBS gp3 (per instance)', '20 GB SSD',                   '$1.90/mo',            '₹159/mo'],
    ['ALB base charge',        'Always-on',                   '$5.84/mo',            '₹487/mo'],
    ['ALB per LCU',            '25 conn/sec or 3K active',    '$0.008/LCU-hr',       '₹0.67/LCU-hr'],
    ['NAT Gateway fixed',      'Private subnet only',         '$32.40/mo',           '₹2,705/mo'],
    ['NAT Gateway data',       'Per GB processed',            '$0.045/GB',           '₹3.76/GB'],
    ['Route 53 zone',          'Per hosted zone',             '$0.50/mo',            '₹42/mo'],
    ['Route 53 queries',       'First 1B queries',            '$0.40/million',       '₹33.4/million'],
    ['DynamoDB WRU',           'Write Request Unit',          '$1.25/million',       '₹104/million'],
    ['DynamoDB RRU',           'Read Request Unit',           '$0.25/million',       '₹20.9/million'],
    ['DynamoDB Storage',       'Per GB per month',            '$0.25/GB',            '₹20.9/GB'],
    ['S3 Storage (Standard)',  'Per GB per month',            '$0.023/GB',           '₹1.92/GB'],
    ['S3 PUT requests',        'Upload / write ops',          '$0.005/1,000',        '₹0.42/1,000'],
    ['S3 GET requests',        'Download / read ops',         '$0.0004/1,000',       '₹0.033/1,000'],
    ['Cognito 0–50K MAU',      'Monthly Active Users',        '$0 (FREE)',           '₹0 (FREE)'],
    ['Cognito 50K–100K MAU',   'Per MAU above 50K',           '$0.0055/MAU',         '₹0.46/MAU'],
  ],
  y, [140, 115, 80, 80]
);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 4 — PER USER MODEL
// ═══════════════════════════════════════════════════════════════════════════════
pg = 4;
pageHeader(doc, pg);
pageFooter(doc);
y = 55;

y = sectionTitle(doc, '03  PER-USER MONTHLY ACTIVITY MODEL', y);

y = infoBox(doc, [
  'Model: One average active user posting all content types daily for 30 days (social feed + journal)',
  'Note: This is NOT the extreme-maximum case. It models a genuinely active daily user across all features.',
], y, COLORS.lightBlue, COLORS.accent);

y = subTitle(doc, 'Social Feed Activity (30 Days)', y);
y = table(doc,
  ['Post Type', 'Daily Volume', 'Monthly Total', 'DynamoDB per month', 'S3 per month'],
  [
    ['Normal text posts',     '5 posts/day',           '150 posts',     '300 WRU   | 15,000 RRU',     'Nil'],
    ['Image posts (3 images each)', '3 posts, 9 images/day', '90 posts, 270 images', '180 WRU | 9,000 RRU', '405 MB (1.5 MB avg/image)'],
    ['Audio MiniCast posts',  '3/day (platform limit)','90 audio posts','270 WRU   | 2,700 RRU',      '180 MB (2 MB avg/audio)'],
    ['Range/curated posts',   '3/day',                 '90 posts',      '90 WRU    | 2,700 RRU',      'Nil'],
    ['Engagement (likes/comments/reposts)', '~30 writes/day', '900 items', '900 WRU | 4,050 RRU', 'Nil'],
    ['Feed page loads',       '10 loads/day',          '300 loads',     '—         | 30,000 RRU',     '—'],
    ['SOCIAL TOTALS',         '14 posts/day',          '420 posts',     '1,740 WRU | 63,450 RRU',     '585 MB'],
  ],
  y, [145, 95, 90, 130, 85], { totalRow: true }
);

y += 5;
y = subTitle(doc, 'Trading Journal Activity (30 Days)', y);
y = table(doc,
  ['Activity', 'Daily Volume', 'Monthly Total', 'DynamoDB per month', 'S3 per month'],
  [
    ['Trade entries',         '10 trades/day',         '300 trades',    '150 WRU   | 15,000 RRU',     'Nil'],
    ['Trade tags',            '5 tags/trade',          '1,500 tags',    '(included in trade WCU)',    'Nil'],
    ['Chart screenshots',     '3 images/day',          '90 images',     '—         | —',              '180 MB (2 MB avg)'],
    ['Journal page loads',    '5 loads/day',           '150 loads',     '—         | 22,500 RRU',     '—'],
    ['JOURNAL TOTALS',        '10 trades/day',         '300 trades',    '150 WRU   | 37,500 RRU',     '180 MB'],
  ],
  y, [145, 95, 90, 130, 85], { totalRow: true }
);

y += 5;
y = subTitle(doc, 'Combined Per-User Monthly Totals', y);
y = kpiRow(doc, [
  { label: 'DynamoDB Writes', value: '1,890 WRU', sub: 'vs 1M free tier → $0', bg: COLORS.lightGreen, border: COLORS.green, color: COLORS.green },
  { label: 'DynamoDB Reads', value: '100,950 RRU', sub: 'vs 1M free tier → $0', bg: COLORS.lightGreen, border: COLORS.green, color: COLORS.green },
  { label: 'S3 New Storage', value: '0.75 GB', sub: 'Images + Audio/month', bg: COLORS.lightBlue, border: COLORS.accent, color: COLORS.accent },
  { label: 'S3 Requests', value: '~9,900', sub: 'PUT: 450 | GET: 9,450', bg: COLORS.lightBlue, border: COLORS.accent, color: COLORS.accent },
], y);

y = infoBox(doc, [
  'FREE TIER NOTE: DynamoDB always-free tier gives 1,000,000 WRU + 1,000,000 RRU per month.',
  '1 user uses only 1,890 WRU and 100,950 RRU → well within free tier → DynamoDB cost = $0',
  'Even at 100 users: 189,000 WRU + 10,095,000 RRU → WRU still free | RRU: 10.095M × $0.25/M = $2.52',
  'S3 storage is cumulative — the longer users stay, the more it grows. Lifecycle policies are critical at scale.',
], y, COLORS.lightGreen, COLORS.green);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 5 — 1 USER & 100 USERS
// ═══════════════════════════════════════════════════════════════════════════════
pg = 5;
pageHeader(doc, pg);
pageFooter(doc);
y = 55;

y = sectionTitle(doc, '04  COST BREAKDOWN — 1 USER (30 Days)', y);

y = table(doc,
  ['Service', 'Configuration', 'USD/Month', 'INR/Month', 'Notes'],
  [
    ['EC2 t3.micro',         '1 instance (min for EB)',        '$7.49',    '₹625',      'Handles 1 user easily. 2vCPU, 1GB RAM'],
    ['EBS Disk',             '20 GB gp3 per instance',         '$1.90',    '₹159',      'OS + application storage'],
    ['EIP',                  'Attached to running EC2',        '$0.00',    '₹0',        'Free when associated with instance'],
    ['ALB',                  'Base charge (near-zero LCU)',    '$5.84',    '₹487',      'LCU negligible for 1 user'],
    ['NAT Gateway',          'Private subnet setup',           '$32.40',   '₹2,705',    'OPTIONAL — see public subnet tip below'],
    ['Route 53',             '1 zone + ~3K queries',           '$0.50',    '₹42',       'Custom domain DNS'],
    ['DynamoDB',             '1,890 WRU + 100,950 RRU',       '$0.00',    '₹0',        'Fully within 1M free tier'],
    ['S3',                   '0.75 GB + 450 PUT + 9,450 GET', '$0.02',    '₹1.67',     '$0.017 storage + $0.002 PUT + $0.004 GET'],
    ['Cognito',              '1 MAU (under 50K free)',         '$0.00',    '₹0',        'Free tier'],
    ['VPC / SG / TG / EB',  'Networking + management',        '$0.00',    '₹0',        'Always free'],
    ['TOTAL WITH NAT',       '',                               '$48.15',   '₹4,021',    ''],
    ['TOTAL WITHOUT NAT',    'Public subnets (no NAT needed)', '$15.75',   '₹1,315',    '74% cheaper'],
  ],
  y, [110, 145, 60, 65, 125], { totalRow: false }
);

y = infoBox(doc, [
  'TIP: At 1 user, NAT Gateway ($32.40) costs MORE than your EC2 ($7.49) + ALB ($5.84) combined.',
  'If your EB environment uses PUBLIC subnets, you can delete the NAT Gateway and save ₹2,705/month immediately.',
], y, COLORS.lightOrange, COLORS.orange);

y = sectionTitle(doc, '05  COST BREAKDOWN — 100 USERS (30 Days)', y);

y = table(doc,
  ['Service', 'Configuration', 'USD/Month', 'INR/Month', 'Notes'],
  [
    ['EC2 t3.small',         '1 instance handles 100 users',   '$15.18',   '₹1,267',    'Easily handles 100 concurrent users'],
    ['EBS Disk',             '20 GB gp3',                      '$1.90',    '₹159',      ''],
    ['EIP',                  'Attached to running EC2',        '$0.00',    '₹0',        ''],
    ['ALB',                  'Base + ~0.1 LCU',                '$6.42',    '₹536',      '~10 concurrent → 0.1 LCU'],
    ['NAT Gateway',          'Fixed + ~5 GB data through NAT', '$32.63',   '₹2,723',    '$32.40 + $0.23 data'],
    ['Route 53',             '1 zone + 300K queries',          '$0.62',    '₹52',       '100 users × 3,000 queries each'],
    ['DynamoDB',             '189K WRU + 10.1M RRU',          '$0.74',    '₹62',       'WRU in free tier | RRU: 10.1M × $0.25/M'],
    ['S3',                   '75 GB + 45K PUT + 945K GET',     '$2.34',    '₹195',      '$1.73 storage + $0.23 PUT + $0.38 GET'],
    ['Cognito',              '100 MAU (under 50K free)',       '$0.00',    '₹0',        ''],
    ['VPC / SG / TG / EB',  'Networking',                     '$0.00',    '₹0',        ''],
    ['TOTAL WITH NAT',       '',                               '$59.83',   '₹4,996',    ''],
    ['TOTAL WITHOUT NAT',    'Public subnets',                 '$27.43',   '₹2,290',    '54% cheaper'],
  ],
  y, [110, 145, 60, 65, 125], { totalRow: false }
);

y = infoBox(doc, [
  'Per-user cost at 100 users WITH NAT: ₹50/user/month',
  'Per-user cost at 100 users WITHOUT NAT: ₹22.90/user/month',
], y, COLORS.lightGreen, COLORS.green);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 6 — 1,000 USERS
// ═══════════════════════════════════════════════════════════════════════════════
pg = 6;
pageHeader(doc, pg);
pageFooter(doc);
y = 55;

y = sectionTitle(doc, '06  COST BREAKDOWN — 1,000 USERS (30 Days)', y);

y = infoBox(doc, [
  'At 1,000 users: Deploy 2 × t3.medium for High Availability (HA). EB auto-scales between them.',
  'DynamoDB moves out of free tier for reads: 100.95M RRU × $0.25/M = $6.25 above free tier reads.',
  'S3 storage becomes meaningful: 750 GB of user-generated content (images + audio).',
], y, COLORS.lightBlue, COLORS.accent);

y = table(doc,
  ['Service', 'Configuration', 'Calculation', 'USD/Month', 'INR/Month'],
  [
    ['EC2 t3.medium × 2',    '2 instances (HA setup)',           '2 × $30.37',                    '$60.74',   '₹5,072'],
    ['EBS Disk',             '20 GB gp3 × 2 instances',         '2 × $1.90',                     '$3.80',    '₹317'],
    ['EIP',                  'Attached to EC2',                 'Free',                           '$0.00',    '₹0'],
    ['ALB',                  'Base + 1 LCU (100 concurrent)',    '$5.84 + 1LCU×$0.008×730',       '$11.68',   '₹975'],
    ['NAT Gateway',          'Fixed + 50 GB data (est.)',        '$32.40 + 50×$0.045',            '$34.65',   '₹2,893'],
    ['Route 53',             '1 zone + 3M queries',             '$0.50 + 3×$0.40',               '$1.70',    '₹142'],
    ['DynamoDB',             '900K WRU + 25.1M RRU',            '0 WRU (free) + $6.25 reads',    '$7.38',    '₹616'],
    ['S3',                   '750 GB + 450K PUT + 9.45M GET',   '$17.25 + $2.25 + $3.78',        '$23.28',   '₹1,944'],
    ['Cognito',              '1,000 MAU',                       'Under 50K → free',              '$0.00',    '₹0'],
    ['VPC / SG / TG / EB',  '',                                'Free',                           '$0.00',    '₹0'],
    ['TOTAL WITH NAT',       '',                                '',                              '$143.23',  '₹11,959'],
    ['TOTAL WITHOUT NAT',    '',                                '',                              '$108.58',  '₹9,066'],
  ],
  y, [115, 135, 115, 65, 65], { totalRow: false }
);

y = kpiRow(doc, [
  { label: 'Total WITH NAT', value: '₹11,959', sub: '/month', bg: COLORS.lightRed, border: COLORS.red, color: COLORS.red },
  { label: 'Total WITHOUT NAT', value: '₹9,066', sub: '/month', bg: COLORS.lightGreen, border: COLORS.green, color: COLORS.green },
  { label: 'Per-User Cost (with NAT)', value: '₹11.96', sub: '/user/month', bg: COLORS.lightOrange, border: COLORS.orange, color: COLORS.orange },
  { label: 'Per-User Cost (no NAT)', value: '₹9.07', sub: '/user/month', bg: COLORS.lightGreen, border: COLORS.green, color: COLORS.green },
], y);

y = sectionTitle(doc, '07  COST BREAKDOWN — 10,000 USERS (30 Days)', y);

y = infoBox(doc, [
  'At 10,000 users: Deploy 4 × t3.large. EB Auto Scaling adjusts based on CPU/network load.',
  'ALB LCU cost grows significantly: 1,000 concurrent users → ~10 LCUs → $58.40 extra.',
  'S3 at 7,500 GB (7.5 TB) becomes the 2nd largest cost after EC2.',
  'Cognito still free — under 50,000 MAU threshold.',
], y, COLORS.lightBlue, COLORS.accent);

y = table(doc,
  ['Service', 'Configuration', 'Calculation', 'USD/Month', 'INR/Month'],
  [
    ['EC2 t3.large × 4',     '4 instances (auto-scaling EB)',   '4 × $60.74',                    '$242.96',  '₹20,287'],
    ['EBS Disk',             '20 GB gp3 × 4 instances',         '4 × $1.90',                     '$7.60',    '₹635'],
    ['EIP',                  'Attached to EC2',                 'Free',                           '$0.00',    '₹0'],
    ['ALB',                  'Base + 10 LCU (1,000 concurrent)','$5.84 + 10×$0.008×730',         '$64.24',   '₹5,364'],
    ['NAT Gateway',          'Fixed + 500 GB data (est.)',       '$32.40 + 500×$0.045',           '$54.90',   '₹4,584'],
    ['Route 53',             '1 zone + 30M queries',            '$0.50 + 30×$0.40',              '$12.50',   '₹1,044'],
    ['DynamoDB',             '9M WRU + 250M RRU',               '$11.25 WRU + $62.50 RRU',       '$73.75',   '₹6,158'],
    ['S3',                   '7,500 GB + 4.5M PUT + 94.5M GET', '$172.50 + $22.50 + $37.80',     '$232.80',  '₹19,439'],
    ['Cognito',              '10,000 MAU',                      'Under 50K → free',              '$0.00',    '₹0'],
    ['VPC / SG / TG / EB',  '',                                'Free',                           '$0.00',    '₹0'],
    ['TOTAL WITH NAT',       '',                                '',                              '$688.75',  '₹57,511'],
    ['TOTAL WITHOUT NAT',    '',                                '',                              '$633.85',  '₹52,927'],
  ],
  y, [115, 135, 115, 65, 65], { totalRow: false }
);

y = kpiRow(doc, [
  { label: 'Total WITH NAT', value: '₹57,511', sub: '/month', bg: COLORS.lightRed, border: COLORS.red, color: COLORS.red },
  { label: 'Total WITHOUT NAT', value: '₹52,927', sub: '/month', bg: COLORS.lightGreen, border: COLORS.green, color: COLORS.green },
  { label: 'Per-User Cost (with NAT)', value: '₹5.75', sub: '/user/month', bg: COLORS.lightOrange, border: COLORS.orange, color: COLORS.orange },
  { label: 'Per-User Cost (no NAT)', value: '₹5.29', sub: '/user/month', bg: COLORS.lightGreen, border: COLORS.green, color: COLORS.green },
], y);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 7 — 1,00,000 USERS
// ═══════════════════════════════════════════════════════════════════════════════
pg = 7;
pageHeader(doc, pg);
pageFooter(doc);
y = 55;

y = sectionTitle(doc, '08  COST BREAKDOWN — 1,00,000 USERS (30 Days)', y);

y = infoBox(doc, [
  'At 1,00,000 users: Deploy 10 × t3.xlarge. This is production scale — likely needs additional optimization.',
  'Cognito billing kicks in: 50,000 free + 50,000 × $0.0055 = $275/month.',
  'S3 storage reaches 75 TB — lifecycle policies to Glacier become critical to control cost.',
  'DynamoDB is $737.50 — GSI indexes MUST be implemented at this scale to avoid scan overcharges.',
  'NAT Gateway data charges: $225/month. VPC Gateway Endpoints for S3/DynamoDB save most of this.',
], y, COLORS.lightOrange, COLORS.orange);

y = table(doc,
  ['Service', 'Configuration', 'Calculation', 'USD/Month', 'INR/Month'],
  [
    ['EC2 t3.xlarge × 10',   '10 instances auto-scaling',       '10 × $121.47',                  '$1,214.70', '₹1,01,427'],
    ['EBS Disk',             '20 GB gp3 × 10 instances',        '10 × $1.90',                    '$19.00',    '₹1,587'],
    ['EIP',                  'Attached to EC2',                 'Free',                           '$0.00',     '₹0'],
    ['ALB',                  'Base + 100 LCU (10K concurrent)', '$5.84 + 100×$0.008×730',        '$589.84',   '₹49,251'],
    ['NAT Gateway',          'Fixed + 5,000 GB data',           '$32.40 + 5,000×$0.045',         '$257.40',   '₹21,492'],
    ['Route 53',             '1 zone + 300M queries',           '$0.50 + 300×$0.40',             '$120.50',   '₹10,062'],
    ['DynamoDB',             '90M WRU + 2.5B RRU',              '$112.50 WRU + $625 RRU',        '$737.50',   '₹61,581'],
    ['S3',                   '75,000 GB + 45M PUT + 945M GET',  '$1,725 + $225 + $378',          '$2,328.00', '₹1,94,388'],
    ['Cognito',              '100K MAU (50K free + 50K paid)',  '50,000 × $0.0055',              '$275.00',   '₹22,963'],
    ['VPC / SG / TG / EB',  '',                                'Free',                           '$0.00',     '₹0'],
    ['TOTAL WITH NAT',       '',                                '',                              '$5,541.94', '₹4,62,752'],
    ['TOTAL WITHOUT NAT',    '',                                '',                              '$5,284.54', '₹4,41,259'],
  ],
  y, [115, 135, 115, 70, 70], { totalRow: false }
);

y = kpiRow(doc, [
  { label: 'Total WITH NAT', value: '₹4.63L', sub: '/month', bg: COLORS.lightRed, border: COLORS.red, color: COLORS.red },
  { label: 'Total WITHOUT NAT', value: '₹4.41L', sub: '/month', bg: COLORS.lightOrange, border: COLORS.orange, color: COLORS.orange },
  { label: 'Per-User Cost (with NAT)', value: '₹4.63', sub: '/user/month', bg: COLORS.lightBlue, border: COLORS.accent, color: COLORS.accent },
  { label: 'Per-User Cost (no NAT)', value: '₹4.41', sub: '/user/month', bg: COLORS.lightGreen, border: COLORS.green, color: COLORS.green },
], y);

y = subTitle(doc, 'Cost Driver Analysis at 1,00,000 Users', y);
y = table(doc,
  ['Service', 'Cost', '% of Total Bill', 'Can Reduce?'],
  [
    ['S3 Storage (75 TB images/audio)',   '₹1,94,388',  '42.0%',  'YES — S3 Glacier lifecycle saves 80%'],
    ['EC2 × 10 t3.xlarge',               '₹1,01,427',  '21.9%',  'YES — Reserved Instances save 30–40%'],
    ['ALB (100 LCUs)',                    '₹49,251',    '10.6%',  'Partial — reduce concurrent connections'],
    ['DynamoDB (2.5B reads)',             '₹61,581',    '13.3%',  'YES — GSI indexes cut reads by 90%'],
    ['NAT Gateway',                       '₹21,492',    '4.6%',   'YES — VPC Gateway Endpoints eliminate data cost'],
    ['Cognito (50K paid users)',           '₹22,963',    '5.0%',   'YES — self-hosted auth saves this'],
    ['Route 53',                          '₹10,062',    '2.2%',   'Minimal savings possible'],
    ['EBS',                               '₹1,587',     '0.3%',   'Minimal'],
  ],
  y, [175, 65, 85, 180]
);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 8 — MASTER COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════
pg = 8;
pageHeader(doc, pg);
pageFooter(doc);
y = 55;

y = sectionTitle(doc, '09  MASTER COMPARISON TABLE — ALL USER TIERS', y);

y = table(doc,
  ['Service', '1 User', '100 Users', '1,000 Users', '10,000 Users', '1,00,000 Users'],
  [
    ['EC2 (+ EBS)',    '₹784',     '₹1,426',   '₹5,389',    '₹20,922',   '₹1,03,014'],
    ['EIP',           '₹0',       '₹0',        '₹0',        '₹0',        '₹0'],
    ['ALB',           '₹487',     '₹536',      '₹975',      '₹5,364',    '₹49,251'],
    ['NAT Gateway',   '₹2,705',   '₹2,723',    '₹2,893',    '₹4,584',    '₹21,492'],
    ['Route 53',      '₹42',      '₹52',       '₹142',      '₹1,044',    '₹10,062'],
    ['DynamoDB',      '₹0',       '₹62',       '₹616',      '₹6,158',    '₹61,581'],
    ['S3',            '₹2',       '₹195',      '₹1,944',    '₹19,439',   '₹1,94,388'],
    ['Cognito',       '₹0',       '₹0',        '₹0',        '₹0',        '₹22,963'],
    ['VPC/SG/TG/EB',  '₹0',       '₹0',        '₹0',        '₹0',        '₹0'],
    ['TOTAL (w/ NAT)','₹4,020',   '₹4,994',    '₹11,959',   '₹57,511',   '₹4,62,751'],
    ['TOTAL (no NAT)','₹1,315',   '₹2,271',    '₹9,066',    '₹52,927',   '₹4,41,259'],
  ],
  y, [95, 82, 82, 82, 82, 82]
);

y += 5;
y = subTitle(doc, 'Per-User Cost Economics', y);
y = table(doc,
  ['Users', 'Total Bill (with NAT)', 'Total Bill (no NAT)', 'Cost Per User (w/NAT)', 'Cost Per User (no NAT)', 'Fixed vs Variable'],
  [
    ['1',          '₹4,020',    '₹1,315',    '₹4,020/user',   '₹1,315/user',  '99.9% fixed, 0.1% variable'],
    ['100',        '₹4,994',    '₹2,271',    '₹50/user',      '₹22.71/user',  '98.7% fixed, 1.3% variable'],
    ['1,000',      '₹11,959',   '₹9,066',    '₹11.96/user',   '₹9.07/user',   '90.8% fixed, 9.2% variable'],
    ['10,000',     '₹57,511',   '₹52,927',   '₹5.75/user',    '₹5.29/user',   '62.0% fixed, 38.0% variable'],
    ['1,00,000',   '₹4,62,751', '₹4,41,259', '₹4.63/user',    '₹4.41/user',   '32.0% fixed, 68.0% variable'],
  ],
  y, [65, 90, 90, 98, 98, 155]
);

y += 5;
y = subTitle(doc, 'Cost Comparison: Old Bill vs New Bill', y);
y = table(doc,
  ['Tier', 'Old Bill (wasted infra)', 'New Bill (1 user)', 'New Bill (100 users)', 'New Bill (1,000 users)', 'Monthly Savings'],
  [
    ['With NAT',    '₹7,463',  '₹4,020',  '₹4,994',   '₹11,959',  '—'],
    ['Without NAT', '₹7,463',  '₹1,315',  '₹2,271',   '₹9,066',   '₹6,148 saved at 1 user'],
  ],
  y, [75, 100, 90, 95, 100, 110]
);

y = infoBox(doc, [
  'BOTTOM LINE: At your current scale (small user base), the NAT Gateway ($32.40) is your #1 controllable cost.',
  'If your VPC uses public subnets → delete NAT Gateway → save ₹2,705 EVERY month permanently.',
  'The per-user variable cost (DynamoDB + S3 for one active user) is only ₹1.67/user — practically free at small scale.',
  'Infrastructure (EC2 + ALB) is what you pay whether you have 0 or 1,000 users. That\'s the nature of always-on servers.',
], y, COLORS.lightBlue, COLORS.accent);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 9 — OPTIMIZATION RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════════
pg = 9;
pageHeader(doc, pg);
pageFooter(doc);
y = 55;

y = sectionTitle(doc, '10  COST OPTIMIZATION RECOMMENDATIONS', y);

// Priority 1
y = subTitle(doc, 'PRIORITY 1 — Immediate Actions (saves ₹2,700–₹3,000/month)', y);
y = table(doc,
  ['Action', 'How', 'Monthly Saving', 'Difficulty'],
  [
    ['Delete NAT Gateway',        'AWS Console → VPC → NAT Gateways → Delete. Move EB to public subnets.',                           '₹2,705',    'Easy (30 min)'],
    ['Verify no eu-north-1 resources', 'Switch to eu-north-1 in AWS console. Check EC2, ALB, NAT, VPC. Delete anything found.',     '₹0–₹3,000', 'Easy (15 min)'],
    ['Delete unused S3 buckets',   'AWS Console → S3 → Delete old elasticbeanstalk-* and deployment buckets.',                       '₹100–₹500', 'Easy (20 min)'],
    ['Remove unused Route 53 zone','If not using custom domain, delete hosted zone. Save $0.50/month.',                              '₹42',       'Easy (5 min)'],
  ],
  y, [145, 180, 80, 90]
);

// Priority 2
y = subTitle(doc, 'PRIORITY 2 — Code Changes (saves ₹5,000–₹50,000/month at scale)', y);
y = table(doc,
  ['Action', 'Impact', 'Monthly Saving', 'Difficulty'],
  [
    ['Add DynamoDB GSI on userId',  'getAllUserPosts() does full table SCAN → Switch to Query with GSI. Reduces reads by 90–95%.',     '₹500–₹55,000', 'Medium (4 hrs)'],
    ['Add VPC Gateway Endpoints',   'Free endpoints for DynamoDB + S3. Traffic bypasses NAT Gateway → eliminates data processing cost.','₹200–₹1,300', 'Easy (1 hr)'],
    ['S3 Lifecycle Policies',       'Move media older than 90 days to S3 Glacier Instant Retrieval. Saves ~80% on storage cost.',     '₹1,500–₹1,55,000','Easy (1 hr)'],
    ['CloudFront CDN for S3',       'Serve images/audio via CloudFront. Reduces S3 GET requests and transfer cost by 60–70%.',        '₹120–₹1,16,000', 'Medium (3 hrs)'],
  ],
  y, [145, 175, 90, 85]
);

// Priority 3
y = subTitle(doc, 'PRIORITY 3 — Architecture Optimizations (for 10K+ users)', y);
y = table(doc,
  ['Action', 'Impact', 'Monthly Saving', 'Difficulty'],
  [
    ['EC2 Reserved Instances',      '1-year commitment → 30–40% discount on EC2. Only after confirming steady load.',                '₹6,000–₹40,000','Easy (billing)'],
    ['ElastiCache Redis',           'Cache DynamoDB reads for feed/journal. Reduces DynamoDB reads by 70%.',                         '₹43,000 at 100K users','Hard (8 hrs)'],
    ['Image compression on upload', 'Compress images to 300KB before S3 upload. Reduces S3 storage by 70–80%.',                     '₹1,360–₹1,55,000','Medium (3 hrs)'],
    ['Audio on-demand TTS',         'Generate audio on-demand via API instead of storing files. Eliminates audio S3 storage.',       '₹500–₹55,000',  'Medium (5 hrs)'],
    ['Downscale EC2 during off-hours','EB scheduled actions to scale down at night (10pm–7am IST). Indian market hours.',            '₹1,500–₹30,000','Medium (2 hrs)'],
  ],
  y, [145, 165, 100, 85]
);

// Optimized cost table
y = subTitle(doc, 'Optimized Cost After All Improvements — Per User Tier', y);
y = table(doc,
  ['Users', 'Current Bill', 'After Priority 1', 'After Priority 1+2', 'After All 3 Priorities', 'Final Savings'],
  [
    ['1',         '₹4,020',    '₹1,315',    '₹1,200',     '₹900',       '₹3,120 (78%)'],
    ['100',       '₹4,994',    '₹2,289',    '₹1,900',     '₹1,400',     '₹3,594 (72%)'],
    ['1,000',     '₹11,959',   '₹9,066',    '₹6,500',     '₹4,200',     '₹7,759 (65%)'],
    ['10,000',    '₹57,511',   '₹52,927',   '₹32,000',    '₹20,000',    '₹37,511 (65%)'],
    ['1,00,000',  '₹4,62,751', '₹4,41,259', '₹2,50,000',  '₹1,40,000',  '₹3,22,751 (70%)'],
  ],
  y, [75, 80, 90, 90, 100, 100]
);

y = infoBox(doc, [
  'SINGLE BIGGEST IMPACT: Add a DynamoDB GSI (Global Secondary Index) on authorUsername.',
  'This converts getAllUserPosts() from a full-table SCAN to a targeted Query → cuts DynamoDB read cost by 90%.',
  'At 1,00,000 users this change alone saves ₹55,000/month. It is a 4-hour code change.',
], y, COLORS.lightGreen, COLORS.green);

doc.addPage();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 10 — SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
pg = 10;
pageHeader(doc, pg);
pageFooter(doc);
y = 55;

y = sectionTitle(doc, 'EXECUTIVE SUMMARY', y);

y = kpiRow(doc, [
  { label: 'Old Monthly Bill', value: '₹7,500', sub: 'Zero users. 100% idle infra.', bg: COLORS.lightRed, border: COLORS.red, color: COLORS.red },
  { label: 'New Bill (1 User)', value: '₹1,315', sub: 'Without NAT Gateway', bg: COLORS.lightGreen, border: COLORS.green, color: COLORS.green },
  { label: 'Monthly Savings', value: '₹6,185', sub: '82% reduction achieved', bg: COLORS.lightBlue, border: COLORS.accent, color: COLORS.accent },
  { label: 'Per-User Variable', value: '₹1.67', sub: 'DynamoDB + S3 only', bg: COLORS.lightOrange, border: COLORS.orange, color: COLORS.orange },
], y);

y = subTitle(doc, 'The 5-Point Story of Your AWS Costs', y);

const story = [
  ['1. The ₹7,500 bill was a mistake, not usage.',
   'Elastic Beanstalk was deployed in 2 regions (Mumbai + Stockholm) and never cleaned up. NAT Gateways,\n   EC2 instances, and ALBs ran 24/7 with zero users for months.'],
  ['2. Your actual infrastructure needs are small.',
   'One EC2 t3.small + 1 ALB = ₹1,754/month covers you from 1 to ~500 users comfortably. That is your\n   true baseline cost.'],
  ['3. DynamoDB and S3 cost almost nothing at small scale.',
   'For 1 active user doing everything daily: DynamoDB = ₹0 (free tier), S3 = ₹1.67. Even at 100 users\n   these two services together cost only ₹257/month.'],
  ['4. The NAT Gateway is still your enemy.',
   'At ₹2,705/month fixed, it costs more than your EC2. If your EB environment uses public subnets,\n   delete it today and save ₹2,705 permanently starting this month.'],
  ['5. At scale, S3 and DynamoDB dominate.',
   'At 1,00,000 users: S3 = 42% of bill (₹1.94L). Fix: Lifecycle policies + CloudFront. DynamoDB = 13%\n   (₹61K). Fix: Add GSI index. Together these two optimizations save ₹2.09L/month.'],
];

story.forEach(([title, body]) => {
  doc.fontSize(9).fillColor(COLORS.primary).font('Helvetica-Bold').text(title, 50, y);
  y += 14;
  doc.fontSize(8.5).fillColor(COLORS.darkGray).font('Helvetica').text(body, 65, y, { width: PAGE_W - 15 });
  y += 32;
});

y = subTitle(doc, 'Quick Reference — When to Upgrade EC2', y);
y = table(doc,
  ['Monthly Active Users', 'Concurrent Users (est.)', 'Recommended EC2', 'Monthly EC2 Cost'],
  [
    ['1 – 200',          '1 – 20',       '1 × t3.micro or t3.small',   '₹625 – ₹1,267'],
    ['200 – 1,000',      '20 – 100',     '1 × t3.medium',              '₹2,536'],
    ['1,000 – 3,000',    '100 – 300',    '2 × t3.medium (HA)',          '₹5,072'],
    ['3,000 – 15,000',   '300 – 1,500',  '2–4 × t3.large',             '₹10,143 – ₹20,287'],
    ['15,000 – 50,000',  '1,500 – 5,000','4–6 × t3.xlarge',            '₹40,571 – ₹60,856'],
    ['50,000 – 1,00,000','5,000–10,000', '8–10 × t3.xlarge or c5.2xl', '₹81,141 – ₹1,01,427'],
  ],
  y, [130, 115, 130, 120]
);

y = infoBox(doc, [
  'RECOMMENDED NEXT STEPS:',
  '  1. Delete NAT Gateway (if public subnets) → saves ₹2,705/month immediately',
  '  2. Check eu-north-1 region for any leftover resources → delete all',
  '  3. Add DynamoDB GSI on authorUsername in neofeed-user-posts table',
  '  4. Set S3 Lifecycle Policy: Standard → Glacier after 90 days',
  '  5. Add VPC Gateway Endpoints for DynamoDB and S3 (free, eliminates NAT data charges)',
], y, COLORS.lightGreen, COLORS.green);

doc.end();

console.log('PDF generated successfully:', OUTPUT_PATH);
