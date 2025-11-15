// app/components/SendRemarkInput.tsx
'use client';
import { useState } from 'react';
import axios from 'axios';

interface Props {
  familyUserId: string;
  patientId: string;
  familyUser: {
    userId: string;
    name: string;
    relation: string;
    photo?: string;
    familyMembers: Array<{
      name: string;
      relation: string;
      photo?: string;
    }>;
  };
}

export default function SendRemarkInput({ familyUserId, patientId, familyUser }: Props) {
  const [text, setText] = useState('');
  const [selectedSender, setSelectedSender] = useState(familyUser.userId);
  const [sending, setSending] = useState(false);

  const senders = [
  {
    id: familyUser.userId,
    name: familyUser.name,
    relation: familyUser.relation,
    photo: familyUser.photo, // Byupeni's photo
  },
  ...familyUser.familyMembers.map(m => ({
    id: `${familyUser.userId}_${m.name}`, // unique ID
    name: m.name,
    relation: m.relation,
    photo: m.photo, // Chetanya's photo
  }))
];

  const handleSend = async () => {
  if (!text.trim() || sending) return;

  setSending(true);
  try {
    const sender = senders.find(s => s.id === selectedSender)!;

    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/send-remark`, {
      familyUserId,
      patientId,
      text: text.trim(),
      fromUserId: sender.id,
      fromName: sender.name,
      fromRelation: sender.relation,
      fromImage: sender.photo || null, // Correct photo sent
    });

    setText('');
    alert('Remark sent!');
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to send');
  } finally {
    setSending(false);
  }
};

  return (
    <div className="mt-8 rounded-2xl bg-white p-6 shadow">
      <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2C2416' }}>
        Send Remark
      </h2>

      <div className="space-y-4">
        {/* Sender Dropdown */}
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#6B5E4C' }}>
            From
          </label>
          <select
            value={selectedSender}
            onChange={e => setSelectedSender(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#6B5E4C] text-black"
            style={{ borderColor: '#E8DCC4', backgroundColor: '#FFFFFF' }}
          >
            {senders.map(sender => (
              <option key={sender.id} value={sender.id}>
                {sender.name} ({sender.relation})
              </option>
            ))}
          </select>
        </div>

        {/* Text Input */}
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#6B5E4C' }}>
            Message
          </label>
          <textarea
  value={text}
  onChange={e => setText(e.target.value)}
  placeholder="Enter reminder..."
  rows={5}
  className="w-full rounded-xl border px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B5E4C]"
  style={{ 
    borderColor: '#E8DCC4', 
    backgroundColor: '#FFFFFF',
    minHeight: '120px'
  }}
/>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: '#6B5E4C' }}
        >
          {sending ? (
            <>
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Send Remark</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}