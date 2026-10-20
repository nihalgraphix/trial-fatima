import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Sliders, ChevronRight, Scale } from 'lucide-react';
import { ProductImage } from '../common/ProductImage';

export const CompareProductsBar: React.FC = () => {
  const { products, compareProductIds, toggleCompareProduct, clearCompareProducts } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (compareProductIds.length === 0) return null;

  const compareProducts = compareProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);

  const attributes = [
    { label: 'Price', key: 'price', format: (v: number) => `₹${v}` },
    { label: 'Category', key: 'category' },
    { label: 'Brand', key: 'brand' },
    { label: 'Stock', key: 'stock' },
    { label: 'Rating', key: 'rating' },
  ];

  // Unique spec keys across all compared products
  const specKeys = Array.from(
    new Set(compareProducts.flatMap((p) => Object.keys(p?.specs || {})))
  );

  return (
    <>
      {/* Floating Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl bg-white border border-[#E8E8E3] shadow-xl rounded-2xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="flex -space-x-2">
            {compareProducts.map((p) => (
              <div key={p?.id} className="relative group shrink-0">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#F9F9F7] overflow-hidden shadow-sm">
                  <ProductImage imageKey={p?.images[0] || ''} name={p?.name || ''} className="w-full h-full object-contain" />
                </div>
                <button
                  onClick={() => p && toggleCompareProduct(p.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-[#171717]">
              Comparing {compareProducts.length} items
            </p>
            <p className="text-[10px] text-[#6B6B6B]">Add up to 4 items</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clearCompareProducts}
            className="text-[10px] font-bold text-[#6B6B6B] hover:text-rose-600 px-2 uppercase tracking-wider"
          >
            Clear
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#171717] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-black transition-all active:scale-95"
          >
            <Scale className="w-3.5 h-3.5" />
            Compare Now
          </button>
        </div>
      </div>

      {/* Comparison Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#E8E8E3] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#171717] tracking-tight">Product Comparison</h2>
                  <p className="text-[11px] text-[#6B6B6B]">Analyze specifications and features side-by-side</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-[#F7F8F3] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 bg-[#F9F9F7] rounded-tl-2xl border-b border-[#E8E8E3] w-40">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#71883F]">Feature</span>
                    </th>
                    {compareProducts.map((p, idx) => (
                      <th
                        key={p?.id}
                        className={`p-4 border-b border-[#E8E8E3] min-w-[200px] ${
                          idx === compareProducts.length - 1 ? 'rounded-tr-2xl' : ''
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="aspect-square w-24 bg-[#F9F9F7] rounded-xl overflow-hidden border border-[#E8E8E3]">
                            <ProductImage imageKey={p?.images[0] || ''} name={p?.name || ''} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#71883F] uppercase tracking-wider mb-1">{p?.brand}</p>
                            <h4 className="text-xs font-black text-[#171717] leading-tight line-clamp-2">{p?.name}</h4>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2EE]">
                  {attributes.map((attr) => (
                    <tr key={attr.key} className="hover:bg-[#F9F9F7]/50 transition-colors">
                      <td className="p-4 font-bold text-[11px] text-[#6B6B6B] bg-[#F9F9F7]/30">{attr.label}</td>
                      {compareProducts.map((p) => (
                        <td key={p?.id} className="p-4 text-xs font-black text-[#171717] tabular-nums">
                          {attr.format ? attr.format((p as any)[attr.key]) : (p as any)[attr.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  
                  {/* Specifications Section Header */}
                  <tr>
                    <td colSpan={compareProducts.length + 1} className="p-4 bg-[#F9F9F7] font-black text-[10px] uppercase tracking-widest text-[#71883F] border-y border-[#E8E8E3]">
                      Detailed Specifications
                    </td>
                  </tr>

                  {specKeys.map((key) => (
                    <tr key={key} className="hover:bg-[#F9F9F7]/50 transition-colors">
                      <td className="p-4 font-bold text-[11px] text-[#6B6B6B] bg-[#F9F9F7]/30">{key}</td>
                      {compareProducts.map((p) => (
                        <td key={p?.id} className="p-4 text-xs text-[#171717]">
                          {p?.specs?.[key] || <span className="text-[#A1A1A1] italic">N/A</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-[#F9F9F7] border-t border-[#E8E8E3] flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-[#E8E8E3] rounded-xl text-xs font-bold text-[#171717]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                }}
                className="px-6 py-2.5 bg-[#71883F] text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
