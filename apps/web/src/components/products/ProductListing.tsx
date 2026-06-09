"use client";

import React, { useState } from "react";
import { ProductCard, ProductCardData } from "./ProductCard";
import { Filter, LayoutGrid, List, X, ChevronDown } from "lucide-react";
import clsx from "clsx";

interface ProductListingProps {
  initialProducts: ProductCardData[];
}

export function ProductListing({ initialProducts }: ProductListingProps) {
  const [products] = useState<ProductCardData[]>(initialProducts);
  const [gridCols, setGridCols] = useState<2 | 4>(4);
  const [activeFilters, setActiveFilters] = useState<string[]>(["Clothing", "Black"]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const removeFilter = (filter: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filter));
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-16 lg:px-24 py-12 md:py-20 mt-10">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-surface pb-6 gap-6">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl text-text-primary mb-4">All Collection</h1>
          <p className="font-sans text-sm text-text-secondary">Showing {products.length} products</p>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            className="md:hidden flex items-center gap-2 font-sans text-[13px] uppercase tracking-wider text-text-primary"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
          
          <div className="hidden md:flex items-center gap-4">
            <span className="font-sans text-[11px] uppercase tracking-widest text-text-secondary">View</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setGridCols(2)}
                className={clsx("p-2 rounded-sm transition-colors", gridCols === 2 ? "bg-surface text-gold" : "text-text-secondary hover:text-text-primary")}
              >
                <List className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setGridCols(4)}
                className={clsx("p-2 rounded-sm transition-colors", gridCols === 4 ? "bg-surface text-gold" : "text-text-secondary hover:text-text-primary")}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="hidden md:block font-sans text-[11px] uppercase tracking-widest text-text-secondary">Sort by</span>
            <div className="relative group cursor-pointer border border-surface px-4 py-2 flex items-center justify-between min-w-[160px]">
              <span className="font-sans text-[13px] text-text-primary">Newest</span>
              <ChevronDown className="w-4 h-4 text-text-secondary group-hover:text-gold transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-12 items-start relative">
        
        {/* Sidebar Filters (Desktop Sticky / Mobile Modal) */}
        <div className={clsx(
          "w-full md:w-[240px] flex-shrink-0 transition-transform duration-300 md:transform-none z-50",
          "fixed inset-0 bg-primary md:bg-transparent md:sticky md:top-[100px] h-full md:h-auto overflow-y-auto md:overflow-visible p-6 md:p-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex justify-between items-center md:hidden mb-8">
            <h2 className="font-heading text-2xl text-text-primary">Filters</h2>
            <button onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6 text-text-primary" /></button>
          </div>

          <div className="flex flex-col gap-8">
            {/* Category Filter */}
            <div>
              <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary mb-4 pb-2 border-b border-surface">Category</h3>
              <div className="flex flex-col gap-3">
                {["Clothing", "Shoes", "Accessories", "Bags"].map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-4 h-4 border border-text-tertiary rounded-[1px] group-hover:border-gold flex items-center justify-center transition-colors">
                      {activeFilters.includes(cat) && <div className="w-2 h-2 bg-gold" />}
                    </div>
                    <span className="font-sans text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary mb-4 pb-2 border-b border-surface">Price</h3>
              <div className="flex flex-col gap-3">
                {["Under $100", "$100 - $300", "$300 - $500", "Over $500"].map(price => (
                  <label key={price} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-4 h-4 border border-text-tertiary rounded-[1px] group-hover:border-gold transition-colors" />
                    <span className="font-sans text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">{price}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Color Filter */}
            <div>
              <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary mb-4 pb-2 border-b border-surface">Color</h3>
              <div className="flex gap-3 flex-wrap">
                {['#000000', '#ffffff', '#808080', '#000080', '#8b4513'].map(color => (
                  <button 
                    key={color} 
                    className="w-6 h-6 rounded-full border border-surface hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <button 
            className="md:hidden mt-12 w-full bg-gold text-primary font-sans text-[13px] font-bold uppercase tracking-[0.15em] py-4 rounded-full"
            onClick={() => setIsSidebarOpen(false)}
          >
            Apply Filters
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full">
          
          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-8">
              {activeFilters.map(filter => (
                <div key={filter} className="flex items-center gap-2 bg-surface border border-gold/20 px-4 py-1.5 rounded-full">
                  <span className="font-sans text-[12px] text-gold">{filter}</span>
                  <button onClick={() => removeFilter(filter)} className="text-text-secondary hover:text-gold transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setActiveFilters([])}
                className="font-sans text-[12px] text-text-tertiary hover:text-text-primary underline ml-2 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Product Grid */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-text-tertiary" />
              </div>
              <h3 className="font-heading text-2xl text-text-primary mb-3">No products found</h3>
              <p className="font-sans text-text-secondary mb-8">Try adjusting your filters to find what you&apos;re looking for.</p>
              <button 
                onClick={() => setActiveFilters([])}
                className="btn-sweep bg-transparent border border-gold text-gold font-sans text-[13px] font-bold uppercase tracking-[0.15em] px-8 py-3 rounded-full"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className={clsx(
                "grid gap-6 md:gap-8",
                gridCols === 4 ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"
              )}>
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              <div className="flex justify-center mt-16">
                <button className="btn-sweep bg-transparent border border-gold text-gold font-sans text-[13px] font-bold uppercase tracking-[0.15em] px-10 py-4 rounded-full transition-colors">
                  Load More
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple internal icon for empty state
function Search(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}
