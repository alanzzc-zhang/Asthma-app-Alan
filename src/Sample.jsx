import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Scatter
} from 'recharts';
import React, { useState } from 'react';

const rawData = [
  { x: 0, name: 'A', cough_total: 50, cough_event: { text: 'Mild cough' } },
  { x: 1, name: 'B', cough_total: 30 },
  { x: 2, name: 'C', cough_total: 70, cough_event: { text: 'Severe cough' } },
  { x: 3, name: 'D', cough_total: 40 }
];

// 手动添加 index 字段
const data = rawData.map((d, i) => ({ ...d, index: i }));

// Pushpin shape 组件
const PushpinShape = ({ cx, cy, payload, isHovered, onHover, onLeave }) => {
  if (!payload?.cough_event) return null;

  return (
    <>
      <text
        x={cx}
        y={cy}
        dy={2}
        dx={4}
        textAnchor="start"
        fontSize={20}
        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        onMouseEnter={() => onHover(payload.index)}
        onMouseLeave={onLeave}
      >
        📌
      </text>

      {isHovered && (
        <>
          <rect
            x={cx + 10}
            y={cy - 35}
            width={140}
            height={30}
            fill="#fff"
            stroke="#888"
            rx={5}
          />
          <text
            x={cx + 15}
            y={cy - 15}
            fontSize={12}
            fill="#333"
            textAnchor="start"
            pointerEvents="none"
          >
            Note: {payload.cough_event.text}
          </text>
        </>
      )}
    </>
  );
};

function LollipopWithPushpinChart() {
  const [hoveredPinIndex, setHoveredPinIndex] = useState(null);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="x"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(value) => data[value]?.name || ''}
          ticks={data.map(d => d.x)}
        />
        <YAxis />
        

        {/* 棒棒糖线 */}
        {data.map((item, index) => (
          <Line
            key={index}
            type="linear"
            data={[
              { x: item.x, cough_total: 0 },
              { x: item.x, cough_total: item.cough_total }
            ]}
            dataKey="cough_total"
            stroke="#8884d8"
            dot={false}
            strokeWidth={3}
          />
        ))}

        {/* 圆点 */}
        <Scatter
          data={data}
          dataKey="cough_total"
          fill="#8884d8"
          strokeWidth={3}
          r={6}
        />

        {/* Pushpin scatter */}
        <Scatter
          data={data}
          dataKey="cough_total"
          shape={(props) => (
            <PushpinShape
              {...props}
              isHovered={hoveredPinIndex === props.payload.index}
              onHover={setHoveredPinIndex}
              onLeave={() => setHoveredPinIndex(null)}
            />
          )}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default LollipopWithPushpinChart;




