import React, { useState } from 'react';

// 1. Interactive SVG Donut Chart with center total and legend
export function DonutChart({ data, total, title = "Total", size = 180, strokeWidth = 24 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const validTotal = total || data.reduce((acc, item) => acc + (item.value || 0), 0) || 1;

  let accumulatedPercent = 0;

  const segments = data.map((item, index) => {
    const percent = item.value / validTotal;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;

    return {
      ...item,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
      index
    };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg) => (
            <circle
              key={seg.index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredIdx === seg.index ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="butt"
              style={{
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                opacity: hoveredIdx === null || hoveredIdx === seg.index ? 1 : 0.6
              }}
              onMouseEnter={() => setHoveredIdx(seg.index)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center Text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff', lineHeight: 1 }}>
            {hoveredIdx !== null ? segments[hoveredIdx].value : total}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginTop: '0.2rem' }}>
            {hoveredIdx !== null ? segments[hoveredIdx].label : title}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '140px' }}>
        {segments.map((seg) => (
          <div
            key={seg.index}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              cursor: 'pointer',
              opacity: hoveredIdx === null || hoveredIdx === seg.index ? 1 : 0.5,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={() => setHoveredIdx(seg.index)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: seg.color }}></span>
              <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: '500' }}>{seg.label}</span>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ffffff' }}>
              {seg.value} ({seg.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Interactive SVG Funnel Chart
export function FunnelChart({ stages }) {
  const [hoveredStage, setHoveredStage] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', maxWidth: '340px', margin: '0 auto' }}>
      {stages.map((stage, idx) => {
        const maxWidth = 100;
        const widthPercent = maxWidth - idx * 18; // Inverted taper

        return (
          <div
            key={stage.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform: hoveredStage === idx ? 'scale(1.02)' : 'scale(1)'
            }}
            onMouseEnter={() => setHoveredStage(idx)}
            onMouseLeave={() => setHoveredStage(null)}
          >
            <div
              style={{
                width: `${widthPercent}%`,
                height: '42px',
                background: stage.gradient || stage.color,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1rem',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.85rem',
                boxShadow: hoveredStage === idx ? `0 0 15px ${stage.color}88` : 'none',
                transition: 'all 0.2s'
              }}
            >
              <span>{stage.label}</span>
              <span style={{ background: 'rgba(0,0,0,0.25)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                {stage.value}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
              {stage.subtext}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// 3. Smooth Area & Line Trend Chart
export function TrendLineChart({ points = [30, 45, 60, 52, 75, 95], labels = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], height = 180, color = "#6366f1", gradientId = "trendGrad" }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const width = 450;
  const paddingX = 35;
  const paddingY = 25;

  const maxVal = Math.max(...points, 100);
  const minVal = Math.min(...points, 0);

  const getX = (index) => paddingX + (index / (points.length - 1)) * (width - 2 * paddingX);
  const getY = (value) => height - paddingY - ((value - minVal) / (maxVal - minVal || 1)) * (height - 2 * paddingY);

  // Generate SVG path string with smooth curves
  const pathD = points.reduce((acc, point, i, arr) => {
    const x = getX(i);
    const y = getY(point);
    if (i === 0) return `M ${x} ${y}`;

    const prevX = getX(i - 1);
    const prevY = getY(arr[i - 1]);
    const cpX1 = prevX + (x - prevX) / 2;
    const cpY1 = prevY;
    const cpX2 = prevX + (x - prevX) / 2;
    const cpY2 = y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${getX(points.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`;

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((p, idx) => {
          const y = height - paddingY - p * (height - 2 * paddingY);
          return (
            <line
              key={idx}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Line curve */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />

        {/* Data points */}
        {points.map((val, i) => {
          const cx = getX(i);
          const cy = getY(val);
          const isHovered = hoveredPoint === i;

          return (
            <g key={i} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)} style={{ cursor: 'pointer' }}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 7 : 4.5}
                fill={color}
                stroke="#0f172a"
                strokeWidth="2.5"
                style={{ transition: 'r 0.2s' }}
              />
              {isHovered && (
                <g>
                  <rect
                    x={cx - 22}
                    y={cy - 30}
                    width="44"
                    height="22"
                    rx="4"
                    fill="#1e293b"
                    stroke="rgba(255,255,255,0.2)"
                  />
                  <text
                    x={cx}
                    y={cy - 15}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {val}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* X Labels */}
        {labels.map((lbl, i) => (
          <text
            key={i}
            x={getX(i)}
            y={height - 6}
            textAnchor="middle"
            fill="#64748b"
            fontSize="10"
            fontWeight="600"
          >
            {lbl}
          </text>
        ))}
      </svg>
    </div>
  );
}

// 4. Horizontal Categories Progress Bars
export function CategoryBarChart({ categories }) {
  const maxCount = Math.max(...categories.map(c => c.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      {categories.map((cat) => (
        <div key={cat.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: '#cbd5e1', fontWeight: '600' }}>{cat.label}</span>
            <span style={{ color: cat.color || '#818cf8', fontWeight: '700' }}>{cat.count}</span>
          </div>
          <div style={{ width: '100%', height: '7px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(cat.count / maxCount) * 100}%`,
                height: '100%',
                backgroundColor: cat.color || '#6366f1',
                borderRadius: '9999px',
                transition: 'width 0.5s ease'
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 5. Circular Radial Gauge for Profile Completion
export function RadialProgressGauge({ percent = 78, size = 130, strokeWidth = 12, label = "Completed" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#radialGaugeGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <defs>
          <linearGradient id="radialGaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ffffff', lineHeight: 1 }}>{percent}%</span>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginTop: '0.2rem' }}>{label}</span>
      </div>
    </div>
  );
}
