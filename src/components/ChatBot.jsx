import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Sparkles } from 'lucide-react';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your autism support assistant powered by Google Gemini AI. I can help answer questions about child development, autism screening, and provide guidance for parents. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = async (userMessage) => {
    try {
      // Call the actual Gemini API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyAqbuSHo7sXRMaXl-dEDayUWSIpiYD_nAY', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful autism support assistant. Be warm, professional, and informative. Focus on child development, autism screening, parenting guidance, and communication support. Keep responses concise (2-3 sentences max) and parent-friendly. 

User message: "${userMessage}"

Provide a helpful response:`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      const data = await response.json();
      const botResponse = data.candidates[0]?.content?.parts[0]?.text;
      
      if (botResponse) {
        return botResponse.trim();
      } else {
        throw new Error('No response from API');
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Fallback responses for when API fails
      const lowerMessage = userMessage.toLowerCase();
      
      // Handle greetings
      if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
        return "Hello! I'm here to help with any questions about child development, autism screening, or parenting support. What would you like to know?";
      }
      
      // Handle thanks
      if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
        return "You're welcome! I'm always here if you need more support or have questions about your child's development.";
      }
      
      // Handle goodbye
      if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
        return "Goodbye! Remember, you're doing a great job as a parent. Feel free to come back anytime you need support!";
      }
      
      // Keyword-based fallbacks
      if (lowerMessage.includes('autism') || lowerMessage.includes('screening')) {
        return "Autism screening tools help identify developmental differences early. The screening looks at areas like social communication, repetitive behaviors, and sensory processing. Remember, screening is just one piece of the puzzle.";
      } else if (lowerMessage.includes('talk') || lowerMessage.includes('speech') || lowerMessage.includes('communicat')) {
        return "Speech and communication development is unique for each child. Try creating opportunities for communication throughout your day - describe what you're doing, ask simple questions, and celebrate their attempts to communicate.";
      } else if (lowerMessage.includes('play') || lowerMessage.includes('activities')) {
        return "Play is how children learn! For social development, try turn-taking games, pretend play, and activities that involve sharing. Follow your child's interests - that's where the best learning happens!";
      } else if (lowerMessage.includes('worry') || lowerMessage.includes('concern')) {
        return "It's natural to have concerns about your child's development. Trust your instincts - you know your child best. If something feels off, it's always worth checking with a professional.";
      } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
        return "There are many types of support available! Early intervention services, speech therapy, occupational therapy, and developmental specialists can all help. You don't have to navigate this journey alone.";
      } else {
        return "That's a great question about child development. Every child develops at their own pace, but there are certain milestones we look for in areas like social interaction, communication, and behavior. Is there something specific you'd like to know?";
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(async () => {
      const botResponse = await generateBotResponse(inputText);
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="relative group"
        >
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-bio-teal rounded-full animate-pulse-glow"></div>
          <div className="absolute bottom-full mb-3 right-0 bio-glass text-bio-text-primary text-sm px-4 py-2 rounded-bio-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-bio-card">
            Need help? Chat with me!
          </div>
          <div className="bio-glass-hover w-16 h-16 bio-glow-teal rounded-full flex items-center justify-center group-hover:scale-105 transition-all bio-focus-ring">
            <MessageCircle className="w-7 h-7 text-bio-text-primary" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bio-glass rounded-bio-lg shadow-bio-card border border-bio-glass-100 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-bio-gradient text-bio-text-primary p-4 rounded-t-bio-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bio-glass p-2 rounded-bio">
            <Bot className="w-5 h-5 text-bio-rose animate-pulse-glow" />
          </div>
          <div>
            <h3 className="font-display font-bold">Development Support Assistant</h3>
            <p className="text-xs text-bio-text-secondary opacity-80">Always here to help</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 bio-glass-hover rounded-bio transition-colors bio-focus-ring"
        >
          <X className="w-5 h-5 text-bio-text-secondary" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bio-glass-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                message.sender === 'user' 
                  ? 'bio-glass text-bio-text-primary bio-glow-teal' 
                  : 'bio-glass text-bio-text-primary bio-glow-rose'
              }`}>
                {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`px-4 py-3 rounded-bio ${
                  message.sender === 'user'
                    ? 'bg-bio-gradient text-bio-text-primary rounded-br-none'
                    : 'bio-glass text-bio-text-primary rounded-bl-none shadow-md'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-bio-200' : 'text-bio-text-secondary'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bio-glass text-bio-text-primary bio-glow-rose flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bio-glass px-4 py-3 rounded-bio shadow-bio-card">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-bio-rose rounded-full animate-pulse-glow" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-bio-rose rounded-full animate-pulse-glow" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-bio-rose rounded-full animate-pulse-glow" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-bio-glass-100 bio-glass rounded-b-bio-lg">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about child development, or parenting support..."
            className="flex-1 px-4 py-3 bg-bio-glass-50 border border-bio-glass-100 rounded-full bio-focus-ring text-bio-text-primary text-sm font-body"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="bio-gradient-border bio-shimmer text-bio-text-primary p-3 rounded-full hover:shadow-bio-glow-rose transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 bio-focus-ring"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-bio-text-secondary font-body">
          <Sparkles className="w-3 h-3 text-bio-teal animate-pulse-glow" />
          <span>Powered by Google Gemini AI - Not a substitute for professional medical advice</span>
        </div>
      </div>
    </div>
  );
}
