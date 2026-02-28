"use client";

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { ToolMessage } from './types';
import { Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ToolMessengerProps {
    rentalId: string;
    currentUserId: string;
}

export function ToolMessenger({ rentalId, currentUserId }: ToolMessengerProps) {
    const [messages, setMessages] = useState<ToolMessage[]>([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('tools_messages')
            .select('*')
            .eq('rental_id', rentalId)
            .order('created_at', { ascending: true });
        if (data) setMessages(data as ToolMessage[]);
        setLoading(false);
    };

    // Mark unread messages as read
    const markRead = async () => {
        await supabase
            .from('tools_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('rental_id', rentalId)
            .neq('sender_id', currentUserId)
            .is('read_at', null);
    };

    useEffect(() => {
        fetchMessages().then(markRead);
        const interval = setInterval(() => {
            fetchMessages().then(markRead);
        }, 3000);
        return () => clearInterval(interval);
    }, [rentalId, currentUserId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const send = async () => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;
        setSending(true);
        setText('');

        await supabase.from('tools_messages').insert({
            rental_id: rentalId,
            sender_id: currentUserId,
            body: trimmed,
        });

        setSending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 shrink-0">
                <Link href="/tools/rentals" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </Link>
                <div>
                    <h3 className="text-sm font-bold text-gray-900">Rental Chat</h3>
                    <p className="text-xs text-gray-400">#{rentalId.slice(0, 8)}</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {loading && <p className="text-center text-sm text-gray-400 py-4">Loading messages...</p>}
                {!loading && messages.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-10">
                        No messages yet. Start the conversation!
                    </p>
                )}
                {messages.map(msg => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm
                                ${isMe
                                    ? 'bg-primary text-white rounded-br-md'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                }`}>
                                <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {isMe && msg.read_at && ' · Read'}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 shrink-0">
                <div className="flex gap-2">
                    <textarea
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        rows={1}
                        maxLength={2000}
                        placeholder="Type a message..."
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        onClick={send}
                        disabled={!text.trim() || sending}
                        className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors shrink-0"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
