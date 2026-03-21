import { cn } from "@/lib/utils";
import {
  Key, Shield, Mail, Lock, CheckCircle, AlertTriangle,
  Clock, Phone, ShieldAlert, ShieldX,
} from "lucide-react";

const icons = {
  key: Key,
  shield: Shield,
  "shield-alert": ShieldAlert,
  "shield-x": ShieldX,
  mail: Mail,
  lock: Lock,
  check: CheckCircle,
  warning: AlertTriangle,
  clock: Clock,
  phone: Phone,
} as const;

type IconName = keyof typeof icons;

interface AuthIconProps {
  name: IconName;
  color?: "blue" | "red" | "green" | "gray";
  size?: number;
}

const colorMap = {
  blue: "text-blue-500",
  red: "text-red-500",
  green: "text-green-500",
  gray: "text-gray-400",
};

export function AuthIcon({ name, color = "blue", size = 40 }: AuthIconProps) {
  const Icon = icons[name];
  return (
    <div className="flex justify-center mb-4">
      <Icon className={cn(colorMap[color])} size={size} />
    </div>
  );
}
