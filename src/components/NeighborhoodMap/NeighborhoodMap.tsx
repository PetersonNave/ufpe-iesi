'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface NeighborhoodData {
  _id: string; 
  count: number; 
}

export default function NeighborhoodMap({neighborhoodData}: {neighborhoodData: NeighborhoodData[]}) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadData() {
      const geoResponse = await fetch('/bairros_recife.geojson'); 
      const geoData = await geoResponse.json();

      const apiData = neighborhoodData;
      const statsMap: Record<string, number> = {};
      
      apiData.forEach((item) => {
        const normalizedName = normalizeName(item._id);
        statsMap[normalizedName] = item.count;
      });

      setGeoJsonData(geoData);
      
      setStats(statsMap);
    }

    loadData();
  }, []);

  const normalizeName = (str: string) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  const getColor = (count: number) => {
    return count > 265 ? '#800026' :
           count > 252  ? '#BD0026' :
           count > 244  ? '#E31A1C' :
           count > 237  ? '#FC4E2A' :
           count > 232   ? '#FD8D3C' :
           count > 0   ? '#FEB24C' :
                         '#FFEDA0';
  };

  const style = (feature: any) => {
    
    const rawName = feature.properties.EBAIRRNOME || feature.properties.EBAIRRNOMEOF || ""; 
    const normalizedName = normalizeName(rawName);
    
    const count = stats[normalizedName] || 0;

    return {
      fillColor: getColor(count),
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const rawName = feature.properties.EBAIRRNOME || feature.properties.EBAIRRNOMEOF;
    const normalizedName = normalizeName(rawName);
    const count = stats[normalizedName] || 0;

    layer.bindPopup(`
      <strong>${rawName}</strong><br/>
      ${count} pacientes registrados
    `);
  };

  if (!geoJsonData) return <div>Carregando mapa...</div>;

  return (
    <MapContainer center={[-8.0476, -34.8770]} zoom={12} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON data={geoJsonData} style={style} onEachFeature={onEachFeature} />
    </MapContainer>
  );
}