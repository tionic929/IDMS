export interface ApplicantCard {
  id: number;
  idNumber: string;
  fullName: string;
  course: string;
  guardian_name: string;
  guardian_contact: string;
  address: string;
  photo: string | null;
  signature: string | null;
}
export interface ElementPos {
  x: number;
  y: number;
}

export interface CardLayout {
  photo: ElementPos;
  fullName: ElementPos;
  idNumber: ElementPos;
  course: ElementPos;
}

export interface CardLayoutConfig {
  photo: { x: number; y: number; width: number; height: number };
  fullName: { x: number; y: number };
  idNumber: { x: number; y: number };
  course: { x: number; y: number };
  signature: { x: number; y: number };
}

export type DepartmentCode = 'BSGE' | 'BSN' | 'BSBA' | 'BSCRIM' | 'BSIT';

export interface LayoutConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
}

export interface FullLayout {
  front: {
    photo: LayoutConfig;
    fullName: LayoutConfig;
    idNumber: LayoutConfig;
    course: LayoutConfig;
  };
  back: {
    signature: LayoutConfig;
    address: LayoutConfig;
    guardian_name: LayoutConfig;
    guardian_contact: LayoutConfig;
  };
}