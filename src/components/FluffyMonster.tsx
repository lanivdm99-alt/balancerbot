import { useState, useEffect } from 'react';

interface MonsterProps {
  type: string;
  level: number;
  xp: number;
  color: string;
}

const MONSTER_TYPES = {
  flash: { name: 'Flash Fox', emoji: '🦊', baseColor: '#ff0066' },
  arb: { name: 'Arb Alien', emoji: '👾', baseColor: '#00ffff' },
  mev: { name: 'MEV Monster', emoji: '👹', baseColor: '#ff00ff' },
  gas: { name: 'Gas Ghost', emoji: '👻', baseColor: '#ffff00' },
  pool: { name: 'Pool Panda', emoji: '🐼', baseColor: '#00ff41' },
  swap: { name: 'Swap Serpent', emoji: '🐉', baseColor: '#bf00ff' },
};

export default function FluffyMonster({ type, level, xp, color }: MonsterProps) {
  const [bounce, setBounce] = useState(false);
  const [glow, setGlow] = useState(false);
  
  const monster = MONSTER_TYPES[type as keyof typeof MONSTER_TYPES] || MONSTER_TYPES.flash;
  
  // Animate on XP gain
  useEffect(() => {
    setBounce(true);
    setGlow(true);
    const timer = setTimeout(() => {
      setBounce(false);
      setGlow(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [xp]);

  const size = Math.min(100 + level * 10, 200);
  const xpProgress = (xp % 100) / 100;

  return (
    <div className="relative flex flex-col items-center">
      {/* Monster Container */}
      <div
        className={`relative transition-all duration-300 ${
          bounce ? 'animate-bounce' : ''
        }`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          filter: glow ? `drop-shadow(0 0 20px ${color}) drop-shadow(0 0 40px ${color})` : 'none',
        }}
      >
        {/* Fluffy Body */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${color}88, ${color}44, ${color}22)`,
            boxShadow: `
              0 0 ${20 + level * 2}px ${color}66,
              0 0 ${40 + level * 4}px ${color}44,
              0 0 ${60 + level * 6}px ${color}22,
              inset 0 0 ${20 + level * 2}px ${color}44
            `,
          }}
        />
        
        {/* Fluffy Edges */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, ${color}aa 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, ${color}aa 0%, transparent 50%),
              radial-gradient(circle at 20% 80%, ${color}aa 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, ${color}aa 0%, transparent 50%)
            `,
            animation: 'spin 20s linear infinite',
          }}
        />

        {/* Monster Emoji */}
        <div className="absolute inset-0 flex items-center justify-center text-6xl">
          {monster.emoji}
        </div>

        {/* Level Badge */}
        <div
          className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2"
          style={{
            backgroundColor: '#000',
            borderColor: color,
            color: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        >
          {level}
        </div>
      </div>

      {/* Monster Info */}
      <div className="mt-3 text-center">
        <div className="text-xs font-bold" style={{ color }}>
          {monster.name}
        </div>
        <div className="text-[10px] text-gray-400">
          LVL {level} • {xp} XP
        </div>
        
        {/* XP Progress Bar */}
        <div className="mt-1 w-full h-1 bg-black rounded-full overflow-hidden border border-gray-700">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${xpProgress * 100}%`,
              backgroundColor: color,
              boxShadow: `0 0 5px ${color}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Monster Collection Component
export function MonsterCollection({ monsters }: { monsters: any[] }) {
  return (
    <div className="box-purple p-3">
      <h3 className="text-xs uppercase tracking-wider shock-pink mb-3 font-bold">
        🎮 Monster Collection ({monsters.length}/6)
      </h3>
      
      <div className="grid grid-cols-3 gap-2">
        {monsters.map((monster, idx) => (
          <FluffyMonster
            key={idx}
            type={monster.type}
            level={monster.level}
            xp={monster.xp}
            color={monster.color}
          />
        ))}
      </div>
      
      {monsters.length < 6 && (
        <div className="mt-3 text-center">
          <p className="text-[10px] shock-cyan">
            Unlock more monsters by trading!
          </p>
        </div>
      )}
    </div>
  );
}
