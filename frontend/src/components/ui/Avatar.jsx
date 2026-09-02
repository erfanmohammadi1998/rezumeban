import { mediaUrl } from "../../api/client";

const COLORS = [
    "bg-blue-500/20 text-blue-300",
    "bg-green-500/20 text-green-300",
    "bg-purple-500/20 text-purple-300",
    "bg-amber-500/20 text-amber-300",
    "bg-pink-500/20 text-pink-300",
    "bg-cyan-500/20 text-cyan-300",
];

const SIZES = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
};

function initials(name = "") {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

export default function Avatar({ name = "", src, size = "md", className = "" }) {
    const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length];
    const url = mediaUrl(src);

    if (url) {
        return (
            <img
                src={url}
                alt={name}
                className={`${SIZES[size]} rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <div
            className={`${SIZES[size]} ${color} rounded-full flex items-center justify-center font-semibold shrink-0 ${className}`}
        >
            {initials(name).toUpperCase() || "?"}
        </div>
    );
}
