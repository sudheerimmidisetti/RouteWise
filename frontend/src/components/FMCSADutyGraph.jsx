import React from 'react';

/**
 * FMCSADutyGraph component rendering an authentic 4-row 24-hour FMCSA Driver Daily Log graph
 * matching the official government paper form.
 *
 * Features:
 * - Solid black top header bar with "Mid-night 1..11 Noon 1..11 Mid-night" and "Total Hours"
 * - 15-minute (short), 30-minute (medium), and 1-hour (full) vertical grid ticks
 * - 4 Row Labels:
 *   1. Off Duty
 *   2. Sleeper Berth
 *   3. Driving
 *   4. On Duty (not driving)
 * - Continuous black step-function duty path
 * - Right side total lines per row
 */
const FMCSADutyGraph = ({ segments = [], totals = {} }) => {
  const svgWidth = 840;
  const headerHeight = 26;
  const rowHeight = 32;
  const labelWidth = 110;
  const totalColWidth = 70;
  const graphWidth = svgWidth - labelWidth - totalColWidth; // 660px for 24 hours (27.5px / hour)
  const graphTop = headerHeight;

  const STATUS_ROW_MAP = {
    off_duty: 0,
    sleeper: 1,
    driving: 2,
    on_duty: 3,
  };

  const hourToX = (hour) => {
    const clamped = Math.max(0, Math.min(24, hour));
    return labelWidth + (clamped / 24.0) * graphWidth;
  };

  const rowToY = (rowIndex) => {
    return graphTop + rowIndex * rowHeight + rowHeight / 2;
  };

  const buildGraphPath = () => {
    if (!segments || segments.length === 0) {
      const startX = hourToX(0);
      const endX = hourToX(24);
      const y = rowToY(0);
      return `M ${startX} ${y} L ${endX} ${y}`;
    }

    let pathCommands = [];
    let currentY = null;

    segments.forEach((seg, idx) => {
      const rowIndex = STATUS_ROW_MAP[seg.status] ?? 0;
      const startX = hourToX(seg.start_hour);
      const endX = hourToX(seg.end_hour);
      const targetY = rowToY(rowIndex);

      if (idx === 0) {
        pathCommands.push(`M ${startX} ${targetY}`);
      } else if (currentY !== null && currentY !== targetY) {
        pathCommands.push(`L ${startX} ${targetY}`);
      }

      pathCommands.push(`L ${endX} ${targetY}`);
      currentY = targetY;
    });

    return pathCommands.join(' ');
  };

  const rowLabels = [
    { name: '1. Off Duty', key: 'off_duty', hours: totals.off_duty || 0 },
    { name: '2. Sleeper Berth', key: 'sleeper', hours: totals.sleeper || 0 },
    { name: '3. Driving', key: 'driving', hours: totals.driving || 0 },
    { name: '4. On Duty (not driving)', key: 'on_duty', hours: totals.on_duty || 0 },
  ];

  const grandTotal = (totals.off_duty || 0) + (totals.sleeper || 0) + (totals.driving || 0) + (totals.on_duty || 0);

  return (
    <div className="w-full overflow-x-auto bg-white p-2 border border-black font-sans text-black select-none">
      <div className="min-w-[800px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${graphTop + 4 * rowHeight}`}
          className="w-full h-auto"
        >
          {/* Top Black Header Bar */}
          <rect x={0} y={0} width={svgWidth} height={headerHeight} fill="#000000" />

          {/* Hour Labels inside Black Bar */}
          {Array.from({ length: 25 }).map((_, hour) => {
            const x = hourToX(hour);
            let labelText = hour.toString();
            if (hour === 0) labelText = 'Mid-night';
            else if (hour === 12) labelText = 'Noon';
            else if (hour === 24) labelText = 'Mid-night';

            return (
              <text
                key={hour}
                x={x}
                y={17}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={hour === 0 || hour === 12 || hour === 24 ? "8" : "9"}
                fontWeight="bold"
              >
                {labelText}
              </text>
            );
          })}

          {/* Total Hours Label inside Black Bar */}
          <text
            x={svgWidth - 35}
            y={17}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
          >
            Total Hours
          </text>

          {/* 4 Status Rows Grid */}
          {rowLabels.map((row, idx) => {
            const y = graphTop + idx * rowHeight;

            return (
              <g key={row.key}>
                {/* Horizontal row background */}
                <rect
                  x={0}
                  y={y}
                  width={svgWidth}
                  height={rowHeight}
                  fill="#ffffff"
                />

                {/* Left Row Label */}
                <text
                  x={8}
                  y={y + 18}
                  fill="#000000"
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  {row.name}
                </text>

                {/* Horizontal top line of row */}
                <line
                  x1={0}
                  y1={y}
                  x2={svgWidth}
                  y2={y}
                  stroke="#000000"
                  strokeWidth="1"
                />

                {/* Right side Total Hours line & text */}
                <line
                  x1={labelWidth + graphWidth + 10}
                  y1={y + rowHeight - 2}
                  x2={svgWidth - 5}
                  y2={y + rowHeight - 2}
                  stroke="#000000"
                  strokeWidth="1"
                />
                <text
                  x={svgWidth - 35}
                  y={y + 20}
                  textAnchor="middle"
                  fill="#000000"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {row.hours.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Vertical Grid Tick Marks (15-min, 30-min, 1-hour) across 4 rows */}
          {Array.from({ length: 24 }).map((_, hour) => {
            const xHour = hourToX(hour);
            const x15 = hourToX(hour + 0.25);
            const x30 = hourToX(hour + 0.5);
            const x45 = hourToX(hour + 0.75);

            return (
              <g key={hour}>
                {rowLabels.map((_, rIdx) => {
                  const rY = graphTop + rIdx * rowHeight;

                  return (
                    <g key={rIdx}>
                      {/* 1-Hour Full Height Line */}
                      <line
                        x1={xHour}
                        y1={rY}
                        x2={xHour}
                        y2={rY + rowHeight}
                        stroke="#000000"
                        strokeWidth="1"
                      />
                      {/* 15-Min Short Tick */}
                      <line
                        x1={x15}
                        y1={rY}
                        x2={x15}
                        y2={rY + rowHeight * 0.3}
                        stroke="#444444"
                        strokeWidth="0.75"
                      />
                      {/* 30-Min Medium Tick */}
                      <line
                        x1={x30}
                        y1={rY}
                        x2={x30}
                        y2={rY + rowHeight * 0.65}
                        stroke="#000000"
                        strokeWidth="0.85"
                      />
                      {/* 45-Min Short Tick */}
                      <line
                        x1={x45}
                        y1={rY}
                        x2={x45}
                        y2={rY + rowHeight * 0.3}
                        stroke="#444444"
                        strokeWidth="0.75"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Right boundary grid line */}
          {rowLabels.map((_, rIdx) => {
            const rY = graphTop + rIdx * rowHeight;
            const xEnd = hourToX(24);
            return (
              <line
                key={`end-${rIdx}`}
                x1={xEnd}
                y1={rY}
                x2={xEnd}
                y2={rY + rowHeight}
                stroke="#000000"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Bottom Grid Border */}
          <line
            x1={0}
            y1={graphTop + 4 * rowHeight}
            x2={svgWidth}
            y2={graphTop + 4 * rowHeight}
            stroke="#000000"
            strokeWidth="1.5"
          />

          {/* Dynamic Duty Status Polyline Path */}
          <path
            d={buildGraphPath()}
            fill="none"
            stroke="#000000"
            strokeWidth="2.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </div>
    </div>
  );
};

export default FMCSADutyGraph;
