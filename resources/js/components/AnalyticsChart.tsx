import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { month: string; total: number }[];
}

const AnalyticsChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-100">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Tooltip />

          <Area
            type="monotone"
            dataKey="total"
            stroke="#000"
            fill="#cbd5e1"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;