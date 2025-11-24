import React from 'react';
import { X } from 'lucide-react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-heading font-bold text-secondary">Terms and Conditions</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto text-gray-600 space-y-4 leading-relaxed font-body">
                    <p><strong>Last Updated: November 24, 2025</strong></p>

                    <h3 className="text-lg font-bold text-secondary mt-4">1. Introduction</h3>
                    <p>Welcome to Dropogram. By accessing or using our platform, you agree to be bound by these Terms and Conditions and our Privacy Policy.</p>

                    <h3 className="text-lg font-bold text-secondary mt-4">2. User Accounts</h3>
                    <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>

                    <h3 className="text-lg font-bold text-secondary mt-4">3. Producer Responsibilities</h3>
                    <p>Producers on Dropogram are independent sellers. Dropogram is not responsible for the quality, safety, or legality of the items offered. Producers must comply with all local laws and regulations regarding food safety and sales.</p>

                    <h3 className="text-lg font-bold text-secondary mt-4">4. Orders and Payments</h3>
                    <p>All payments are processed securely. Dropogram acts as a venue for users to discover and purchase homemade goods. Refunds and cancellations are subject to the individual Producer's policy and Dropogram's dispute resolution process.</p>

                    <h3 className="text-lg font-bold text-secondary mt-4">5. Prohibited Conduct</h3>
                    <p>You agree not to use the service for any unlawful purpose or to solicit others to perform or participate in any unlawful acts.</p>

                    <h3 className="text-lg font-bold text-secondary mt-4">6. Limitation of Liability</h3>
                    <p>Dropogram shall not be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>

                    <p className="mt-8 text-sm text-gray-500">For full terms, please contact legal@dropogram.com</p>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}
