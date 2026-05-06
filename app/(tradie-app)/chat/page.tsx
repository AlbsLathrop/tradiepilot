'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Paperclip, Mic } from 'lucide-react';

interface Message {
  id: string;
  role: 'joey' | 'alfred';
  content: string;
  timestamp: Date;
  action?: string;
  mediaUrl?: string;
  mediaType?: string;
}

interface Job {
  id: string;
  name: string;
  status: string;
  clientName: string;
  suburb: string;
}

interface JobContext {
  id: string;
  clientName: string;
  suburb: string;
  service: string;
  status: string;
  jobValue: number | null;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const [tradieSlug, setTradieSlug] = useState('');
  const [jobContext, setJobContext] = useState<JobContext | null>(null);
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  useEffect(() => {
    if (session?.user?.tradieSlug) {
      setTradieSlug(session?.user?.tradieSlug);
    }
  }, [session?.user?.tradieSlug]);

  useEffect(() => {
    if (!tradieSlug || messagesLoaded) return;

    const loadChatHistory = async () => {
      try {
        const res = await fetch(`/api/alfred/chat-history?tradieSlug=${tradieSlug}`);
        const data = await res.json();

        if (data.messages && data.messages.length > 0) {
          const loadedMessages = data.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          setMessages(loadedMessages);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setMessagesLoaded(true);
      }
    };

    loadChatHistory();
  }, [tradieSlug, messagesLoaded]);

  const getDefaultMessage = () => {
    const name = session?.user?.name || 'mate';
    return {
      id: '1',
      role: 'alfred' as const,
      content: `G'day ${name}. I'm ALFRED — your TradiePilot agent. Tell me about a job update, ask about your leads, or anything else about the business.`,
      timestamp: new Date(),
    };
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [getDefaultMessage()];

    try {
      const saved = localStorage.getItem('alfred_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch {}

    return [getDefaultMessage()];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [pendingSMS, setPendingSMS] = useState<any>(null);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('jobId');
    const preloadedMessage = params.get('message');

    if (jobId && tradieSlug) {
      fetch(`/api/jobs?tradieSlug=${tradieSlug}`)
        .then(r => r.json())
        .then(data => {
          const job = data.jobs?.find((j: any) => j.id === jobId);
          if (job) {
            setJobContext({
              id: job.id,
              clientName: job.clientName,
              suburb: job.suburb,
              service: job.service,
              status: job.status,
              jobValue: job.jobValue,
            });
          }
        })
        .catch(() => {});
    }

    if (preloadedMessage) {
      setInput(preloadedMessage);
      setTimeout(() => {
        sendMessage(preloadedMessage);
        window.history.replaceState({}, '', '/chat');
      }, 300);
    }
  }, [tradieSlug]);

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
        body: JSON.stringify({ message: transcribeData.transcript, tradieSlug }),
      });
      const alfredData = await alfredRes.json();

      if (alfredData.reply) {
        const alfredMsg = {
          id: (Date.now() + 1).toString(),
          role: 'alfred' as const,
          content: alfredData.reply,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, alfredMsg]);

