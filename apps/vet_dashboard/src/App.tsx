import { useState, useEffect, useCallback } from "react";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import {
    Search, Plus, LogOut, AlertTriangle, X, PawPrint,
    Utensils, FlaskConical, BarChart2, Check,
    Trash2, Eye, EyeOff, Activity, Clock,
    QrCode, Mail, UserCheck, UserX, Link2,
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import type { Pet as DbPet, WeightLog, FecesLog } from "@/types/supabase";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS UI (mapeados a partir do banco)
// ─────────────────────────────────────────────────────────────────────────────
type Status = "Ativo" | "Pendente" | "Inativo";
type Tab = "timeline" | "graficos" | "dieta" | "fezes";
type AppView = "dashboard" | "stool-global";

interface UiPet {
    id: string;
    name: string;
    species: "Cão" | "Gato" | "Outro";
    breed: string;
    weight: number;
    birthDate: string | null;
    photoUrl: string | null;
    status: Status;
    hasAlert: boolean;          // derivado de weight_logs.flagged_alert
    avatarColor: string;        // calculado client-side (não existe no DB)
}

// ⚠ INCONSISTÊNCIA: DB usa 'active'|'inactive'|'pending', UI usa pt-BR
const STATUS_DB_TO_UI: Record<string, Status> = {
    active: "Ativo", inactive: "Inativo", pending: "Pendente",
};
const STATUS_UI_TO_DB: Record<Status, DbPet["status"]> = {
    Ativo: "active", Inativo: "inactive", Pendente: "pending",
};

// ⚠ INCONSISTÊNCIA: avatarColor não existe na tabela pets — calculado por hash do ID
const AVATAR_PALETTE = [
    "bg-amber-100 text-amber-700",
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-pink-100 text-pink-700",
    "bg-sky-100 text-sky-700",
];
function avatarColor(id: string) {
    const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return AVATAR_PALETTE[n % AVATAR_PALETTE.length];
}

// ⚠ INCONSISTÊNCIA: DB armazena species como string livre — não é enum validado
function mapSpecies(s: string): "Cão" | "Gato" | "Outro" {
    const lower = s.toLowerCase();
    if (lower.includes("cão") || lower.includes("cao") || lower.includes("dog")) return "Cão";
    if (lower.includes("gato") || lower.includes("cat")) return "Gato";
    return "Outro";
}

function mapDbPet(dbPet: DbPet, hasAlert: boolean): UiPet {
    return {
        id: dbPet.id,
        name: dbPet.name,
        species: mapSpecies(dbPet.species),
        breed: dbPet.breed ?? "",
        weight: dbPet.weight_kg ?? 0,
        birthDate: dbPet.birth_date,
        photoUrl: dbPet.photo_url,
        status: STATUS_DB_TO_UI[dbPet.status] ?? "Ativo",
        hasAlert,
        avatarColor: avatarColor(dbPet.id),
    };
}

// ⚠ INCONSISTÊNCIA: diet_plans.ingredients é JSON livre — precisamos de schema fixo
interface Ingredient {
    id: string;
    name: string;
    amount: number;       // gramas
    calPer100: number;    // kcal por 100g
    // ⚠ INCONSISTÊNCIA: protein/fat/carbs por ingrediente não estão no schema do DB
    //   (só existem os totais: protein_g, fat_g, carbs_g na tabela diet_plans)
    //   Armazenamos aqui na coluna ingredients (JSON) para cálculo reativo.
    protein: number;
    fat: number;
    carbs: number;
}

interface WeightRecord {
    date: string;
    weight: number;
    alert?: boolean;
}

interface FecesCard {
    id: string;
    petId: string;
    petName: string;
    date: string;
    score: number | null;
    visible: boolean;
    dismissing: boolean;
    photoUrl: string | null;
}

const MACRO_COLORS = ["#3B82F6", "#F59E0B", "#A855F7"];
const BRISTOL = [
    { score: 1, desc: "Muito duro" },
    { score: 2, desc: "Duro" },
    { score: 3, desc: "Normal-duro" },
    { score: 4, desc: "Normal" },
    { score: 5, desc: "Mole" },
    { score: 6, desc: "Mole-líquido" },
    { score: 7, desc: "Líquido" },
];

function calcMacros(ings: Ingredient[]) {
    return ings.reduce(
        (acc, ing) => {
            const f = ing.amount / 100;
            return {
                kcal: acc.kcal + ing.calPer100 * f,
                protein: acc.protein + ing.protein * f,
                fat: acc.fat + ing.fat * f,
                carbs: acc.carbs + ing.carbs * f,
            };
        },
        { kcal: 0, protein: 0, fat: 0, carbs: 0 }
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE ESTILO
// ─────────────────────────────────────────────────────────────────────────────
const inputCls = "w-full h-9 px-3 text-sm rounded-md border border-zinc-300 bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors";
const inputErrCls = "border-red-400 focus:ring-red-400/20 focus:border-red-500";
const labelCls = "block text-sm font-medium text-zinc-700 mb-1.5";
const sectionLabelCls = "text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES SIMPLES
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
    const s = {
        Ativo: "bg-green-100 text-green-700",
        Pendente: "bg-amber-100 text-amber-700",
        Inativo: "bg-zinc-100 text-zinc-500",
    }[status];
    return <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap", s)}>{status}</span>;
}

function PatientCardItem({ pet, isSelected, onClick }: { pet: UiPet; isSelected: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all duration-150 cursor-pointer border-l-2 relative",
                isSelected ? "bg-green-50 border-green-600" : "border-transparent hover:bg-zinc-50"
            )}
        >
            {pet.photoUrl ? (
                <img src={pet.photoUrl} alt={pet.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            ) : (
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0", pet.avatarColor)}>
                    {pet.name[0]}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-sm font-medium text-zinc-900 truncate">{pet.name}</span>
                    <StatusBadge status={pet.status} />
                </div>
                <p className="text-xs text-zinc-500 truncate">{pet.breed || pet.species} · {pet.species}</p>
            </div>
            {pet.hasAlert && (
                <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
        </button>
    );
}

function AlertBannerComp({ petName, onDismiss }: { petName: string; onDismiss: () => void }) {
    return (
        <div className="mx-6 mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800">Alerta de peso — {petName}</p>
                <p className="text-xs text-red-600 mt-0.5">Acima do peso ideal há registros consecutivos. Ação clínica recomendada.</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <button className="text-xs font-medium text-red-700 hover:text-red-900 underline underline-offset-2">Ver detalhes</button>
                <button onClick={onDismiss} className="text-red-400 hover:text-red-600 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function SheetComp({
    open, onClose, title, width = "480px", children, footer,
}: {
    open: boolean; onClose: () => void; title: string; width?: string;
    children: React.ReactNode; footer?: React.ReactNode;
}) {
    return (
        <>
            <div className={cn("fixed inset-0 bg-black/25 z-40 transition-opacity duration-300", open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")} onClick={onClose} />
            <div
                className={cn("fixed right-0 top-0 h-full bg-white z-50 border-l border-zinc-200 flex flex-col transition-transform duration-300 ease-in-out shadow-xl", open ? "translate-x-0" : "translate-x-full")}
                style={{ width }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 flex-shrink-0">
                    <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
                {footer && <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-end gap-3 flex-shrink-0">{footer}</div>}
            </div>
        </>
    );
}

function WeightTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: WeightRecord }[]; label?: string }) {
    if (!active || !payload?.length) return null;
    const isAlert = payload[0].payload.alert;
    return (
        <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 shadow-sm">
            <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
            <p className={cn("text-sm font-semibold", isAlert ? "text-red-600" : "text-green-700")}>{payload[0].value} kg</p>
            {isAlert && <p className="text-xs text-red-500 mt-0.5">⚠ Acima do ideal</p>}
        </div>
    );
}

function CustomDot(props: { cx?: number; cy?: number; payload?: WeightRecord }) {
    const { cx = 0, cy = 0, payload } = props;
    if (payload?.alert) return <circle key={`d-${cx}`} cx={cx} cy={cy} r={5} fill="#DC2626" stroke="white" strokeWidth={2} />;
    return <circle key={`d-${cx}`} cx={cx} cy={cy} r={4} fill="#16A34A" stroke="white" strokeWidth={2} />;
}

function StoolCardView({ card, onScore, showPetName }: { card: FecesCard; onScore: (id: string, score: number) => void; showPetName?: boolean }) {
    return (
        <div className={cn("rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm transition-all duration-300", card.dismissing && "opacity-0 scale-95")}>
            <div className="h-44 bg-zinc-100 relative">
                {card.photoUrl ? (
                    <img src={card.photoUrl} alt="Fezes" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-400">Sem foto</div>
                )}
                {showPetName && (
                    <span className="absolute top-2 left-2 bg-white/90 text-xs font-medium text-zinc-700 px-2 py-0.5 rounded-full border border-zinc-200">
                        {card.petName}
                    </span>
                )}
            </div>
            <div className="p-3">
                <p className="text-xs text-zinc-400 flex items-center gap-1 mb-3">
                    <Clock className="w-3 h-3" />{card.date}
                </p>
                <div className="flex gap-1">
                    {BRISTOL.map(({ score, desc }) => (
                        <button
                            key={score}
                            title={desc}
                            onClick={() => onScore(card.id, score)}
                            className="flex-1 h-7 text-xs font-semibold rounded border border-zinc-200 hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-colors"
                        >
                            {score}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TUTOR SELECTOR + QR CODE MODAL
// ─────────────────────────────────────────────────────────────────────────────
const TUTOR_PALETTE = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-orange-100 text-orange-700",
    "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700",
    "bg-sky-100 text-sky-700",
];
function tutorAvatarColor(id: string) {
    const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return TUTOR_PALETTE[n % TUTOR_PALETTE.length];
}
function initials(name: string) { return name.split(" ").map(w => w[0]).slice(0, 2).join(""); }

interface UiTutor { id: string; name: string; pets: { id: string; name: string }[]; avatarColor: string; }

function TutorSelector({ value, onChange }: { value: UiTutor | null; onChange: (t: UiTutor | null) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<UiTutor[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteEmailError, setInviteEmailError] = useState("");
    const [inviteSent, setInviteSent] = useState(false);

    useEffect(() => {
        if (query.length < 2) { setResults([]); setShowDropdown(false); return; }
        setSearching(true);
        const t = setTimeout(async () => {
            type TutorRow = { user_id: string; display_name: string | null; pets: { id: string; name: string }[] };
            const { data } = await supabase
                .from("tutor_profiles")
                .select("user_id, display_name, pets!pets_tutor_user_id_fkey(id, name)")
                .eq("is_deleted", false)
                .ilike("display_name", `%${query}%`)
                .limit(6);
            setResults((data ?? []).map((r: TutorRow) => ({
                id: r.user_id, name: r.display_name ?? "—",
                pets: r.pets ?? [], avatarColor: tutorAvatarColor(r.user_id),
            })));
            setSearching(false);
            setShowDropdown(true);
        }, 300);
        return () => clearTimeout(t);
    }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleSendInvite() {
        if (!inviteEmail || !inviteEmail.includes("@")) { setInviteEmailError("E-mail inválido"); return; }
        setInviteEmailError("");
        setInviteSent(true);
    }

    if (value) {
        return (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0", value.avatarColor)}>
                            {initials(value.name)}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-semibold text-zinc-900 truncate">{value.name}</span>
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-0.5 flex-shrink-0">
                                    <UserCheck className="w-3 h-3" />Vinculado
                                </span>
                            </div>
                            {value.pets.length > 0 && (
                                <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1 truncate">
                                    <PawPrint className="w-3 h-3 flex-shrink-0" />Outros pets: {value.pets.map(p => p.name).join(", ")}
                                </p>
                            )}
                        </div>
                    </div>
                    <button type="button" onClick={() => onChange(null)}
                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <UserX className="w-3.5 h-3.5" />Desvincular
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <input type="text" value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    placeholder="Nome ou e-mail do tutor..."
                    className={cn(inputCls, "pl-8", searching && "opacity-70")} />
                {query && (
                    <button type="button" onClick={() => { setQuery(""); setResults([]); setShowDropdown(false); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
                {showDropdown && results.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 overflow-hidden">
                        {results.map((tutor) => (
                            <button type="button" key={tutor.id}
                                onMouseDown={() => { onChange(tutor); setQuery(""); setResults([]); setShowDropdown(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 text-left">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", tutor.avatarColor)}>
                                    {initials(tutor.name)}
                                </div>
                                <span className="flex-1 text-sm font-medium text-zinc-900 truncate">{tutor.name}</span>
                                <span className="text-xs text-zinc-400 flex items-center gap-0.5 flex-shrink-0">
                                    <PawPrint className="w-3 h-3" />{tutor.pets.length} pet{tutor.pets.length !== 1 ? "s" : ""}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
                {showDropdown && results.length === 0 && query.length >= 2 && !searching && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 px-3 py-2.5 text-xs text-zinc-400">
                        Nenhum tutor encontrado para "{query}"
                    </div>
                )}
            </div>
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-200" />
                <span className="text-xs text-zinc-400">ou</span>
                <div className="flex-1 h-px bg-zinc-200" />
            </div>
            {!showInviteForm && !inviteSent && (
                <button type="button" onClick={() => setShowInviteForm(true)}
                    className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium transition-colors">
                    <Mail className="w-4 h-4" />Convidar novo tutor por e-mail
                </button>
            )}
            {showInviteForm && !inviteSent && (
                <div className="space-y-2">
                    <input type="email" value={inviteEmail}
                        onChange={(e) => { setInviteEmail(e.target.value); setInviteEmailError(""); }}
                        placeholder="email@dotutor.com"
                        className={cn(inputCls, inviteEmailError && inputErrCls)} />
                    {inviteEmailError && <p className="text-xs text-red-500">{inviteEmailError}</p>}
                    <div className="flex gap-2">
                        <button type="button" onClick={handleSendInvite}
                            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md transition-colors">
                            Enviar convite
                        </button>
                        <button type="button" onClick={() => { setShowInviteForm(false); setInviteEmail(""); setInviteEmailError(""); }}
                            className="h-8 px-3 border border-zinc-300 hover:bg-zinc-50 text-xs rounded-md transition-colors text-zinc-700">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
            {inviteSent && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700">Convite enviado para <strong>{inviteEmail}</strong></p>
                </div>
            )}
        </div>
    );
}

function QRCodeModal({ petId, petName, onClose }: { petId: string; petName: string; onClose: () => void }) {
    const linkUrl = `https://app.nouris.com/vincular/${petId}`;
    const [copied, setCopied] = useState(false);
    function copyLink() {
        navigator.clipboard.writeText(linkUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
    return (
        <>
            <div className="fixed inset-0 bg-black/40" style={{ zIndex: 60 }} onClick={onClose} />
            <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 60 }}>
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6 w-80 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-semibold text-zinc-900">Vincular tutor via QR</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">{petName}</p>
                        </div>
                        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-white border-2 border-green-100 rounded-xl">
                            <QRCodeSVG value={linkUrl} size={180} fgColor="#16A34A" bgColor="#ffffff" />
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 text-center mb-4 leading-relaxed">
                        O tutor escaneia este QR com o app Nouris para se vincular a <strong className="text-zinc-700">{petName}</strong>
                    </p>
                    <button onClick={copyLink}
                        className="w-full h-9 border border-zinc-300 hover:bg-zinc-50 text-sm font-medium rounded-md transition-colors text-zinc-700 flex items-center justify-center gap-2">
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
                        {copied ? "Link copiado!" : "Copiar link"}
                    </button>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
    const [screen, setScreen] = useState<"login" | "app">("login");

    // Auth
    const [email, setEmail] = useState("ana@nourisvet.com");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
    const [loginLoading, setLoginLoading] = useState(false);
    const [vetName, setVetName] = useState("Veterinário");
    const [vetEmail, setVetEmail] = useState("");

    // Dashboard
    const [appView, setAppView] = useState<AppView>("dashboard");
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("timeline");
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [periodFilter, setPeriodFilter] = useState<"30d" | "90d" | "1a">("90d");

    // Data — Supabase
    const [pets, setPets] = useState<UiPet[]>([]);
    const [petsLoading, setPetsLoading] = useState(false);
    const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
    const [stoolCards, setStoolCards] = useState<FecesCard[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [activeDietId, setActiveDietId] = useState<string | null>(null);
    const [dietNotes, setDietNotes] = useState("");

    // Sheets
    const [showNewAnimal, setShowNewAnimal] = useState(false);
    const [showDietCalc, setShowDietCalc] = useState(false);

    // New animal form
    const [newAnimal, setNewAnimal] = useState({
        name: "", species: "Cão" as "Cão" | "Gato" | "Outro",
        breed: "", birthDate: "", weight: "",
        status: "Ativo" as Status, observations: "",
    });
    const [animalErrors, setAnimalErrors] = useState<Record<string, string>>({});
    const [animalSaving, setAnimalSaving] = useState(false);

    // Tutor linking + QR modal
    const [selectedTutor, setSelectedTutor] = useState<UiTutor | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrPetData, setQrPetData] = useState<{ id: string; name: string } | null>(null);
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setVetEmail(session.user.email ?? "");
                setVetName(session.user.user_metadata?.full_name ?? session.user.email ?? "Veterinário");
                setScreen("app");
            }
        });
    }, []);

    // ── Carregar pets ─────────────────────────────────────────────────────────
    const loadPets = useCallback(async () => {
        setPetsLoading(true);
        const { data: dbPets, error } = await supabase.from("pets").select("*").order("name");
        if (error) { console.error("Erro ao carregar pets:", error); setPetsLoading(false); return; }

        // Busca todos os pet_ids com alerta em uma única query (evita N+1)
        const dbPetList = (dbPets ?? []) as DbPet[];
        const { data: alertData } = await supabase
            .from("weight_logs")
            .select("pet_id")
            .eq("flagged_alert", true);
        const alertPetIds = new Set((alertData ?? []).map((r: { pet_id: string }) => r.pet_id));
        const uiPets: UiPet[] = dbPetList.map((dbPet) => mapDbPet(dbPet, alertPetIds.has(dbPet.id)));
        setPets(uiPets);
        setPetsLoading(false);
    }, []);

    useEffect(() => { if (screen === "app") loadPets(); }, [screen, loadPets]);

    // ── Carregar dados do pet selecionado ─────────────────────────────────────
    useEffect(() => {
        if (!selectedPetId) return;
        setWeightHistory([]);
        setStoolCards([]);
        setIngredients([]);
        setActiveDietId(null);

        // Histórico de peso
        supabase
            .from("weight_logs")
            .select("*")
            .eq("pet_id", selectedPetId)
            .order("recorded_at")
            .then(({ data }) => {
                setWeightHistory(
                    (data ?? []).map((log: WeightLog) => ({
                        date: new Date(log.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
                        weight: log.weight_kg,
                        alert: log.flagged_alert,
                    }))
                );
            });

        // Fezes pendentes do pet
        supabase
            .from("feces_logs")
            .select("*")
            .eq("pet_id", selectedPetId)
            .is("score", null)
            .order("recorded_at", { ascending: false })
            .then(({ data }) => {
                setStoolCards(
                    (data ?? []).map((log: FecesLog) => ({
                        id: log.id,
                        petId: log.pet_id,
                        petName: pets.find((p) => p.id === log.pet_id)?.name ?? "—",
                        date: new Date(log.recorded_at).toLocaleString("pt-BR"),
                        score: log.score,
                        visible: true,
                        dismissing: false,
                        photoUrl: log.photo_url,
                    }))
                );
            });

        // Dieta ativa
        supabase
            .from("diet_plans")
            .select("*")
            .eq("pet_id", selectedPetId)
            .eq("active", true)
            .maybeSingle()
            .then(({ data }) => {
                const plan = data as { id: string; notes: string | null; ingredients: unknown } | null;
                if (plan) {
                    setActiveDietId(plan.id);
                    setDietNotes(plan.notes ?? "");
                    // ⚠ INCONSISTÊNCIA: ingredients JSON precisa ter formato Ingredient[]
                    const rawIngredients = Array.isArray(plan.ingredients) ? plan.ingredients as Ingredient[] : [];
                    setIngredients(rawIngredients.length > 0 ? rawIngredients : []);
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPetId]);

    // ── Triagem global ────────────────────────────────────────────────────────
    useEffect(() => {
        if (appView !== "stool-global") return;
        supabase
            .from("feces_logs")
            .select("*, pets(name)")
            .is("score", null)
            .order("recorded_at", { ascending: false })
            .then(({ data }) => {
                setStoolCards(
                    (data ?? []).map((log: FecesLog & { pets?: { name: string } }) => ({
                        id: log.id,
                        petId: log.pet_id,
                        petName: (log as { pets?: { name: string } }).pets?.name ?? "—",
                        date: new Date(log.recorded_at).toLocaleString("pt-BR"),
                        score: log.score,
                        visible: true,
                        dismissing: false,
                        photoUrl: log.photo_url,
                    }))
                );
            });
    }, [appView]);

    // ── Computed ──────────────────────────────────────────────────────────────
    const selectedPet = pets.find((p) => p.id === selectedPetId) ?? null;
    const filteredPets = pets.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.breed || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    const pendingStoolCount = stoolCards.filter((c) => c.visible && c.score === null).length;
    const macros = calcMacros(ingredients);

    // ── Handlers ──────────────────────────────────────────────────────────────
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        const errs: typeof loginErrors = {};
        if (!email) errs.email = "E-mail obrigatório";
        else if (!email.includes("@")) errs.email = "E-mail inválido";
        if (!password) errs.password = "Senha obrigatória";
        setLoginErrors(errs);
        if (Object.keys(errs).length) return;

        setLoginLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        setLoginLoading(false);

        if (error) {
            setLoginErrors({ password: "Credenciais inválidas. Verifique e-mail e senha." });
            return;
        }
        setVetEmail(data.user?.email ?? "");
        setVetName(data.user?.user_metadata?.full_name ?? data.user?.email ?? "Veterinário");
        // Garante que o vet está registrado na tabela vet_profiles
        await supabase.from("vet_profiles").upsert({ user_id: data.user.id, display_name: data.user.email ?? null } as never);
        setScreen("app");
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        setScreen("login");
        setPassword("");
        setPets([]);
        setSelectedPetId(null);
    }

    function selectPet(id: string) {
        setSelectedPetId(id);
        setActiveTab("timeline");
        setAlertDismissed(false);
        setAppView("dashboard");
    }

    async function handleStoolScore(cardId: string, score: number) {
        // Animação de saída
        setStoolCards((prev) => prev.map((c) => c.id === cardId ? { ...c, score, dismissing: true } : c));
        // Persistir no Supabase
        const { error } = await supabase.from("feces_logs").update({ score } as never).eq("id", cardId);
        if (error) console.error("Erro ao salvar score:", error);
        setTimeout(() => setStoolCards((prev) => prev.filter((c) => c.id !== cardId)), 300);
    }

    async function handleSubmitAnimal(e: React.FormEvent) {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!newAnimal.name.trim()) errs.name = "Nome obrigatório";
        if (!newAnimal.weight) errs.weight = "Peso obrigatório";
        setAnimalErrors(errs);
        if (Object.keys(errs).length) return;

        setAnimalSaving(true);
        const { data: session } = await supabase.auth.getUser();
        const { data: insertData, error } = await supabase.from("pets").insert({
            name: newAnimal.name,
            species: newAnimal.species,
            breed: newAnimal.breed || null,
            birth_date: newAnimal.birthDate || null,
            weight_kg: parseFloat(newAnimal.weight) || null,
            tutor_user_id: selectedTutor?.id ?? null,
            vet_id: session.user?.id ?? null,
            status: STATUS_UI_TO_DB[newAnimal.status],
        } as never).select("id").single();
        setAnimalSaving(false);

        if (error) {
            console.error("Erro ao cadastrar pet:", error);
            setAnimalErrors({ name: `Erro ao salvar: ${error.message}` });
            return;
        }

        const savedId = (insertData as { id: string } | null)?.id;
        setShowNewAnimal(false);
        setNewAnimal({ name: "", species: "Cão", breed: "", birthDate: "", weight: "", status: "Ativo", observations: "" });
        setAnimalErrors({});
        setSelectedTutor(null);
        await loadPets();
        if (savedId) { setQrPetData({ id: savedId, name: newAnimal.name }); setShowQRModal(true); }
    }

    async function handleSaveDiet(activate: boolean) {
        if (!selectedPetId) return;
        const { data: session } = await supabase.auth.getUser();
        const totalMacros = calcMacros(ingredients);

        const dietPayload = {
            ingredients: ingredients as unknown,
            calories_kcal: Math.round(totalMacros.kcal),
            protein_g: Math.round(totalMacros.protein * 10) / 10,
            fat_g: Math.round(totalMacros.fat * 10) / 10,
            carbs_g: Math.round(totalMacros.carbs * 10) / 10,
            notes: dietNotes,
            active: activate,
        };
        if (activeDietId) {
            await supabase.from("diet_plans").update(dietPayload as never).eq("id", activeDietId);
        } else {
            await supabase.from("diet_plans").insert({
                ...dietPayload,
                pet_id: selectedPetId,
                vet_id: session.user?.id ?? "",
            } as never);
        }
        setShowDietCalc(false);
    }

    function addIngredient() {
        setIngredients((prev) => [...prev, { id: String(Date.now()), name: "", amount: 100, calPer100: 0, protein: 0, fat: 0, carbs: 0 }]);
    }
    function removeIngredient(id: string) { setIngredients((prev) => prev.filter((i) => i.id !== id)); }
    function updateIngredient(id: string, field: keyof Ingredient, value: string | number) {
        setIngredients((prev) => prev.map((i) => i.id === id ? { ...i, [field]: value } : i));
    }

    function getWeightData() {
        const counts: Record<string, number> = { "30d": 3, "90d": 6, "1a": weightHistory.length };
        return weightHistory.slice(-counts[periodFilter]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TELA DE LOGIN
    // ─────────────────────────────────────────────────────────────────────────
    if (screen === "login") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4" style={{ fontFamily: "Inter, sans-serif" }}>
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl mb-3 shadow-sm">
                            <PawPrint className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-zinc-900">Nouris Vet</h1>
                        <p className="text-sm text-zinc-500 mt-1">Portal Veterinário</p>
                    </div>
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                        <h2 className="text-base font-semibold text-zinc-900 mb-5">Entrar na sua conta</h2>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className={labelCls}>E-mail</label>
                                <input type="text" value={email} onChange={(e) => { setEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: undefined })); }}
                                    className={cn(inputCls, loginErrors.email && inputErrCls)} placeholder="ana@nourisvet.com" />
                                {loginErrors.email && <p className="text-xs text-red-500 mt-1">{loginErrors.email}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>Senha</label>
                                <div className="relative">
                                    <input type={showPass ? "text" : "password"} value={password}
                                        onChange={(e) => { setPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: undefined })); }}
                                        className={cn(inputCls, "pr-10", loginErrors.password && inputErrCls)} placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {loginErrors.password && <p className="text-xs text-red-500 mt-1">{loginErrors.password}</p>}
                            </div>
                            <button type="submit" disabled={loginLoading}
                                className="w-full h-10 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors">
                                {loginLoading ? "Entrando..." : "Entrar"}
                            </button>
                        </form>
                        <div className="mt-4 text-center">
                            <button className="text-sm text-green-600 hover:text-green-700 hover:underline underline-offset-2 transition-colors">Esqueci minha senha</button>
                        </div>
                    </div>
                    <p className="text-center text-xs text-zinc-400 mt-5">Acesso apenas por convite · Nouris Vet © 2026</p>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDERIZADORES DE TABS
    // ─────────────────────────────────────────────────────────────────────────
    function renderTimeline() {
        const data = getWeightData();
        const reversed = [...data].reverse();
        return (
            <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-zinc-900">Histórico de peso</h3>
                    <div className="flex items-center gap-1 bg-zinc-100 rounded-md p-0.5">
                        {(["30d", "90d", "1a"] as const).map((f) => (
                            <button key={f} onClick={() => setPeriodFilter(f)}
                                className={cn("px-3 py-1 text-xs rounded font-medium transition-all", periodFilter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
                                {f === "30d" ? "30 dias" : f === "90d" ? "90 dias" : "1 ano"}
                            </button>
                        ))}
                    </div>
                </div>
                {reversed.length === 0 ? (
                    <p className="text-sm text-zinc-400 py-8 text-center">Nenhum registro de peso ainda.</p>
                ) : (
                    <div className="relative pl-5">
                        <div className="absolute left-0 top-2 bottom-2 w-px bg-zinc-200" />
                        <div className="space-y-0">
                            {reversed.map((rec, i) => (
                                <div key={i} className="flex items-start gap-4 py-3 relative">
                                    <div className={cn("absolute -left-[17px] top-4 w-3 h-3 rounded-full border-2 border-white", rec.alert ? "bg-red-500" : "bg-green-500")} />
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="text-xs text-zinc-400 w-16 flex-shrink-0 flex items-center gap-1"><Clock className="w-3 h-3" />{rec.date}</span>
                                        <span className="text-sm font-semibold text-zinc-900">{rec.weight} kg</span>
                                        {rec.alert && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">Alerta</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    function renderGraficos() {
        const data = getWeightData();
        return (
            <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-zinc-900">Evolução de peso</h3>
                    <div className="flex items-center gap-1 bg-zinc-100 rounded-md p-0.5">
                        {(["30d", "90d", "1a"] as const).map((f) => (
                            <button key={f} onClick={() => setPeriodFilter(f)}
                                className={cn("px-3 py-1 text-xs rounded font-medium transition-all", periodFilter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                {data.length === 0 ? (
                    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-zinc-400">Sem dados de peso para exibir.</div>
                ) : (
                    <div className="bg-white border border-zinc-200 rounded-lg p-4">
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.12} />
                                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                                <RechartsTip content={<WeightTooltip />} />
                                <Area type="monotone" dataKey="weight" stroke="#16A34A" strokeWidth={2} fill="url(#wGrad)"
                                    dot={CustomDot as never} activeDot={{ r: 6, fill: "#16A34A", stroke: "white", strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
                <div className="flex items-center gap-4 mt-3 px-1">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />Peso normal</div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />Alerta de peso</div>
                </div>
            </div>
        );
    }

    function renderDieta() {
        const total = macros.protein + macros.fat + macros.carbs;
        const macroCards = [
            { label: "Calorias", value: Math.round(macros.kcal), unit: "kcal", pct: null, color: "text-green-600" },
            { label: "Proteína", value: Math.round(macros.protein * 10) / 10, unit: "g", pct: total > 0 ? macros.protein / total : 0, color: "text-blue-600" },
            { label: "Gordura", value: Math.round(macros.fat * 10) / 10, unit: "g", pct: total > 0 ? macros.fat / total : 0, color: "text-amber-600" },
            { label: "Carboidratos", value: Math.round(macros.carbs * 10) / 10, unit: "g", pct: total > 0 ? macros.carbs / total : 0, color: "text-purple-600" },
        ];
        return (
            <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-zinc-900">Plano alimentar ativo</h3>
                    <button onClick={() => setShowDietCalc(true)}
                        className="h-8 px-3 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5" />{activeDietId ? "Editar plano" : "Criar plano"}
                    </button>
                </div>
                {ingredients.length === 0 ? (
                    <p className="text-sm text-zinc-400 py-4">Nenhum plano de dieta ativo. Clique em "Criar plano".</p>
                ) : (
                    <>
                        <div className="grid grid-cols-4 gap-3 mb-6">
                            {macroCards.map((c) => (
                                <div key={c.label} className="bg-white border border-zinc-200 rounded-lg p-3">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-1">{c.label}</p>
                                    <p className={cn("text-2xl font-bold", c.color)}>{c.value}<span className="text-xs font-normal text-zinc-400 ml-0.5">{c.unit}</span></p>
                                    {c.pct !== null && (
                                        <div className="mt-2">
                                            <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-current transition-all duration-500" style={{ width: `${Math.round(c.pct * 100)}%` }} />
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-1">{Math.round(c.pct * 100)}%</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                            <div className="px-4 py-3 border-b border-zinc-100"><p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ingredientes</p></div>
                            <table className="w-full text-sm">
                                <thead><tr className="border-b border-zinc-100 bg-zinc-50">
                                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">Ingrediente</th>
                                    <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2">Qtd (g)</th>
                                    <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2">kcal</th>
                                </tr></thead>
                                <tbody>
                                    {ingredients.map((ing) => (
                                        <tr key={ing.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                                            <td className="px-4 py-2.5 text-zinc-900">{ing.name}</td>
                                            <td className="px-4 py-2.5 text-right text-zinc-600">{ing.amount}</td>
                                            <td className="px-4 py-2.5 text-right text-zinc-600">{Math.round((ing.calPer100 * ing.amount) / 100)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {dietNotes && <div className="px-4 py-3 border-t border-zinc-100 text-xs text-zinc-500">{dietNotes}</div>}
                        </div>
                    </>
                )}
            </div>
        );
    }

    function renderFezes() {
        const petStool = stoolCards.filter((c) => c.petId === selectedPetId && c.visible);
        if (petStool.length === 0) {
            return (
                <div className="p-6 flex flex-col items-center justify-center min-h-48 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3"><Check className="w-6 h-6 text-green-600" /></div>
                    <p className="text-sm font-medium text-zinc-700">Sem avaliações pendentes</p>
                    <p className="text-xs text-zinc-500 mt-1">Todas as fotos deste paciente foram avaliadas.</p>
                </div>
            );
        }
        return (
            <div className="p-6">
                <div className="flex items-center gap-2 mb-5">
                    <h3 className="text-sm font-semibold text-zinc-900">Triagem de fezes</h3>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">{petStool.length} pendente{petStool.length > 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {petStool.map((card) => <StoolCardView key={card.id} card={card} onScore={handleStoolScore} />)}
                </div>
            </div>
        );
    }

    function renderPatientProfile() {
        if (!selectedPet) return null;
        const showAlert = selectedPet.hasAlert && !alertDismissed;
        const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
            { id: "timeline", label: "Timeline", icon: <Activity className="w-3.5 h-3.5" /> },
            { id: "graficos", label: "Gráficos", icon: <BarChart2 className="w-3.5 h-3.5" /> },
            { id: "dieta", label: "Dieta", icon: <Utensils className="w-3.5 h-3.5" /> },
            { id: "fezes", label: "Triagem de Fezes", icon: <FlaskConical className="w-3.5 h-3.5" /> },
        ];
        return (
            <div>
                {showAlert && <AlertBannerComp petName={selectedPet.name} onDismiss={() => setAlertDismissed(true)} />}
                <div className="px-6 pt-5 pb-4 border-b border-zinc-200">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            {selectedPet.photoUrl ? (
                                <img src={selectedPet.photoUrl} alt={selectedPet.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                            ) : (
                                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0", selectedPet.avatarColor)}>{selectedPet.name[0]}</div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-900">{selectedPet.name}</h1>
                                <p className="text-sm text-zinc-500 mt-0.5">{selectedPet.breed || selectedPet.species} · {selectedPet.species} · {selectedPet.weight} kg</p>
                                <div className="mt-1.5 flex items-center gap-2">
                                    <StatusBadge status={selectedPet.status} />
                                    <button
                                        onClick={() => { setQrPetData({ id: selectedPet.id, name: selectedPet.name }); setShowQRModal(true); }}
                                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-green-700 border border-zinc-200 hover:border-green-300 rounded px-1.5 py-0.5 transition-colors">
                                        <QrCode className="w-3 h-3" />QR do tutor
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-4">
                        {tabs.map((t) => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)}
                                className={cn("flex items-center gap-1.5 px-3 py-2 text-sm rounded-md font-medium transition-all",
                                    activeTab === t.id ? "bg-green-50 text-green-700" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900")}>
                                {t.icon}{t.label}
                            </button>
                        ))}
                    </div>
                </div>
                {activeTab === "timeline" && renderTimeline()}
                {activeTab === "graficos" && renderGraficos()}
                {activeTab === "dieta" && renderDieta()}
                {activeTab === "fezes" && renderFezes()}
            </div>
        );
    }

    function renderEmptyState() {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5">
                    <PawPrint className="w-10 h-10 text-green-300" />
                </div>
                <h2 className="text-base font-semibold text-zinc-700 mb-2">Nenhum paciente selecionado</h2>
                <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">Selecione um paciente na barra lateral para ver o histórico clínico completo.</p>
                <button onClick={() => setShowNewAnimal(true)}
                    className="mt-6 h-9 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" />Cadastrar novo animal
                </button>
            </div>
        );
    }

    function renderStoolGlobal() {
        const visible = stoolCards.filter((c) => c.visible);
        const pending = visible.filter((c) => c.score === null);
        return (
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-bold text-zinc-900">Triagem Global de Fezes</h2>
                    <span className={cn("px-2.5 py-1 text-sm font-medium rounded-full", pending.length > 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>
                        {pending.length} pendente{pending.length !== 1 ? "s" : ""}
                    </span>
                </div>
                {visible.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><Check className="w-8 h-8 text-green-600" /></div>
                        <p className="text-base font-semibold text-zinc-700">Todas as avaliações em dia!</p>
                        <p className="text-sm text-zinc-400 mt-1">Nenhuma triagem pendente no momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {visible.map((card) => <StoolCardView key={card.id} card={card} onScore={handleStoolScore} showPetName />)}
                    </div>
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SHELL PRINCIPAL
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-screen overflow-hidden bg-white" style={{ fontFamily: "Inter, sans-serif" }}>
            {/* Sidebar */}
            <aside className="w-72 flex-shrink-0 border-r border-zinc-200 flex flex-col bg-white">
                <div className="px-4 py-4 border-b border-zinc-100">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center"><PawPrint className="w-4 h-4 text-white" /></div>
                        <span className="font-semibold text-zinc-900 text-sm">Nouris Vet</span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar paciente..." className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2">
                    <div className="flex items-center justify-between px-2 mb-1">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pacientes</span>
                        <button onClick={() => setShowNewAnimal(true)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors">
                            <Plus className="w-3.5 h-3.5" />Novo
                        </button>
                    </div>
                    <div className="space-y-0.5 mt-1">
                        {petsLoading && [...Array(4)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-100 mx-1 mb-1" />)}
                        {!petsLoading && filteredPets.length === 0 && (
                            <p className="text-xs text-zinc-400 px-2 py-4 text-center">{searchQuery ? "Nenhum resultado" : "Nenhum paciente ainda"}</p>
                        )}
                        {filteredPets.map((pet) => (
                            <PatientCardItem key={pet.id} pet={pet} isSelected={selectedPetId === pet.id && appView === "dashboard"} onClick={() => selectPet(pet.id)} />
                        ))}
                    </div>
                </div>

                <div className="px-3 py-2 border-t border-zinc-100">
                    <button onClick={() => setAppView("stool-global")}
                        className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors",
                            appView === "stool-global" ? "bg-green-50 text-green-700 font-medium" : "text-zinc-600 hover:bg-zinc-50")}>
                        <FlaskConical className="w-4 h-4 flex-shrink-0" />
                        <span>Triagem de Fezes</span>
                        {pendingStoolCount > 0 && (
                            <span className="ml-auto w-5 h-5 flex items-center justify-center bg-amber-500 text-white text-xs rounded-full font-semibold">{pendingStoolCount}</span>
                        )}
                    </button>
                </div>

                <div className="px-3 py-3 border-t border-zinc-100 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700 flex-shrink-0">
                        {vetName[0]?.toUpperCase() ?? "V"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 truncate">{vetName}</p>
                        <p className="text-xs text-zinc-400 truncate">{vetEmail}</p>
                    </div>
                    <button onClick={handleLogout} title="Sair" className="text-zinc-400 hover:text-zinc-600 transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto">
                {appView === "stool-global" ? renderStoolGlobal() : selectedPet ? renderPatientProfile() : renderEmptyState()}
            </main>

            {/* Sheet — Cadastrar Animal */}
            <SheetComp
                open={showNewAnimal}
                onClose={() => { setShowNewAnimal(false); setAnimalErrors({}); setSelectedTutor(null); }}
                title="Cadastrar novo animal"
                footer={
                    <>
                        <button onClick={() => { setShowNewAnimal(false); setAnimalErrors({}); setSelectedTutor(null); }}
                            className="h-9 px-4 border border-zinc-300 hover:bg-zinc-50 text-sm font-medium rounded-md transition-colors text-zinc-700">Cancelar</button>
                        <button onClick={handleSubmitAnimal} disabled={animalSaving}
                            className="h-9 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors">
                            {animalSaving ? "Salvando..." : "Cadastrar"}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmitAnimal} className="space-y-6">
                    <div>
                        <p className={sectionLabelCls}>Dados do animal</p>
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Nome do pet <span className="text-red-500">*</span></label>
                                <input type="text" value={newAnimal.name}
                                    onChange={(e) => { setNewAnimal((p) => ({ ...p, name: e.target.value })); setAnimalErrors((p) => ({ ...p, name: "" })); }}
                                    className={cn(inputCls, animalErrors.name && inputErrCls)} placeholder="Ex: Bolinha" />
                                {animalErrors.name && <p className="text-xs text-red-500 mt-1">{animalErrors.name}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Espécie <span className="text-red-500">*</span></label>
                                    <select value={newAnimal.species} onChange={(e) => setNewAnimal((p) => ({ ...p, species: e.target.value as "Cão" | "Gato" | "Outro" }))} className={cn(inputCls, "cursor-pointer")}>
                                        <option>Cão</option><option>Gato</option><option>Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Status</label>
                                    <select value={newAnimal.status} onChange={(e) => setNewAnimal((p) => ({ ...p, status: e.target.value as Status }))} className={cn(inputCls, "cursor-pointer")}>
                                        <option>Ativo</option><option>Pendente</option><option>Inativo</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Raça</label>
                                <input type="text" value={newAnimal.breed} onChange={(e) => setNewAnimal((p) => ({ ...p, breed: e.target.value }))} className={inputCls} placeholder="Ex: Golden Retriever" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Data de nascimento</label>
                                    <input type="date" value={newAnimal.birthDate} onChange={(e) => setNewAnimal((p) => ({ ...p, birthDate: e.target.value }))} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Peso atual (kg) <span className="text-red-500">*</span></label>
                                    <input type="number" value={newAnimal.weight}
                                        onChange={(e) => { setNewAnimal((p) => ({ ...p, weight: e.target.value })); setAnimalErrors((p) => ({ ...p, weight: "" })); }}
                                        className={cn(inputCls, animalErrors.weight && inputErrCls)} placeholder="Ex: 5.2" step="0.1" min="0" />
                                    {animalErrors.weight && <p className="text-xs text-red-500 mt-1">{animalErrors.weight}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-zinc-100 pt-5">
                        <p className={sectionLabelCls}>Tutor responsável</p>
                        <TutorSelector value={selectedTutor} onChange={setSelectedTutor} />
                    </div>
                    <div className="border-t border-zinc-100 pt-5">
                        <p className={sectionLabelCls}>Observações clínicas iniciais</p>
                        <textarea value={newAnimal.observations} onChange={(e) => setNewAnimal((p) => ({ ...p, observations: e.target.value }))}
                            rows={3} className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors resize-none"
                            placeholder="Histórico, alergias, medicamentos em uso..." />
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {/* ⚠ INCONSISTÊNCIA: owner_id é NOT NULL no DB, mas o tutor pode não existir ainda.
                  O cadastro pelo vet usa o próprio user_id como owner temporário. */}
                            Tutor será vinculado posteriormente pelo app do responsável.
                        </p>
                    </div>
                </form>
            </SheetComp>

            {/* Sheet — Calculadora de Dieta */}
            <SheetComp
                open={showDietCalc}
                onClose={() => setShowDietCalc(false)}
                title="Calculadora de Dieta"
                width="560px"
                footer={
                    <>
                        <button onClick={() => handleSaveDiet(false)}
                            className="h-9 px-4 hover:bg-zinc-50 text-sm font-medium rounded-md transition-colors text-zinc-700">Salvar rascunho</button>
                        <button onClick={() => handleSaveDiet(true)}
                            className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition-colors">Ativar plano</button>
                    </>
                }
            >
                <div className="space-y-6">
                    <div>
                        <p className={sectionLabelCls}>Macros em tempo real</p>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {[
                                { label: "kcal", value: Math.round(macros.kcal), color: "text-green-600" },
                                { label: "Proteína", value: `${Math.round(macros.protein * 10) / 10}g`, color: "text-blue-600" },
                                { label: "Gordura", value: `${Math.round(macros.fat * 10) / 10}g`, color: "text-amber-600" },
                                { label: "Carbs", value: `${Math.round(macros.carbs * 10) / 10}g`, color: "text-purple-600" },
                            ].map((m) => (
                                <div key={m.label} className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center">
                                    <p className="text-xs text-zinc-500 mb-1">{m.label}</p>
                                    <p className={cn("text-lg font-bold", m.color)}>{m.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-center gap-8">
                            <PieChart width={140} height={140}>
                                <Pie data={[
                                    { name: "Proteína", value: Math.max(Math.round(macros.protein), 0.1) },
                                    { name: "Gordura", value: Math.max(Math.round(macros.fat), 0.1) },
                                    { name: "Carboidratos", value: Math.max(Math.round(macros.carbs), 0.1) },
                                ]} cx={65} cy={65} innerRadius={42} outerRadius={62} dataKey="value" strokeWidth={2}>
                                    {MACRO_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                                </Pie>
                            </PieChart>
                            <div className="space-y-1.5">
                                {[{ label: "Proteína", color: MACRO_COLORS[0] }, { label: "Gordura", color: MACRO_COLORS[1] }, { label: "Carboidratos", color: MACRO_COLORS[2] }].map((m) => (
                                    <div key={m.label} className="flex items-center gap-2 text-xs text-zinc-600">
                                        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: m.color }} />{m.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className={sectionLabelCls}>Ingredientes</p>
                            <button type="button" onClick={addIngredient}
                                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors">
                                <Plus className="w-3.5 h-3.5" />Adicionar
                            </button>
                        </div>
                        <div className="space-y-2">
                            {ingredients.map((ing) => (
                                <div key={ing.id} className="grid grid-cols-[1fr_70px_70px_28px] gap-2 items-center">
                                    <input type="text" value={ing.name} onChange={(e) => updateIngredient(ing.id, "name", e.target.value)} placeholder="Ingrediente" className={cn(inputCls, "h-8 text-xs")} />
                                    <input type="number" value={ing.amount} onChange={(e) => updateIngredient(ing.id, "amount", parseFloat(e.target.value) || 0)} placeholder="g" className={cn(inputCls, "h-8 text-xs text-center")} min="0" />
                                    <input type="number" value={ing.calPer100} onChange={(e) => updateIngredient(ing.id, "calPer100", parseFloat(e.target.value) || 0)} placeholder="kcal/100g" className={cn(inputCls, "h-8 text-xs text-center")} min="0" />
                                    <button type="button" onClick={() => removeIngredient(ing.id)} className="h-8 w-7 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors rounded">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-[1fr_70px_70px_28px] gap-2 mt-1">
                            <span className="text-xs text-zinc-400 pl-1">Nome</span>
                            <span className="text-xs text-zinc-400 text-center">Qtd (g)</span>
                            <span className="text-xs text-zinc-400 text-center">kcal/100g</span>
                            <span />
                        </div>
                    </div>
                    <div className="border-t border-zinc-100 pt-5">
                        <p className={sectionLabelCls}>Instruções para o tutor</p>
                        <textarea value={dietNotes} onChange={(e) => setDietNotes(e.target.value)} rows={3}
                            className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors resize-none"
                            placeholder="Frequência de refeições, preparo, observações..." />
                    </div>
                </div>
            </SheetComp>
            {showQRModal && qrPetData && (
                <QRCodeModal petId={qrPetData.id} petName={qrPetData.name} onClose={() => setShowQRModal(false)} />
            )}
        </div>
    );
}