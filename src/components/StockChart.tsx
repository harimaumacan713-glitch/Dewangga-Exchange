import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const data = [
  { name: 'Dec 22', value: 4000 },
  { name: 'Dec 23', value: 3000 },
  { name: 'Dec 24', value: 5000 },
  { name: 'Dec 25', value: 2000 },
  { name: 'Dec 26', value: 6000 },
];

export default function StockChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{fontSize: 10}} />
        <YAxis tick={{fontSize: 10}} />
        <Bar dataKey="value" fill="#a3e635" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
