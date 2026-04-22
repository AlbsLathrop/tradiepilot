'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';

interface Message {
  id: string;
  role: 'joey' | 'alfred';
  content: string;
  timestamp: Date;
  action?: string;
  mediaUrl?: string;
}

interface Job {
  id: string;
  name: string;
  status: string;
  clientName: string;
  suburb: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [{
      id: '1',
      role: 'alfred',
      content: "G'day Joey. I'm ALFRED — your TradiePilot agent. Tell me about a job update, ask about your leads, or anything else about the business.",
      timestamp: new Date(),
    }];

    try {
      const saved = localStorage.getItem('alfred_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch {}

    return [{
      id: '1',
      role: 'alfred',
      content: "G'day Joey. I'm ALFRED — your TradiePilot agent. Tell me about a job update, ask about your leads, or anything else about the business.",
      timestamp: new Date(),
    }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [quickChips, setQuickChips] = useState([
    "What's on today?",
    "How many leads this week?",
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        const toSave = messages.slice(-100);
        localStorage.setItem('alfred_chat_history', JSON.stringify(toSave));
      } catch {}
    }
  }, [messages]);

  useEffect(() => {
    const loadDynamicChips = async () => {
      try {
        const res = await fetch('/api/alfred/context');
        const data = await res.json();

        const baseChips = ["What's on today?", "How many leads this week?"];
        if (data.todaysJobs?.length > 0) {
          const job = data.todaysJobs[0];
          baseChips.push(`${job.name} — send update`);
        }
        setQuickChips(baseChips);
      } catch {
        // Keep defaults if fetch fails
      }
    };

    loadDynamicChips();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        await handleVoiceNote(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleVoiceNote = async (audioBlob: Blob) => {
    const voiceMsg: Message = {
      id: Date.now().toString(),
      role: 'joey',
      content: '🎤 Transcribing...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, voiceMsg]);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');

      const transcribeRes = await fetch('/api/alfred/transcribe', {
        method: 'POST',
        body: formData,
      });
      const transcribeData = await transcribeRes.json();

      if (!transcribeData.transcript) throw new Error('No transcript');

      // Update bubble with real transcript
      setMessages(prev => prev.map(m =>
        m.id === voiceMsg.id
          ? { ...m, content: `🎤 "${transcribeData.transcript}"` }
          : m
      ));

      // Send to ALFRED
      setLoading(true);
      const alfredRes = await fetch('/api/alfred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: transcribeData.transcript }),
      });
      const alfredData = await alfredRes.json();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'alfred',
        content: alfredData.reply || 'Done ✓',
        timestamp: new Date(),
      }]);

    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === voiceMsg.id
          ? { ...m, content: '🎤 Could not transcribe. Try again.' }
          : m
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // Show preview message
    const previewMsg: Message = {
      id: Date.now().toString(),
      role: 'joey',
      content: `📎 Uploading ${file.type.startsWith('video/') ? 'video' : 'photo'}...`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, previewMsg]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobName', 'Active Job');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const uploadRes = await fetch('/api/alfred/media', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Upload failed');
      }

      const uploadData = await uploadRes.json();

      if (uploadData.success) {
        // Send media to ALFRED for context
        const alfredRes = await fetch('/api/alfred', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Uploaded a ${uploadData.mediaType.toLowerCase()}: ${uploadData.description}`,
            mediaUrl: uploadData.mediaUrl,
            mediaType: uploadData.mediaType,
          }),
        });
        const alfredData = await alfredRes.json();

        // Update preview with ALFRED's response
        setMessages(prev => [
          ...prev.filter(m => m.id !== previewMsg.id),
          {
            ...previewMsg,
            content: `📷 ${file.name}`,
            mediaUrl: uploadData.mediaUrl,
          },
          {
            id: (Date.now() + 1).toString(),
            role: 'alfred',
            content: alfredData.reply || uploadData.message,
            timestamp: new Date(),
          }
        ]);
      }
    } catch (err: any) {
      const errorMsg = err.name === 'AbortError'
        ? 'Upload timed out. Try a smaller photo.'
        : `Upload failed: ${err.message}`;

      setMessages(prev => prev.map(m =>
        m.id === previewMsg.id
          ? { ...m, content: `❌ ${errorMsg}` }
          : m
      ));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'joey',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/alfred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      const alfredMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'alfred',
        content: data.reply || "Done ✓",
        timestamp: new Date(),
        action: data.action,
      };

      setMessages(prev => [...prev, alfredMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'alfred',
        content: "Something went wrong. Try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#111827]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-[#0F0F0F] border-b border-[#374151]">
        <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white font-bold text-lg">
          A
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-base">ALFRED</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <p className="text-[#9CA3AF] text-xs">Your TradiePilot agent</p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('alfred_chat_history');
            setMessages([{
              id: Date.now().toString(),
              role: 'alfred',
              content: "Chat cleared. What do you need?",
              timestamp: new Date(),
            }]);
          }}
          className="text-[#6B7280] hover:text-[#9CA3AF] text-xs"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'joey' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'alfred' && (
              <div className="w-7 h-7 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">
                A
              </div>
            )}
            <div
              className={`max-w-[80%] ${
                msg.role === 'joey'
                  ? 'bg-[#F97316] text-white rounded-br-sm'
                  : 'bg-[#1F2937] text-[#F9FAFB] rounded-bl-sm border border-[#374151]'
              }`}
            >
              {msg.mediaUrl && (
                <img
                  src={msg.mediaUrl}
                  alt="Uploaded media"
                  className="w-full rounded-t-2xl max-h-64 object-cover"
                />
              )}
              <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed">
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold mr-2 mt-1">
              A
            </div>
            <div className="bg-[#1F2937] border border-[#374151] px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick chips */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {quickChips.map(chip => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              className="flex-shrink-0 bg-[#1F2937] border border-[#374151] text-[#D1D5DB] text-xs px-3 py-2 rounded-full hover:border-[#F97316] hover:text-white transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-4 bg-[#0F0F0F] border-t border-[#374151]">
        <div className="flex items-center gap-2 bg-[#1F2937] border border-[#374151] rounded-2xl px-3 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-[#9CA3AF] hover:text-[#F97316] disabled:opacity-40 transition-colors p-1"
          >
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Message ALFRED..."
            className="flex-1 bg-transparent text-white text-sm placeholder-[#6B7280] outline-none"
            disabled={uploading}
          />
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
            className={`p-1 transition-colors select-none ${
              recording
                ? 'text-red-500 animate-pulse scale-125'
                : 'text-[#9CA3AF] hover:text-[#F97316]'
            }`}
          >
            <Mic size={18} />
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || uploading}
            className="bg-[#F97316] hover:bg-[#C2580A] disabled:opacity-40 text-white p-1.5 rounded-full transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Bottom nav spacer */}
      <div className="h-16" />
    </div>
  );
}
