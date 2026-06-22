import { KhaadiScraper } from './brands/khaadi/scraper';
import mongoose from 'mongoose';

async function main() {
  console.log('Starting Scraper Pipeline...');

  const khaadi = new KhaadiScraper();
  
  // You can run multiple scrapers sequentially or with Promise.all
  await khaadi.scrape();

  console.log('All scrapers finished. Disconnecting from DB...');
  await mongoose.disconnect();
}

main().catch(console.error);
