import { TrendingUp } from "lucide-react";

interface PositionsHeaderProps {
    userName?: string;
    userEmail?: string;
}

export function PositionsHeader({ userName, userEmail }: PositionsHeaderProps) {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Positions & Trading
            </h1>
            <p className="text-slate-600 text-base mt-1">
                {userName ? (
                    <>
                        Managing positions for <span className="font-semibold text-emerald-700">{userName}</span> ({userEmail})
                    </>
                ) : (
                    "Monitor live positions, track P&L, and manage trading activity"
                )}
            </p>
        </div>
    );
}
