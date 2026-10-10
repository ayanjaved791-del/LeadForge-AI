import React from 'react';
import { Sparkles, X, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginAsDemoUser, loading } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Failed to authenticate with Google. You can use Demo Workspace below.');
      }
    }
  };

  const handleDemoLogin = () => {
    loginAsDemoUser();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-black font-bold">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <span className="text-base font-bold text-white tracking-tight font-heading">LeadForge AI</span>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight mt-3 font-heading">
          Sign In to Your Workspace
        </h2>
        <p className="text-xs text-neutral-400 mt-1 mb-6 leading-relaxed">
          Access your research pipeline, AI company scoring models, and personalized outreach drafts.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.053 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800" />
            </div>
            <span className="relative bg-neutral-950 px-2 text-[11px] text-neutral-500 uppercase tracking-wider">
              Or Instant Preview
            </span>
          </div>

          <button
            onClick={handleDemoLogin}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white font-medium text-sm transition-all group"
          >
            <span>Launch Live Demo Workspace</span>
            <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
          <Shield className="h-3 w-3 text-neutral-400" />
          <span>Enterprise-grade security · Cloud Firestore · Google Auth</span>
        </div>
      </div>
    </div>
  );
};
