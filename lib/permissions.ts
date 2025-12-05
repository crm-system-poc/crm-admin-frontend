export const hasModule = (permissions: any, module: string) =>
    permissions?.[module] === true;
  
export const hasAction = (
  permissions: any,
  module: string,
  action: "create" | "read" | "update" | "delete"
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
      permissions[actionsKey]?.[action] === true
    );
  }

  const base = module.replace("manage", "");
  const actionKey = `${base.charAt(0).toLowerCase()}${base.slice(1)}Actions`;

  return permissions[module] && permissions[actionKey]?.[action];
};

