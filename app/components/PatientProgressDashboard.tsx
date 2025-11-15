// app/components/PatientProgressDashboard.tsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MeditationPoint {
  date: string;
  time: string;
  fullDate: string;
  durationSeconds: number;
  sessionId: string;
}

interface QuizPoint {
  date: string;
  time: string;
  fullDate: string;
  score: number;
  total: number;
  accuracy: number;
  quizId: string;
}

interface ProgressData {
  patientName: string;
  meditation: MeditationPoint[];
  quiz: QuizPoint[];
  totalMeditationSeconds: number;
}

interface Props {
  patientId: string;
}

export default function PatientProgressDashboard({ patientId }: Props) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-patient-progress`, {
          params: { patientId }
        });

        const fetchedData = res.data;
        setData(fetchedData);

        console.log('PATIENT PROGRESS FETCHED:', {
          patientName: fetchedData.patientName,
          totalMeditationSeconds: fetchedData.totalMeditationSeconds,
          meditationCount: fetchedData.meditation.length,
          quizCount: fetchedData.quiz.length
        });

        console.table(fetchedData.meditation);
        console.table(fetchedData.quiz);

      } catch (err: any) {
        console.error('FAILED TO FETCH PROGRESS:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchProgress();
    }
  }, [patientId]);

  const generateAIFeedback = async () => {
  if (!data || generating) return;

  setGenerating(true);
  setAiFeedback(null);

  try {
    const readingsText = data.meditation
      .map((s, i) => `${i + 1}. ${s.date} at ${s.time} UTC → ${s.durationSeconds} seconds`)
      .join('\n');

    const quizText = data.quiz
      .map((q, i) => `${i + 1}. ${q.date} at ${q.time} UTC → ${q.score}/${q.total} (${q.accuracy}%)`)
      .join('\n');

    const prompt = `You are a leading neurologist specializing in Alzheimer's disease and cognitive health.

Patient: ${data.patientName}
Goal: Monitor cognitive engagement via meditation and memory quizzes.

### MEDITATION SESSIONS (Last 24h)
${readingsText || 'None'}

Total: ${data.meditation.length} sessions, ${data.totalMeditationSeconds} seconds

### QUIZ PERFORMANCE (Last 24h)
${quizText || 'None'}

Average Accuracy: ${data.quiz.length > 0 
  ? Math.round(data.quiz.reduce((a, b) => a + b.accuracy, 0) / data.quiz.length) 
  : 0}%

---

Provide a **concise, professional, empathetic** 3-4 sentence summary from your clinical perspective.
Focus on:
- Cognitive engagement
- Consistency
- Areas of concern or improvement
- One actionable recommendation

