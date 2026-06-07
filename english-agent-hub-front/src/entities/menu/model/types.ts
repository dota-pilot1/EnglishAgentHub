export type MenuRecord = {
  id: number;
  code: string;
  parentId: number | null;
  label: string;
  labelKey: string | null;
  path: string | null;
  icon: string | null;
  isExternal: boolean;
  requiredRole: string | null;
  requiredPermission: string | null;
  visible: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MenuItem = MenuRecord & {
  children: MenuItem[];
};