        // Save to database
        if (tradieSlug) {
          fetch('/api/alfred/chat-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: transcribeData.transcript,
              reply: alfredData.reply,
              action: alfredData.action,
              tradieSlug,
            }),
          }).catch(err => console.error('Failed to save chat:', err));
        }
      }

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const clearPendingFile = () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingFile(null);
    setPendingPreviewUrl(null);
  };

  const sendMessage = async (text: string) => {
    if ((!text.trim() && !pendingFile) || loading || uploading) return;

    setLoading(true);
    if (pendingFile) setUploading(true);

    let mediaUrl: string | undefined;
    let mediaType: string | undefined;

    try {
      // Upload file if pending
      if (pendingFile) {
        const formData = new FormData();
        formData.append('file', pendingFile);
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
        if (!uploadData.success) throw new Error('Upload returned no URL');

        mediaUrl = uploadData.mediaUrl;
        mediaType = uploadData.mediaType;
      }

      // Create user message with optional media
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'joey',
        content: text || `📎 ${pendingFile?.name || 'File'}`,
        timestamp: new Date(),
        ...(mediaUrl && { mediaUrl, mediaType }),
      };

      setMessages(prev => [...prev, userMsg]);
      setInput('');
      clearPendingFile();

      // Send to ALFRED
      const recentMessages = messages
        .filter(m => m.content && !m.content.includes('Transcribing') && !m.content.includes('Uploading') && !m.content.includes('Downloading'))
        .slice(-50)
        .map(m => ({
          role: m.role === 'joey' ? 'user' : 'assistant',
          content: m.content,
        }));

      const alfredPayload: any = {
        message: text || (mediaType ? `Shared a ${mediaType.toLowerCase()}` : 'File sent'),
        tradieSlug,
        conversationHistory: recentMessages,
      };

      if (jobContext) {
        alfredPayload.jobContext = jobContext;
      }

      if (mediaUrl) {
        alfredPayload.mediaUrl = mediaUrl;
        alfredPayload.mediaType = mediaType;
      }

      if (pendingSMS) {
        alfredPayload.pendingSMS = pendingSMS;
      }

      const res = await fetch('/api/alfred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alfredPayload),
      });

      const data = await res.json();

      // Handle pending SMS
      if (data.pendingSMS) {
        setPendingSMS(data.pendingSMS);
      }
      if (data.smsSent) {
        setPendingSMS(null);
      }

      // Clean ALFRED response: strip JSON code blocks and extract reply
      let replyText = data.reply;

      // First: extract reply from JSON wrapper with ```json blocks
      const jsonWrapperMatch = replyText.match(/```json\s*\{[\s\S]*?"reply"\s*:\s*"([\s\S]*?)"\s*\}[\s\S]*?```/);
      if (jsonWrapperMatch && jsonWrapperMatch[1]) {
        replyText = jsonWrapperMatch[1];
      }

      // Second: remove remaining JSON code blocks
      replyText = replyText.replace(/```json[\s\S]*?```/g, '').trim();

      // Third: if reply is a bare JSON object, try to parse it
      if (replyText.startsWith('{') && replyText.endsWith('}')) {
        try {
          const parsed = JSON.parse(replyText);
          if (parsed.reply) {
            replyText = parsed.reply;
          }
        } catch {
          // If parse fails, use as-is
        }
      }

      if (replyText) {
        const alfredMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'alfred',
          content: replyText,
          timestamp: new Date(),
          action: data.action,
        };

        setMessages(prev => [...prev, alfredMsg]);

        // Save to database
        if (tradieSlug) {
          fetch('/api/alfred/chat-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text || (mediaType ? `Shared a ${mediaType.toLowerCase()}` : 'File sent'),
              reply: replyText,
              action: data.action,
              tradieSlug,
            }),
          }).catch(err => console.error('Failed to save chat:', err));
        }
      }
    } catch (err: any) {
      const errorMsg = err.name === 'AbortError'
        ? 'Upload timed out. Try a smaller file.'
        : `Error: ${err.message}`;

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'alfred',
        content: errorMsg,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setUploading(false);
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

      {/* Job Context Banner */}
      {jobContext && (
        <div className="px-4 py-3 bg-[#1F2937] border-b border-[#374151] flex items-center justify-between">
          <p className="text-[#9CA3AF] text-xs">
            📋 Asking about: <span className="text-white font-semibold">{jobContext.clientName}</span> — {jobContext.service} in {jobContext.suburb} ({jobContext.status})
          </p>
          <button
            onClick={() => setJobContext(null)}
            className="text-[#6B7280] hover:text-[#9CA3AF] text-xs"
          >
            ×
          </button>
        </div>
      )}

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
              className={`max-w-[80%] overflow-hidden ${
                msg.role === 'joey'
                  ? 'bg-[#F97316] text-white rounded-br-sm rounded-tl-2xl rounded-tr-2xl'
                  : 'bg-[#1F2937] text-[#F9FAFB] rounded-bl-sm rounded-tl-2xl rounded-tr-2xl border border-[#374151]'
              }`}
            >
              {msg.mediaUrl && (
                <div className="-mx-4 -mt-3 mb-2">
                  {msg.mediaType === 'Video' ? (
                    <video
                      src={msg.mediaUrl}
                      controls
                      className="w-full max-h-64 bg-black"
                    />
                  ) : (
                    <img
                      src={msg.mediaUrl}
                      alt="Job photo"
                      className="w-full max-h-64 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(msg.mediaUrl, '_blank')}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              )}
              {msg.content && <div className="px-4 py-3 text-sm leading-relaxed">{msg.content}</div>}
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
        {/* File preview */}
        {pendingFile && (
          <div className="pb-3 flex items-center gap-3">
            <div className="relative">
              <img
                src={pendingPreviewUrl!}
                alt="attachment preview"
                className="w-16 h-16 rounded-lg object-cover border-2 border-[#F97316]"
              />
              <button
                onClick={clearPendingFile}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
            <span className="text-[#9CA3AF] text-xs flex-1 truncate">{pendingFile.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 bg-[#1F2937] border border-[#374151] rounded-2xl px-3 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !!pendingFile}
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
            disabled={uploading}
          >
            <Mic size={18} />
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={(!input.trim() && !pendingFile) || loading || uploading}
            className="bg-[#F97316] hover:bg-[#C2580A] disabled:opacity-40 text-white p-1.5 rounded-full transition-all"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Bottom nav spacer */}
      <div className="h-16" />
    </div>
  );
}
