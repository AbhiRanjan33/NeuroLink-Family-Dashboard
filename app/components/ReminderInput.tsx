// components/ReminderInput.tsx
'use client';
import { useState, useEffect } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

interface Props {
  familyUserId: string;
  patientId: string;
}

export default function ReminderInput({ familyUserId, patientId }: Props) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastReminder, setLastReminder] = useState<{ message: string; time: string } | null>(null);

  // Initialize Web Speech API (same as SpeechToText.tsx)
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-US'; // Hindi + English mix

    recog.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          final += res[0].transcript + ' ';
        } else {
          interim += res[0].transcript;
        }
      }
      // Append to existing text (allows editing + voice)
      setText((prev) => prev + final + interim);
    };

    recog.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
    };

    recog.onend = () => {
      setIsListening(false);
    };

    setRecognition(recog);
  }, []);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const sendReminder = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/add-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyUserId,
          patientId,
          text: trimmedText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const { message, time } = data.reminder;
        setLastReminder({ message, time });
        setText('');
        setTimeout(() => setLastReminder(null), 5000);
      } else {
        alert(data.error || 'Failed to set reminder');
      }
    } catch (err) {
      alert('NetworkNetwork error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && text.trim()) {
      sendReminder();
    }
  };

  const browserSupportsSpeech = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);

  if (!browserSupportsSpeech) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-6 shadow text-center">
        <p className="text-red-600 font-semibold">Speech not supported</p>
        <p className="text-sm text-gray-600 mt-1">Use Chrome or Edge for voice input</p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-6 shadow-lg">
      <h2 className="mb-5 text-2xl font-bold text-center" style={{ color: '#2C2416' }}>
        Set Reminder via Voice or Text
      </h2>

      <div className="flex gap-3 items-center">
        {/* TEXT INPUT - FULLY EDITABLE */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Speak or type: दवा 8 बजे... or 'Take medicine at 8 PM'"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full rounded-xl border-2 px-5 py-3.5 text-base transition-all pr-12"
            style={{
              borderColor: isListening ? '#10b981' : '#E8DCC4',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              boxShadow: isListening ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none'
            }}
            disabled={loading}
          />
          {isListening && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
        </div>

        {/* VOICE TOGGLE BUTTON */}
        <button
          onClick={toggleListening}
          disabled={!recognition}
          className={`rounded-xl p-3.5 transition-all transform active:scale-95 ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 animate-pulse shadow-lg'
              : 'bg-gradient-to-r from-[#6B5E4C] to-[#8B7B6A] hover:from-[#5A4D3E] hover:to-[#7A6A59] shadow-md'
          } ${!recognition ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isListening ? 'Stop Listening' : 'Start Speaking'}
        >
          {isListening ? <MicOff size={22} className="text-white" /> : <Mic size={22} className="text-white" />}
        </button>

        {/* SEND BUTTON */}
        <button
          onClick={sendReminder}
          disabled={loading || !text.trim()}
          className="rounded-xl px-6 py-3.5 font-bold text-white transition-all flex items-center gap-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: loading || !text.trim()
              ? '#ccc'
              : 'linear-gradient(to right, #10b981, #059669)',
            boxShadow: loading || !text.trim() ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </div>
          ) : (
            <>
              <Send size={18} />
              Send
            </>
          )}
        </button>
      </div>

      {/* LISTENING STATUS */}
      {isListening && (
        <p className="mt-3 text-sm font-medium animate-pulse text-center" style={{ color: '#10b981' }}>
          Listening... Speak your reminder
        </p>
      )}

      {/* SUCCESS MESSAGE */}
      {lastReminder && (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <p className="text-sm font-bold text-green-800">
            Reminder Set!
          </p>
          <p className="text-sm mt-1" style={{ color: '#2C2416' }}>
            <strong>{lastReminder.message}</strong> at <strong>{lastReminder.time}</strong>
          </p>
        </div>
      )}
    </div>
  );
}