
import PatientAnalytics from '@/models/PatientAnalytics';
import FullAnalyticsDashboard from '@/components/FullAnalyticsDashboard/FullAnalyticsDashboard';
import dbConnect from '@/lib/mongodb';
import NeighborhoodMap from '@/components/NeighborhoodMap/NeighborhoodMap';

// Helper para buscar Top 5 de qualquer campo (ignora vazios)
async function getTop5(field: string) {
  return PatientAnalytics.aggregate([
    { $match: { [field]: { $exists: true, $ne: "" } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
}

export const revalidate = 0;

async function getAnalyticsData() {
  await dbConnect();

  const totalPatients = await PatientAnalytics.countDocuments();

  // --- SESSÃO 1: DEMOGRAFIA ---
  
  // Faixas Etárias (0-18, 19-30, 31-45, 46-60, 60+)
  const ageStats = await PatientAnalytics.aggregate([
    {
      $bucket: {
        groupBy: "$demographics.ageAtRegistration",
        boundaries: [0, 19, 31, 46, 61, 150],
        default: "Outros",
        output: { count: { $sum: 1 } }
      }
    }
  ]);

  const genderStats = await PatientAnalytics.aggregate([
    { $group: { _id: "$demographics.gender", count: { $sum: 1 } } }
  ]);

  const topCities = await getTop5("demographics.city");
  const topNeighborhoods = await getTop5("demographics.neighborhood");
  const filiteredTopNeighborhoods = topNeighborhoods.map(e =>{ return {...e, _id: e._id.replace("/PE", "")}})
  // --- SESSÃO 2: SOCIOECONÔMICO ---

const SALARIO_MINIMO = 1518;
const perCapitaStats = await PatientAnalytics.aggregate([
    { 
      $addFields: {
        incomeValue: { $convert: {
          input: "$socioeconomic.familyIncome",
          to: "double",
          onError: null,
          onNull: null
        }},
        residentsVal: { $toDouble: "$socioeconomic.residentsCount" }
      }
    },
    { 
      $match: { 
        incomeValue: { $gt: 0 }, 
        residentsVal: { $gt: 0 } // Evitar divisão por zero
      } 
    },
    {
      $project: {
        // Cálculo exato: Renda / Pessoas
        perCapita: { $divide: ["$incomeValue", "$residentsVal"] }
      }
    },
    {
      $group: {
        _id: null,
        avgPerCapita: { $avg: "$perCapita" } // Média global da per capita
      }
    }
  ]);

  // Valor seguro caso não tenha dados ainda
  const avgPerCapita = perCapitaStats[0]?.avgPerCapita || 0;

const incomeStats = await PatientAnalytics.aggregate([
  {
    $project: {
      incomeCategory: {
        $switch: {
          branches: [
            {
              case: { $lte: ["$socioeconomic.familyIncome", SALARIO_MINIMO] },
              then: "Até 1 Salário Mínimo"
            },
            {
              case: {
                $and: [
                  { $gt: ["$socioeconomic.familyIncome", SALARIO_MINIMO] },
                  { $lte: ["$socioeconomic.familyIncome", SALARIO_MINIMO * 2] }
                ]
              },
              then: "Até 2 Salário Mínimo"
            },
            {
              case: {
                $and: [
                  { $gt: ["$socioeconomic.familyIncome", SALARIO_MINIMO * 2] },
                  { $lte: ["$socioeconomic.familyIncome", SALARIO_MINIMO * 3] }
                ]
              },
              then: "Até 3 Salário Mínimo"
            },
            {
              case: {
                $and: [
                  { $gt: ["$socioeconomic.familyIncome", SALARIO_MINIMO * 3] },
                  { $lte: ["$socioeconomic.familyIncome", SALARIO_MINIMO * 4] }
                ]
              },
              then: "Até 4 Salário Mínimo"
            },
            {
              case: { $gt: ["$socioeconomic.familyIncome", SALARIO_MINIMO * 4] },
              then: "Mais de 4 Salário Mínimo"
            }
          ],
          default: "Não Informado / Outros"
        }
      }
    }
  },
  {
    $group: {
      _id: "$incomeCategory",
      count: { $sum: 1 }
    }
  },
  {
    $sort: {
      _id: 1
    }
  }
]);


  // Vínculo UFPE (Geral)
  const ufpeCommunityStats = await PatientAnalytics.aggregate([
    { 
      $group: { 
        _id: { $toUpper: "$socioeconomic.isUfpeCommunity" }, // Força uppercase para garantir (SIM/Sim/sim)
        count: { $sum: 1 } 
      } 
    }
  ]);

  // Vínculo UFPE (Detalhado por Tipo - APENAS quem é da comunidade)
  const ufpeLinkTypeStats = await PatientAnalytics.aggregate([
    { 
      $match: { 
        "socioeconomic.isUfpeCommunity": { $in: ["SIM", "Sim", "sim", true, "true"] } 
      } 
    },
    { $match: { "socioeconomic.ufpeLinkType": { $ne: "" } } }, // Ignora vazios
    { $group: { _id: "$socioeconomic.ufpeLinkType", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // --- SESSÃO 3: TRIAGEM ---

  const priorityStats = await PatientAnalytics.aggregate([
    { $group: { _id: "$triage.priority", count: { $sum: 1 } } }
  ]);

  // Top 5 Campos Livres de Triagem
  const topComplaints = await getTop5("triage.complaint");
  const topReferral = await getTop5("triage.referralSource");
  const topLifestyle = await getTop5("triage.lifestyle");
  const educationStats = await PatientAnalytics.aggregate([
    { $match: { "socioeconomic.educationLevel": { $ne: "" } } }, // Ignora vazios
    { $group: { _id: "$socioeconomic.educationLevel", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // 2. Distribuição por Pessoas na Casa (Agrupado numéricamente)
  const residentsStats = await PatientAnalytics.aggregate([
    { $match: { "socioeconomic.residentsCount": { $gt: 0 } } },
    { $group: { _id: "$socioeconomic.residentsCount", count: { $sum: 1 } } },
    { $sort: { _id: 1 } } // Ordena de 1 morador até X moradores
  ]);
  // Especialidades (Array unwind)
  const topSpecialties = await PatientAnalytics.aggregate([
    { $unwind: "$triage.specialties" },
    { $group: { _id: "$triage.specialties", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  const neighborhoodDensity = await PatientAnalytics.aggregate([
      {
        // 1. Filtra documentos que têm bairro preenchido
        $match: { "demographics.neighborhood": { $exists: true, $ne: null } }
      },
      {
        // 2. Agrupa pelo nome do bairro e conta
        $group: {
          _id: "$demographics.neighborhood", // Agrupa pelo valor do campo
          count: { $sum: 1 } // Soma 1 para cada ocorrência
        }
      },
      {
        // 3. Opcional: Ordena do maior para o menor
        $sort: { count: -1 }
      }
    ]);

    const filteredNeighborhoodDensity = neighborhoodDensity.map(e =>{ return {...e, _id: e._id.replace("/PE", "")}})
    
  return {
    totalPatients,
    demographics: { ageStats, genderStats, topCities, topNeighborhoods: filiteredTopNeighborhoods, filteredNeighborhoodDensity},
    socioeconomic: { incomeStats, ufpeCommunityStats, ufpeLinkTypeStats, avgPerCapita, educationStats, residentsStats },
    triage: { priorityStats, topComplaints, topReferral, topLifestyle, topSpecialties }
  };
}

export default async function AnalyticsPage() {
  const rawData = await getAnalyticsData();
  const data = JSON.parse(JSON.stringify(rawData));

  return (
    <div style={{ padding: '40px', background: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
          <h1 style={{ color: '#1a365d', margin: 0 }}>Dashboard Clínico</h1>
          

          <p style={{ color: '#718096', margin: '5px 0 0 0' }}>Análise segmentada por demografia, condições socioeconômicas e triagem.</p>
        </header>
        
        <FullAnalyticsDashboard data={data} />

        <div style={{
            marginTop: '40px',color: 'rgb(26, 54, 93)', marginBottom: '40px',
        }} className="border rounded-lg overflow-hidden shadow-sm">
            <h2 style={{marginBottom: '16px'}}>Distribuição Geográfica de Pacientes</h2>
            <NeighborhoodMap neighborhoodData={data.demographics.filteredNeighborhoodDensity} />
        </div>
      </div>
    </div>
  );
}