export enum Gender {
  LAKI_LAKI = 'LAKI_LAKI',
  PEREMPUAN = 'PEREMPUAN',
}

export enum Religion {
  ISLAM = 'ISLAM',
  KRISTEN = 'KRISTEN',
  KATOLIK = 'KATOLIK',
  HINDU = 'HINDU',
  BUDDHA = 'BUDDHA',
  KONGHUCU = 'KONGHUCU',
  LAINNYA = 'LAINNYA',
}

export enum MaritalStatus {
  BELUM_KAWIN = 'BELUM_KAWIN',
  KAWIN = 'KAWIN',
  CERAI_HIDUP = 'CERAI_HIDUP',
  CERAI_MATI = 'CERAI_MATI',
}

export enum Education {
  TIDAK_SEKOLAH = 'TIDAK_SEKOLAH',
  SD = 'SD',
  SMP = 'SMP',
  SMA = 'SMA',
  D1 = 'D1',
  D2 = 'D2',
  D3 = 'D3',
  S1 = 'S1',
  S2 = 'S2',
  S3 = 'S3',
}

export enum DomicileStatus {
  TETAP = 'TETAP',
  KONTRAK = 'KONTRAK',
  KOST = 'KOST',
  LAINNYA = 'LAINNYA',
}

export enum VaccinationStatus {
  BELUM = 'BELUM',
  DOSIS_1 = 'DOSIS_1',
  DOSIS_2 = 'DOSIS_2',
  BOOSTER_1 = 'BOOSTER_1',
  BOOSTER_2 = 'BOOSTER_2',
}

export enum FamilyRole {
  KEPALA_KELUARGA = 'KEPALA_KELUARGA',
  ISTRI = 'ISTRI',
  ANAK = 'ANAK',
  LAINNYA = 'LAINNYA',
}

export interface Family {
  id: number;
  noKK: string;
  address: string;
  rtNumber: string;
  rwNumber: string;
  createdAt: string;
  updatedAt: string;
  members?: Resident[];
}

export interface Resident {
  id: number;
  nik: string;
  noKK: string;
  fullName: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string;
  address: string;
  rtNumber: string;
  rwNumber: string;
  religion: Religion;
  maritalStatus: MaritalStatus;
  occupation?: string;
  education?: Education;
  bpjsNumber?: string;
  phoneNumber?: string;
  email?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  domicileStatus: DomicileStatus;
  vaccinationStatus?: VaccinationStatus;
  createdAt: string;
  updatedAt: string;
  userId: number;
  familyId?: number;
  familyRole?: FamilyRole;
  family?: Family;
}

export interface ResidentFilter {
  search?: string;
  rtNumber?: string;
  rwNumber?: string;
  gender?: Gender;
  isVerified?: boolean;
  familyId?: number;
  domicileStatus?: DomicileStatus;
}

export interface ResidentPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ResidentFormData {
  nik: string;
  noKK: string;
  fullName: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string;
  address: string;
  rtNumber: string;
  rwNumber: string;
  religion: Religion;
  maritalStatus: MaritalStatus;
  occupation?: string;
  education?: Education;
  bpjsNumber?: string;
  phoneNumber?: string;
  email?: string;
  domicileStatus: DomicileStatus;
  vaccinationStatus?: VaccinationStatus;
  familyRole?: FamilyRole;
}

// Translated options for UI display
export const genderOptions = [
  { value: Gender.LAKI_LAKI, label: 'Laki-laki' },
  { value: Gender.PEREMPUAN, label: 'Perempuan' },
];

export const religionOptions = [
  { value: Religion.ISLAM, label: 'Islam' },
  { value: Religion.KRISTEN, label: 'Kristen' },
  { value: Religion.KATOLIK, label: 'Katolik' },
  { value: Religion.HINDU, label: 'Hindu' },
  { value: Religion.BUDDHA, label: 'Buddha' },
  { value: Religion.KONGHUCU, label: 'Konghucu' },
  { value: Religion.LAINNYA, label: 'Lainnya' },
];

export const maritalStatusOptions = [
  { value: MaritalStatus.BELUM_KAWIN, label: 'Belum Kawin' },
  { value: MaritalStatus.KAWIN, label: 'Kawin' },
  { value: MaritalStatus.CERAI_HIDUP, label: 'Cerai Hidup' },
  { value: MaritalStatus.CERAI_MATI, label: 'Cerai Mati' },
];

export const educationOptions = [
  { value: Education.TIDAK_SEKOLAH, label: 'Tidak Sekolah' },
  { value: Education.SD, label: 'SD' },
  { value: Education.SMP, label: 'SMP' },
  { value: Education.SMA, label: 'SMA' },
  { value: Education.D1, label: 'D1' },
  { value: Education.D2, label: 'D2' },
  { value: Education.D3, label: 'D3' },
  { value: Education.S1, label: 'S1' },
  { value: Education.S2, label: 'S2' },
  { value: Education.S3, label: 'S3' },
];

export const domicileStatusOptions = [
  { value: DomicileStatus.TETAP, label: 'Tetap' },
  { value: DomicileStatus.KONTRAK, label: 'Kontrak' },
  { value: DomicileStatus.KOST, label: 'Kost' },
  { value: DomicileStatus.LAINNYA, label: 'Lainnya' },
];

export const vaccinationStatusOptions = [
  { value: VaccinationStatus.BELUM, label: 'Belum' },
  { value: VaccinationStatus.DOSIS_1, label: 'Dosis 1' },
  { value: VaccinationStatus.DOSIS_2, label: 'Dosis 2' },
  { value: VaccinationStatus.BOOSTER_1, label: 'Booster 1' },
  { value: VaccinationStatus.BOOSTER_2, label: 'Booster 2' },
];

export const familyRoleOptions = [
  { value: FamilyRole.KEPALA_KELUARGA, label: 'Kepala Keluarga' },
  { value: FamilyRole.ISTRI, label: 'Istri' },
  { value: FamilyRole.ANAK, label: 'Anak' },
  { value: FamilyRole.LAINNYA, label: 'Lainnya' },
]; 