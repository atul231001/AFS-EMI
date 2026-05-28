import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

const Captcha = ({ onVerify }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const canvasRef = useRef(null);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
    setUserInput('');
    setIsCorrect(false);
    onVerify(false);
    drawCaptcha(text);
  };

  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background with noise
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some random lines for noise
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(240, 136, 62, ${Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Add some dots for noise
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw text with random rotation/scale
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.textBaseline = 'middle';
    
    const space = canvas.width / (text.length + 1);
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      const x = space * (i + 1);
      const y = canvas.height / 2 + (Math.random() * 10 - 5);
      const angle = (Math.random() * 40 - 20) * Math.PI / 180;
      
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = i % 2 === 0 ? '#f0883e' : '#ffffff';
      ctx.fillText(text[i], -10, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase();
    setUserInput(val);
    if (val === captchaText) {
      setIsCorrect(true);
      onVerify(true);
    } else {
      setIsCorrect(false);
      onVerify(false);
    }
  };

  return (
    <div className="bg-[#161b22] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-6 group hover:border-[#f0883e]/30 transition-all shadow-xl">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 bg-[#f0883e]/10 rounded-xl flex items-center justify-center text-[#f0883e] border border-[#f0883e]/20">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Image Protocol Verification</p>
          <div className="mt-2 flex items-center gap-3">
             <div className="relative rounded-lg overflow-hidden border border-white/10 shadow-inner">
               <canvas 
                 ref={canvasRef} 
                 width={160} 
                 height={50} 
                 className="block cursor-pointer"
                 onClick={generateCaptcha}
                 title="Click to refresh"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
             </div>
             
             <input 
               type="text"
               value={userInput}
               onChange={handleChange}
               placeholder="VERIFY"
               className={`w-28 bg-[#0d1117] border ${isCorrect ? 'border-[#3fb950] text-[#3fb950]' : 'border-white/10 text-white'} rounded-xl px-4 py-3 text-xs font-black tracking-widest focus:outline-none text-center focus:border-[#f0883e] transition-all uppercase`}
             />
          </div>
        </div>
      </div>
      
      <button 
        type="button"
        onClick={generateCaptcha}
        className="p-3 text-slate-500 hover:text-[#f0883e] hover:bg-[#f0883e]/5 rounded-xl transition-all"
      >
        <RefreshCw size={18} />
      </button>
    </div>
  );
};

export default Captcha;
