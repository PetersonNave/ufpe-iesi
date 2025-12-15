'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import styles from './anamnese.module.scss';
import { saveAnamnesis } from '../api/actions';

// Componente interno para usar o useSearchParams com Suspense
function AnamneseForm() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  const patientName = searchParams.get('patientName');

  const [formData, setFormData] = useState({
    queixa: '',
    historico: '',
    medicamentos: '',
    dor: '0',
    objetivos: ''
  });

  const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    setStatus('SENDING');

    // 1. Gera o HTML (q0) conforme padrão
    let htmlContent = `<div style="font-family: Arial, sans-serif;">`;
    htmlContent += `<h3 style="color: #17af95;">Anamnese Remota (Preenchimento pelo Paciente)</h3>`;
    htmlContent += `<p><strong>Queixa Principal:</strong> ${formData.queixa}</p>`;
    htmlContent += `<p><strong>Histórico de Doenças/Cirurgias:</strong> ${formData.historico}</p>`;
    htmlContent += `<p><strong>Medicamentos em uso:</strong> ${formData.medicamentos}</p>`;
    htmlContent += `<p><strong>Nível de Dor (0-10):</strong> ${formData.dor}</p>`;
    htmlContent += `<p><strong>Objetivos com o tratamento:</strong> ${formData.objetivos}</p>`;
    htmlContent += `</div>`;

    // 2. Formata Data
    const now = new Date();
    const formattedDate = now.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).replace(',', '');

    // 3. Payload (Reutilizando idModelo: 1 da Avaliação Inicial do NUTES )
    const payload = {
      dataatendimento: formattedDate,
      q0: htmlContent,
      titulo: "Anamnese Remota",
      idProntuarioCliente: "2",
      idModelo: "1" 
    };

    try {
      // Usa a mesma rota solicitada
      await api.post(`/api/patients/${patientId}/ehr/document/save`, payload);


      const mongoPayload = {
        patientId: patientId,
        patientName: patientName || 'Desconhecido',
        complaint: formData.queixa,
        history: formData.historico,
        medications: formData.medicamentos,
        painLevel: Number(formData.dor), 
        goals: formData.objetivos
      };

      saveAnamnesis(mongoPayload);
      
      setStatus('SUCCESS');
    } catch (error) {
      console.error(error);
      setStatus('ERROR');
    }
  };

  if (!patientId) {
    return <div className={styles.container}><p>Link inválido. Identificação do paciente não encontrada.</p></div>;
  }

  if (status === 'SUCCESS') {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <h2 style={{ color: 'var(--colorPrimary)' }}>✅ Recebido!</h2>
          <p>Sua ficha foi enviada com sucesso para a clínica.</p>
          <p>Você já pode fechar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Ficha de Anamnese</h1>
          <p>Olá, <strong>{patientName || 'Paciente'}</strong>. Por favor, preencha as informações abaixo para adiantar seu atendimento.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.fieldGroup}>
            <label>Qual sua queixa principal? (O que sente?)</label>
            <textarea 
              name="queixa" 
              rows={3} 
              required 
              placeholder="Ex: Dor na lombar ao agachar..." 
              value={formData.queixa}
              onChange={handleChange}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>Histórico de Saúde (Doenças crônicas, cirurgias passadas)</label>
            <textarea 
              name="historico" 
              rows={3} 
              placeholder="Ex: Hipertensão, Diabetes, Cirurgia no joelho em 2020..." 
              value={formData.historico}
              onChange={handleChange}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>Usa algum medicamento contínuo?</label>
            <input 
              type="text" 
              name="medicamentos" 
              placeholder="Se sim, quais?" 
              value={formData.medicamentos}
              onChange={handleChange}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>Nível de dor hoje (0 = Sem dor, 10 = Pior dor possível)</label>
            <div className={styles.rangeWrapper}>
              <input 
                type="range" 
                name="dor" 
                min="0" 
                max="10" 
                value={formData.dor}
                onChange={handleChange}
                className={styles.rangeInput}
              />
              <span className={styles.rangeValue}>{formData.dor}</span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label>Qual seu objetivo principal com a fisioterapia?</label>
            <textarea 
              name="objetivos" 
              rows={2} 
              placeholder="Ex: Voltar a jogar bola, conseguir subir escadas sem dor..." 
              value={formData.objetivos}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={status === 'SENDING'}>
            {status === 'SENDING' ? 'Enviando...' : 'Enviar Ficha'}
          </button>
          
          {status === 'ERROR' && (
            <p className={styles.errorMsg}>Erro ao enviar. Tente novamente.</p>
          )}

        </form>
      </div>
    </div>
  );
}

// Página principal que envolve o conteúdo em Suspense
export default function AnamnesePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AnamneseForm />
    </Suspense>
  );
}