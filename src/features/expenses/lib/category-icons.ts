import {
  Bus,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  Film,
  Activity,
  Fuel as FuelIcon,
  HelpCircle,
  ForkKnife,
  Coffee,
  Truck,
  Briefcase,
  Video,
  FileText,
  Home,
  Camera,
  Wallet,
  User,
  Clock,
  Hexagon,
  Plus,
  type LucideIcon,
} from 'lucide-react'

// Category.icon is a plain string on the backend — the 9 system
// categories use these exact lowercase names (see
// apps/expenses/management/commands/seed_categories.py's DEFAULT_CATEGORIES);
// custom categories use whichever of ADD_CATEGORY_ICON_OPTIONS name the
// user picked in AddCategoryFlow, also lowercased at creation time.
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  grocery: ShoppingCart,
  transport: Bus,
  food: ForkKnife,
  shopping: ShoppingBag,
  bills: Receipt,
  health: Activity,
  entertainment: Film,
  fuel: FuelIcon,
  other: HelpCircle,
  // Custom-category icon choices from AddCategoryFlow
  coffee: Coffee,
  truck: Truck,
  shoppingbag: ShoppingBag,
  shoppingcart: ShoppingCart,
  briefcase: Briefcase,
  activity: Activity,
  video: Video,
  filetext: FileText,
  home: Home,
  camera: Camera,
  wallet: Wallet,
  user: User,
  clock: Clock,
  hexagon: Hexagon,
  plus: Plus,
}

export function iconForCategory(icon: string): LucideIcon {
  return CATEGORY_ICON_MAP[icon.toLowerCase()] ?? HelpCircle
}

// The exact icon choices AddCategoryFlow's picker grid offers — keys here
// are what actually gets sent as Category.icon on create.
export const ADD_CATEGORY_ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: 'coffee', icon: Coffee },
  { name: 'truck', icon: Truck },
  { name: 'shoppingbag', icon: ShoppingBag },
  { name: 'shoppingcart', icon: ShoppingCart },
  { name: 'briefcase', icon: Briefcase },
  { name: 'activity', icon: Activity },
  { name: 'video', icon: Video },
  { name: 'filetext', icon: FileText },
  { name: 'home', icon: Home },
  { name: 'camera', icon: Camera },
  { name: 'wallet', icon: Wallet },
  { name: 'user', icon: User },
  { name: 'clock', icon: Clock },
  { name: 'hexagon', icon: Hexagon },
  { name: 'plus', icon: Plus },
]
