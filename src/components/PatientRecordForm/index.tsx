'use client';

import { useState } from 'react';
import { api } from '@/services/api';
import { PatientDetail } from '@/types';
import styles from './PatientRecordForm.module.scss';

type FormType = 'AVALIACAO' | 'EVOLUCAO' | 'ENCAMINHAMENTO';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select';
  options?: string[];
  width?: string;
  placeholder?: string;
}

interface FormTemplate {
  id: FormType;
  title: string;
  modelId: string;
  fields: FormField[];
}

const FORM_TEMPLATES: Record<FormType, FormTemplate> = {
  AVALIACAO: {
    id: 'AVALIACAO',
    title: 'Ficha de Avaliação Inicial', //
    modelId: '1',
    fields: [
      { name: 'queixa_principal', label: 'Queixa Principal (HDA)', type: 'textarea', placeholder: 'Relato livre do motivo da consulta' }, //
      { name: 'historico_doencas', label: 'Histórico de Doenças', type: 'text', placeholder: 'Hipertensão, Diabetes...' }, //
      { name: 'dor_escala_visual', label: 'EVA (0-10)', type: 'number', width: '30%' }, //
      { name: 'prioridade_atend', label: 'Prioridade', type: 'select', options: ['Alta', 'Média', 'Baixa'], width: '70%' }, //
      { name: 'objetivos_paciente', label: 'Objetivos do Paciente', type: 'text' }, //
      { name: 'diagnostico_cinetico', label: 'Diagnóstico Cinético-Funcional', type: 'textarea' }, //
      { name: 'plano_terapeutico', label: 'Plano Terapêutico', type: 'textarea' }, //
    ]
  },
  EVOLUCAO: {
    id: 'EVOLUCAO',
    title: 'Ficha de Evolução', //
    modelId: '2',
    fields: [
      { name: 'subjetivo_relato', label: 'Relato Subjetivo', type: 'text', placeholder: 'Como o paciente diz que está hoje' }, //
      { name: 'sinais_vitais', label: 'Sinais Vitais (PA, FC, SpO2)', type: 'text', placeholder: 'Ex: 120/80 mmHg, 80bpm, 98%' }, //
      { name: 'procedimentos', label: 'Procedimentos Realizados', type: 'textarea', placeholder: 'Cinesioterapia, Eletroterapia...' }, //
      { name: 'intercorrencias', label: 'Intercorrências', type: 'textarea' }, //
      { name: 'orientacoes_casa', label: 'Orientações para Casa', type: 'textarea' }, //
      { name: 'prox_sessao_data', label: 'Próxima Sessão', type: 'date', width: '50%' }, //
      { name: 'status_evolucao', label: 'Status', type: 'select', options: ['Melhora', 'Manutenção', 'Piora'], width: '50%' } //
    ]
  },
  ENCAMINHAMENTO: {
    id: 'ENCAMINHAMENTO',
    title: 'Ficha de Encaminhamento', //
    modelId: '3',
    fields: [
      { name: 'clinica_destino', label: 'Clínica de Destino', type: 'select', options: ['Fisioterapia', 'Terapia Ocupacional', 'Fonoaudiologia', 'Odontologia'] }, //
      { name: 'nivel_urgencia', label: 'Nível de Urgência', type: 'select', options: ['Rotina', 'Urgência'] }, //
      { name: 'motivo_encam', label: 'Motivo do Encaminhamento', type: 'textarea' }, //
      { name: 'resumo_caso', label: 'Resumo do Caso', type: 'textarea' }, //
      { name: 'anexos_exames', label: 'Link para Exames/Anexos', type: 'text' } //
    ]
  }
};

interface Props {
  patient: PatientDetail;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PatientRecordForm({ patient, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'SELECT' | 'FILL'>('SELECT');
  const [selectedType, setSelectedType] = useState<FormType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSelectType = (type: FormType) => {
    setSelectedType(type);
    setFormData({});
    setStep('FILL');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    setSubmitting(true);

    const template = FORM_TEMPLATES[selectedType];

    let htmlContent = `<div style="font-family: Arial, sans-serif;">`;
    htmlContent += `<h3 style="color: #17af95;">${template.title}</h3>`;
    template.fields.forEach(field => {
       const val = formData[field.name] || '-';
       htmlContent += `<p><strong>${field.label}:</strong> ${val}</p>`;
    });
    htmlContent += `</div>`;

    const now = new Date();
    const formattedDate = now.toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).replace(',', ''); 

    const payload = {
      dataatendimento: formattedDate,
      q0: htmlContent,
      titulo: template.title,
      idProntuarioCliente: "2", 
      idModelo: template.modelId
    };

    try {
      await api.post(`/api/patients/${patient.id}/ehr/document/save`, payload);
      alert('Documento salvo com sucesso!');
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar documento.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'SELECT') {
    return (
      <div className={styles.container}>
        <h4>Selecione o documento:</h4>
        <div className={styles.grid}>
          <button type="button" className={styles.card} onClick={() => handleSelectType('AVALIACAO')}>
            <span className={styles.icon}>📋</span>
            <strong>Avaliação Inicial</strong>
            <small>Anamnese e Diagnóstico</small>
          </button>
          <button type="button" className={styles.card} onClick={() => handleSelectType('EVOLUCAO')}>
            <span className={styles.icon}>📈</span>
            <strong>Evolução</strong>
            <small>Diário de Sessão</small>
          </button>
          <button type="button" className={styles.card} onClick={() => handleSelectType('ENCAMINHAMENTO')}>
            <span className={styles.icon}>🏥</span>
            <strong>Encaminhamento</strong>
            <small>Transferência Interna</small>
          </button>
        </div>
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.btnSecondary}>Cancelar</button>
        </div>
      </div>
    );
  }

  const template = FORM_TEMPLATES[selectedType!];

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <div className={styles.header}>
        <h4>{template.title}</h4>
        <span className={styles.patientName}>{patient.name}</span>
      </div>

      <div className={styles.formGrid}>
        {template.fields.map((field) => (
          <div key={field.name} className={styles.fieldGroup} style={{ width: field.width || '100%' }}>
            <label>{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea 
                required 
                rows={3}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={e => setFormData({...formData, [field.name]: e.target.value})}
              />
            ) : field.type === 'select' ? (
              <select 
                required 
                value={formData[field.name] || ''}
                onChange={e => setFormData({...formData, [field.name]: e.target.value})}
              >
                <option value="">Selecione...</option>
                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input 
                type={field.type} 
                required
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={e => setFormData({...formData, [field.name]: e.target.value})}
              />
            )}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={() => setStep('SELECT')} className={styles.btnSecondary}>
          Voltar
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={submitting}>
          {submitting ? 'Salvando...' : 'Finalizar e Salvar'}
        </button>
      </div>
    </form>
  );
}