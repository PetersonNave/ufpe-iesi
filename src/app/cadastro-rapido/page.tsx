"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import styles from "./cadastro.module.scss";
import { saveDataAnalytics } from "../api/actions";

export default function CadastroRapidoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    nameSocial: "",
    cpf: "",
    rg: "",
    cns: "",
    dateOfBirth: "",
    sex: "",
    color: "",
    cellphone: "",
    securityContact: "",
    zip: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",

    maritalStatus: "",
    educationLevel: "",
    religion: "",
    isUfpeCommunity: "",
    ufpeType: "",
    housingStatus: "",
    familyIncome: "",
    residentsCount: "",
    transportType: "",

    referralSource: "",
    complaint: "",
    diagnosis: "",
    specialties: [] as string[],
    priority: "Normal",
    lifestyle: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData({ ...formData, specialties: options });
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let formattedDate = "";
    if (formData.dateOfBirth) {
      const [year, month, day] = formData.dateOfBirth.split("-");
      formattedDate = `${day}/${month}/${year}`;
    }

    const obsContent = `
      CADASTRO RÁPIDO - TRIAGEM
      -------------------------
      Queixa Principal: ${formData.complaint}
      Diagnóstico Prévio: ${formData.diagnosis}
      Especialidades: ${formData.specialties.join(", ")}
      Prioridade: ${formData.priority}
      
      DADOS SOCIAIS:
      Vínculo UFPE: ${formData.isUfpeCommunity} (${formData.ufpeType})
      Moradia: ${formData.housingStatus} | Renda: ${formData.familyIncome}
      Transporte: ${formData.transportType}
      Hábitos: ${formData.lifestyle}
      Contato Segurança: ${formData.securityContact}
      Origem: ${formData.referralSource}
    `.trim();

    const payload = {
      name: formData.name.toUpperCase(),
      nameSocial: formData.nameSocial,
      birthName: null,
      flagWhatsapp: false,
      cns: formData.cns,
      sns: "",
      address: formData.address,
      number: "S/N",
      rg: formData.rg,
      cpf: formData.cpf.replace(/\D/g, ""),
      passport: "",
      passport_valid_date: "",
      apartment: "",
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      cellphone: formData.cellphone.replace(/\D/g, ""),
      phone: "",
      email: "",
      obs: obsContent,
      sex: formData.sex,
      dateOfBirth: formattedDate,
      country: "BR",
      profession: "",
      educationLevel: formData.educationLevel,
      education: "",
      idHealthInsurance: "",
      healthProfessionalResponsible: "",
      healthInsurancePlan: "",
      healthInsurancePlanCardNumber: "",
      indicatedBy: formData.referralSource,
      genre: "",
      bloodType: null,
      bloodFactor: null,
      maritalStatus: formData.maritalStatus,
      religion: formData.religion,
      healthInsurancePlanCardNumberExpiry: "",
      kinships: [],
      responsibleName1: "",
      kinship: "",
      relationship: "",
      acceptDuplicate: false,
      acceptDuplicateCpf: true,
      acceptMinorPatient: true,
      cellphoneCountry: "BR",
    };

    try {
      const response = await api.post("/api/patients/create", payload);

      if (response.data && response.data.patient) {
        const { id, name } = response.data.patient;

        const analyticsPayload = {
          cpf: formData.cpf.replace(/\D/g, ""),
          name: formData.name,

          demographics: {
            birthDate: formData.dateOfBirth,
            ageAtRegistration: calculateAge(formData.dateOfBirth),
            gender: formData.sex,
            raceColor: formData.color,
            city: formData.city,
            neighborhood: formData.neighborhood,
          },

          socioeconomic: {
            educationLevel: formData.educationLevel,
            maritalStatus: formData.maritalStatus,
            familyIncome: formData.familyIncome,
            housingStatus: formData.housingStatus,
            residentsCount: Number(formData.residentsCount) || 0,
            transportType: formData.transportType,
            isUfpeCommunity: formData.isUfpeCommunity,
            ufpeLinkType: formData.ufpeType,
          },

          triage: {
            referralSource: formData.referralSource,
            priority: formData.priority,
            specialties: formData.specialties,
            complaint: formData.complaint,
            lifestyle: formData.lifestyle,
          },

          system: {
            legacyPatientId: id,
            status: "TRIAGE_COMPLETED",
          },
        };

        console.log("Salvando analytics...");
        await saveDataAnalytics(analyticsPayload);

        router.push(
          `/anamnese?patientId=${id}&patientName=${encodeURIComponent(name)}`
        );
      } else {
        alert("Paciente criado, mas ID não retornado.");
      }
    } catch (error: any) {
      console.error(error);
      alert("Erro ao cadastrar. Verifique CPF ou campos obrigatórios.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className={styles.stepContainer}>
      <h4>1. Identificação e Contato</h4>

      <div className={styles.fieldGroup}>
        <label>Nome Completo *</label>
        <input
          type="text"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label>Nome Social</label>
        <input
          type="text"
          name="nameSocial"
          value={formData.nameSocial}
          onChange={handleChange}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>CPF *</label>
          <input
            type="text"
            name="cpf"
            maxLength={14}
            required
            value={formData.cpf}
            onChange={handleChange}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>RG</label>
          <input
            type="text"
            name="rg"
            value={formData.rg}
            onChange={handleChange}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>CNS (Sus)</label>
          <input
            type="text"
            name="cns"
            value={formData.cns}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>Data de Nascimento *</label>
          <input
            type="date"
            name="dateOfBirth"
            required
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
          {formData.dateOfBirth && (
            <small className={styles.hint}>
              Idade: {calculateAge(formData.dateOfBirth)} anos
            </small>
          )}
        </div>
        <div className={styles.fieldGroup}>
          <label>Sexo</label>
          <select name="sex" value={formData.sex} onChange={handleChange}>
            <option value="">Selecione...</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label>Raça/Cor</label>
          <select name="color" value={formData.color} onChange={handleChange}>
            <option value="">Selecione...</option>
            <option value="Branca">Branca</option>
            <option value="Preta">Preta</option>
            <option value="Parda">Parda</option>
            <option value="Amarela">Amarela</option>
            <option value="Indigena">Indígena</option>
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>Celular *</label>
          <input
            type="text"
            name="cellphone"
            required
            value={formData.cellphone}
            onChange={handleChange}
            placeholder="(81) 9..."
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>Contato de Segurança</label>
          <input
            type="text"
            name="securityContact"
            value={formData.securityContact}
            onChange={handleChange}
            placeholder="Nome e Tel"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>Bairro</label>
          <input
            type="text"
            name="neighborhood"
            value={formData.neighborhood}
            onChange={handleChange}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>Cidade/UF</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.stepContainer}>
      <h4>2. Dados Sociais e Vínculo</h4>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>Estado Civil</label>
          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
          >
            <option value="">Selecione...</option>
            <option value="Solteiro">Solteiro</option>
            <option value="Casado">Casado</option>
            <option value="Divorciado">Divorciado</option>
            <option value="Viuvo">Viúvo</option>
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label>Escolaridade</label>
          <select
            name="educationLevel"
            value={formData.educationLevel}
            onChange={handleChange}
          >
            <option value="">Selecione...</option>
            <option value="Fundamental">Fundamental</option>
            <option value="Médio">Médio</option>
            <option value="Superior">Superior</option>
          </select>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label>Possui vínculo com UFPE? (Comunidade Universitária)</label>
        <select
          name="isUfpeCommunity"
          value={formData.isUfpeCommunity}
          onChange={handleChange}
        >
          <option value="">Não</option>
          <option value="Sim">Sim</option>
        </select>
      </div>

      {formData.isUfpeCommunity === "Sim" && (
        <div className={styles.fieldGroup}>
          <label>Tipo de Vínculo</label>
          <select
            name="ufpeType"
            value={formData.ufpeType}
            onChange={handleChange}
          >
            <option value="">Selecione...</option>
            <option value="Aluno">Aluno</option>
            <option value="Servidor Docente">Servidor Docente</option>
            <option value="Servidor Tecnico">Servidor Técnico</option>
          </select>
        </div>
      )}

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>Situação de Moradia</label>
          <select
            name="housingStatus"
            value={formData.housingStatus}
            onChange={handleChange}
          >
            <option value="">Selecione...</option>
            <option value="Propria">Própria</option>
            <option value="Alugada">Alugada</option>
            <option value="Residencia Universitaria">
              Residência Universitária
            </option>
            <option value="Outra">Outra</option>
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label>Transporte Principal</label>
          <select
            name="transportType"
            value={formData.transportType}
            onChange={handleChange}
          >
            <option value="">Selecione...</option>
            <option value="Publico">Transporte Público</option>
            <option value="Aplicativo">Aplicativos</option>
            <option value="Proprio">Próprio</option>
            <option value="Prefeitura">Prefeitura</option>
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>Renda Familiar Aprox.</label>
          <input
            type="text"
            name="familyIncome"
            value={formData.familyIncome}
            onChange={handleChange}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>Nº Moradores</label>
          <input
            type="number"
            name="residentsCount"
            value={formData.residentsCount}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={styles.stepContainer}>
      <h4>3. Triagem e Acolhimento</h4>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>Origem/Encaminhamento</label>
          <select
            name="referralSource"
            value={formData.referralSource}
            onChange={handleChange}
          >
            <option value="">Selecione...</option>
            <option value="Livre Demanda">Livre Demanda</option>
            <option value="Rede Publica">Rede Pública</option>
            <option value="Rede Privada">Rede Privada</option>
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label>Prioridade de Atendimento</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            style={{
              borderColor: formData.priority === "Alta" ? "red" : "#ccc",
            }}
          >
            <option value="Normal">Normal</option>
            <option value="Alta">Alta (Urgência)</option>
          </select>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label>Especialidades (Segure Ctrl para selecionar várias)</label>
        <select
          multiple
          name="specialties"
          value={formData.specialties}
          onChange={handleMultiSelect}
          style={{ height: "80px" }}
        >
          <option value="Neurofuncional">Neurofuncional</option>
          <option value="Ortopedia">Ortopedia</option>
          <option value="Pediatria">Pediatria</option>
          <option value="Respiratoria">Respiratória</option>
          <option value="Geriatria">Geriatria</option>
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label>Queixa Principal / Motivo</label>
        <textarea
          name="complaint"
          rows={3}
          value={formData.complaint}
          onChange={handleChange}
          placeholder="Relato das necessidades..."
        />
      </div>

      <div className={styles.fieldGroup}>
        <label>Hábitos de Vida</label>
        <textarea
          name="lifestyle"
          rows={2}
          value={formData.lifestyle}
          onChange={handleChange}
          placeholder="Álcool, fumo, atividade física..."
        />
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Cadastro de Primeiro Contato</h2>
          <div className={styles.progressBar}>
            <div
              className={`${styles.stepIndicator} ${
                step >= 1 ? styles.active : ""
              }`}
            >
              1
            </div>
            <div className={styles.line}></div>
            <div
              className={`${styles.stepIndicator} ${
                step >= 2 ? styles.active : ""
              }`}
            >
              2
            </div>
            <div className={styles.line}></div>
            <div
              className={`${styles.stepIndicator} ${
                step >= 3 ? styles.active : ""
              }`}
            >
              3
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <div className={styles.footerActions}>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className={styles.backBtn}
              >
                Voltar
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setStep(step + 1);
                }}
                className={styles.nextBtn}
              >
                Próximo ➡️
              </button>
            ) : (
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? "Cadastrando..." : "Finalizar Cadastro"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
