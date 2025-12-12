'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api'; // Sua instância configurada com token
import styles from './cadastro.module.scss';

export default function CadastroRapidoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Estado apenas para os campos essenciais visíveis
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    dateOfBirth: '', // Input type="date" retorna YYYY-MM-DD
    cellphone: '',
    email: '',
    sex: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Formata a data de YYYY-MM-DD para DD/MM/YYYY (Padrão comum em APIs BR)
    let formattedDate = '';
    if (formData.dateOfBirth) {
        const [year, month, day] = formData.dateOfBirth.split('-');
        formattedDate = `${day}/${month}/${year}`;
    }

    // Monta o payload GIGANTE exigido pela API, preenchendo os vazios
    const payload = {
        name: formData.name.toUpperCase(), // Convenção comum salvar em uppercase
        birthName: null,
        flagWhatsapp: false,
        cns: "",
        sns: "",
        address: "",
        number: "",
        rg: "",
        cpf: formData.cpf.replace(/\D/g, ''), // Remove formatação se houver
        passport: "",
        passport_valid_date: "",
        apartment: "",
        neighborhood: "",
        city: "",
        state: "",
        zip: "",
        cellphone: formData.cellphone.replace(/\D/g, ''),
        phone: "",
        email: formData.email,
        obs: "Cadastro Rápido via Dashboard",
        sex: formData.sex,
        dateOfBirth: formattedDate,
        country: "BR",
        profession: "",
        educationLevel: "",
        education: "",
        idHealthInsurance: "",
        healthProfessionalResponsible: "",
        healthInsurancePlan: "",
        healthInsurancePlanCardNumber: "",
        indicatedBy: "",
        genre: "",
        bloodType: "",
        bloodFactor: "",
        maritalStatus: "",
        religion: "",
        healthInsurancePlanCardNumberExpiry: "",
        kinships: [],
        responsibleName1: "",
        kinship: "",
        relationship: "",
        acceptDuplicate: false,
        acceptDuplicateCpf: false,
        acceptMinorPatient: false,
        cellphoneCountry: "BR"
    };

    try {
      const response = await api.post('/api/patients/create', payload);

      if (response.data && response.data.patient) {
        const { id, name } = response.data.patient;
        
        // SUCESSO: Redireciona Imediatamente para a Anamnese
        // Passando os dados do novo paciente criado
        router.push(`/anamnese?patientId=${id}&patientName=${encodeURIComponent(name)}`);
      } else {
        alert('Paciente criado, mas não houve retorno do ID.');
      }

    } catch (error: any) {
      console.error(error);
      alert('Erro ao cadastrar paciente. Verifique os dados (CPF duplicado?).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Cadastro Rápido</h2>
          <p className={styles.subtitle}>Preencha seus dados básicos e vá direto para a anamnese.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          
          {/* Nome Completo */}
          <div className={styles.fieldGroup}>
            <label>Nome Completo *</label>
            <input 
              type="text" 
              name="name" 
              required 
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: João da Silva"
            />
          </div>

          <div className={styles.row}>
            {/* CPF */}
            <div className={styles.fieldGroup}>
              <label>CPF</label>
              <input 
                type="text" 
                name="cpf" 
                value={formData.cpf}
                onChange={handleChange}
                placeholder="Apenas números"
                maxLength={14}
              />
            </div>

            {/* Data de Nascimento */}
            <div className={styles.fieldGroup}>
              <label>Data de Nascimento</label>
              <input 
                type="date" 
                name="dateOfBirth" 
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.row}>
            {/* Celular */}
            <div className={styles.fieldGroup}>
              <label>Celular</label>
              <input 
                type="text" 
                name="cellphone" 
                value={formData.cellphone}
                onChange={handleChange}
                placeholder="(81) 99999-9999"
              />
            </div>

            {/* Sexo */}
            <div className={styles.fieldGroup}>
              <label>Sexo</label>
              <select name="sex" value={formData.sex} onChange={handleChange}>
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
          </div>

          {/* Email */}
          <div className={styles.fieldGroup}>
            <label>E-mail</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email}
              onChange={handleChange}
              placeholder="paciente@email.com"
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Cadastrando...' : 'Salvar e Iniciar Anamnese ➡️'}
          </button>

          <button type="button" onClick={() => router.back()} className={styles.backBtn}>
            Cancelar
          </button>

        </form>
      </div>
    </div>
  );
}