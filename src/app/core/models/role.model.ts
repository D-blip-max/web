export interface Permission {
  id: string;
  code: string;
  module: string;
  method: string;
  path: string;
  description?: string;
  created_at: string;
}

export interface GroupedPermissions {
  module: string;
  permissions: Permission[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
}

export interface RoleCreate {
  name: string;
  description?: string;
  permission_ids?: string[];
}

export interface RoleUpdate {
  name?: string;
  description?: string;
}

export interface RolePermissionAssign {
  permission_ids: string[];
}
