import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
    value = 0,
    onChange,
    size = 18,
    readOnly = false,
}) {
    const [hover, setHover] = useState(0);
    const active = hover || value;

    return (
        <div className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    disabled={readOnly}
                    onMouseEnter={() => !readOnly && setHover(n)}
                    onMouseLeave={() => !readOnly && setHover(0)}
                    onClick={() => !readOnly && onChange?.(n === value ? 0 : n)}
                    className={readOnly ? "cursor-default" : "cursor-pointer"}
                >
                    <Star
                        size={size}
                        className={
                            n <= active
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-600"
                        }
                    />
                </button>
            ))}
        </div>
    );
}
