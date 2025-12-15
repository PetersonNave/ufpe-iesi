import AnalyticsDashboard from "@/components/AnalyticsDashboard/AnalyticsDashboard";
import dbConnect from "@/lib/mongodb";
import PatientAnamnesis from "@/models/PatientAnamnesis";

// Função para buscar dados agregados (Server Side)
async function getAnalyticsData() {
  await dbConnect();

  // 1. KPI: Total de Fichas
  const totalDocs = await PatientAnamnesis.countDocuments();

  // 2. KPI: Média de Dor Geral
  // O aggregate é poderoso para cálculos matemáticos no banco
  const avgPainResult = await PatientAnamnesis.aggregate([
    { $group: { _id: null, avg: { $avg: "$painLevel" } } },
  ]);
  const avgPain = avgPainResult[0]?.avg ? avgPainResult[0].avg.toFixed(1) : 0;

  // Função auxiliar para buscar Top 5 valores distintos de um campo específico
  async function getTop5ByField(field: string) {
    return PatientAnamnesis.aggregate([
      { $match: { [field]: { $exists: true, $ne: "" } } }, // Ignora vazios
      { $group: { _id: `$${field}`, count: { $sum: 1 } } }, // Agrupa pelo texto exato
      { $sort: { count: -1 } }, // Ordena do maior para o menor
      { $limit: 5 }, // Pega só os 5 primeiros
    ]);
  }
  // 3. GRÁFICO: Distribuição de Dor (Quantos nível 1, quantos nível 10...)
  const painDistribution = await PatientAnamnesis.aggregate([
    { $group: { _id: "$painLevel", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }, // Ordenar do nível 0 ao 10
  ]);

  // 4. GRÁFICO: Volume por Dia (Últimos 7 dias)
  const dailyVolume = await PatientAnamnesis.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 5. LISTA: Últimas 5 entradas para inspeção rápida
  const recentEntries = await PatientAnamnesis.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("patientName complaint painLevel createdAt")
    .lean();
  const [topComplaint, topHistory, topMedications, topGoals] =
    await Promise.all([
      getTop5ByField("complaint"),
      getTop5ByField("history"),
      getTop5ByField("medications"),
      getTop5ByField("goals"),
    ]);

  return {
    totalDocs,
    avgPain,
    painDistribution,
    dailyVolume,
    recentEntries,
    topComplaint,
    topHistory,
    topMedications,
    topGoals,
  };
}

export default async function Page() {
  const data = await getAnalyticsData();

  // Serializar os dados para passar pro Client Component (MongoDB retorna objetos complexos)
  const serializedData = JSON.parse(JSON.stringify(data));

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "sans-serif",
        background: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ color: "#333" }}>Painel de Anamneses</h1>
        <p style={{ color: "#666" }}>
          Visão geral da entrada de pacientes remotos
        </p>
      </div>

      {/* --- CARDS DE KPIs (Indicadores Chave) --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <KpiCard
          title="Total de Fichas"
          value={serializedData.totalDocs}
          icon="📄"
        />
        <KpiCard
          title="Média de Dor (0-10)"
          value={serializedData.avgPain}
          icon="🌡️"
          color={serializedData.avgPain > 7 ? "#d9534f" : "#17af95"}
        />
        <KpiCard
          title="Novos Hoje"
          value={
            serializedData.dailyVolume[serializedData.dailyVolume.length - 1]
              ?.count || 0
          }
          icon="📅"
        />
      </div>

      {/* --- GRÁFICOS --- */}
      <AnalyticsDashboard
        painDistribution={data.painDistribution}
        dailyVolume={data.dailyVolume}
        topComplaint={data.topComplaint}
        topHistory={data.topHistory}
        topMedications={data.topMedications}
        topGoals={data.topGoals}
      />

      {/* --- TABELA RECENTE --- */}
      <div
        style={{
          marginTop: "30px",
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        }}
      >
        <h3 style={{ marginBottom: "15px", color: "#555" }}>
          Últimas Entradas
        </h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #f0f0f0", color: "#888" }}>
              <th style={{ padding: "10px" }}>Data</th>
              <th style={{ padding: "10px" }}>Paciente</th>
              <th style={{ padding: "10px" }}>Queixa Principal</th>
              <th style={{ padding: "10px" }}>Dor</th>
            </tr>
          </thead>
          <tbody>
            {serializedData.recentEntries.map((entry: any) => (
              <tr key={entry._id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px", color: "#666" }}>
                  {new Date(entry.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td style={{ padding: "10px", fontWeight: "bold" }}>
                  {entry.patientName}
                </td>
                <td style={{ padding: "10px" }}>{entry.complaint}</td>
                <td style={{ padding: "10px" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      background: entry.painLevel >= 8 ? "#ffebeb" : "#e6fffa",
                      color: entry.painLevel >= 8 ? "#d9534f" : "#17af95",
                      fontWeight: "bold",
                    }}
                  >
                    {entry.painLevel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Pequeno componente auxiliar para os Cards
function KpiCard({ title, value, icon, color = "#333" }: any) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: "14px", color: "#999" }}>{title}</p>
        <h2 style={{ margin: "5px 0 0 0", fontSize: "28px", color: color }}>
          {value}
        </h2>
      </div>
      <div style={{ fontSize: "30px", opacity: 0.8 }}>{icon}</div>
    </div>
  );
}
