import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, type ChatMessage } from '@/lib/supabase';
import { Headset, X, Send, Check, Loader2, MessageCircle } from 'lucide-react';

const STORAGE_KEY = 'spl_support_conversation';

type StoredConversation = {
  ticketId: string;
  customerName: string;
  customerEmail: string;
};

function loadStoredConversation(): StoredConversation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredConversation;
  } catch {
    return null;
  }
}

function saveStoredConversation(conv: StoredConversation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conv));
}

function clearStoredConversation() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function SupportButton() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<StoredConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Registration form state (first-time visitor)
  const [regForm, setRegForm] = useState({ name: '', email: '' });
  const [registering, setRegistering] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load stored conversation on mount
  useEffect(() => {
    const stored = loadStoredConversation();
    if (stored) setConversation(stored);
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (ticketId: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
    setLoadingMessages(false);
    scrollToBottom();
  }, [scrollToBottom]);

  // When chat opens, load messages for existing conversation
  useEffect(() => {
    if (open && conversation) {
      loadMessages(conversation.ticketId);
    }
  }, [open, conversation, loadMessages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!open || !conversation) return;

    const channel = supabase
      .channel(`support-chat-${conversation.ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${conversation.ticketId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, conversation, scrollToBottom]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, scrollToBottom]);

  // Start a new conversation (registration)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!regForm.name || !regForm.email) return;
    setRegistering(true);

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        customer_name: regForm.name,
        customer_email: regForm.email,
        status: 'open',
      })
      .select()
      .single();

    if (ticketError || !ticket) {
      setError('Could not start conversation. Please try again.');
      setRegistering(false);
      return;
    }

    const conv: StoredConversation = {
      ticketId: ticket.id,
      customerName: regForm.name,
      customerEmail: regForm.email,
    };
    saveStoredConversation(conv);
    setConversation(conv);
    setRegForm({ name: '', email: '' });
    setRegistering(false);
    setMessages([]);
  };

  // Send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;
    setSubmitting(true);
    setError('');

    const msgText = newMessage.trim();
    setNewMessage('');

    const { data, error: msgError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: conversation.ticketId,
        sender: 'customer',
        message: msgText,
      })
      .select()
      .single();

    if (msgError || !data) {
      setError('Failed to send message. Please try again.');
      setNewMessage(msgText);
      setSubmitting(false);
      return;
    }

    // Update ticket status to open if it was replied/closed
    await supabase
      .from('support_tickets')
      .update({ status: 'open', updated_at: new Date().toISOString() })
      .eq('id', conversation.ticketId);

    setMessages((prev) => [...prev, data as ChatMessage]);
    setSubmitting(false);
    scrollToBottom();
  };

  // Start a new conversation (reset)
  const handleResetConversation = () => {
    clearStoredConversation();
    setConversation(null);
    setMessages([]);
    setError('');
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-gold-400 shadow-lg transition-all hover:scale-105 hover:bg-ink-800 hover:shadow-xl active:scale-95"
        aria-label="Customer Support"
      >
        {open ? <X className="h-6 w-6" /> : <Headset className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-gold-500" />
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm animate-fade-in-up">
          <div className="flex max-h-[70vh] flex-col rounded-2xl bg-white shadow-2xl border border-ink-200 overflow-hidden">
            {/* Header */}
            <div className="bg-ink-950 px-5 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500">
                    <Headset className="h-5 w-5 text-ink-950" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-white">Customer Support</h3>
                    <p className="text-xs text-ink-400">
                      {conversation ? `Signed in as ${conversation.customerName}` : We'll get back to you in a few minutes.}
                    </p>
                  </div>
                </div>
                {conversation && (
                  <button
                    onClick={handleResetConversation}
                    className="text-xs text-ink-400 hover:text-gold-400 transition-colors"
                    title="Start a new conversation"
                  >
                    New chat
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
              {conversation ? (
                /* Chat view */
                <div className="flex flex-col">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-ink-300" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center py-10 px-5 text-center">
                      <MessageCircle className="h-10 w-10 text-ink-200 mb-3" />
                      <p className="text-sm text-ink-500">Send a message to start the conversation.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                              msg.sender === 'customer'
                                ? 'bg-gold-500 text-ink-950 rounded-br-sm'
                                : 'bg-ink-100 text-ink-800 rounded-bl-sm'
                            }`}
                          >
                            <p className="whitespace-pre-line">{msg.message}</p>
                            <p className={`mt-1 text-[10px] ${msg.sender === 'customer' ? 'text-ink-700/60' : 'text-ink-400'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              ) : (
                /* Registration form (first time) */
                <div className="p-5">
                  <div className="flex flex-col items-center py-4 text-center mb-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/10 mb-3">
                      <MessageCircle className="h-7 w-7 text-gold-600" />
                    </div>
                    <h4 className="font-serif text-base font-semibold text-ink-900 mb-1">Start a Conversation</h4>
                    <p className="text-sm text-ink-500">Tell us your name and email so we can reply to you.</p>
                  </div>
                  <form onSubmit={handleRegister} className="space-y-3">
                    {error && (
                      <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{error}</div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-ink-700 mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        className="input py-2 text-sm"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-700 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        className="input py-2 text-sm"
                        placeholder="your@email.com"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={registering}
                      className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
                    >
                      {registering ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Starting...</>
                      ) : (
                        <>Start Chatting</>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Message input (only when conversation exists) */}
            {conversation && (
              <div className="border-t border-ink-100 p-3 shrink-0">
                {error && (
                  <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700 mb-2">{error}</div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <textarea
                    rows={1}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    className="flex-1 resize-none rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/15 transition-colors max-h-24"
                    placeholder="Type your message..."
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newMessage.trim()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-gold-400 transition-all hover:bg-ink-800 disabled:opacity-40 active:scale-95"
                    aria-label="Send message"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
