import React from 'react';

/**
 * FMCSADutyGraph component rendering an authentic 4-row 24-hour FMCSA Driver Daily Log graph
 * matching official FMCSA paper form standards.
 *
 * Features:
 * - Solid black top header bar: "Midnight 1 2 3 4 5 6 7 8 9 10 11 Noon 1 2 3 4 5 6 7 8 9 10 11 Midnight" & "Total Hours"
 * - 15-minute, 30-minute, and 1-hour grid tick marks
 * - 4 Standard FMCSA Status Rows:
 *   1. Off Duty
 *   2. Sleeper Berth
 *   3. Driving
 *   4. On Duty (not driving)
 * - Ultra-precise continuous vector step-function duty path starting at hour 0.0 and ending at hour 24.0
 * - Exact vertical transitions at duty change timestamps
 * - preserveAspectRatio="xMinYMin meet" for rock-solid grid & status bar alignment across full window lengths
 * - Right-side row total hours column & grand total 24.0 validation box
 */
const FMCSADutyGraph = ({ segments = [], totals = {} }) => {
  const svgWidth = 840;
  const headerHeight = 26;
  const rowHeight = 32;
  const labelWidth = 120;
  const totalColWidth = 70;
  const graphWidth = svgWidth - labelWidth - totalColWidth; // 650px for 24 hours (27.083px / hour)
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

  // Build full 24-hour normalized segments covering 0.0 to 24.0
  const getNormalizedSegments = () => {
    if (!segments || segments.length === 0) {
      return [{ status: 'off_duty', start_hour: 0, end_hour: 24 }];
    }

    const sorted = [...segments].sort((a, b) => a.start_hour - b.start_hour);
    const normalized = [];
    let currentHour = 0;

    sorted.forEach((seg) => {
      if (seg.start_hour > currentHour) {
        normalized.push({
          status: 'off_duty',
          start_hour: currentHour,
          end_hour: seg.start_hour,
        });
      }
      normalized.push(seg);
      currentHour = Math.max(currentHour, seg.end_hour);
    });

    if (currentHour < 24) {
      normalized.push({
        status: 'off_duty',
        start_hour: currentHour,
        end_hour: 24,
      });
    }

    return normalized;
  };

  const buildGraphPath = () => {
    const normSegs = getNormalizedSegments();
    let pathCommands = [];
    let currentY = null;

    normSegs.forEach((seg, idx) => {
      const rowIndex = STATUS_ROW_MAP[seg.status] ?? 0;
      const startX = hourToX(seg.start_hour);
      const endX = hourToX(seg.end_hour);
      const targetY = rowToY(rowIndex);

      if (idx === 0) {
        pathCommands.push(`M ${startX.toFixed(2)} ${targetY.toFixed(2)}`);
      } else if (currentY !== null && currentY !== targetY) {
        // Vertical step transition at exact timestamp
        pathCommands.push(`L ${startX.toFixed(2)} ${targetY.toFixed(2)}`);
      }

      // Horizontal line across status interval
      pathCommands.push(`L ${endX.toFixed(2)} ${targetY.toFixed(2)}`);
      currentY = targetY;
    });

    return pathCommands.join(' ');
  };

  const offDuty = totals.off_duty || 0;
  const sleeper = totals.sleeper || 0;
  const driving = totals.driving || 0;
  const onDuty = totals.on_duty || 0;

  const rowLabels = [
    { name: '1. OFF DUTY', key: 'off_duty', hours: offDuty },
    { name: '2. SLEEPER BERTH', key: 'sleeper', hours: sleeper },
    { name: '3. DRIVING', key: 'driving', hours: driving },
    { name: '4. ON DUTY (not driving)', key: 'on_duty', hours: onDuty },
  ];

  const grandTotal = offDuty + sleeper + driving + onDuty;

  return (
    <div className="w-full overflow-x-auto bg-white p-2 border border-black font-sans text-black select-none">
      <div className="w-full min-w-[780px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${graphTop + 4 * rowHeight + 1}`}
          className="w-full h-auto block"
          preserveAspectRatio="xMinYMin meet"
          shapeRendering="geometricPrecision"
        >
          {/* Top Black Header Bar */}
          <rect x={0} y={0} width={svgWidth} height={headerHeight} fill="#000000" />

          {/* Left "OFFICIAL LOG" Header Label */}
          <text
            x={10}
            y={17}
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            letterSpacing="0.5"
          >
            STATUS
          </text>

          {/* Hour Labels inside Black Bar (0..24) */}
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
                fontSize={hour === 0 || hour === 12 || hour === 24 ? '7.5' : '8.5'}
                fontWeight="bold"
              >
                {labelText}
              </text>
            );
          })}

          {/* Total Hours Header */}
          <text
            x={svgWidth - 35}
            y={17}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.5"
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
                <rect x={0} y={y} width={svgWidth} height={rowHeight} fill="#ffffff" />

                {/* Left Row Label */}
                <text x={8} y={y + 19} fill="#000000" fontSize="9" fontWeight="bold">
                  {row.name}
                </text>

                {/* Horizontal top line of row */}
                <line x1={0} y1={y} x2={svgWidth} y2={y} stroke="#000000" strokeWidth="1" />

                {/* Right side Total Hours line & text */}
                <line
                  x1={labelWidth + graphWidth}
                  y1={y}
                  x2={labelWidth + graphWidth}
                  y2={y + rowHeight}
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

        {/* Total 24.0 Hours Grand Total Verification Footer */}
        <div className="flex justify-between items-center mt-1 px-1 font-mono text-[10px] text-black border-t border-black pt-1 font-bold">
          <span>24-Hour Duty Grid Status Summary</span>
          <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-300 rounded">
            Total Accumulated: {grandTotal.toFixed(1)} / 24.0 Hours
          </span>
        </div>
      </div>
    </div>
  );
};

export default FMCSADutyGraph;
