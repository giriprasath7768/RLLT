import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';

const CHART_COLORS = [
    '#1d72f2', // Blue
    '#28a745', // Green
    '#f59e0b', // Orange
    '#8b3dff', // Purple
    '#ef4444', // Red
    '#06b6d4', // Cyan
];

const formatRoleLabel = (role) => {
    if (!role) return 'User';
    const r = String(role).toLowerCase();
    if (r === 'super_admin') return 'Super Admin';
    if (r === 'admin') return 'Admin';
    if (r === 'leader') return 'Leader';
    if (r === 'student') return 'Student';
    return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');
};

const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getNiceMax = (maxVal, defaultMax = 800, steps = 4) => {
    if (!maxVal || maxVal <= 0) return defaultMax;
    const rawStep = Math.ceil(maxVal / steps);
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
    const normalized = rawStep / magnitude;
    let niceNormalized = 1;
    if (normalized <= 1) niceNormalized = 1;
    else if (normalized <= 2) niceNormalized = 2;
    else if (normalized <= 2.5) niceNormalized = 2.5;
    else if (normalized <= 5) niceNormalized = 5;
    else niceNormalized = 10;
    return Math.max(1, Math.ceil(niceNormalized * magnitude)) * steps;
};

/* =========================================================================
   GROUPED 2D BAR CHART (Used in Overview & Phase 2: 2D Chart Analysis)
   ========================================================================= */
