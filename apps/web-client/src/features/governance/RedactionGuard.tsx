import { Lock } from 'lucide-react';


// Mock simple role context
const USER_ROLE = 'analyst'; // 'admin' | 'analyst' | 'public'

interface RedactionGuardProps {
    minRole: 'admin' | 'analyst' | 'public';
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function RedactionGuard({ minRole, children, fallback }: RedactionGuardProps) {
    const roleLevels = { 'public': 0, 'analyst': 1, 'admin': 2 };
    const userLevel = roleLevels[USER_ROLE as keyof typeof roleLevels];
    const reqLevel = roleLevels[minRole];

    if (userLevel < reqLevel) {
        return fallback ? <>{fallback}</> : (
            <div className="flex items-center gap-2 text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded select-none cursor-not-allowed">
                <Lock size={14} />
                <span className="text-xs font-mono">REDACTED</span>
            </div>
        );
    }

    return <>{children}</>;
}
