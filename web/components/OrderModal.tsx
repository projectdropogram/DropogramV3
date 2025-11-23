import React, { useState } from 'react';

interface Product {
    id: string;
    title: string;
    price: number;
}

interface OrderModalProps {
    product: Product;
    onClose: () => void;
    onConfirm: () => void;
}

export function OrderModal({ product, onClose, onConfirm }: OrderModalProps) {
    const [loading, setLoading] = useState(false);
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        setLoading(false);
        onConfirm();
    };

    // Simple formatting for card number (groups of 4)
    const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            setCardNumber(parts.join(' '));
        } else {
            setCardNumber(v);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Checkout</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6 bg-gray-50 p-4 rounded-xl">
                        <div className="bg-orange-100 p-3 rounded-lg text-2xl">🥘</div>
                        <div>
                            <h4 className="font-bold text-gray-900">{product.title}</h4>
                            <p className="text-primary font-bold">${product.price.toFixed(2)}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                            <input
                                type="text"
                                placeholder="0000 0000 0000 0000"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                value={cardNumber}
                                onChange={handleCardChange}
                                maxLength={19}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                                <input
                                    type="text"
                                    placeholder="MM/YY"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    maxLength={5}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                                <input
                                    type="text"
                                    placeholder="123"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    value={cvc}
                                    onChange={(e) => setCvc(e.target.value)}
                                    maxLength={3}
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover transition-all transform active:scale-95 shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin">↻</span> Processing...
                                    </>
                                ) : (
                                    `Pay $${product.price.toFixed(2)}`
                                )}
                            </button>
                            <p className="text-xs text-center text-gray-400 mt-3">
                                🔒 Secure Payment (Simulation Mode)
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
