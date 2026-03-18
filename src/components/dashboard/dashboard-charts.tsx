'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DashboardCharts({ byStatus, byUnit }: { byStatus: { name: string; total: number }[]; byUnit: { name: string; total: number }[]; }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[{ title: 'Ocorrências por estado', data: byStatus }, { title: 'Ocorrências por unidade', data: byUnit }].map((item) => (
        <div key={item.title} className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">{item.title}</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={item.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