Tone: Warm, encouraging, medical authority.
`.trim();

    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter API key not found. Add OPENROUTER_API_KEY to .env.local");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "NeuroLink AI",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // ← YOUR MODEL
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const feedback = result.choices?.[0]?.message?.content?.trim();

    if (!feedback) {
      throw new Error("No response from AI. Try again.");
    }

    setAiFeedback(feedback);
  } catch (err: any) {
    console.error("OPENROUTER ERROR:", err);
    setAiFeedback(`Failed to generate feedback: ${err.message}`);
  } finally {
    setGenerating(false);
  }
};

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;

    const point = payload[0].payload;
    const value = payload[0].value;
    const isMeditation = 'durationSeconds' in point;

    return (
      <div className="rounded-lg bg-white p-4 shadow-xl border-2" style={{ borderColor: '#E8DCC4' }}>
        <p className="text-sm font-bold" style={{ color: '#2C2416' }}>
          {point.date} <span className="font-normal text-xs text-gray-500">at {point.time} UTC</span>
        </p>
        <hr className="my-2 border-t border-dashed" style={{ borderColor: '#E8DCC4' }} />
        {isMeditation ? (
          <p className="text-sm">
            <span className="font-medium" style={{ color: '#9C27B0' }}>Duration:</span>{' '}
            <strong>{value} seconds</strong>
          </p>
        ) : (
          <>
            <p className="text-sm">
              <span className="font-medium" style={{ color: '#2196F3' }}>Score:</span>{' '}
              <strong>{point.score}/{point.total}</strong>
            </p>
            <p className="text-sm">
              <span className="font-medium" style={{ color: '#2196F3' }}>Accuracy:</span>{' '}
              <strong>{value}%</strong>
            </p>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6B5E4C] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!data || (!data.meditation.length && !data.quiz.length)) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow text-center">
        <p className="text-gray-500">No activity recorded yet</p>
      </div>
    );
  }

  const totalSeconds = data.totalMeditationSeconds || 0;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-center" style={{ color: '#2C2416' }}>
        {data.patientName}'s Activity Timeline
      </h2>

      <div className="grid gap-8 md:grid-cols-2">
        {/* MEDITATION CHART */}
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold flex items-center gap-2" style={{ color: '#6B5E4C' }}>
            Meditation Sessions
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              key={`meditation-${data.meditation.length}`}
              data={data.meditation}
              margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#f0e6d2" />
              <XAxis 
                dataKey="fullDate"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={65}
                tickFormatter={(v) => v.split("T")[0]}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Seconds', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip content={CustomTooltip} cursor={{ stroke: '#6B5E4C', strokeWidth: 2, strokeDasharray: '5 5' }} />
              <Line 
                type="monotone"
                dataKey="durationSeconds"
                stroke="#9C27B0"
                strokeWidth={3}
                dot={{ fill: '#9C27B0', r: 6 }}
                activeDot={{ r: 8 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* QUIZ CHART */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold flex items-center gap-2" style={{ color: '#6B5E4C' }}>
            Quiz Accuracy
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              key={`quiz-${data.quiz.length}`}
              data={data.quiz}
              margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#f0e6d2" />
              <XAxis 
                dataKey="fullDate" 
                tick={{ fontSize: 11 }} 
                angle={-45}
                textAnchor="end"
                height={65}
                tickFormatter={(v) => v.split("T")[0]}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 12 }} 
                label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip content={CustomTooltip} cursor={{ stroke: '#6B5E4C', strokeWidth: 2, strokeDasharray: '5 5' }} />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#2196F3"
                strokeWidth={3}
                dot={{ fill: '#2196F3', r: 6 }}
                activeDot={{ r: 8 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 text-center">
        <div className="rounded-lg bg-purple-100 p-3">
          <p className="text-xs text-purple-700">Sessions</p>
          <p className="text-xl font-bold" style={{ color: '#6B5E4C' }}>
            {data.meditation.length}
          </p>
        </div>
        <div className="rounded-lg bg-pink-100 p-3">
          <p className="text-xs text-pink-700">Total Time</p>
          <p className="text-xl font-bold" style={{ color: '#6B5E4C' }}>
            {totalMinutes}m {seconds}s
          </p>
        </div>
        <div className="rounded-lg bg-blue-100 p-3">
          <p className="text-xs text-blue-700">Quizzes</p>
          <p className="text-xl font-bold" style={{ color: '#6B5E4C' }}>
            {data.quiz.length}
          </p>
        </div>
        <div className="rounded-lg bg-cyan-100 p-3">
          <p className="text-xs text-cyan-700">Best Score</p>
          <p className="text-xl font-bold" style={{ color: '#6B5E4C' }}>
            {data.quiz.length > 0 
              ? Math.max(...data.quiz.map(q => q.accuracy))
              : 0}%
          </p>
        </div>
      </div>

      {/* AI FEEDBACK BUTTON */}
      <div className="mt-8 text-center">
        <button
          onClick={generateAIFeedback}
          disabled={generating}
          className={`px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-lg ${
            generating 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-[#6B5E4C] to-[#8B7B6A] hover:from-[#5A4D3E] hover:to-[#7A6A59] active:scale-95'
          }`}
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Generating Doctor's Feedback...
            </span>
          ) : (
            'Get AI Doctor Feedback'
          )}
        </button>
      </div>

      {/* AI FEEDBACK DISPLAY */}
      {aiFeedback && (
        <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
          {/* <p className="text-sm font-semibold text-amber-800 mb-2">Dr. Emily Chen, Neurologist</p> */}
          <p className="text-sm leading-relaxed" style={{ color: '#2C2416' }}>
            {aiFeedback}
          </p>
        </div>
      )}
    </div>
  );
}