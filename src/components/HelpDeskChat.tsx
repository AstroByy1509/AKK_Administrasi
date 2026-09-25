import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export const HelpDeskChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Halo! Saya asisten virtual logistik. Ada yang bisa saya bantu terkait SOP atau formulir?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, terjadi kesalahan saat menghubungi server.' }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          <MessageSquare size={24} />
        </button>
      ) : (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-80 h-96 flex flex-col overflow-hidden">
          <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
            <h3 className="font-bold text-white">Help Desk AKK</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
                <span className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                  {msg.content}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-slate-700 flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              placeholder="Tanya SOP..."
            />
            <button onClick={handleSend} className="bg-indigo-600 text-white p-2 rounded-lg"><Send size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
};
