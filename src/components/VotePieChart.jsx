import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const VotePieChart = ({ supportCount, rejectCount, totalEligible }) => {
  const data = [
    { name: 'Support', value: supportCount },
    { name: 'Reject', value: rejectCount },
  ];
  const COLORS = ['#1dc071', '#f04438'];
  const totalVotes = supportCount + rejectCount;
  const participationRate =
    totalEligible > 0
      ? ((totalVotes / totalEligible) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="w-full h-auto flex flex-col items-center">
      <div className="w-[160px] h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius="60%"
              outerRadius="100%"
              dataKey="value"
              labelLine={false}
              label={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const percent = ((value / totalVotes) * 100).toFixed(1);
                return [`${value} votes (${percent}%)`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-sm text-gray-400 mt-2">
        {participationRate}% of users voted
      </p>
    </div>
  );
};



export default VotePieChart;

