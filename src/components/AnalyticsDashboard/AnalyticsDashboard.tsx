'use client';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

// Sub-componente para os Gráficos de Top 5 (Para evitar repetição de código)
const Top5Chart = ({ data, title, color, icon }: any) => (
  <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <h3 style={{ color: '#555', margin: 0, fontSize: '16px' }}>{title}</h3>
    </div>
    
    <div style={{ height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        {/* layout="vertical" faz as barras deitadas */}
        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          {/* YAxis type="category" é crucial para barras horizontais */}
          <XAxis type="number" hide />
          <YAxis 
            dataKey="_id" 
            type="category" 
            width={120} 
            tick={{fontSize: 11}} 
            interval={0} // Mostra todos os labels
          />
          <Tooltip 
            cursor={{ fill: '#f4f4f4' }}
            contentStyle={{ borderRadius: '8px' }}
          />
          <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} barSize={20} name="Ocorrências" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default function AnalyticsDashboard({ 
  painDistribution, dailyVolume,
  topComplaint, topHistory, topMedications, topGoals 
}: any) {
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* SEÇÃO 1: GRÁFICOS GERAIS (Lado a Lado) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#555', marginBottom: '15px' }}>Distribuição de Dor (0-10)</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={painDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="_id" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#17af95" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#555', marginBottom: '15px' }}>Volume Semanal</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyVolume}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="_id" tickFormatter={(str) => str.substring(5)} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: TOP 5 OCORRÊNCIAS (Grid 2x2) */}
      <h2 style={{ fontSize: '18px', color: '#666', marginTop: '10px' }}>Principais Ocorrências</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        <Top5Chart 
          title="Queixas Principais" 
          data={topComplaint} 
          color="#FF8042" // Laranja
          icon="🤕"
        />

        <Top5Chart 
          title="Histórico de Doenças" 
          data={topHistory} 
          color="#0088FE" // Azul
          icon="📋"
        />

        <Top5Chart 
          title="Medicamentos Comuns" 
          data={topMedications} 
          color="#00C49F" // Verde Água
          icon="💊"
        />

        <Top5Chart 
          title="Objetivos do Paciente" 
          data={topGoals} 
          color="#FFBB28" // Amarelo
          icon="🎯"
        />

      </div>
    </div>
  );
}