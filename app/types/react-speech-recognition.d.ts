// types/react-speech-recognition.d.ts
declare module 'react-speech-recognition' {
  export interface SpeechRecognitionResult {
    transcript: string;
    isFinal: boolean;
  }

  export interface SpeechRecognitionState {
    transcript: string;
    interimTranscript: string;
    finalTranscript: string;
    listening: boolean;
    browserSupportsSpeechRecognition: boolean;
  }

  export function useSpeechRecognition(): SpeechRecognitionState;
  export default SpeechRecognition;
}