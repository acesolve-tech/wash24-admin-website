export type SidebarItemBase = {
  title: string;
  icon?: React.ReactNode;
  path: string;
  role?: string[];
  location?: string;
};

export type SidebarItemWithSub = SidebarItemBase & {
  subItems: SidebarItemBase[];
};

export type SidebarItem = SidebarItemBase | SidebarItemWithSub;
