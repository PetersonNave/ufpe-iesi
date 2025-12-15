"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ff6b6b",
];
const INCOME_ORDER = [
  "Até 1 SM",
  "Até 2 SM",
  "Até 3 SM",
  "Até 4 SM",
  "Mais de 4 SM",
];
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};
export default function FullAnalyticsDashboard({ data }: any) {
  // Ordenar Renda (Garante que "Até 1" venha antes de "Até 2", independente do Mongo)
  const sortedIncome = data.socioeconomic.incomeStats.sort((a: any, b: any) => {
    return INCOME_ORDER.indexOf(a._id) - INCOME_ORDER.indexOf(b._id);
  });


  // Função para formatar labels de idade do Bucket do Mongo
  const formatAgeLabel = (val: number) => {
    if (val === 0) return "0-18";
    if (val === 19) return "19-30";
    if (val === 31) return "31-45";
    if (val === 46) return "46-60";
    if (val === 61) return "60+";
    return String(val);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
      {/* ---------------- SESSÃO 1: DEMOGRÁFICA ---------------- */}
      <section>
        <SectionHeader title="1. Perfil Demográfico" icon="👤" />
       
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "24px",
          }}
        >
          <ChartCard title="Nível de Escolaridade">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                layout="vertical"
                data={data.socioeconomic.educationStats}
                margin={{ left: 20, right: 30 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal
                  vertical={false}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="_id"
                  type="category"
                  width={110}
                  style={{ fontSize: "11px" }}
                  interval={0}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ borderRadius: "8px" }}
                />
                <Bar
                  dataKey="count"
                  fill="#8884d8"
                  radius={[0, 4, 4, 0]}
                  barSize={25}
                  label={{ position: "right", fill: "#666" }}
                  name="Pacientes"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* GRÁFICO 2: PESSOAS NA CASA (Barras Verticais) */}
          <ChartCard title="Pessoas na Residência">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.socioeconomic.residentsStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="_id"
                  label={{
                    value: "Nº de Pessoas",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f4f4f4" }} />
                <Bar
                  dataKey="count"
                  fill="#FF8042"
                  radius={[4, 4, 0, 0]}
                  name="Ocorrências"
                >
                  {data.socioeconomic.residentsStats.map(
                    (entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry._id > 4 ? "#d9534f" : "#FF8042"}
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          {/* Pirâmide Etária */}
          <ChartCard title="Faixa Etária">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.demographics.ageStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="_id" tickFormatter={formatAgeLabel} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  labelFormatter={formatAgeLabel}
                  cursor={{ fill: "#f4f4f4" }}
                />
                <Bar
                  dataKey="count"
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                  name="Pacientes"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Gênero */}
          <ChartCard title="Gênero">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.demographics.genderStats}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  label
                >
                  {data.demographics.genderStats.map(
                    (entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
 <ChartCard title="Comunidade UFPE vs Externo">
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <div style={{ width: "50%", height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={data.socioeconomic.ufpeCommunityStats}
                      dataKey="count"
                      nameKey="_id"
                      innerRadius={50}
                      outerRadius={70}
                    >
                      <Cell fill="#00C49F" /> {/* Sim */}
                      <Cell fill="#1f1f1f" /> {/* Não */}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: "50%" }}>
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  Distribuição do Vínculo (Apenas Comunidade)
                </h4>
                {data.socioeconomic.ufpeLinkTypeStats.length > 0 ? (
                  <ul
                    style={{ listStyle: "none", padding: 0, fontSize: "13px" }}
                  >
                    {data.socioeconomic.ufpeLinkTypeStats.map(
                      (item: any, idx: number) => (
                        <li
                          key={idx}
                          style={{
                            padding: "6px 0",
                            borderBottom: "1px solid #f0f0f0",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>{item._id}</span>
                          <strong style={{ color: "#00C49F" }}>
                            {item.count}
                          </strong>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p style={{ fontSize: "12px", color: "#999" }}>
                    Nenhum dado de vínculo disponível.
                  </p>
                )}
              </div>
            </div>
          </ChartCard>
          {/* Top 5 Bairros (Barras Horizontais) */}
          <Top5BarChart
            title="Top 5 Bairros"
            data={data.demographics.topNeighborhoods}
            color="#0088FE"
          />
        </div>
      </section>

      {/* ---------------- SESSÃO 2: SOCIOECONÔMICA ---------------- */}
      <section>
        <SectionHeader title="2. Análise Socioeconômica" icon="💰" />
 <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #1a365d 0%, #2a4365 100%)",
              padding: "30px",
              borderRadius: "12px",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 4px 15px rgba(26, 54, 93, 0.2)",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  opacity: 0.9,
                  fontWeight: "normal",
                }}
              >
                Renda Per Capita Média (Estimada)
              </h3>
              <p
                style={{
                  margin: "5px 0 0 0",
                  fontSize: "0.9rem",
                  opacity: 0.7,
                }}
              >
                Baseado na renda familiar dividida pelo nº de moradores
              </p>
            </div>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
              {formatCurrency(data.socioeconomic.avgPerCapita)}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Renda Familiar (Range Solicitado) */}
          <ChartCard title="Renda Familiar (Salários Mínimos)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={sortedIncome}
                layout="vertical"
                margin={{ left: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal
                  vertical={false}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="_id"
                  type="category"
                  width={100}
                  style={{ fontSize: "12px" }}
                />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar
                  dataKey="count"
                  fill="#FFBB28"
                  radius={[0, 4, 4, 0]}
                  barSize={30}
                  label={{ position: "right", fill: "#666" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
{/* Estado Civil (NOVO - Pizza) */}
          <ChartCard title="Estado Civil">
             <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.socioeconomic.maritalStats}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.socioeconomic.maritalStats?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Situação de Moradia (NOVO - Barras) */}
          <ChartCard title="Situação de Moradia">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.socioeconomic.housingStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="_id" style={{ fontSize: '11px' }} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f4f4f4" }} />
                <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} name="Pacientes" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Tipo de Transporte (NOVO - Barras) */}
          <ChartCard title="Meio de Transporte Principal">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.socioeconomic.transportStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="_id" style={{ fontSize: '11px' }} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f4f4f4" }} />
                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} name="Pacientes" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          {/* Vínculo UFPE (Donut + Lista) */}
         
        </div>
      </section>

      {/* ---------------- SESSÃO 3: TRIAGEM CLÍNICA ---------------- */}
      <section>
        <SectionHeader title="3. Triagem e Queixas" icon="🩺" />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Prioridade */}
          <ChartCard title="Classificação de Prioridade">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.triage.priorityStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="_id" />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f4f4f4" }} />
                <Bar dataKey="count" fill="#FF8042" radius={[4, 4, 0, 0]}>
                  {data.triage.priorityStats.map(
                    (entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry._id === "Alta" || entry._id === "Urgente"
                            ? "#ff4d4f"
                            : "#FF8042"
                        }
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top 5 Especialidades */}
          <Top5BarChart
            title="Especialidades Requisitadas"
            data={data.triage.topSpecialties}
            color="#8884d8"
          />

          {/* Top 5 Queixas */}
          <Top5BarChart
            title="Queixas Principais (Top 5)"
            data={data.triage.topComplaints}
            color="#ff6b6b"
          />

          {/* Top 5 Origem */}
          <Top5BarChart
            title="Origem do Encaminhamento"
            data={data.triage.topReferral}
            color="#4ecdc4"
          />

          {/* Top 5 Lifestyle */}
          <Top5BarChart
            title="Hábitos de Vida"
            data={data.triage.topLifestyle}
            color="#ffe66d"
          />
        </div>
      </section>
    </div>
  );
}

// --- Sub-componentes para Limpeza do Código ---

// Componente para Gráfico de Barras Horizontais (Reutilizável)
const Top5BarChart = ({ data, title, color }: any) => (
  <div
    style={{
      background: "#fff",
      padding: "24px",
      borderRadius: "12px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    }}
  >
    <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#555" }}>
      {title}
    </h3>
    <div style={{ height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ left: 10, right: 30 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
          />
          <XAxis type="number" hide />
          <YAxis
            dataKey="_id"
            type="category"
            width={90}
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{ borderRadius: "8px" }}
          />
          <Bar
            dataKey="count"
            fill={color}
            radius={[0, 4, 4, 0]}
            barSize={20}
            name="Total"
            label={{ position: "right", fill: "#999", fontSize: 12 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Componente de Cartão Simples
const ChartCard = ({ title, children }: any) => (
  <div
    style={{
      background: "#fff",
      padding: "24px",
      borderRadius: "12px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    }}
  >
    <h3
      style={{
        margin: "0 0 20px 0",
        fontSize: "16px",
        color: "#555",
        borderBottom: "1px solid #eee",
        paddingBottom: "10px",
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

// Cabeçalho de Sessão
const SectionHeader = ({ title, icon }: any) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "20px",
      borderLeft: "4px solid #1a365d",
      paddingLeft: "15px",
    }}
  >
    <span style={{ fontSize: "24px" }}>{icon}</span>
    <h2
      style={{ fontSize: "20px", color: "#1a365d", margin: 0, fontWeight: 600 }}
    >
      {title}
    </h2>
  </div>
);
