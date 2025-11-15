// components/SpeechToText.tsx
'use client';
import { useState, useEffect } from 'react';

export default function SpeechToText() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition. Use Chrome/Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-US';

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
      setTranscript(final + interim);
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

  return (
    <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
      <h3 className="text-lg font-bold text-purple-800 mb-3">Speak Your Home Address</h3>
      
      <button
        onClick={toggleListening}
        className={`px-6 py-3 rounded-xl font-bold text-white transition-all flex items-center gap-2 ${
          isListening
            ? 'bg-red-600 hover:bg-red-700 animate-pulse'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
        }`}
      >
        {isListening ? (
          <>Stop Listening</>
        ) : (
          <>Start Speaking</>
        )}
      </button>

      <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200 min-h-24">
        <p className="text-sm text-gray-600">
          {transcript || 'Speak now...'}
        </p>
      </div>

      {transcript && (
        <button
          onClick={() => {
            // Send to save-home-address API
            fetch('/api/save-home-address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: transcript.trim(),
                patientId: 'your_patient_id',
                familyUserId: 'your_family_id'
              })
            });
          }}
          className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
        >
          Save Address
        </button>
      )}
    </div>
  );
}