type ActionKey = "create" | "read" | "update" | "delete";
export type Actions = Partial<Record<ActionKey, boolean>>;

export type PermissionMap = { role?: string } & Record<string, boolean | Actions | undefined>;

export const hasModule = (permissions: PermissionMap | null | undefined, module: string) =>
    permissions?.[module] === true;
  
export const hasAction = (
  permissions: PermissionMap | null | undefined,
  module: string,
  action: ActionKey
) => {
  if (!permissions) return false;
  if (permissions.role === "SuperAdmin") return true;

  const normalize = {
    managePlatformUsers: "platformUserActions",
    manageProducts: "productsActions",
    manageInquiry: "inquiryActions"
  } as Record<string, string>;

  const actionsKey = normalize[module];

  if (actionsKey) {
    if (permissions[module] && !permissions[actionsKey]) {
      return true; 
    }
    return (
      permissions[module] &&
      (permissions[actionsKey] as Actions)?.[action] === true
    );
  }

  const base = module.replace("manage", "");
  const actionKey = `${base.charAt(0).toLowerCase()}${base.slice(1)}Actions`;

  return permissions[module] && (permissions[actionKey] as Actions)?.[action];
};

