import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Scatter,
  Customized,
  Rectangle
} from 'recharts';
import React, { useState } from 'react';

const sampleData = [
  {
    date: "06-01",
    medication: [
      { period: "00:00-08:00", medications: [{ on_time: true }, { on_time: false }] },
      { period: "09:00-14:00", medications: [{ on_time: true }] },
      { period: "15:00-20:00", medications: [] }
    ]
  },
  {
    date: "06-02",
    medication: [
      { period: "00:00-08:00", medications: [{ on_time: false }] },
      { period: "09:00-14:00", medications: [{ on_time: true }, { on_time: true }] },
      { period: "15:00-20:00", medications: [{ on_time: true }] }
    ]
  }
];

const timePeriods = ["00:00-08:00", "09:00-14:00", "15:00-20:00", "21:00-24:00"];
const getPeriodIndex = (period) => timePeriods.indexOf(period);  // 将字符串 period 转为数字 index

const getMedColor = (ratio) => {
  if (ratio === null || isNaN(ratio)) return "#f0f0f0"; // 无记录，淡灰
  if (ratio >= 1) return "#003f5c";
  if (ratio >= 0.75) return "#2f4b7c";
  if (ratio >= 0.5) return "#665191";
  if (ratio >= 0.25) return "#a05195";
  return "#d45087";
};


function SampleHeatMap() {

  return (
    <ResponsiveContainer width="100%" height={600}>
  <ComposedChart
    data={sampleData}
    margin={{ top: 20, right: 20, bottom: 20, left: 60 }}
    clipPath={undefined}
  >
    <XAxis dataKey="date" type="category" interval={0} tick={{ fontSize: 12 }} />
    <YAxis
    type="number"
    dataKey={null}
    domain={[0, timePeriods.length - 1]}
    ticks={[0, 1, 2, 3]}
    tickFormatter={(tick) => timePeriods[tick]}
    tick={{ fontSize: 12 }}
    />
    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
    <Customized
  component={({ xAxisMap, yAxisMap, height, width }) => {
    const xAxis = xAxisMap[Object.keys(xAxisMap)[0]];
    const yAxis = yAxisMap[Object.keys(yAxisMap)[0]];
    const xScale = xAxis.scale;
    const yScale = yAxis.scale;

    const xDomain = sampleData.map(d => d.date);
    const xStep = width / xDomain.length;  // 每个 date 的格宽
    const xBandwidth = xStep * 0.8;        // 留点 padding，80% 宽度

    const yBandwidth = height / timePeriods.length * 0.8;

    const rectangles = [];
    sampleData.forEach((day) => {
      (day.medication ?? []).forEach((entry) => {
        const x = xScale(day.date) + xStep * 0.1; // 或 xStep * 0.1 ~ 0.2 取 padding 效果
        const y = yScale(getPeriodIndex(entry.period)) + yBandwidth * 0.1;
        if (x === undefined || y === undefined) return;

        const total = entry.medications.length;
        const onTime = entry.medications.filter(m => m.on_time).length;
        const ratio = total > 0 ? onTime / total : null;
        const color = getMedColor(ratio);

        rectangles.push(
          <rect
            key={`${day.date}-${entry.period}`}
            x={x}
            y={y}
            width={xBandwidth}
            height={yBandwidth}
            fill={color}
            stroke="#ccc"
          />
        );
      });
    });

    console.log("🔍 rectangles = ", rectangles);

    return <g>{rectangles}</g>;
  }}
/>




  </ComposedChart>
</ResponsiveContainer>

  );
}

export default SampleHeatMap;




