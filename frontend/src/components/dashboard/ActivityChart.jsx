import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function ActivityChart({ 
  data = [
    { day: 'Mon', minutes: 35, sessions: 2 },
    { day: 'Tue', minutes: 60, sessions: 3 },
    { day: 'Wed', minutes: 45, sessions: 2 },
    { day: 'Thu', minutes: 80, sessions: 4 },
    { day: 'Fri', minutes: 55, sessions: 3 },
    { day: 'Sat', minutes: 90, sessions: 5 },
    { day: 'Sun', minutes: 70, sessions: 4 }
  ],
  title = "Weekly Practice Activity",
  subtitle = "Interview preparation time (minutes)"
}) {
  const [activeBar, setActiveBar] = useState(null);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F172A] text-white px-3 py-2 rounded-xl text-xs shadow-lg">
          <p className="font-bold">{payload[0].payload.day}</p>
          <p className="text-[#5B4DFF] font-semibold">{payload[0].value} mins practice</p>
          <p className="text-slate-400">{payload[0].payload.sessions} sessions completed</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#E7EAF3] shadow-soft flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-[800] text-[#0F172A]">{title}</h3>
          <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-[#EEF2FF] text-[#5B4DFF] text-xs font-bold">
          Total: 435 mins
        </div>
      </div>

      <div className="w-full h-64 mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onMouseMove={(state) => {
              if (state.isTooltipActive) {
                setActiveBar(state.activeTooltipIndex);
              } else {
                setActiveBar(null);
              }
            }}
          >
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
              dy={8}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar 
              dataKey="minutes" 
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={activeBar === index ? '#5B4DFF' : '#EEF2FF'} 
                  stroke={activeBar === index ? '#4E3FE8' : '#D5DDFF'}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
