import PatientAnalytics from "@/models/PatientAnalytics";
import FullAnalyticsDashboard from "@/components/FullAnalyticsDashboard/FullAnalyticsDashboard";
import dbConnect from "@/lib/mongodb";
import NeighborhoodMap from "@/components/NeighborhoodMap/NeighborhoodMap";

async function getTop5(field: string) {
  return PatientAnalytics.aggregate([
    { $match: { [field]: { $exists: true, $ne: "" } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
}

export const revalidate = 0;

async function getAnalyticsData() {
  await dbConnect();

  const totalPatients = await PatientAnalytics.countDocuments();

  const ageStats = await PatientAnalytics.aggregate([
    {
      $bucket: {
        groupBy: "$demographics.ageAtRegistration",
        boundaries: [0, 19, 31, 46, 61, 150],
        default: "Outros",
        output: { count: { $sum: 1 } },
      },
    },
  ]);

  const genderStats = await PatientAnalytics.aggregate([
    { $group: { _id: "$demographics.gender", count: { $sum: 1 } } },
  ]);

  const topCities = await getTop5("demographics.city");
  const topNeighborhoods = await getTop5("demographics.neighborhood");
  const filiteredTopNeighborhoods = topNeighborhoods.map((e) => {
    return { ...e, _id: e._id.replace("/PE", "") };
  });

  const SALARIO_MINIMO = 1518;
  const perCapitaStats = await PatientAnalytics.aggregate([
    {
      $addFields: {
        incomeValue: {
          $convert: {
            input: "$socioeconomic.familyIncome",
            to: "double",
            onError: null,
            onNull: null,
          },
        },
        residentsVal: { $toDouble: "$socioeconomic.residentsCount" },
      },
    },
    {
      $match: {
        incomeValue: { $gt: 0 },
        residentsVal: { $gt: 0 },
      },
    },
    {
      $project: {
        perCapita: { $divide: ["$incomeValue", "$residentsVal"] },
      },
    },
    {
      $group: {
        _id: null,
        avgPerCapita: { $avg: "$perCapita" },
      },
    },
  ]);

  const avgPerCapita = perCapitaStats[0]?.avgPerCapita || 0;

  const incomeStats = await PatientAnalytics.aggregate([
    {
      $project: {
        incomeCategory: {
          $switch: {
            branches: [
              {
                case: { $lte: ["$socioeconomic.familyIncome", SALARIO_MINIMO] },
                then: "Até 1 Salário Mínimo",
              },
              {
                case: {
                  $and: [
                    { $gt: ["$socioeconomic.familyIncome", SALARIO_MINIMO] },
                    {
                      $lte: ["$socioeconomic.familyIncome", SALARIO_MINIMO * 2],
                    },
                  ],
                },
                then: "Até 2 Salário Mínimo",
              },
              {
                case: {
                  $and: [
                    {
                      $gt: ["$socioeconomic.familyIncome", SALARIO_MINIMO * 2],
                    },
                    {
                      $lte: ["$socioeconomic.familyIncome", SALARIO_MINIMO * 3],
                    },
                  ],
                },
                then: "Até 3 Salário Mínimo",
              },
              {
                case: {
                  $and: [
                    {
                      $gt: ["$socioeconomic.familyIncome", SALARIO_MINIMO * 3],
                    },
                    {
                      $lte: ["$socioeconomic.familyIncome", SALARIO_MINIMO * 4],
                    },
                  ],
                },
                then: "Até 4 Salário Mínimo",
              },
              {
                case: {
                  $gt: ["$socioeconomic.familyIncome", SALARIO_MINIMO * 4],
                },
                then: "Mais de 4 Salário Mínimo",
              },
            ],
            default: "Não Informado / Outros",
          },
        },
      },
    },
    {
      $group: {
        _id: "$incomeCategory",
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const maritalStats = await PatientAnalytics.aggregate([
    { $match: { "socioeconomic.maritalStatus": { $exists: true, $ne: "" } } },
    { $group: { _id: "$socioeconomic.maritalStatus", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const housingStats = await PatientAnalytics.aggregate([
    { $match: { "socioeconomic.housingStatus": { $exists: true, $ne: "" } } },
    { $group: { _id: "$socioeconomic.housingStatus", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const transportStats = await PatientAnalytics.aggregate([
    { $match: { "socioeconomic.transportType": { $exists: true, $ne: "" } } },
    { $group: { _id: "$socioeconomic.transportType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const ufpeCommunityStats = await PatientAnalytics.aggregate([
    {
      $group: {
        _id: { $toUpper: "$socioeconomic.isUfpeCommunity" },
        count: { $sum: 1 },
      },
    },
  ]);

  const ufpeLinkTypeStats = await PatientAnalytics.aggregate([
    {
      $match: {
        "socioeconomic.isUfpeCommunity": {
          $in: ["SIM", "Sim", "sim", true, "true"],
        },
      },
    },
    { $match: { "socioeconomic.ufpeLinkType": { $ne: "" } } },
    { $group: { _id: "$socioeconomic.ufpeLinkType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const priorityStats = await PatientAnalytics.aggregate([
    { $group: { _id: "$triage.priority", count: { $sum: 1 } } },
  ]);

  const topComplaints = await getTop5("triage.complaint");
  const topReferral = await getTop5("triage.referralSource");
  const topLifestyle = await getTop5("triage.lifestyle");
  const educationStats = await PatientAnalytics.aggregate([
    { $match: { "socioeconomic.educationLevel": { $ne: "" } } },
    { $group: { _id: "$socioeconomic.educationLevel", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const residentsStats = await PatientAnalytics.aggregate([
    { $match: { "socioeconomic.residentsCount": { $gt: 0 } } },
    { $group: { _id: "$socioeconomic.residentsCount", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const topSpecialties = await PatientAnalytics.aggregate([
    { $unwind: "$triage.specialties" },
    { $group: { _id: "$triage.specialties", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  const neighborhoodDensity = await PatientAnalytics.aggregate([
    {
      $match: { "demographics.neighborhood": { $exists: true, $ne: null } },
    },
    {
      $group: {
        _id: "$demographics.neighborhood",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  const filteredNeighborhoodDensity = neighborhoodDensity.map((e) => {
    return { ...e, _id: e._id.replace("/PE", "") };
  });

  return {
    totalPatients,
    demographics: {
      ageStats,
      genderStats,
      topCities,
      topNeighborhoods: filiteredTopNeighborhoods,
      filteredNeighborhoodDensity,
    },
    socioeconomic: {
      incomeStats,
      ufpeCommunityStats,
      ufpeLinkTypeStats,
      avgPerCapita,
      educationStats,
      residentsStats,
      maritalStats,
      housingStats,
      transportStats,
    },
    triage: {
      priorityStats,
      topComplaints,
      topReferral,
      topLifestyle,
      topSpecialties,
    },
  };
}

export default async function AnalyticsPage() {
  const rawData = await getAnalyticsData();
  const data = JSON.parse(JSON.stringify(rawData));

  return (
    <div style={{ padding: "40px", background: "#f8f9fa", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <header
          style={{
            marginBottom: "40px",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "20px",
          }}
        >
          <h1 style={{ color: "#1a365d", margin: 0 }}>Dashboard Clínico</h1>

          <p style={{ color: "#718096", margin: "5px 0 0 0" }}>
            Análise segmentada por demografia, condições socioeconômicas e
            triagem.
          </p>
        </header>

        <FullAnalyticsDashboard data={data} />

        <div
          style={{
            borderTop: "2px solid #e2e8f0",
            marginTop: "40px",
            paddingTop: "10px",
            color: "rgb(26, 54, 93)",
            marginBottom: "40px",
          }}
          className="border rounded-lg overflow-hidden shadow-sm"
        >
          <h2 style={{ marginBottom: "16px", fontSize: "2rem" }}>
            Distribuição Geográfica de Pacientes
          </h2>
          <NeighborhoodMap
            neighborhoodData={data.demographics.filteredNeighborhoodDensity}
          />
        </div>
      </div>
    </div>
  );
}