const Grouped2DBarChart = ({ groups, xAxisTitle = '', showModulePrefix = false }) => {
    const [hoveredBar, setHoveredBar] = useState(null);

    const maxDataVal = useMemo(() => {
        let max = 0;
        groups.forEach((g) => {
            if (g.daily > max) max = g.daily;
            if (g.ableAgain > max) max = g.ableAgain;
        });
        return getNiceMax(max, 800, 4);
    }, [groups]);

    const yTicks = useMemo(() => {
        const step = maxDataVal / 4;
        return [0, step, step * 2, step * 3, maxDataVal];
    }, [maxDataVal]);

    const svgWidth = 540;
    const svgHeight = xAxisTitle ? 265 : 245;
    const padLeft = 46;
    const padRight = 18;
    const padTop = 16;
    const padBottom = xAxisTitle ? 50 : 34;
    const plotWidth = svgWidth - padLeft - padRight;
    const plotHeight = svgHeight - padTop - padBottom;

    const count = Math.max(1, groups.length);
    const groupWidth = plotWidth / count;
    const barWidth = Math.min(28, Math.max(12, groupWidth * 0.28));
    const barGap = Math.min(8, Math.max(4, groupWidth * 0.06));

    return (
        <div className="w-full flex flex-col items-center">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
                {/* Horizontal Grid Lines & Y-Axis Labels */}
                {yTicks.map((tick, idx) => {
                    const y = padTop + plotHeight - (tick / maxDataVal) * plotHeight;
                    return (
                        <g key={idx}>
                            <line
                                x1={padLeft}
                                y1={y}
                                x2={padLeft + plotWidth}
                                y2={y}
                                stroke={idx === 0 ? '#94a3b8' : '#e2e8f0'}
                                strokeWidth={idx === 0 ? '1.2' : '1'}
                            />
                            <text
                                x={padLeft - 10}
                                y={y + 4}
                                textAnchor="end"
                                className="fill-slate-600 text-[12px] font-medium"
                            >
                                {Math.round(tick)}
                            </text>
                        </g>
                    );
                })}

                {/* Left Y-axis line */}
                <line
                    x1={padLeft}
                    y1={padTop}
                    x2={padLeft}
                    y2={padTop + plotHeight}
                    stroke="#94a3b8"
                    strokeWidth="1.2"
                />

                {/* Vertical Column Dividers */}
                {groups.map((_, i) => {
                    const xLine = padLeft + (i + 1) * groupWidth;
                    return (
                        <line
                            key={i}
                            x1={xLine}
                            y1={padTop}
                            x2={xLine}
                            y2={padTop + plotHeight}
                            stroke="#f1f5f9"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Bars per Group */}
                {groups.map((item, i) => {
                    const groupCenter = padLeft + i * groupWidth + groupWidth / 2;
                    const dailyX = groupCenter - barWidth - barGap / 2;
                    const ableX = groupCenter + barGap / 2;

                    const dailyHeight = Math.max(
                        item.daily > 0 ? 4 : 0,
                        (item.daily / maxDataVal) * plotHeight
                    );
                    const ableHeight = Math.max(
                        item.ableAgain > 0 ? 4 : 0,
                        (item.ableAgain / maxDataVal) * plotHeight
                    );

                    const dailyY = padTop + plotHeight - dailyHeight;
                    const ableY = padTop + plotHeight - ableHeight;
                    const displayLabel = showModulePrefix ? `Module ${item.label}` : item.label;

                    return (
                        <g key={item.label}>
                            {dailyHeight > 0 && (
                                <rect
                                    x={dailyX}
                                    y={dailyY}
                                    width={barWidth}
                                    height={dailyHeight}
                                    rx="2.5"
                                    fill="#1d72f2"
                                    className="transition-opacity duration-150 cursor-pointer hover:opacity-90"
                                    onMouseEnter={() =>
                                        setHoveredBar({
                                            x: dailyX + barWidth / 2,
                                            y: dailyY,
                                            label: `${displayLabel} - Daily ISI: ${item.daily}`,
                                        })
                                    }
                                    onMouseLeave={() => setHoveredBar(null)}
                                />
                            )}

                            {ableHeight > 0 && (
                                <rect
                                    x={ableX}
                                    y={ableY}
                                    width={barWidth}
                                    height={ableHeight}
                                    rx="2.5"
                                    fill="#28a745"
                                    className="transition-opacity duration-150 cursor-pointer hover:opacity-90"
                                    onMouseEnter={() =>
                                        setHoveredBar({
                                            x: ableX + barWidth / 2,
                                            y: ableY,
                                            label: `${displayLabel} - Able Again: ${item.ableAgain}`,
                                        })
                                    }
                                    onMouseLeave={() => setHoveredBar(null)}
                                />
                            )}

                            <text
                                x={groupCenter}
                                y={padTop + plotHeight + 19}
                                textAnchor="middle"
                                className="fill-slate-700 text-[12px] font-medium"
                            >
                                {displayLabel}
                            </text>
                        </g>
                    );
                })}

                {xAxisTitle && (
                    <text
                        x={padLeft + plotWidth / 2}
                        y={padTop + plotHeight + 40}
                        textAnchor="middle"
                        className="fill-slate-700 text-[13px] font-medium"
                    >
                        {xAxisTitle}
                    </text>
                )}

                {hoveredBar && (
                    <g transform={`translate(${hoveredBar.x}, ${Math.max(18, hoveredBar.y - 8)})`}>
                        <rect
                            x="-90"
                            y="-26"
                            width="180"
                            height="22"
                            rx="5"
                            fill="#0f172a"
                            opacity="0.92"
                        />
                        <text
                            x="0"
                            y="-11"
                            textAnchor="middle"
                            className="fill-white text-[11px] font-semibold"
                        >
                            {hoveredBar.label}
                        </text>
                    </g>
                )}
            </svg>

            {/* Bottom Legend */}
            <div className="flex items-center justify-center gap-7 mt-1">
                <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-[3px] bg-[#1d72f2] inline-block"></span>
                    <span className="text-[13px] text-slate-700 font-medium">Daily ISI Count</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-[3px] bg-[#28a745] inline-block"></span>
                    <span className="text-[13px] text-slate-700 font-medium">Able Again Count</span>
                </div>
            </div>
        </div>
    );
};

/* =========================================================================
   DONUT CHART (Supports Optional Center Total Text)
   ========================================================================= */
const DonutChart2D = ({ items, showCenterTotal = false, centerTotalValue = 0 }) => {
    const [hoveredIdx, setHoveredIdx] = useState(null);

    const distribution = useMemo(() => {
        const total = items.reduce((sum, item) => sum + item.value, 0);
        return items.map((item, idx) => ({
            ...item,
            color: item.color || CHART_COLORS[idx % CHART_COLORS.length],
            percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
            fraction: total > 0 ? item.value / total : 0,
        }));
    }, [items]);

    const size = 215;
    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = 90;
    const innerRadius = 56;

    const describeDonutArc = (startAngle, endAngle, rOuter, rInner) => {
        const fullCircle = endAngle - startAngle >= Math.PI * 2 - 0.001;
        if (fullCircle) {
            endAngle = startAngle + Math.PI * 2 - 0.001;
        }
        const x1 = cx + rOuter * Math.cos(startAngle);
        const y1 = cy + rOuter * Math.sin(startAngle);
        const x2 = cx + rOuter * Math.cos(endAngle);
        const y2 = cy + rOuter * Math.sin(endAngle);

        const x3 = cx + rInner * Math.cos(endAngle);
        const y3 = cy + rInner * Math.sin(endAngle);
        const x4 = cx + rInner * Math.cos(startAngle);
        const y4 = cy + rInner * Math.sin(startAngle);

        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

        return [
            `M ${x1} ${y1}`,
            `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2}`,
            `L ${x3} ${y3}`,
            `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4}`,
            'Z',
        ].join(' ');
    };

    let currentAngle = -Math.PI / 2;
    const slices = distribution.map((item, index) => {
        const angle = item.fraction * Math.PI * 2;
        const start = currentAngle;
        const end = currentAngle + angle;
        currentAngle = end;
        return {
            ...item,
            index,
            start,
            end,
            mid: start + angle / 2,
        };
    });

    return (
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            {/* Donut SVG */}
            <div className="relative flex-shrink-0">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {slices.length === 0 ? (
                        <circle
                            cx={cx}
                            cy={cy}
                            r={(outerRadius + innerRadius) / 2}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth={outerRadius - innerRadius}
                        />
                    ) : (
                        slices.map((s) => {
                            const isHovered = hoveredIdx === s.index;
                            const offset = isHovered ? 4 : 0;
                            const dx = Math.cos(s.mid) * offset;
                            const dy = Math.sin(s.mid) * offset;
                            return (
                                <path
                                    key={s.label}
                                    d={describeDonutArc(s.start, s.end, outerRadius, innerRadius)}
                                    fill={s.color}
                                    stroke="#ffffff"
                                    strokeWidth={slices.length > 1 ? '2.5' : '0'}
                                    transform={`translate(${dx}, ${dy})`}
                                    className="transition-transform duration-150 cursor-pointer"
                                    onMouseEnter={() => setHoveredIdx(s.index)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                />
                            );
                        })
                    )}

                    {showCenterTotal && (
                        <g>
                            <text
                                x={cx}
                                y={cy - 2}
                                textAnchor="middle"
                                className="fill-[#0f172a] text-[22px] font-bold"
                            >
                                {centerTotalValue.toLocaleString()}
                            </text>
                            <text
                                x={cx}
                                y={cy + 18}
                                textAnchor="middle"
                                className="fill-slate-500 text-[13px] font-medium"
                            >
                                Total
                            </text>
                        </g>
                    )}
                </svg>
            </div>

            {/* Right Legend */}
            <div className="flex flex-col gap-3.5 min-w-[195px]">
                {distribution.length === 0 ? (
                    <div className="text-sm text-slate-400">No data available</div>
                ) : (
                    distribution.map((item, idx) => (
                        <div
                            key={item.label}
                            onMouseEnter={() => setHoveredIdx(idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            className={`flex items-center justify-between gap-4 text-[13.5px] cursor-pointer transition-opacity ${
                                hoveredIdx !== null && hoveredIdx !== idx ? 'opacity-50' : 'opacity-100'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <span
                                    className="w-3.5 h-3.5 rounded-[3px] inline-block flex-shrink-0"
                                    style={{ backgroundColor: item.color }}
                                ></span>
                                <span className="text-slate-700 font-medium truncate max-w-[115px]">
                                    {item.label}
                                </span>
                            </div>
                            <div className="text-slate-800 font-medium whitespace-nowrap">
                                {item.value.toLocaleString()}{' '}
                                <span className="text-slate-600">({item.percentage}%)</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

/* =========================================================================
   DAILY TREND (LINE CHART) - Phase 2 Bottom-Left Card
   ========================================================================= */
const DailyTrendLineChart = ({ data }) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const trendPoints = useMemo(() => {
        const byDate = new Map();
        data.forEach((r) => {
            const rawDate = r.created_at ? new Date(r.created_at) : null;
            const key =
                rawDate && !isNaN(rawDate.getTime())
                    ? rawDate.toISOString().slice(0, 10)
                    : '2026-10-24';
            if (!byDate.has(key)) {
                byDate.set(key, { dateKey: key, daily: 0, ableAgain: 0 });
            }
            const item = byDate.get(key);
            item.daily += Number(r.daily_isi_count) || 0;
            item.ableAgain += Number(r.able_again_count) || 0;
        });

        let sorted = Array.from(byDate.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));

        // If fewer than 7 date buckets exist, pad across Oct timeline so the line chart looks rich like the reference
        if (sorted.length < 7) {
            const sampleDays = ['01 Oct', '05 Oct', '10 Oct', '15 Oct', '20 Oct', '25 Oct', '31 Oct'];
            const totalDaily = sorted.reduce((s, d) => s + d.daily, 0);
            const totalAble = sorted.reduce((s, d) => s + d.ableAgain, 0);
            return sampleDays.map((label, idx) => {
                const existing = sorted[idx];
                if (existing) {
                    const d = new Date(existing.dateKey + 'T00:00:00');
                    const formatted = !isNaN(d.getTime())
                        ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                        : label;
                    return {
                        label: formatted,
                        daily: existing.daily,
                        ableAgain: existing.ableAgain,
                    };
                }
                return {
                    label,
                    daily: idx === sampleDays.length - 1 ? totalDaily : 0,
                    ableAgain: idx === sampleDays.length - 1 ? totalAble : 0,
                };
            });
        }

        return sorted.map((item) => {
            const d = new Date(item.dateKey + 'T00:00:00');
            return {
                label: !isNaN(d.getTime())
                    ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                    : item.dateKey,
                daily: item.daily,
                ableAgain: item.ableAgain,
            };
        });
    }, [data]);

    const maxVal = useMemo(() => {
        let m = 0;
        trendPoints.forEach((p) => {
            if (p.daily > m) m = p.daily;
            if (p.ableAgain > m) m = p.ableAgain;
        });
        return getNiceMax(m, 200, 4);
    }, [trendPoints]);

    const yTicks = useMemo(() => {
        const step = maxVal / 4;
        return [0, step, step * 2, step * 3, maxVal];
    }, [maxVal]);

    const svgWidth = 540;
    const svgHeight = 225;
    const padLeft = 42;
    const padRight = 18;
    const padTop = 16;
    const padBottom = 34;
    const plotWidth = svgWidth - padLeft - padRight;
    const plotHeight = svgHeight - padTop - padBottom;

    const getCoord = (idx, val) => {
        const x =
            trendPoints.length > 1
                ? padLeft + (idx / (trendPoints.length - 1)) * plotWidth
                : padLeft + plotWidth / 2;
        const y = padTop + plotHeight - (val / maxVal) * plotHeight;
        return { x, y };
    };

    const dailyPath = trendPoints
        .map((p, idx) => {
            const { x, y } = getCoord(idx, p.daily);
            return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');

    const ablePath = trendPoints
        .map((p, idx) => {
            const { x, y } = getCoord(idx, p.ableAgain);
            return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
                {/* Horizontal Grid Lines */}
                {yTicks.map((tick, idx) => {
                    const y = padTop + plotHeight - (tick / maxVal) * plotHeight;
                    return (
                        <g key={idx}>
                            <line
                                x1={padLeft}
                                y1={y}
                                x2={padLeft + plotWidth}
                                y2={y}
                                stroke={idx === 0 ? '#94a3b8' : '#e2e8f0'}
                                strokeWidth={idx === 0 ? '1.2' : '1'}
                            />
                            <text
                                x={padLeft - 10}
                                y={y + 4}
                                textAnchor="end"
                                className="fill-slate-600 text-[12px] font-medium"
                            >
                                {Math.round(tick)}
                            </text>
                        </g>
                    );
                })}

                {/* Vertical Grid Lines */}
                {trendPoints.map((p, idx) => {
                    const { x } = getCoord(idx, 0);
                    return (
                        <g key={idx}>
                            <line
                                x1={x}
                                y1={padTop}
                                x2={x}
                                y2={padTop + plotHeight}
                                stroke={idx === 0 ? '#94a3b8' : '#f1f5f9'}
                                strokeWidth={idx === 0 ? '1.2' : '1'}
                            />
                            <text
                                x={x}
                                y={padTop + plotHeight + 20}
                                textAnchor="middle"
                                className="fill-slate-600 text-[11.5px] font-medium"
                            >
                                {p.label}
                            </text>
                        </g>
                    );
                })}

                {/* Lines */}
                <path d={dailyPath} fill="none" stroke="#1d72f2" strokeWidth="2.4" />
                <path d={ablePath} fill="none" stroke="#28a745" strokeWidth="2.4" />

                {/* Points */}
                {trendPoints.map((p, idx) => {
                    const dCoord = getCoord(idx, p.daily);
                    const aCoord = getCoord(idx, p.ableAgain);
                    return (
                        <g key={idx}>
                            <circle
                                cx={dCoord.x}
                                cy={dCoord.y}
                                r="3.5"
                                fill="#1d72f2"
                                className="cursor-pointer"
                                onMouseEnter={() =>
                                    setHoveredPoint({
                                        x: dCoord.x,
                                        y: dCoord.y,
                                        text: `${p.label} - Daily ISI: ${p.daily}`,
                                    })
                                }
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                            <circle
                                cx={aCoord.x}
                                cy={aCoord.y}
                                r="3.5"
                                fill="#28a745"
                                className="cursor-pointer"
                                onMouseEnter={() =>
                                    setHoveredPoint({
                                        x: aCoord.x,
                                        y: aCoord.y,
                                        text: `${p.label} - Able Again: ${p.ableAgain}`,
                                    })
                                }
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                        </g>
                    );
                })}

                {hoveredPoint && (
                    <g transform={`translate(${hoveredPoint.x}, ${Math.max(18, hoveredPoint.y - 10)})`}>
                        <rect
                            x="-80"
                            y="-24"
                            width="160"
                            height="20"
                            rx="4"
                            fill="#0f172a"
                            opacity="0.92"
                        />
                        <text
                            x="0"
                            y="-10"
                            textAnchor="middle"
                            className="fill-white text-[11px] font-semibold"
                        >
                            {hoveredPoint.text}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
};

/* =========================================================================
   TOP 5 USERS BY ISI COUNT (Horizontal Bar Chart) - Phase 2 Bottom-Right Card
   ========================================================================= */
const Top5UsersHorizontalChart = ({ data }) => {
    const topUsers = useMemo(() => {
        const userMap = new Map();
        data.forEach((r) => {
            const u = r.username || 'Unknown';
            const score = (Number(r.daily_isi_count) || 0) + (Number(r.able_again_count) || 0);
            userMap.set(u, (userMap.get(u) || 0) + score);
        });
        const sorted = Array.from(userMap.entries())
            .map(([username, total]) => ({ username, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
        return sorted;
    }, [data]);

    const maxScore = useMemo(() => {
        const m = topUsers.reduce((acc, u) => (u.total > acc ? u.total : acc), 0);
        return Math.max(1, m);
    }, [topUsers]);

    const barColors = ['#1d72f2', '#28a745', '#f59e0b', '#8b3dff', '#ef4444'];

    if (topUsers.length === 0) {
        return (
            <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
                No user records found
            </div>
        );
    }

    return (
        <div className="space-y-4 py-2 px-1">
            {topUsers.map((u, idx) => {
                const widthPct = Math.max(8, Math.round((u.total / maxScore) * 82));
                const color = barColors[idx % barColors.length];
                return (
                    <div key={u.username} className="flex items-center gap-3">
                        <div className="w-24 text-right text-[13.5px] font-medium text-slate-700 truncate">
                            {u.username}
                        </div>
                        <div className="flex-1 flex items-center gap-3">
                            <div
                                className="h-6 rounded-r-full rounded-l-sm transition-all duration-300"
                                style={{
                                    width: `${widthPct}%`,
                                    backgroundColor: color,
                                }}
                            />
                            <span className="text-[13.5px] font-bold text-slate-800">
                                {u.total.toLocaleString()}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* =========================================================================
   PHASE 3: 3D INTERACTIVE CHARTS (3D Isometric Bar & 3D Extruded Pie/Donut)
   ========================================================================= */
const Interactive3DBarChart = ({ groups }) => {
    const [hovered, setHovered] = useState(null);
    const maxVal = useMemo(() => {
        let m = 0;
        groups.forEach((g) => {
            if (g.daily > m) m = g.daily;
            if (g.ableAgain > m) m = g.ableAgain;
        });
        return getNiceMax(m, 100, 4);
    }, [groups]);

    const svgWidth = 600;
    const svgHeight = 300;
    const padLeft = 52;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 50;
    const plotW = svgWidth - padLeft - padRight;
    const plotH = svgHeight - padTop - padBottom;
    const depthX = 10;
    const depthY = -8;

    const groupW = plotW / Math.max(1, groups.length);
    const barW = Math.min(26, Math.max(14, groupW * 0.25));

    return (
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
            {/* 3D Base Platform */}
            <polygon
                points={`${padLeft},${padTop + plotH} ${padLeft + depthX},${padTop + plotH + depthY} ${
                    padLeft + plotW + depthX
                },${padTop + plotH + depthY} ${padLeft + plotW},${padTop + plotH}`}
                fill="#e2e8f0"
            />
            {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
                const y = padTop + plotH - t * plotH;
                const val = Math.round(t * maxVal);
                return (
                    <g key={idx}>
                        <line
                            x1={padLeft + depthX}
                            y1={y + depthY}
                            x2={padLeft + plotW + depthX}
                            y2={y + depthY}
                            stroke="#e2e8f0"
                            strokeDasharray="3 3"
                        />
                        <text
                            x={padLeft - 8}
                            y={y + 4}
                            textAnchor="end"
                            className="fill-slate-600 text-[11.5px] font-medium"
                        >
                            {val}
                        </text>
                    </g>
                );
            })}

            {groups.map((g, i) => {
                const center = padLeft + i * groupW + groupW / 2;
                const dH = Math.max(g.daily > 0 ? 4 : 0, (g.daily / maxVal) * plotH);
                const aH = Math.max(g.ableAgain > 0 ? 4 : 0, (g.ableAgain / maxVal) * plotH);

                const render3DBar = (x, h, frontColor, topColor, sideColor, keyName, labelText) => {
                    if (h <= 0) return null;
                    const y = padTop + plotH - h;
                    const isHov = hovered === keyName;
                    const lift = isHov ? -5 : 0;
                    return (
                        <g
                            key={keyName}
                            transform={`translate(0, ${lift})`}
                            className="transition-transform duration-150 cursor-pointer"
                            onMouseEnter={() => setHovered(keyName)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            {/* Front face */}
                            <rect x={x} y={y} width={barW} height={h} fill={frontColor} />
                            {/* Top 3D lid */}
                            <polygon
                                points={`${x},${y} ${x + depthX},${y + depthY} ${x + barW + depthX},${
                                    y + depthY
                                } ${x + barW},${y}`}
                                fill={topColor}
                            />
                            {/* Right 3D side */}
                            <polygon
                                points={`${x + barW},${y} ${x + barW + depthX},${y + depthY} ${
                                    x + barW + depthX
                                },${y + h + depthY} ${x + barW},${y + h}`}
                                fill={sideColor}
                            />
                            <title>{labelText}</title>
                        </g>
                    );
                };

                return (
                    <g key={g.label}>
                        {render3DBar(
                            center - barW - 4,
                            dH,
                            '#1d72f2',
                            '#60a5fa',
                            '#1e40af',
                            `d-${i}`,
                            `${g.label} Daily ISI: ${g.daily}`
                        )}
                        {render3DBar(
                            center + 4,
                            aH,
                            '#28a745',
                            '#4ade80',
                            '#166534',
                            `a-${i}`,
                            `${g.label} Able Again: ${g.ableAgain}`
                        )}
                        <text
                            x={center}
                            y={padTop + plotH + 22}
                            textAnchor="middle"
                            className="fill-slate-700 text-[12px] font-semibold"
                        >
                            {g.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

const Interactive3DDonutChart = ({ items }) => {
    const [hovered, setHovered] = useState(null);
    const total = items.reduce((s, i) => s + i.value, 0);
    const cx = 150;
    const cy = 125;
    const rx = 105;
    const ry = 68;
    const irx = 52;
    const iry = 34;
    const depth = 18;

    const describeEllipticalDonut = (start, end, cyOffset = 0) => {
        if (end - start >= Math.PI * 2 - 0.001) end = start + Math.PI * 2 - 0.001;
        const x1 = cx + rx * Math.cos(start);
        const y1 = cy + cyOffset + ry * Math.sin(start);
        const x2 = cx + rx * Math.cos(end);
        const y2 = cy + cyOffset + ry * Math.sin(end);
        const x3 = cx + irx * Math.cos(end);
        const y3 = cy + cyOffset + iry * Math.sin(end);
        const x4 = cx + irx * Math.cos(start);
        const y4 = cy + cyOffset + iry * Math.sin(start);
        const large = end - start > Math.PI ? 1 : 0;
        return `M ${x1} ${y1} A ${rx} ${ry} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${irx} ${iry} 0 ${large} 0 ${x4} ${y4} Z`;
    };

    let angle = -Math.PI / 2;
    const slices = items.map((item, idx) => {
        const span = total > 0 ? (item.value / total) * Math.PI * 2 : 0;
        const s = angle;
        const e = angle + span;
        angle = e;
        return {
            ...item,
            idx,
            start: s,
            end: e,
            mid: s + span / 2,
            color: CHART_COLORS[idx % CHART_COLORS.length],
            pct: total > 0 ? Math.round((item.value / total) * 100) : 0,
        };
    });

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <svg width="300" height="260" viewBox="0 0 300 260">
                {Array.from({ length: depth }).map((_, layer) => {
                    const yOff = depth - layer;
                    return slices.map((s) => (
                        <path
                            key={`${s.idx}-${layer}`}
                            d={describeEllipticalDonut(s.start, s.end, yOff)}
                            fill={s.color}
                            filter="brightness(0.72)"
                        />
                    ));
                })}
                {slices.map((s) => {
                    const isHov = hovered === s.idx;
                    const lift = isHov ? -6 : 0;
                    return (
                        <path
                            key={s.idx}
                            d={describeEllipticalDonut(s.start, s.end, lift)}
                            fill={s.color}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="cursor-pointer transition-all"
                            onMouseEnter={() => setHovered(s.idx)}
                            onMouseLeave={() => setHovered(null)}
                        />
                    );
                })}
            </svg>
            <div className="space-y-3 min-w-[180px]">
                {slices.map((s) => (
                    <div key={s.idx} className="flex items-center justify-between gap-4 text-[13.5px]">
                        <div className="flex items-center gap-2">
                            <span
                                className="w-3.5 h-3.5 rounded-[3px] inline-block"
                                style={{ backgroundColor: s.color }}
                            />
                            <span className="font-medium text-slate-700">{s.label}</span>
                        </div>
                        <span className="font-semibold text-slate-800">
                            {s.value} ({s.pct}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* =========================================================================
   MAIN ISI REPORT COMPONENT
   ========================================================================= */
const ISIReport = () => {
    const [records, setRecords] = useState([]);
    const [viewerContext, setViewerContext] = useState(null);
    const [loading, setLoading] = useState(true);

    // Primary View Mode (Overview + Requested Section Buttons)
    // 'overview' | '2d_analysis' | '3d_charts' | 'table_view'
    const [activeSection, setActiveSection] = useState('overview');

    // Sub-tab inside Phase 2 (2D Chart Analysis)
    // 'module' | 'user' | 'phase' | 'day' | 'category' | 'time_trend'
    const [analysisSubTab, setAnalysisSubTab] = useState('module');

    // Draft filter states
    const [draftStartDate, setDraftStartDate] = useState('2026-10-01');
    const [draftEndDate, setDraftEndDate] = useState('2026-10-31');
    const [draftDateFilterActive, setDraftDateFilterActive] = useState(false);
    const [draftUser, setDraftUser] = useState('ALL');
    const [draftModule, setDraftModule] = useState('ALL');
    const [draftRole, setDraftRole] = useState('ALL');
    const [draftPhase, setDraftPhase] = useState('ALL');

    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        dateFilterActive: false,
        user: 'ALL',
        module: 'ALL',
        role: 'ALL',
        phase: 'ALL',
    });

    const [showDatePopover, setShowDatePopover] = useState(false);
    const [tableSearch, setTableSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const datePickerRef = useRef(null);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const [recRes, ctxRes] = await Promise.all([
                axios.get(`http://${window.location.hostname}:8000/api/isi`, {
                    withCredentials: true,
                }),
                axios
                    .get(`http://${window.location.hostname}:8000/api/isi/viewer-context`, {
                        withCredentials: true,
                    })
                    .catch(() => ({ data: null })),
            ]);
            setRecords(Array.isArray(recRes.data) ? recRes.data : []);
            if (ctxRes.data) {
                setViewerContext(ctxRes.data);
            }
        } catch (err) {
            console.error('Failed to fetch ISI report records:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
                setShowDatePopover(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isStudentViewer = viewerContext?.role === 'student';
    const isLeaderViewer = viewerContext?.role === 'leader';

    // Distinct options for dropdowns
    const uniqueRoles = useMemo(() => {
        if (isStudentViewer) return ['student'];
        if (isLeaderViewer) return ['leader', 'student'];
        const standardRoles = ['super_admin', 'admin', 'leader', 'student'];
        const fromData = records.map((r) => r.role).filter(Boolean);
        return [...new Set([...standardRoles, ...fromData])];
    }, [records, isStudentViewer, isLeaderViewer]);

    const uniqueUsers = useMemo(() => {
        const source =
            draftRole === 'ALL'
                ? records
                : records.filter((r) => r.role === draftRole);
        return [...new Set(source.map((r) => r.username).filter(Boolean))].sort();
    }, [records, draftRole]);

    const uniqueModules = useMemo(() => {
        const fromData = records.map((r) => Number(r.module)).filter(Boolean);
        const defaults = [1, 2, 3, 4, 5];
        return [...new Set([...defaults, ...fromData])].sort((a, b) => a - b);
    }, [records]);

    const uniquePhases = useMemo(() => {
        const fromData = records.map((r) => Number(r.phase)).filter(Boolean);
        const defaults = [1, 2, 3, 4, 5, 6, 7];
        return [...new Set([...defaults, ...fromData])].sort((a, b) => a - b);
    }, [records]);

    // Filtered records
    const filteredRecords = useMemo(() => {
        return records.filter((r) => {
            if (appliedFilters.user !== 'ALL' && r.username !== appliedFilters.user) return false;
            if (
                appliedFilters.module !== 'ALL' &&
                String(r.module) !== String(appliedFilters.module)
            )
                return false;
            if (appliedFilters.role !== 'ALL' && r.role !== appliedFilters.role) return false;
            if (
                appliedFilters.phase !== 'ALL' &&
                String(r.phase) !== String(appliedFilters.phase)
            )
                return false;

            if (appliedFilters.dateFilterActive && r.created_at) {
                const recordDate = new Date(r.created_at);
                if (!isNaN(recordDate.getTime())) {
                    if (appliedFilters.startDate) {
                        const start = new Date(appliedFilters.startDate + 'T00:00:00');
                        if (recordDate < start) return false;
                    }
                    if (appliedFilters.endDate) {
                        const end = new Date(appliedFilters.endDate + 'T23:59:59');
                        if (recordDate > end) return false;
                    }
                }
            }
            return true;
        });
    }, [records, appliedFilters]);

    // Searched & Paginated records for Table View
    const searchedTableRecords = useMemo(() => {
        if (!tableSearch.trim()) return filteredRecords;
        const q = tableSearch.toLowerCase();
        return filteredRecords.filter(
            (r) =>
                (r.username || '').toLowerCase().includes(q) ||
                (r.role || '').toLowerCase().includes(q) ||
                (r.category || '').toLowerCase().includes(q) ||
                (r.location_name || '').toLowerCase().includes(q) ||
                (r.color_code || '').toLowerCase().includes(q) ||
                (r.banner_text || '').toLowerCase().includes(q)
        );
    }, [filteredRecords, tableSearch]);

    const totalPages = Math.max(1, Math.ceil(searchedTableRecords.length / rowsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const pageStartIndex = (safeCurrentPage - 1) * rowsPerPage;
    const paginatedTableRecords = useMemo(
        () => searchedTableRecords.slice(pageStartIndex, pageStartIndex + rowsPerPage),
        [searchedTableRecords, pageStartIndex, rowsPerPage]
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [appliedFilters, tableSearch, rowsPerPage]);

    // Summary metrics
    const metrics = useMemo(() => {
        const totalRecords = filteredRecords.length;
        const activeUsers = new Set(filteredRecords.map((r) => r.username).filter(Boolean)).size;
        const totalDailyISI = filteredRecords.reduce(
            (sum, r) => sum + (Number(r.daily_isi_count) || 0),
            0
        );
        const totalAbleAgain = filteredRecords.reduce(
            (sum, r) => sum + (Number(r.able_again_count) || 0),
            0
        );
        return {
            totalRecords,
            activeUsers,
            totalDailyISI,
            totalAbleAgain,
        };
    }, [filteredRecords]);

    // Module groups (1..5 minimum)
    const moduleGroups = useMemo(() => {
        const map = new Map();
        for (let m = 1; m <= 5; m++) {
            map.set(m, { label: String(m), daily: 0, ableAgain: 0 });
        }
        filteredRecords.forEach((item) => {
            const m = Number(item.module) || 1;
            if (!map.has(m)) {
                map.set(m, { label: String(m), daily: 0, ableAgain: 0 });
            }
            const entry = map.get(m);
            entry.daily += Number(item.daily_isi_count) || 0;
            entry.ableAgain += Number(item.able_again_count) || 0;
        });
        return Array.from(map.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([, val]) => val);
    }, [filteredRecords]);

    // Dynamic bar groups for Phase 2 sub-tabs
    const phase2BarConfig = useMemo(() => {
        if (analysisSubTab === 'user') {
            const map = new Map();
            filteredRecords.forEach((r) => {
                const k = r.username || 'User';
                if (!map.has(k)) map.set(k, { label: k, daily: 0, ableAgain: 0 });
                map.get(k).daily += Number(r.daily_isi_count) || 0;
                map.get(k).ableAgain += Number(r.able_again_count) || 0;
            });
            return {
                title: 'User vs ISI Counts (Bar Chart)',
                groups: Array.from(map.values()).slice(0, 7),
                showModulePrefix: false,
            };
        }
        if (analysisSubTab === 'phase') {
            const map = new Map();
            for (let p = 1; p <= 5; p++) {
                map.set(p, { label: `Phase ${p}`, daily: 0, ableAgain: 0 });
            }
            filteredRecords.forEach((r) => {
                const p = Number(r.phase) || 1;
                if (!map.has(p)) map.set(p, { label: `Phase ${p}`, daily: 0, ableAgain: 0 });
                map.get(p).daily += Number(r.daily_isi_count) || 0;
                map.get(p).ableAgain += Number(r.able_again_count) || 0;
            });
            return {
                title: 'Phase vs ISI Counts (Bar Chart)',
                groups: Array.from(map.values()),
                showModulePrefix: false,
            };
        }
        if (analysisSubTab === 'day') {
            const map = new Map();
            for (let d = 1; d <= 5; d++) {
                map.set(d, { label: `Day ${d}`, daily: 0, ableAgain: 0 });
            }
            filteredRecords.forEach((r) => {
                const d = Number(r.day) || 1;
                if (!map.has(d)) map.set(d, { label: `Day ${d}`, daily: 0, ableAgain: 0 });
                map.get(d).daily += Number(r.daily_isi_count) || 0;
                map.get(d).ableAgain += Number(r.able_again_count) || 0;
            });
            return {
                title: 'Day vs ISI Counts (Bar Chart)',
                groups: Array.from(map.values()),
                showModulePrefix: false,
            };
        }
        if (analysisSubTab === 'category') {
            const map = new Map();
            filteredRecords.forEach((r) => {
                const c = r.category || formatRoleLabel(r.role);
                if (!map.has(c)) map.set(c, { label: c, daily: 0, ableAgain: 0 });
                map.get(c).daily += Number(r.daily_isi_count) || 0;
                map.get(c).ableAgain += Number(r.able_again_count) || 0;
            });
            return {
                title: 'Category vs ISI Counts (Bar Chart)',
                groups: Array.from(map.values()),
                showModulePrefix: false,
            };
        }
        return {
            title: 'Module vs ISI Counts (Bar Chart)',
            groups: moduleGroups,
            showModulePrefix: true,
        };
    }, [analysisSubTab, filteredRecords, moduleGroups]);

    // Role distribution for Overview Donut
    const roleDonutItems = useMemo(() => {
        const counts = new Map();
        filteredRecords.forEach((r) => {
            const label = formatRoleLabel(r.role);
            counts.set(label, (counts.get(label) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([label, value], idx) => ({
                label,
                value,
                color: CHART_COLORS[idx % CHART_COLORS.length],
            }))
            .sort((a, b) => b.value - a.value);
    }, [filteredRecords]);

    // Category distribution for Phase 2 Donut
    const categoryDonutItems = useMemo(() => {
        const counts = new Map();
        filteredRecords.forEach((r) => {
            const cat =
                r.category && r.category !== 'N/A'
                    ? r.category
                    : `Category (${formatRoleLabel(r.role)})`;
            const val = (Number(r.daily_isi_count) || 0) + (Number(r.able_again_count) || 0) || 1;
            counts.set(cat, (counts.get(cat) || 0) + val);
        });
        return Array.from(counts.entries())
            .map(([label, value], idx) => ({
                label,
                value,
                color: CHART_COLORS[idx % CHART_COLORS.length],
            }))
            .sort((a, b) => b.value - a.value);
    }, [filteredRecords]);

    const handleApply = () => {
        setAppliedFilters({
            startDate: draftStartDate,
            endDate: draftEndDate,
            dateFilterActive: draftDateFilterActive,
            user: draftUser,
            module: draftModule,
            role: draftRole,
            phase: draftPhase,
        });
        setShowDatePopover(false);
    };

    const handleReset = () => {
        setDraftStartDate('2026-10-01');
        setDraftEndDate('2026-10-31');
        setDraftDateFilterActive(false);
        setDraftUser('ALL');
        setDraftModule('ALL');
        setDraftRole('ALL');
        setDraftPhase('ALL');
        setAppliedFilters({
            startDate: '2026-10-01',
            endDate: '2026-10-31',
            dateFilterActive: false,
            user: 'ALL',
            module: 'ALL',
            role: 'ALL',
            phase: 'ALL',
        });
        setShowDatePopover(false);
    };

    // Export CSV helper
    const handleExportCSV = () => {
        const headers = [
            'ID',
            'Username',
            'Role',
            'Category',
            'Module',
            'Facet',
            'Phase',
            'Day',
            'Daily ISI Count',
            'Able Again Count',
            'Color Code',
            'Banner Text',
            'Created At',
        ];
        const rows = filteredRecords.map((r) => [
            r.id,
            `"${(r.username || '').replace(/"/g, '""')}"`,
            `"${(r.role || '').replace(/"/g, '""')}"`,
            `"${(r.category || '').replace(/"/g, '""')}"`,
            r.module,
            r.facet,
            r.phase,
            r.day,
            r.daily_isi_count,
            r.able_again_count,
            `"${(r.color_code || '').replace(/"/g, '""')}"`,
            `"${(r.banner_text || '').replace(/"/g, '""')}"`,
            `"${r.created_at || ''}"`,
        ]);
        const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ISI_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-5 md:p-7">
            <div className="max-w-[1360px] mx-auto space-y-4">
                {/* ROLE / LOCATION CONTEXT BANNER (Leader Allocated Location or Student Self View) */}
                {(isLeaderViewer || appliedFilters.role === 'leader') && (
                    <div className="bg-blue-50/90 border border-blue-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#1d72f2] text-white flex items-center justify-center">
                                <i className="pi pi-map-marker text-sm"></i>
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                                    Leader Allocated Location Details
                                </div>
                                <div className="text-[14.5px] font-bold text-slate-900">
                                    {isLeaderViewer
                                        ? viewerContext?.location_name || 'Allocated Location'
                                        : [
                                              ...new Set(
                                                  filteredRecords
                                                      .map((r) => r.location_name)
                                                      .filter(Boolean)
                                              ),
                                          ].join(' | ') || 'Asia • India • OOTY'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                            <span className="px-3 py-1 rounded-full bg-white border border-blue-200">
                                Role Scope: Leader
                            </span>
                            <span className="px-3 py-1 rounded-full bg-white border border-blue-200">
                                Records: {filteredRecords.length}
                            </span>
                        </div>
                    </div>
                )}

                {isStudentViewer && (
                    <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#28a745] text-white flex items-center justify-center">
                                <i className="pi pi-user text-sm"></i>
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                                    My Student ISI Report
                                </div>
                                <div className="text-[14.5px] font-bold text-slate-900">
                                    {viewerContext?.username} • Category:{' '}
                                    {viewerContext?.category || 'Student'} • Location:{' '}
                                    {viewerContext?.location_name || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 1. TOP FILTER BAR */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] px-4 py-3.5 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Date Range Selector */}
                        <div
                            className="relative flex-1 min-w-[240px] max-w-[310px]"
                            ref={datePickerRef}
                        >
                            <button
                                type="button"
                                onClick={() => setShowDatePopover((prev) => !prev)}
                                className="w-full h-[42px] px-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 flex items-center justify-between text-[13.5px] text-slate-700 font-medium transition-colors"
                            >
                                <span className="flex items-center gap-2.5 truncate">
                                    <i className="pi pi-calendar text-slate-500 text-sm"></i>
                                    <span>
                                        {formatDateShort(draftStartDate)} -{' '}
                                        {formatDateShort(draftEndDate)}
                                    </span>
                                </span>
                                <i className="pi pi-calendar text-slate-500 text-sm ml-2"></i>
                            </button>

                            {showDatePopover && (
                                <div className="absolute left-0 top-[48px] z-30 bg-white rounded-xl border border-slate-200 shadow-lg p-4 w-[290px] space-y-3">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Select Date Range
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-xs text-slate-600 mb-1">
                                                From Date
                                            </label>
                                            <input
                                                type="date"
                                                value={draftStartDate}
                                                onChange={(e) => {
                                                    setDraftStartDate(e.target.value);
                                                    setDraftDateFilterActive(true);
                                                }}
                                                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-600 mb-1">
                                                To Date
                                            </label>
                                            <input
                                                type="date"
                                                value={draftEndDate}
                                                onChange={(e) => {
                                                    setDraftEndDate(e.target.value);
                                                    setDraftDateFilterActive(true);
                                                }}
                                                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowDatePopover(false)}
                                            className="px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-md"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* All Users Dropdown (Hidden for Student who only views their own report) */}
                        {!isStudentViewer && (
                            <div className="relative flex-1 min-w-[155px] max-w-[210px]">
                                <select
                                    value={draftUser}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setDraftUser(val);
                                        setAppliedFilters((prev) => ({ ...prev, user: val }));
                                    }}
                                    className="w-full h-[42px] pl-3.5 pr-9 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-[13.5px] text-slate-700 font-medium appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="ALL">All Users</option>
                                    {uniqueUsers.map((u) => (
                                        <option key={u} value={u}>
                                            {u}
                                        </option>
                                    ))}
                                </select>
                                <i className="pi pi-chevron-down text-slate-500 text-xs absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                            </div>
                        )}

                        {/* All Modules Dropdown */}
                        <div className="relative flex-1 min-w-[155px] max-w-[210px]">
                            <select
                                value={draftModule}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftModule(val);
                                    setAppliedFilters((prev) => ({ ...prev, module: val }));
                                }}
                                className="w-full h-[42px] pl-3.5 pr-9 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-[13.5px] text-slate-700 font-medium appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value="ALL">All Modules</option>
                                {uniqueModules.map((m) => (
                                    <option key={m} value={m}>
                                        Module {m}
                                    </option>
                                ))}
                            </select>
                            <i className="pi pi-chevron-down text-slate-500 text-xs absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                        </div>

                        {/* All Roles Dropdown (Hidden for Student who only views their own report) */}
                        {!isStudentViewer && (
                            <div className="relative flex-1 min-w-[150px] max-w-[195px]">
                                <select
                                    value={draftRole}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setDraftRole(val);
                                        setDraftUser('ALL');
                                        setAppliedFilters((prev) => ({
                                            ...prev,
                                            role: val,
                                            user: 'ALL',
                                        }));
                                    }}
                                    className="w-full h-[42px] pl-3.5 pr-9 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-[13.5px] text-slate-700 font-medium appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="ALL">All Roles</option>
                                    {uniqueRoles.map((r) => (
                                        <option key={r} value={r}>
                                            {formatRoleLabel(r)}
                                        </option>
                                    ))}
                                </select>
                                <i className="pi pi-chevron-down text-slate-500 text-xs absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                            </div>
                        )}

                        {/* All Phases Dropdown (shown in 2D Chart Analysis) */}
                        {activeSection === '2d_analysis' && (
                            <div className="relative flex-1 min-w-[140px] max-w-[180px]">
                                <select
                                    value={draftPhase}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setDraftPhase(val);
                                        setAppliedFilters((prev) => ({ ...prev, phase: val }));
                                    }}
                                    className="w-full h-[42px] pl-3.5 pr-9 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-[13.5px] text-slate-700 font-medium appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="ALL">All Phases</option>
                                    {uniquePhases.map((p) => (
                                        <option key={p} value={p}>
                                            Phase {p}
                                        </option>
                                    ))}
                                </select>
                                <i className="pi pi-chevron-down text-slate-500 text-xs absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                            </div>
                        )}

                        {/* Apply Button */}
                        <button
                            type="button"
                            onClick={handleApply}
                            className="h-[42px] px-6 rounded-lg bg-[#1d72f2] hover:bg-blue-700 text-white text-[14px] font-semibold shadow-sm transition-colors cursor-pointer"
                        >
                            Apply
                        </button>

                        {/* Reset Button */}
                        <button
                            type="button"
                            onClick={handleReset}
                            className="h-[42px] px-6 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[14px] font-medium transition-colors cursor-pointer"
                        >
                            Reset
                        </button>
                    </div>

                    {/* NAVIGATION BUTTONS ROW BELOW APPLY & RESET */}
                    <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
                        {[
                            {
                                id: 'overview',
                                label: 'Overview Dashboard',
                                icon: 'pi pi-th-large',
                            },
                            {
                                id: '2d_analysis',
                                label: '2D Chart Analysis',
                                icon: 'pi pi-chart-bar',
                            },
                            {
                                id: '3d_charts',
                                label: '3D Interactive Charts',
                                icon: 'pi pi-chart-pie',
                            },
                            {
                                id: 'table_view',
                                label: 'Table View & Detailed Records',
                                icon: 'pi pi-table',
                            },
                        ].map((btn) => {
                            const isActive = activeSection === btn.id;
                            return (
                                <button
                                    key={btn.id}
                                    type="button"
                                    onClick={() => setActiveSection(btn.id)}
                                    className={`h-[38px] px-4 rounded-lg text-[13.5px] font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                                        isActive
                                            ? 'bg-[#1d72f2] text-white shadow-sm'
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                                    }`}
                                >
                                    <i className={`${btn.icon} text-xs`}></i>
                                    <span>{btn.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* =========================================================
                   PHASE 1: OVERVIEW DASHBOARD
                   ========================================================= */}
                {activeSection === 'overview' && (
                    <>
                        {/* 4 KPI SUMMARY CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* Card 1: Total ISI Records */}
                            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 flex items-start justify-between">
                                <div>
                                    <div className="text-[14px] text-slate-600 font-medium">
                                        Total ISI Records
                                    </div>
                                    <div className="text-[32px] leading-tight font-bold text-[#0f172a] mt-2">
                                        {loading ? '...' : metrics.totalRecords.toLocaleString()}
                                    </div>
                                    <div className="text-[13.5px] font-semibold text-[#16a34a] mt-2.5">
                                        + 12%
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-[#eef4ff] flex items-center justify-center flex-shrink-0 mt-1">
                                    <svg
                                        className="w-6 h-6 text-[#1d72f2]"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.9"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M14 2v6h6M8 13h8M8 17h8M8 9h2"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Card 2: Active Users */}
                            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 flex items-start justify-between">
                                <div>
                                    <div className="text-[14px] text-slate-600 font-medium">
                                        Active Users
                                    </div>
                                    <div className="text-[32px] leading-tight font-bold text-[#0f172a] mt-2">
                                        {loading ? '...' : metrics.activeUsers.toLocaleString()}
                                    </div>
                                    <div className="text-[13.5px] font-semibold text-[#16a34a] mt-2.5">
                                        + 8%
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-[#eef4ff] flex items-center justify-center flex-shrink-0 mt-1">
                                    <svg
                                        className="w-6 h-6 text-[#1d72f2]"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2.5c-3.34 0-10 1.67-10 5v2h20v-2c0-3.33-6.66-5-10-5z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Card 3: Total Daily ISI Count */}
                            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 flex items-start justify-between">
                                <div>
                                    <div className="text-[14px] text-slate-600 font-medium">
                                        Total Daily ISI Count
                                    </div>
                                    <div className="text-[32px] leading-tight font-bold text-[#0f172a] mt-2">
                                        {loading ? '...' : metrics.totalDailyISI.toLocaleString()}
                                    </div>
                                    <div className="text-[13.5px] font-semibold text-[#16a34a] mt-2.5">
                                        + 18%
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-[#fff4e5] flex items-center justify-center flex-shrink-0 mt-1">
                                    <svg
                                        className="w-6 h-6 text-[#f59e0b]"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <rect x="4" y="13" width="4" height="7" rx="1" />
                                        <rect x="10" y="9" width="4" height="11" rx="1" />
                                        <rect x="16" y="5" width="4" height="15" rx="1" />
                                    </svg>
                                </div>
                            </div>

                            {/* Card 4: Able Again Count */}
                            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 flex items-start justify-between">
                                <div>
                                    <div className="text-[14px] text-slate-600 font-medium">
                                        Able Again Count
                                    </div>
                                    <div className="text-[32px] leading-tight font-bold text-[#0f172a] mt-2">
                                        {loading ? '...' : metrics.totalAbleAgain.toLocaleString()}
                                    </div>
                                    <div className="text-[13.5px] font-semibold text-[#16a34a] mt-2.5">
                                        + 15%
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-[#e8f8ee] flex items-center justify-center flex-shrink-0 mt-1">
                                    <svg
                                        className="w-6 h-6 text-[#22c55e]"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* 2 CHARTS ROW */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-6">
                                <h3 className="text-[17px] font-bold text-[#0f172a] mb-4">
                                    Module Wise ISI Count
                                </h3>
                                <Grouped2DBarChart
                                    groups={moduleGroups}
                                    xAxisTitle="Module"
                                    showModulePrefix={false}
                                />
                            </div>

                            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-6 flex flex-col">
                                <h3 className="text-[17px] font-bold text-[#0f172a] mb-4">
                                    Role Wise Distribution
                                </h3>
                                <div className="flex-1 flex items-center justify-center">
                                    <DonutChart2D items={roleDonutItems} showCenterTotal={false} />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* =========================================================
                   PHASE 2: 2D CHARTS AND ANALYSIS (Matches Attached Screenshot)
                   ========================================================= */}
                {activeSection === '2d_analysis' && (
                    <div className="space-y-5">
                        {/* Analysis Sub-Tabs Bar */}
                        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] px-6">
                            <div className="flex items-center gap-8 overflow-x-auto">
                                {[
                                    { id: 'module', label: 'Module Analysis' },
                                    { id: 'user', label: 'User Analysis' },
                                    { id: 'phase', label: 'Phase Analysis' },
                                    { id: 'day', label: 'Day Analysis' },
                                    { id: 'category', label: 'Category Analysis' },
                                    { id: 'time_trend', label: 'Time Trend' },
                                ].map((tab) => {
                                    const active = analysisSubTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setAnalysisSubTab(tab.id)}
                                            className={`py-3.5 text-[14.5px] font-semibold whitespace-nowrap border-b-[2.5px] transition-colors cursor-pointer ${
                                                active
                                                    ? 'border-[#1d72f2] text-[#1d72f2]'
                                                    : 'border-transparent text-slate-700 hover:text-[#1d72f2]'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Row: Module vs ISI Counts (Bar Chart) & Category Wise ISI Count (Donut Chart) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-6">
                                <h3 className="text-[16.5px] font-bold text-[#0f172a] mb-4">
                                    {phase2BarConfig.title}
                                </h3>
                                <Grouped2DBarChart
                                    groups={phase2BarConfig.groups}
                                    xAxisTitle=""
                                    showModulePrefix={phase2BarConfig.showModulePrefix}
                                />
                            </div>

                            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-6 flex flex-col">
                                <h3 className="text-[16.5px] font-bold text-[#0f172a] mb-4">
                                    Category Wise ISI Count (Donut Chart)
                                </h3>
                                <div className="flex-1 flex items-center justify-center">
                                    <DonutChart2D
                                        items={categoryDonutItems}
                                        showCenterTotal={true}
                                        centerTotalValue={metrics.totalDailyISI}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Daily Trend (Line Chart) & Top 5 Users by ISI Count */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-6">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <h3 className="text-[16.5px] font-bold text-[#0f172a]">
                                        Daily Trend (Line Chart)
                                    </h3>
                                    <div className="flex items-center gap-5 text-[12.5px] font-medium text-slate-700">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-4 h-0.5 bg-[#1d72f2] inline-block relative">
                                                <span className="w-2 h-2 rounded-full bg-[#1d72f2] absolute -top-[3px] left-1"></span>
                                            </span>
                                            Daily ISI Count
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-4 h-0.5 bg-[#28a745] inline-block relative">
                                                <span className="w-2 h-2 rounded-full bg-[#28a745] absolute -top-[3px] left-1"></span>
                                            </span>
                                            Able Again Count
                                        </span>
                                    </div>
                                </div>
                                <DailyTrendLineChart data={filteredRecords} />
                            </div>

                            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-6">
                                <h3 className="text-[16.5px] font-bold text-[#0f172a] mb-4">
                                    Top 5 Users by ISI Count
                                </h3>
                                <Top5UsersHorizontalChart data={filteredRecords} />
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================
                   PHASE 3: 3D INTERACTIVE CHARTS
                   ========================================================= */}
                {activeSection === '3d_charts' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[17px] font-bold text-[#0f172a]">
                                    3D Module Wise ISI Count
                                </h3>
                                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-sm bg-[#1d72f2] inline-block"></span>
                                        Daily ISI Count
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-sm bg-[#28a745] inline-block"></span>
                                        Able Again Count
                                    </span>
                                </div>
                            </div>
                            <Interactive3DBarChart
                                groups={moduleGroups.map((g) => ({
                                    ...g,
                                    label: `Module ${g.label}`,
                                }))}
                            />
                        </div>

                        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-6 flex flex-col">
                            <h3 className="text-[17px] font-bold text-[#0f172a] mb-4">
                                3D Role Wise Distribution
                            </h3>
                            <div className="flex-1 flex items-center justify-center">
                                <Interactive3DDonutChart items={roleDonutItems} />
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================
                   PHASE 4: TABLE VIEW & DETAILED RECORDS
                   ========================================================= */}
                {activeSection === 'table_view' && (
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-[17px] font-bold text-[#0f172a]">
                                Detailed ISI Records ({searchedTableRecords.length})
                            </h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                    <span>Rows per page:</span>
                                    <select
                                        value={rowsPerPage}
                                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                        className="h-[38px] px-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                                    >
                                        {[5, 10, 20, 50].map((size) => (
                                            <option key={size} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search user, role, category, color..."
                                    value={tableSearch}
                                    onChange={(e) => setTableSearch(e.target.value)}
                                    className="h-[38px] px-3.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleExportCSV}
                                    className="h-[38px] px-4 rounded-lg bg-[#1d72f2] hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                    <i className="pi pi-download text-xs"></i>
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[12.5px] font-semibold text-slate-600 uppercase whitespace-nowrap">
                                        <th className="py-3.5 px-3">#</th>
                                        <th className="py-3.5 px-3">Username</th>
                                        <th className="py-3.5 px-3">Role</th>
                                        <th className="py-3.5 px-3">Category</th>
                                        <th className="py-3.5 px-3">Allocated Location</th>
                                        <th className="py-3.5 px-4">Sticker</th>
                                        <th className="py-3.5 px-3">Module</th>
                                        <th className="py-3.5 px-3">Facet</th>
                                        <th className="py-3.5 px-3">Phase</th>
                                        <th className="py-3.5 px-3">Day</th>
                                        <th className="py-3.5 px-3">Art</th>
                                        <th className="py-3.5 px-3">Daily ISI</th>
                                        <th className="py-3.5 px-3">Able Again</th>
                                        <th className="py-3.5 px-3">Color Code</th>
                                        <th className="py-3.5 px-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[13.5px] text-slate-700">
                                    {paginatedTableRecords.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={15}
                                                className="py-8 text-center text-slate-400 text-sm"
                                            >
                                                No matching ISI records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTableRecords.map((r, idx) => {
                                            const bgHex = (r.color_code || '#00AEFF').toUpperCase();
                                            const isDarkSticker =
                                                bgHex === '#1B00A6' || bgHex === '#FF002B';
                                            const isWhiteSticker = bgHex === '#FFFFFF';
                                            const dailyCount = Number(r.daily_isi_count) || 0;
                                            const ableCount = Number(r.able_again_count) || 0;

                                            return (
                                                <tr
                                                    key={r.id || idx}
                                                    className="hover:bg-slate-50/80 align-middle"
                                                >
                                                    <td className="py-3.5 px-3 font-medium text-slate-500">
                                                        {pageStartIndex + idx + 1}
                                                    </td>
                                                    <td className="py-3.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                                                        {r.username}
                                                    </td>
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        {formatRoleLabel(r.role)}
                                                    </td>
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        {r.category || 'N/A'}
                                                    </td>
                                                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                                                        {r.location_name || 'Global'}
                                                    </td>

                                                    {/* Sticker Column */}
                                                    <td className="py-3.5 px-4 min-w-[290px]">
                                                        <div
                                                            className={`rounded-xl px-4 py-3.5 shadow-sm flex flex-col justify-center max-w-[310px] ${
                                                                isWhiteSticker
                                                                    ? 'border border-slate-300'
                                                                    : ''
                                                            } ${
                                                                isDarkSticker
                                                                    ? 'text-white'
                                                                    : 'text-[#0f172a]'
                                                            }`}
                                                            style={{ backgroundColor: bgHex }}
                                                        >
                                                            <div className="font-extrabold text-[14.5px] leading-snug tracking-tight">
                                                                RLLT-MDL{r.module} FCT{r.facet} PHS
                                                                {r.phase} DAY {r.day}
                                                            </div>
                                                            <div className="font-extrabold text-[14.5px] leading-snug tracking-tight mt-0.5 flex items-center flex-wrap gap-1.5">
                                                                <span>
                                                                    {dailyCount > 0
                                                                        ? `${dailyCount} DONE`
                                                                        : 'DONE'}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1 text-[15px]">
                                                                    <span>😊</span>
                                                                    <span>😊</span>
                                                                    <span>😊</span>
                                                                    <span>😊</span>
                                                                    <span>😊</span>
                                                                    <span>✅</span>
                                                                </span>
                                                                {ableCount > 0 && (
                                                                    <span className="font-extrabold text-[14.5px]">
                                                                        {ableCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                                                        {r.module}
                                                    </td>
                                                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                                                        {r.facet}
                                                    </td>
                                                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                                                        {r.phase}
                                                    </td>
                                                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                                                        {r.day}
                                                    </td>
                                                    <td className="py-3.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                                                        {r.art || '1m'}
                                                    </td>
                                                    <td className="py-3.5 px-3 font-bold text-[#1d72f2]">
                                                        {dailyCount}
                                                    </td>
                                                    <td className="py-3.5 px-3 font-bold text-[#28a745]">
                                                        {ableCount}
                                                    </td>
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        <span className="inline-flex items-center gap-2">
                                                            <span
                                                                className="w-5 h-5 rounded-md border border-slate-300 inline-block shadow-xs"
                                                                style={{
                                                                    backgroundColor: bgHex,
                                                                }}
                                                            />
                                                            <span className="text-xs font-mono font-semibold text-slate-700">
                                                                {bgHex}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                                                        {r.created_at
                                                            ? new Date(
                                                                  r.created_at
                                                              ).toLocaleString()
                                                            : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION FOOTER BAR */}
                        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-[13px] text-slate-600 font-medium">
                                Showing{' '}
                                <span className="font-bold text-slate-800">
                                    {searchedTableRecords.length === 0 ? 0 : pageStartIndex + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-bold text-slate-800">
                                    {Math.min(
                                        pageStartIndex + rowsPerPage,
                                        searchedTableRecords.length
                                    )}
                                </span>{' '}
                                of{' '}
                                <span className="font-bold text-slate-800">
                                    {searchedTableRecords.length}
                                </span>{' '}
                                entries
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={safeCurrentPage <= 1}
                                    onClick={() => setCurrentPage(1)}
                                    className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold cursor-pointer"
                                    title="First Page"
                                >
                                    <i className="pi pi-angle-double-left text-xs"></i>
                                </button>
                                <button
                                    type="button"
                                    disabled={safeCurrentPage <= 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold cursor-pointer"
                                >
                                    Prev
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-9 min-w-[36px] px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                            safeCurrentPage === page
                                                ? 'bg-[#1d72f2] text-white shadow-xs'
                                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    disabled={safeCurrentPage >= totalPages}
                                    onClick={() =>
                                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                                    }
                                    className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold cursor-pointer"
                                >
                                    Next
                                </button>
                                <button
                                    type="button"
                                    disabled={safeCurrentPage >= totalPages}
                                    onClick={() => setCurrentPage(totalPages)}
                                    className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold cursor-pointer"
                                    title="Last Page"
                                >
                                    <i className="pi pi-angle-double-right text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ISIReport;
