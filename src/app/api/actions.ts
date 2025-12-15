"use server";

import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import PatientAnalyticsSchema from "@/models/PatientAnalytics";
import PatientAnamnesis from "@/models/PatientAnamnesis";

export async function saveDataAnalytics(dados: any) {
  try {
    await dbConnect();

    const novoRegistro: any = await PatientAnalyticsSchema.create(dados);

    return { success: true, id: novoRegistro._id.toString() };
  } catch (error: any) {
    console.error("Erro ao salvar:", error);
    return { success: false, error: error.message };
  }
}

export async function saveAnamnesis(data: any) {
  try {
    await dbConnect();

    const newRecord: any = await PatientAnamnesis.create(data);

    return { success: true, id: newRecord._id.toString() };
  } catch (error: any) {
    console.error("Erro ao salvar anamnese no Mongo:", error);
    return { success: false, error: error.message };
  }
}
