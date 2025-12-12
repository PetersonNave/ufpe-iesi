'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/services/api';
import { Patient, PatientDetail, PatientResponse } from '@/types';
import styles from './dashboard.module.scss';
import PatientRecordForm from '@/components/PatientRecordForm';

export default function DashboardPage() {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<'INFO' | 'RECORD'>('INFO');
  // --- Estados de Dados ---
  const [serverPatients, setServerPatients] = useState<Patient[]>([]); // Dados da paginação do servidor
  const [allPatientsCache, setAllPatientsCache] = useState<Patient[]>([]); // Cache de TODOS os pacientes
  const [userName, setUserName] = useState('');

  // --- Estados de Controle da API (Server Side) ---
  const [loadingServer, setLoadingServer] = useState(true);
  const [serverPage, setServerPage] = useState(1);
  const [serverLastPage, setServerLastPage] = useState(1);

  // --- Estados de Busca e "Deep Fetch" ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false); // Define se estamos no modo de busca
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(''); // Ex: "Carregando 5/17..."

  // --- Estados da Paginação Local (Client Side - Busca) ---
  const [clientPage, setClientPage] = useState(1);
  const itemsPerPage = 25;

  // --- Estados do Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);

  // Inicialização
  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    const storedName = localStorage.getItem('user_name');
    if (storedName) setUserName(storedName);

    fetchServerPage(1);
  }, [router]);

  // ---------------------------------------------------------
  // 1. Lógica Padrão (Paginação via API)
  // ---------------------------------------------------------
  const fetchServerPage = async (pageNumber: number) => {
    setLoadingServer(true);
    
    // Atualiza isSearching apenas visualmente se tiver termo
    if (searchTerm) setIsSearching(true);
    else setIsSearching(false);

    try {
      const response = await api.get<PatientResponse>(`/api/patients`, {
        params: {
          page: pageNumber,
          search: searchTerm // Aqui está a mágica da query string
        }
      });
      
      // Atualiza os estados do servidor (Server Side)
      setServerPatients(response.data.data);
      setServerPage(response.data.current_page);
      setServerLastPage(response.data.last_page);
      
    } catch (error) {
      console.error('Erro ao buscar lista', error);
      setServerPatients([]);
    } finally {
      setLoadingServer(false);
    }
  };
const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Reseta para página 1 sempre que buscar
    fetchServerPage(1);
  };
  
  // ---------------------------------------------------------
  // 2. Lógica de Busca (Deep Fetch + Filtro Local)
  // ---------------------------------------------------------
  
  // Computa os pacientes filtrados e paginados localmente
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return [];
    
    // Filtro case-insensitive
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = allPatientsCache.filter(p => 
      p.name.toLowerCase().includes(lowerTerm)
    );
    return filtered;
  }, [allPatientsCache, searchTerm]);


  // Total de páginas locais
  const clientLastPage = Math.ceil(filteredPatients.length / itemsPerPage) || 1;

  
const handleClearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    // Timeout para garantir que o estado limpou antes do fetch
    setTimeout(() => {
        // Gambiarra técnica: chamamos a api diretamente ou forçamos o fetch ler vazio
        // O jeito mais limpo sem mudar a assinatura é forçar um reload manual aqui
        setLoadingServer(true);
        api.get<PatientResponse>(`/api/patients`, { params: { page: 1, search: '' } })
           .then(res => {
               setServerPatients(res.data.data);
               setServerPage(res.data.current_page);
               setServerLastPage(res.data.last_page);
           })
           .finally(() => setLoadingServer(false));
    }, 0);
  };
  // ---------------------------------------------------------
  // 3. Modal e Detalhes
  // ---------------------------------------------------------
  const handleSelectPatient = async (id: number) => {
    setIsModalOpen(true);
    setModalMode('INFO'); // Reseta para INFO
    setLoadingDetails(true);
    setSelectedPatient(null);
    try {
      const response = await api.get<PatientDetail>(`/api/patients/${id}`);
      setSelectedPatient(response.data);
    } catch (error) {
      console.error(error);
      setIsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleFillForm = () => alert('Ação: Preencher Ficha');
const handleRequestFill = () => {
  if (!selectedPatient) return;

  // Monta o link apontando para a nova rota, passando ID e Nome como parâmetros
  const link = `${window.location.origin}/anamnese?patientId=${selectedPatient.id}&patientName=${encodeURIComponent(selectedPatient.name)}`;

  // Copia para a área de transferência
  navigator.clipboard.writeText(link)
    .then(() => alert(`Link de Anamnese Remota gerado e copiado!\n\nEnvie este link para o paciente:\n${link}`))
    .catch(() => alert(`Copie este link manualmente:\n${link}`));
};
  const getFullAddress = (p: PatientDetail) => {
    const parts = [p.address, p.number, p.neighborhood, p.city, p.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Endereço não cadastrado';
  };

  // ---------------------------------------------------------
  // Renderização
  // ---------------------------------------------------------
  
  // Decide qual lista mostrar: Busca (Local) ou Servidor
  const currentPage = isSearching ? clientPage : serverPage;
  const lastPage = isSearching ? clientLastPage : serverLastPage;

const handlePageChange = (newPage: number) => {
    fetchServerPage(newPage);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.brand}>NUTES Fisioterapia</h1>
          <span className={styles.welcome}>Olá, {userName}</span>
        </div>
        <button onClick={() => { Cookies.remove('auth_token'); router.push('/login'); }} className={styles.logoutBtn}>
          Sair
        </button>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.titleSection}>
          <h2 className={styles.pageTitle}>Pacientes</h2>
          
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <input 
              type="text" 
              placeholder="Buscar por nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              disabled={loadingSearch}
            />
           <button type="submit" className={styles.searchBtn} disabled={loadingServer}>
              Buscar
            </button>
            {searchTerm && (
              <button type="button" onClick={handleClearSearch} className={styles.clearBtn}>
                Limpar
              </button>
            )}
          </form>
        </div>

       

        <div className={styles.tableContainer}>
          {loadingServer ? (
            <div className={styles.loaderContainer}>Carregando...</div>
          ) :(
            <>
              {isSearching && <div className={styles.resultsInfo}>Resultados para: <strong>{searchTerm}</strong></div>}

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Convênio</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                 {serverPatients.length > 0 ? (
                    serverPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td><strong>{patient.name}</strong></td>
                        <td>{patient.cpf || '-'}</td>
                        <td>{patient.healthInsurance?.name || 'Particular'}</td>
                        <td>
                          <span className={patient.status.status === 'Ativo' ? styles.statusActive : styles.statusInactive}>
                            {patient.status.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleSelectPatient(patient.id)}
                            className={styles.detailsBtn}
                          >
                            Selecionar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>
                        Nenhum paciente encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className={styles.pagination}>
                <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                  Anterior
                </button>
                <span>{currentPage} / {lastPage}</span>
                <button disabled={currentPage === lastPage} onClick={() => handlePageChange(currentPage + 1)}>
                  Próxima
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* --- MODAL (Mesmo código anterior) --- */}
      {isModalOpen && selectedPatient && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{loadingDetails ? 'Carregando...' : selectedPatient.name}</h3>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
                {loadingDetails ? <div className={styles.spinner}>Carregando...</div> : (
                   <>
                        {modalMode === 'INFO' && (  
                            <>
                     <div className={styles.detailSection}>
                        <h4>Dados Pessoais</h4>
                        <div className={styles.infoGrid}>
                            <p><strong>ID:</strong> {selectedPatient.id}</p>
                            <p><strong>CPF:</strong> {selectedPatient.cpf || '-'}</p>
                            <p><strong>Nascimento:</strong> {selectedPatient.dateOfBirth || '-'}</p>
                            <p><strong>Profissão:</strong> {selectedPatient.profession || '-'}</p>
                        </div>
                     </div>
                     <div className={styles.detailSection}>
                        <h4>Contato</h4>
                        <div className={styles.infoGrid}>
                            <p><strong>Celular:</strong> {selectedPatient.cellphone || '-'}</p>
                            <p><strong>Email:</strong> {selectedPatient.email || '-'}</p>
                            <p className={styles.fullRow}><strong>Endereço:</strong> {getFullAddress(selectedPatient)}</p>
                        </div>
                     </div>
                     <div className={styles.actionButtons}>
                        <button onClick={() => setModalMode('RECORD')}className={styles.btnPrimary}>Preencher Ficha</button>
                        <button onClick={handleRequestFill} className={styles.btnSecondary}>Solicitar Preenchimento</button>
                     </div>
                     </>)}
{modalMode === 'RECORD' && (
                    <PatientRecordForm 
                      patient={selectedPatient}
                      onClose={() => setModalMode('INFO')} // Voltar para info
                      onSuccess={() => setIsModalOpen(false)} // Fechar tudo
                    />
                  )}
                   </>
                )}
                

              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}