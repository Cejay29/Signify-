import {
    Trophy,
    Flame,
    Sun,
    Flag,
    Bolt,
    Star,
} from "lucide-react";

const iconMap = {
    trophy: Trophy,
    flame: Flame,
    sun: Sun,
    flag: Flag,
    bolt: Bolt,
    star: Star,
};

export default function AchievementIcon({ icon = "trophy", size = 28 }) {
    const Icon = iconMap[icon] || Trophy;
    return <Icon size={size} className="text-yellow-400" />;
}
