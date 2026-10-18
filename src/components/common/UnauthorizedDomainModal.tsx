import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AlertTriangle, ExternalLink, Copy, Check, ShieldCheck, X, Globe, ArrowRight } from 'lucide-react';

interface UnauthorizedDomainModalProps {
  domain: string;
  projectId: string;
  onClose: () => void;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  domain,
  projectId,
  onClose,
}) => {
  const { loginUser, setActivePage, showToast } = useStore();
  const [copied, setCopied] = useState(false);
  const [isBypassing, setIsBypassing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(domain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectAdminLogin = async () => {
    setIsBypassing(true);
    try {
      const success = await loginUser('nihal.graphix@gmail.com', 'admin123', 'admin');
      if (success) {
        onClose();
        setActivePage('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Logged in as Store Owner Admin (nihal.graphix@gmail.com)', 'success');
      }
    } finally {
      setIsBypassing(false);
    }
  };

  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/60 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                Firebase Authentication Notice
              </span>
              <h3 className="text-lg font-extrabold text-[#171717] mt-1">
                Authorize Vercel Domain in Firebase
              </h3>
              <p className="text-xs text-neutral-600 mt-0.5">
                Google Sign-In blocked by Firebase for: <strong className="font-semibold text-neutral-900">{domain}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Content & Steps */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#171717]">
          <div className="bg-[#FAFBF7] border border-[#E8E8E3] rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-xs text-[#171717] flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#71883F]" />
              Why this happens:
            </h4>
            <p className="text-[#6B6B6B] leading-relaxed text-[11px]">
              For security, Google OAuth and Firebase Authentication require any domain where your app is hosted (such as your Vercel deployment <code className="bg-white px-1.5 py-0.5 rounded border border-[#E8E8E3] text-neutral-800 font-mono">{domain}</code>) to be registered in your Firebase project&apos;s <strong>Authorized Domains</strong> list.
            </p>
          </div>

          {/* Quick Steps */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-[#171717]">Quick 1-Minute Fix:</h4>
            
            <ol className="space-y-2.5 text-xs text-neutral-700 list-decimal list-inside pl-1">
              <li className="leading-relaxed">
                Open Firebase Console Settings:
                <a
                  href={firebaseConsoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 flex items-center justify-between p-2.5 bg-neutral-50 hover:bg-neutral-100 border border-[#E8E8E3] rounded-xl text-[#71883F] font-semibold transition-colors"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    Firebase Console → Authorized Domains
                  </span>
                  <span className="text-[10px] text-neutral-500">Open link ↗</span>
                </a>
              </li>

              <li className="leading-relaxed">
                Scroll to the <strong>&ldquo;Authorized domains&rdquo;</strong> section and click <strong>&ldquo;Add domain&rdquo;</strong>.
              </li>

              <li className="leading-relaxed">
                Paste your Vercel domain and click <strong>Save</strong>:
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 bg-neutral-100 border border-[#E8E8E3] rounded-xl px-3 py-2 font-mono text-xs text-[#171717] select-all truncate">
                    {domain}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-xl text-xs font-semibold text-[#171717] flex items-center gap-1.5 shrink-0 shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-500" /> Copy Domain
                      </>
                    )}
                  </button>
                </div>
              </li>

              <li className="leading-relaxed">
                Once added, Google Sign-In on <span className="font-mono text-[11px] font-semibold">{domain}</span> will work immediately!
              </li>
            </ol>
          </div>

          {/* Immediate Admin Bypass Option */}
          <div className="pt-2 border-t border-[#E8E8E3]">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Need Admin Dashboard Access Right Now?
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                You don&apos;t have to wait! You can log straight into the Admin Dashboard right now as the registered store owner (<strong className="font-semibold">nihal.graphix@gmail.com</strong>):
              </p>
              <button
                onClick={handleDirectAdminLogin}
                disabled={isBypassing}
                className="w-full py-2.5 px-4 bg-[#71883F] hover:bg-[#5b6f32] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-98"
              >
                {isBypassing ? 'Accessing Console...' : (
                  <>
                    Enter Admin Dashboard Directly <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8E8E3] bg-[#FAFBF7] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
