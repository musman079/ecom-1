import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { Normalizer } from './Normalizer';
import { Product } from '../models/Product';
import { connectDB } from '../config/db';
import fs from 'fs/promises';
import path from 'path';

export interface RawProductData {
  sku: string | null;
  title: string;
  brand: string;
  url: string;
  images: string[];
  price: number;
  discount_price: number | null;
  in_stock: boolean;
  description: string;
}

export abstract class BaseScraper {
  protected browser!: Browser;
  protected context!: BrowserContext;
  public brandName: string;

  constructor(brandName: string) {
    this.brandName = brandName;
  }

  /**
   * Initializes the Playwright browser
   */
  public async init() {
    console.log(`[${this.brandName}] Initializing browser...`);
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    // Connect to DB if not already
    await connectDB();
  }

  /**
   * Closes the Playwright browser
   */
  public async close() {
    if (this.browser) {
      await this.browser.close();
      console.log(`[${this.brandName}] Browser closed.`);
    }
  }

  /**
   * Main execution method that subclasses must implement
   */
  public abstract scrape(): Promise<void>;

  /**
   * Utility to normalize raw product data and save it to MongoDB
   */
  protected async saveProduct(rawProduct: RawProductData) {
    try {
      const normalizedData = Normalizer.extractAttributes(rawProduct.title, rawProduct.description);
      
      const productPayload = {
        ...rawProduct,
        ...normalizedData,
        // If it's invalid, we nullify the SKU to avoid uniqueness constraint issues,
        // unless you specifically want to track missing SKUs via some logic.
        // We'll keep the sku but flag is_valid = false based on the Normalizer.
        sku: normalizedData.is_valid ? rawProduct.sku : null
      };

      // Upsert to MongoDB
      // Use URL as backup unique identifier if SKU is null for upsert lookup
      const filter = productPayload.sku 
        ? { sku: productPayload.sku, brand: this.brandName }
        : { url: productPayload.url, brand: this.brandName };

      await Product.findOneAndUpdate(
        filter,
        productPayload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      
      console.log(`[${this.brandName}] Saved product: ${productPayload.title} | Valid: ${productPayload.is_valid}`);
    } catch (error) {
      console.error(`[${this.brandName}] Error saving product ${rawProduct.url}:`, error);
    }
  }

  /**
   * Utility to auto-scroll a page to load lazy items
   */
  protected async autoScroll(page: Page) {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
}
