process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

// Connection string comes ONLY from POSTGRES_URL (set in .env.local).
// There is no hardcoded fallback — a dead/typo'd host here used to masquerade
// as a silent ENOTFOUND instead of a clear "env var missing" error.
const connStr = process.env.POSTGRES_URL;
if (!connStr) {
  console.error('❌ POSTGRES_URL is not set.');
  console.error('   Run with: node --env-file=.env.local scripts/seed-sold-tags.cjs');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
});

const PURITY = {
  '22K': 0.9167,
  '18K': 0.7500,
  '14K': 0.5833,
  '24K': 1.0000,
  '916': 0.9160,
  '999': 0.9990,
};

// [item name, purity, grossWt range, stoneWt range, lessWt range]
const CATALOG = [
  ['Gold Ring',           '22K', [3.2, 12.5],   [0.0, 1.8], [0.0, 0.3]],
  ['Gold Chain',          '22K', [8.0, 45.0],   [0.0, 0.5], [0.0, 0.4]],
  ['Gold Bangle',         '22K', [10.0, 38.0],  [0.0, 0.6], [0.0, 0.5]],
  ['Gold Necklace',       '22K', [18.0, 95.0],  [0.0, 4.5], [0.0, 1.0]],
  ['Gold Earring',        '22K', [2.0, 9.0],    [0.0, 1.2], [0.0, 0.2]],
  ['Gold Pendant',        '22K', [2.5, 14.0],   [0.0, 2.0], [0.0, 0.3]],
  ['Diamond Ring',        '18K', [3.5, 8.5],    [0.2, 1.6], [0.0, 0.2]],
  ['Diamond Earring',     '18K', [2.2, 6.5],    [0.2, 1.4], [0.0, 0.2]],
  ['Gold Bracelet',       '916', [12.0, 40.0],  [0.0, 0.8], [0.0, 0.6]],
  ['Gold Coin',           '24K', [5.0, 50.0],   [0.0, 0.0], [0.0, 0.0]],
  ['Silver Anklet',       '999', [15.0, 60.0],  [0.0, 0.5], [0.0, 0.4]],
  ['Gold Nose Pin',       '14K', [0.6, 2.0],    [0.0, 0.4], [0.0, 0.1]],
  ['Gold Mangalsutra',    '22K', [8.0, 30.0],   [0.0, 2.5], [0.0, 0.5]],
  ['Gold Kada',           '916', [20.0, 55.0],  [0.0, 0.7], [0.0, 0.6]],
];

const BUSINESSES = [
  'Shree Jewellers',
  'Khandelwal Gold House',
  'Panchratna Ornaments',
  'Sona Baazar',
  'Tanishq Retail',
  'OM Gold & Diamonds',
];

function rnd(min, max, dp = 3) {
  const v = min + Math.random() * (max - min);
  return Number(v.toFixed(dp));
}
function pad(n, len) { return String(n).padStart(len, '0'); }

async function main() {
  // 1) Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.sold_tags (
      id            bigserial PRIMARY KEY,
      tag_id        text NOT NULL,
      item_name     text NOT NULL,
      purity        text,
      gross_wt      numeric(12,3) NOT NULL DEFAULT 0,
      stone_wt      numeric(12,3) NOT NULL DEFAULT 0,
      less_wt       numeric(12,3) NOT NULL DEFAULT 0,
      net_wt        numeric(12,3) NOT NULL DEFAULT 0,
      fine_wt       numeric(12,3) NOT NULL DEFAULT 0,
      sale_date     date NOT NULL,
      vch_id        text NOT NULL,
      business_name text,
      created_at    timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_sold_tags_date ON public.sold_tags(sale_date);
    CREATE INDEX IF NOT EXISTS idx_sold_tags_vch  ON public.sold_tags(vch_id);
    CREATE INDEX IF NOT EXISTS idx_sold_tags_item ON public.sold_tags(item_name);
  `);
  console.log('✓ table ready');

  const { rows: cnt } = await pool.query('SELECT count(*)::int AS c FROM public.sold_tags');
  if (cnt[0].c > 0) {
    console.log(`✓ already has ${cnt[0].c} rows — skipping seed`);
    await pool.end();
    return;
  }

  // 2) Seed ~160 rows across 2026-03-01 .. 2026-07-15
  const today = new Date('2026-07-15T00:00:00Z');
  const start = new Date('2026-03-01T00:00:00Z');
  const spanDays = Math.round((today - start) / 86400000);

  const rows = [];
  let tagSeq = 1001;
  let vchSeq = 1;
  const vchDateMap = {}; // approximate voucher number per day

  for (let i = 0; i < 170; i++) {
    const cat = CATALOG[Math.floor(Math.random() * CATALOG.length)];
    const [item, purity, gR, sR, lR] = cat;
    const gross = rnd(gR[0], gR[1]);
    const stone = rnd(sR[0], sR[1]);
    const less = rnd(lR[0], lR[1]);
    const net = Number((gross - stone - less).toFixed(3));
    const fine = Number((Math.max(net, 0) * PURITY[purity]).toFixed(3));

    const d = new Date(start.getTime() + Math.floor(Math.random() * (spanDays + 1)) * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const ym = dateStr.slice(0, 7);
    vchDateMap[ym] = (vchDateMap[ym] || 0) + 1;
    const vchId = `VCH-${ym}-${pad(vchDateMap[ym], 4)}`;

    const business = BUSINESSES[Math.floor(Math.random() * BUSINESSES.length)];
    const tagId = `TAG-${pad(tagSeq++, 5)}`;

    rows.push([tagId, item, purity, gross, stone, less, net, fine, dateStr, vchId, business]);
  }

  const insert = `
    INSERT INTO public.sold_tags
      (tag_id, item_name, purity, gross_wt, stone_wt, less_wt, net_wt, fine_wt, sale_date, vch_id, business_name)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
  `;
  for (const r of rows) {
    await pool.query(insert, r);
  }
  console.log(`✓ seeded ${rows.length} rows`);
  await pool.end();
}

main().catch(e => { console.error('ERR', e); process.exit(1); });
