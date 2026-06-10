import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader, ShoppingCart, Star } from 'lucide-react';
import { useUIStore, useCartStore, useAuthStore } from '../../store';
import { aiAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const SUGGESTED_QUERIES = [
  'Suggest laptops under ₹60,000',
  'Best wireless headphones',
  'Gaming phones under ₹30,000',
  'Top rated cameras',
  'Budget smartwatches',
];

export default function AIChat() {
  const { chatOpen, toggleChat } = useUIStore();
  const { addToCart } = useCartStore();
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm ShopBot 🤖 — your AI shopping assistant. Ask me anything like *\"Suggest laptops under ₹60,000\"* or *\"Best wireless earbuds\"*!",
      products: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const query = text || input.trim();
    if (!query || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await aiAPI.chat({
        message: query,
        conversationHistory,
      });

      const assistantMsg = {
        role: 'assistant',
        content: data.reply,
        products: data.products || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', content: query },
        { role: 'assistant', content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble right now. Please try again!", products: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (productId) => {
    if (!token) { navigate('/login'); return; }
    addToCart(productId);
  };

  if (!chatOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 bg-amazon-orange hover:bg-yellow-500 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group"
        title="AI Shopping Assistant"
      >
        <Bot size={24} />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        <span className="absolute right-16 bottom-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          AI Shopping Assistant
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col animate-slide-up overflow-hidden"
      style={{ height: '600px', maxHeight: 'calc(100vh - 6rem)' }}>
      {/* Header */}
      <div className="bg-amazon-navy dark:bg-gray-800 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-amazon-orange rounded-full flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white text-sm">ShopBot AI</p>
          <p className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
            Online — Powered by Claude AI
          </p>
        </div>
        <button onClick={toggleChat} className="text-gray-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-amazon-orange rounded-full flex items-center justify-center mb-1">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div
                className={`rounded-2xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-amazon-orange text-white rounded-tr-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>

              {/* Product results */}
              {msg.products && msg.products.length > 0 && (
                <div className="mt-2 space-y-2">
                  {msg.products.slice(0, 4).map((product) => (
                    <div key={product._id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 flex gap-2 hover:border-amazon-orange transition-colors">
                      <img
                        src={product.images?.[0]?.url}
                        alt={product.name}
                        className="w-14 h-14 object-contain rounded-lg bg-gray-50 flex-shrink-0"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/56x56/f3f4f6/9ca3af?text=?'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${product._id}`} onClick={toggleChat}
                          className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-amazon-orange transition-colors">
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={10} className="text-amazon-orange fill-amazon-orange" />
                          <span className="text-xs text-gray-500">{product.ratings}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            ₹{product.price?.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => handleAddToCart(product._id)}
                            className="bg-amazon-orange hover:bg-yellow-500 text-white text-xs px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <ShoppingCart size={10} /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {msg.products.length > 4 && (
                    <Link
                      to={`/products?search=${encodeURIComponent(messages.find((m, idx) => idx === i - 1)?.content || '')}`}
                      onClick={toggleChat}
                      className="block text-center text-xs text-amazon-orange hover:underline py-1"
                    >
                      View all {msg.products.length} results →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amazon-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-amazon-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-amazon-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested queries */}
      {messages.length === 1 && (
        <div className="px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-1">
            {SUGGESTED_QUERIES.map((q) => (
              <button key={q} onClick={() => sendMessage(q)}
                className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-amazon-orange hover:text-white text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={loading}
            className="flex-1 input text-sm py-2"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-amazon-orange hover:bg-yellow-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
