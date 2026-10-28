import React, { useState } from 'react';
import { Coffee, Utensils, Croissant, Cake, ShoppingBag, Wine, Sparkles } from 'lucide-react';

interface ProductVisualProps {
  name: string;
  category: string;
  imageUrl?: string;
  preset?: string;
  className?: string;
  aspectRatio?: 'square' | 'wide' | 'thumb';
}

export const ProductVisual: React.FC<ProductVisualProps> = ({
  name,
  category,
  imageUrl,
  preset,
  className = '',
  aspectRatio = 'square',
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Pick color and icon based on category/preset
  const catLower = (category || '').toLowerCase();
  const presetLower = (preset || '').toLowerCase();

  let bgGradient = 'from-amber-950/40 to-neutral-900';
  let accentColor = '#f59e0b';
  let IconComponent = Coffee;

  if (
    presetLower.includes('burger') ||
    presetLower.includes('sandwich') ||
    presetLower.includes('wrap') ||
    catLower.includes('sandwich')
  ) {
    bgGradient = 'from-amber-950/40 to-neutral-900';
    accentColor = '#f59e0b';
    IconComponent = Utensils;
  } else if (
    presetLower.includes('meal') ||
    presetLower.includes('thali') ||
    presetLower.includes('biryani') ||
    presetLower.includes('breakfast') ||
    catLower.includes('lunch') ||
    catLower.includes('breakfast') ||
    catLower.includes('food')
  ) {
    bgGradient = 'from-orange-950/40 to-neutral-900';
    accentColor = '#f97316';
    IconComponent = Utensils;
  } else if (
    presetLower.includes('fruit') ||
    presetLower.includes('salad') ||
    presetLower.includes('nutri') ||
    catLower.includes('fruit') ||
    catLower.includes('healthy')
  ) {
    bgGradient = 'from-emerald-950/40 to-neutral-900';
    accentColor = '#10b981';
    IconComponent = Sparkles;
  } else if (
    presetLower.includes('bakery') ||
    presetLower.includes('snack') ||
    catLower.includes('bakery') ||
    catLower.includes('snack')
  ) {
    bgGradient = 'from-yellow-950/40 to-neutral-900';
    accentColor = '#eab308';
    IconComponent = Croissant;
  } else if (presetLower.includes('dessert') || catLower.includes('dessert')) {
    bgGradient = 'from-pink-950/40 to-neutral-900';
    accentColor = '#ec4899';
    IconComponent = Cake;
  } else if (presetLower.includes('combo') || catLower.includes('combo')) {
    bgGradient = 'from-purple-950/40 to-neutral-900';
    accentColor = '#a855f7';
    IconComponent = Sparkles;
  } else if (
    presetLower.includes('drink') ||
    presetLower.includes('milk') ||
    presetLower.includes('juice') ||
    catLower.includes('bev') ||
    catLower.includes('drink') ||
    catLower.includes('milk')
  ) {
    bgGradient = 'from-sky-950/40 to-neutral-900';
    accentColor = '#38bdf8';
    IconComponent = Wine;
  } else if (presetLower.includes('retail') || catLower.includes('retail')) {
    bgGradient = 'from-neutral-800 to-neutral-900';
    accentColor = '#94a3b8';
    IconComponent = ShoppingBag;
  }

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'wide'
      ? 'aspect-[4/3]'
      : 'w-10 h-10';

  if (imageUrl && !imageFailed) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-neutral-950 ${aspectClass} ${className}`}>
        <img
          src={imageUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
    );
  }

  // Fallback / Stylized Vector Presentation
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${bgGradient} border border-neutral-800/80 flex flex-col items-center justify-center p-3 text-center ${aspectClass} ${className}`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner mb-1.5"
        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
      >
        <IconComponent className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase truncate max-w-[90%]">
        {category}
      </span>
    </div>
  );
};
