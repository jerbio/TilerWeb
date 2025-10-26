import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sitemapPath = join(__dirname, '../public/sitemap.xml');

try {
  // Read the sitemap file
  let sitemap = readFileSync(sitemapPath, 'utf8');
  
  // Get current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Replace all lastmod dates with today's date
  sitemap = sitemap.replace(
    /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g,
    `<lastmod>${today}</lastmod>`
  );
  
  // Write the updated sitemap back
  writeFileSync(sitemapPath, sitemap, 'utf8');
  
  console.log(`✅ Sitemap updated successfully with date: ${today}`);
} catch (error) {
  console.error('❌ Error updating sitemap:', error.message);
  process.exit(1);
}
