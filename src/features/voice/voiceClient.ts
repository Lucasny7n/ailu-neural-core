export type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

export interface VoiceStatus {
  state: VoiceState;
  message?: string;
  isAvailable: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export class VoiceClient {
  private recognition: SpeechRecognition | null = null;
  private synth: SpeechSynthesis = window.speechSynthesis;
  private onTranscriptCallback: (text: string) => void = () => {};
  private onStateChangeCallback: (status: VoiceStatus) => void = () => {};

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = "pt-BR";
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        this.onTranscriptCallback(transcript);
      };

      this.recognition.onstart = () => {
        this.onStateChangeCallback({ state: "listening", isAvailable: true });
      };

      this.recognition.onend = () => {
        this.onStateChangeCallback({ state: "idle", isAvailable: true });
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.onStateChangeCallback({ state: "error", message: `Erro: ${event.error}`, isAvailable: true });
      };
    }
  }

  isAvailable(): boolean {
    return this.recognition !== null;
  }

  onTranscript(callback: (text: string) => void) {
    this.onTranscriptCallback = callback;
  }

  onStateChange(callback: (status: VoiceStatus) => void) {
    this.onStateChangeCallback = callback;
  }

  startListening() {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.error("Speech recognition start failed:", e);
      }
    }
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  speak(text: string) {
    if (this.synth) {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.onstart = () => this.onStateChangeCallback({ state: "speaking", isAvailable: true });
      utterance.onend = () => this.onStateChangeCallback({ state: "idle", isAvailable: true });
      this.synth.speak(utterance);
    }
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.onStateChangeCallback({ state: "idle", isAvailable: true });
    }
  }
}

export const voiceClient = new VoiceClient();
