import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Plus,
  Trash2,
  X,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { Product, Order, OrderItem } from '../../types';
import { useStore } from '../../context/StoreContext';
import { InvoiceModal } from '../checkout/InvoiceModal';

interface POSCartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export const AdminBillingPOS: React.FC = () => {
  const { products, categories, createDirectOrder, storeSettings, showToast } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<POSCartItem[]>([]);

  // Customer Details Form
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GPay / UPI' | 'Card' | 'Store Credit'>('Cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Generated Order Modal
  const [generatedOrder, setGeneratedOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const totalDiscount = Math.min(discountAmount, subtotal);
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`${product.name} is currently out of stock!`, 'error');
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        if (currentQty >= product.stock) {
          showToast(`Maximum available stock reached for ${product.name} (${product.stock} in stock).`, 'info');
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [...prev, { product, quantity: 1, unitPrice: product.price }];
      }
    });
  };

  // Adjust Quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              showToast(`Only ${item.product.stock} units available in stock.`, 'info');
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  // Remove Item
  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Clear Cart
  const handleClearCart = () => {
    setCart([]);
    setDiscountAmount(0);
  };

  // Generate Bill & Complete Sale
  const handleGenerateBill = async () => {
    if (cart.length === 0) {
      showToast('Please select at least one item to generate a bill.', 'error');
      return;
    }

    const posInvoiceId = `POS-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderItems: OrderItem[] = cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.unitPrice,
      mrp: item.product.mrp || item.unitPrice,
      quantity: item.quantity,
      image: item.product.images?.[0] || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80',
      sku: item.product.sku,
    }));

    const newOrderData: Partial<Order> = {
      id: posInvoiceId,
      date: new Date().toISOString().split('T')[0],
      customerName: customerName || 'Outlet Walk-in Customer',
      email: customerEmail || 'walkin@fathimastores.com',
      phone: customerPhone || '+91 98450 12345',
      shippingAddress: {
        fullName: customerName || 'Outlet Walk-in Customer',
        phone: customerPhone || '+91 98450 12345',
        email: customerEmail || 'walkin@fathimastores.com',
        house: 'Fathima Stores Outlet Counter',
        street: 'Commercial Complex, MG Road',
        area: 'Central Trivandrum',
        city: 'Trivandrum',
        district: 'Trivandrum',
        state: 'Kerala',
        pinCode: '695001',
      },
      deliveryMethod: 'In-Store Counter Pickup',
      paymentMethod: paymentMethod === 'GPay / UPI' ? 'UPI' : paymentMethod,
      paymentStatus: 'Paid',
      orderStatus: 'Delivered',
      items: orderItems,
      subtotal,
      discount: totalDiscount,
      deliveryCharge: 0,
      total: grandTotal,
      paidAmount: grandTotal,
      outstandingBalance: 0,
    };

    try {
      const createdOrder = await createDirectOrder(newOrderData);
      setGeneratedOrder(createdOrder);
      setIsInvoiceOpen(true);
      showToast(`Bill #${posInvoiceId} generated successfully! Total: ₹${grandTotal}`, 'success');
    } catch (error) {
      console.error("Error creating direct order:", error);
      showToast("Failed to generate bill. Please try again.", "error");
    }
  };


  return (
    <div className="p-4 sm:p-6 space-y-6 text-xs text-left">
      {/* POS Counter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E8E3] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#71883F] text-white flex items-center justify-center font-bold shadow-2xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#171717] tracking-tight">
              In-Store Outlet Billing & POS Counter
            </h2>
            <p className="text-[11px] text-[#6B6B6B] mt-0.2">
              Select items purchased by walk-in customers, apply discounts, and generate printable GST tax invoices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-[#FAF7F2] px-3.5 py-2 rounded-xl border border-[#E8E8E3] flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#71883F]" />
            <div>
              <span className="text-[10px] text-[#6B6B6B] block">Cart Selected Items</span>
              <span className="font-extrabold text-[#171717]">
                {cart.reduce((a, b) => a + b.quantity, 0)} Items
              </span>
            </div>
          </div>

          <div className="bg-[#EFF4E6] px-3.5 py-2 rounded-xl border border-[#71883F]/30 flex items-center gap-2 text-[#71883F]">
            <Sparkles className="w-4 h-4" />
            <div>
              <span className="text-[10px] text-[#71883F] font-semibold block uppercase">Total Payable</span>
              <span className="font-extrabold text-sm">₹{grandTotal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selection Catalog (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E8E8E3] rounded-2xl shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h3 className="font-extrabold text-sm text-[#171717] uppercase tracking-wider flex items-center gap-2">
              <span>Select Outlet Items</span>
              <span className="text-[11px] font-mono text-[#6B6B6B] bg-neutral-100 px-2 py-0.5 rounded font-normal">
                {filteredProducts.length} Available
              </span>
            </h3>

            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or SKU..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-[#FAF7F2] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
              />
              <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-[#71883F] text-white shadow-2xs'
                  : 'bg-[#FAF7F2] text-[#6B6B6B] border border-[#E8E8E3] hover:text-[#171717]'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? 'bg-[#71883F] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#6B6B6B] border border-[#E8E8E3] hover:text-[#171717]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full p-8 text-center text-[#6B6B6B]">
                No matching products found. Try adjusting your search query.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                const pImage = product.images?.[0] || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80';
                return (
                  <div
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className={`border rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer hover:shadow-md relative ${
                      inCart
                        ? 'border-[#71883F] bg-[#EFF4E6]/40'
                        : product.stock <= 0
                        ? 'opacity-50 border-neutral-200 bg-neutral-50 cursor-not-allowed'
                        : 'border-[#E8E8E3] bg-white hover:border-[#71883F]'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-[#71883F] text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">
                        {inCart.quantity}
                      </span>
                    )}

                    <div className="space-y-2">
                      <div className="w-full h-24 rounded-lg bg-neutral-100 overflow-hidden flex items-center justify-center">
                        <img
                          src={pImage}
                          alt={product.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>

                      <div>
                        <span className="text-[9px] text-[#6B6B6B] font-mono block uppercase">
                          {product.sku}
                        </span>
                        <h4 className="font-bold text-xs text-[#171717] line-clamp-2 leading-tight">
                          {product.name}
                        </h4>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#E8E8E3] flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-sm text-[#71883F]">₹{product.price}</span>
                        <span className="text-[10px] text-[#6B6B6B] block">
                          Stock: {product.stock}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={product.stock <= 0}
                        className="p-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg transition-colors cursor-pointer disabled:bg-neutral-300"
                        title="Add to Outlet Bill"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Outlet Cart & Bill Generation Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E8E8E3] rounded-2xl shadow-2xs p-5 space-y-5 flex flex-col justify-between min-h-[620px]">
          <div className="space-y-4">
            {/* Header & Clear */}
            <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-3">
              <h3 className="font-extrabold text-sm text-[#171717] uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#71883F]" />
                Outlet Billing Cart ({cart.length})
              </h3>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Clear Cart
                </button>
              )}
            </div>

            {/* Customer Info Form */}
            <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8E8E3] space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#171717] block mb-1 text-[11px]">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs outline-none focus:border-[#71883F]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1 text-[11px]">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs outline-none focus:border-[#71883F]"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="font-semibold text-[#171717] block mb-1 text-[11px]">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Cash', 'GPay / UPI', 'Card', 'Store Credit'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-[#71883F] text-white shadow-2xs'
                          : 'bg-white text-[#171717] border border-[#E8E8E3] hover:bg-neutral-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Items List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-[#6B6B6B] border border-dashed border-[#E8E8E3] rounded-xl space-y-2">
                  <ShoppingBag className="w-6 h-6 text-[#E8E8E3] mx-auto" />
                  <p className="font-semibold text-xs text-[#171717]">No items added to bill yet</p>
                  <p className="text-[10px]">Click any product on the left catalog to add it to this sale.</p>
                </div>
              ) : (
                cart.map((item) => {
                  const itemImg = item.product.images?.[0] || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80';
                  return (
                    <div
                      key={item.product.id}
                      className="p-2.5 bg-white border border-[#E8E8E3] rounded-xl flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <img
                          src={itemImg}
                          alt={item.product.name}
                          className="w-9 h-9 object-contain rounded bg-neutral-50 shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-[#171717] truncate">{item.product.name}</h5>
                          <div className="flex items-center gap-2 text-[10px] text-[#6B6B6B]">
                            <span>₹{item.unitPrice} each</span>
                            <span className="font-mono">SKU: {item.product.sku}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-md bg-[#FAF7F2] hover:bg-[#E8E8E3] text-[#171717] flex items-center justify-center font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-extrabold text-xs tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-md bg-[#FAF7F2] hover:bg-[#E8E8E3] text-[#171717] flex items-center justify-center font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right shrink-0 min-w-[50px]">
                        <span className="font-bold text-xs text-[#71883F] tabular-nums block">
                          ₹{item.unitPrice * item.quantity}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bill Calculation & Generate Button */}
          <div className="pt-3 border-t border-[#E8E8E3] space-y-3">
            {/* Discount Input */}
            <div className="flex items-center justify-between gap-2">
              <label className="font-semibold text-[#171717] text-[11px]">Special Discount (₹):</label>
              <input
                type="number"
                min={0}
                max={subtotal}
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-24 px-2 py-1 bg-[#FAF7F2] border border-[#E8E8E3] rounded-lg text-right font-bold text-xs text-[#71883F] outline-none"
              />
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E8E3]">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Outlet Items Subtotal:</span>
                <span className="font-semibold text-[#171717] tabular-nums">₹{subtotal}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Applied Discount:</span>
                  <span className="tabular-nums">-₹{totalDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-[#6B6B6B] text-[10px]">
                <span>GST Tax (Included 18%):</span>
                <span className="font-mono">₹{(grandTotal * 0.18 / 1.18).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm font-extrabold text-[#171717] pt-2 border-t border-[#E8E8E3]">
                <span>Final Payable Bill Amount:</span>
                <span className="text-[#71883F] tabular-nums text-base">₹{grandTotal}</span>
              </div>
            </div>

            {/* Generate Bill Button */}
            <button
              type="button"
              onClick={handleGenerateBill}
              disabled={cart.length === 0}
              className="w-full py-3 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all duration-150 cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              <Receipt className="w-4 h-4" />
              <span>Generate Tax Invoice & Print Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formatted Bill Printable Modal */}
      {generatedOrder && (
        <InvoiceModal
          order={generatedOrder}
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}
    </div>
  );
};
