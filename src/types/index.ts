
export interface HealthInsurance {
  id: number;
  name: string;
  imgLogo: string;
}

export interface Patient {
  id: number;
  name: string;
  cpf: string | null;
  dateOfBirth: string | null;
  agePatient: string;
  healthInsurance: HealthInsurance | null;
  status: {
    id: number;
    status: string;
  };
}

export interface PatientDetail extends Patient {
  email: string | null;
  cellphone: string | null;
  phone: string | null;
  address: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  profession: string | null;
  education: string | null;
  indicatedBy: string | null;
  obs: string | null;
  registeredByUser: {
    id: number;
    name: string;
  } | null;
}

export interface PatientResponse {
  current_page: number;
  last_page: number;
  data: Patient[];
  total: number;
}