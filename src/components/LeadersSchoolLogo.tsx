import React from 'react';

interface LeadersSchoolLogoProps {
  customLogoUrl?: string | null;
  className?: string;
  variant?: 'full' | 'compact';
  onClick?: () => void;
}

export const LeadersSchoolLogo: React.FC<LeadersSchoolLogoProps> = ({
  customLogoUrl,
  className = '',
  variant = 'full',
  onClick,
}) => {
  // If the user uploaded or set a custom image logo, display that image
  if (customLogoUrl) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center justify-center shrink-0 ${className} cursor-pointer`}
        title="The Leaders Group of Schools (Click to change logo)"
      >
        <img
          src={customLogoUrl}
          alt="The Leaders Group of Schools Logo"
          className="max-h-10 w-auto object-contain rounded-sm"
        />
      </div>
    );
  }

  // Official vector high-fidelity emblem for The Leaders Group of Schools
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 shrink-0 select-none cursor-pointer group ${className}`}
      title="The Leaders Group of Schools (Click to customize logo & colours)"
    >
      {/* Official Golden Laurel Shield Emblem */}
      <div className="relative w-10 h-10 shrink-0 flex items-center justify-center bg-[#071324] rounded-lg border border-[#D4AF37]/60 shadow-sm p-1 group-hover:border-[#D4AF37] transition-all">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Gold Shield Border */}
          <path
            d="M50 6 C70 6 86 14 86 28 C86 62 66 85 50 94 C34 85 14 62 14 28 C14 14 30 6 50 6 Z"
            fill="#0B1F3A"
            stroke="#D4AF37"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Inner Decorative Laurel Branch Left */}
          <path
            d="M26 38 C23 44 24 53 28 60 C32 67 38 73 44 78"
            stroke="#D4AF37"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />
          <circle cx="24" cy="42" r="2.2" fill="#D4AF37" />
          <circle cx="26" cy="51" r="2.2" fill="#D4AF37" />
          <circle cx="31" cy="61" r="2.2" fill="#D4AF37" />
          <circle cx="37" cy="70" r="2.2" fill="#D4AF37" />

          {/* Inner Decorative Laurel Branch Right */}
          <path
            d="M74 38 C77 44 76 53 72 60 C68 67 62 73 56 78"
            stroke="#D4AF37"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />
          <circle cx="76" cy="42" r="2.2" fill="#D4AF37" />
          <circle cx="74" cy="51" r="2.2" fill="#D4AF37" />
          <circle cx="69" cy="61" r="2.2" fill="#D4AF37" />
          <circle cx="63" cy="70" r="2.2" fill="#D4AF37" />

          {/* Golden Star of Leadership at Crest Top */}
          <polygon
            points="50,15 52.5,22 60,22 54,26.5 56.5,33.5 50,29 43.5,33.5 46,26.5 40,22 47.5,22"
            fill="#D4AF37"
          />

          {/* Open Book of Knowledge in Gold & White */}
          <path
            d="M32 46 C38 43 45 44 50 47 C55 44 62 43 68 46 L68 62 C62 59 55 60 50 63 C45 60 38 59 32 62 Z"
            fill="#FFFFFF"
            stroke="#D4AF37"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Book Spine Center Line */}
          <line x1="50" y1="47" x2="50" y2="63" stroke="#0B1F3A" strokeWidth="2" />

          {/* Golden Lettering Monogram */}
          <text
            x="50"
            y="76"
            textAnchor="middle"
            fill="#D4AF37"
            fontSize="10"
            fontWeight="bold"
            fontFamily="serif"
            letterSpacing="1"
          >
            TLGS
          </text>
        </svg>
      </div>

      {/* Official Typography (The Leaders Group of Schools) */}
      {variant === 'full' && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] sm:text-[13px] font-black tracking-wider text-white font-serif uppercase drop-shadow-xs">
              THE LEADERS
            </span>
            <span className="text-[9px] font-semibold text-[#D4AF37] bg-[#D4AF37]/15 px-1 py-0.5 rounded border border-[#D4AF37]/40 tracking-wider">
              CBSE
            </span>
          </div>
          <span className="text-[9px] sm:text-[9.5px] font-medium tracking-widest text-[#D4AF37] uppercase mt-0.5">
            GROUP OF SCHOOLS
          </span>
        </div>
      )}
    </div>
  );
};
