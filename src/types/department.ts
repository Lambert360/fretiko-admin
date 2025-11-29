export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  staffCount?: number;
}

export interface Permission {
  code: string;
  name: string;
  category: string;
  description: string;
}
