import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import {
  Search, Plus, LogOut, AlertTriangle, X, PawPrint,
  Utensils, FlaskConical, BarChart2, Check,
  Trash2, Eye, EyeOff, Activity, Clock,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Types ────────────────────────────────────────────────────────────────────
type Status = "Ativo" | "Pendente" | "Inativo";
type Tab = "timeline" | "graficos" | "dieta" | "fezes";
type AppView = "dashboard" | "stool-global";

interface Pet {
  id: string;
  name: string;
  species: "Cão" | "Gato" | "Outro";
  breed: string;
  weight: number;
  status: Status;
  hasAlert: boolean;
  avatarColor: string;
}

interface WeightRecord {
  date: string;
  weight: number;
  alert?: boolean;
}

interface Ingredient {
  id: string;
  name: string;
  amount: number;
  calPer100: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface StoolCard {
  id: string;
  petId: string;
  petName: string;
  date: string;
  score: number | null;
  visible: boolean;
  dismissing: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const PETS_DATA: Pet[] = [
  { id: "1", name: "Bolinha", species: "Cão", breed: "Golden Retriever", weight: 28, status: "Ativo", hasAlert: true, avatarColor: "bg-amber-100 text-amber-700" },
  { id: "2", name: "Luna", species: "Gato", breed: "Siamês", weight: 3.8, status: "Ativo", hasAlert: false, avatarColor: "bg-violet-100 text-violet-700" },
  { id: "3", name: "Rex", species: "Cão", breed: "Pastor Alemão", weight: 35, status: "Pendente", hasAlert: false, avatarColor: "bg-blue-100 text-blue-700" },
  { id: "4", name: "Mel", species: "Cão", breed: "Labrador", weight: 22, status: "Inativo", hasAlert: false, avatarColor: "bg-zinc-100 text-zinc-600" },
  { id: "5", name: "Pipoca", species: "Cão", breed: "Poodle", weight: 4.2, status: "Ativo", hasAlert: false, avatarColor: "bg-pink-100 text-pink-700" },
];

const WEIGHT_HISTORY: WeightRecord[] = [
  { date: "01/Jan", weight: 24.8 },
  { date: "15/Jan", weight: 25.2 },
  { date: "01/Fev", weight: 25.8 },
  { date: "15/Fev", weight: 26.5 },
  { date: "01/Mar", weight: 27.1 },
  { date: "15/Mar", weight: 27.9 },
  { date: "01/Abr", weight: 28.0, alert: true },
  { date: "15/Abr", weight: 28.5, alert: true },
  { date: "01/Mai", weight: 28.3, alert: true },
  { date: "20/Mai", weight: 28.0, alert: true },
];

const INIT_INGREDIENTS: Ingredient[] = [
  { id: "1", name: "Frango cozido", amount: 150, calPer100: 165, protein: 31, fat: 3.6, carbs: 0 },
  { id: "2", name: "Arroz branco", amount: 100, calPer100: 130, protein: 2.7, fat: 0.3, carbs: 28 },
  { id: "3", name: "Cenoura", amount: 50, calPer100: 41, protein: 0.9, fat: 0.2, carbs: 10 },
  { id: "4", name: "Óleo de coco", amount: 10, calPer100: 862, protein: 0, fat: 100, carbs: 0 },
];

const INIT_STOOL: StoolCard[] = [
  { id: "s1", petId: "2", petName: "Luna", date: "20/05/2026 14:32", score: null, visible: true, dismissing: false },
  { id: "s2", petId: "1", petName: "Bolinha", date: "20/05/2026 09:15", score: null, visible: true, dismissing: false },
  { id: "s3", petId: "1", petName: "Bolinha", date: "19/05/2026 18:44", score: null, visible: true, dismissing: false },
];

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

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

// ── Small components ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  const s = {
    Ativo: "bg-green-100 text-green-700",
    Pendente: "bg-amber-100 text-amber-700",
    Inativo: "bg-zinc-100 text-zinc-500",
  }[status];
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap", s)}>
      {status}
    </span>
  );
}

function PatientCard({ pet, isSelected, onClick }: { pet: Pet; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all duration-150 cursor-pointer border-l-2 relative",
        isSelected
          ? "bg-green-50 border-green-600"
          : "border-transparent hover:bg-zinc-50"
      )}
    >
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0", pet.avatarColor)}>
        {pet.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-sm font-medium text-zinc-900 truncate">{pet.name}</span>
          <StatusBadge status={pet.status} />
        </div>
        <p className="text-xs text-zinc-500 truncate">{pet.breed} · {pet.species}</p>
      </div>
      {pet.hasAlert && (
        <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
      )}
    </button>
  );
}

function AlertBanner({ petName, onDismiss }: { petName: string; onDismiss: () => void }) {
  return (
    <div className="mx-6 mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800">Alerta de peso — {petName}</p>
        <p className="text-xs text-red-600 mt-0.5">
          Acima do peso ideal há 4 consultas consecutivas. Ação clínica recomendada.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="text-xs font-medium text-red-700 hover:text-red-900 underline underline-offset-2">
          Ver detalhes
        </button>
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Sheet({
  open, onClose, title, width = "480px", children, footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/25 z-40 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed right-0 top-0 h-full bg-white z-50 border-l border-zinc-200 flex flex-col transition-transform duration-300 ease-in-out shadow-xl",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ width }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-end gap-3 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

// ── Recharts helpers ──────────────────────────────────────────────────────────
function WeightTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: WeightRecord }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const isAlert = payload[0].payload.alert;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 shadow-sm">
      <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
      <p className={cn("text-sm font-semibold", isAlert ? "text-red-600" : "text-green-700")}>
        {payload[0].value} kg
      </p>
      {isAlert && <p className="text-xs text-red-500 mt-0.5">⚠ Acima do ideal</p>}
    </div>
  );
}

function CustomDot(props: { cx?: number; cy?: number; payload?: WeightRecord }) {
  const { cx = 0, cy = 0, payload } = props;
  if (payload?.alert) {
    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="#DC2626" stroke="white" strokeWidth={2} />;
  }
  return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#16A34A" stroke="white" strokeWidth={2} />;
}

// ── Shared style helpers ──────────────────────────────────────────────────────
const inputCls = "w-full h-9 px-3 text-sm rounded-md border border-zinc-300 bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors";
const inputErrCls = "border-red-400 focus:ring-red-400/20 focus:border-red-500";
const labelCls = "block text-sm font-medium text-zinc-700 mb-1.5";
const sectionLabelCls = "text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3";

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<"login" | "app">("login");

  // Login
  const [email, setEmail] = useState("ana@nourisvet.com");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  // Dashboard
  const [appView, setAppView] = useState<AppView>("dashboard");
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("timeline");
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState<"30d" | "90d" | "1a">("90d");
  const [pets, setPets] = useState<Pet[]>(PETS_DATA);
  const [stoolCards, setStoolCards] = useState<StoolCard[]>(INIT_STOOL);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INIT_INGREDIENTS);

  // Sheets
  const [showNewAnimal, setShowNewAnimal] = useState(false);
  const [showDietCalc, setShowDietCalc] = useState(false);

  // New animal form
  const [newAnimal, setNewAnimal] = useState({
    name: "", species: "Cão" as "Cão" | "Gato" | "Outro",
    breed: "", birthDate: "", weight: "",
    status: "Ativo" as Status, tutor: "", observations: "", startDiet: false,
  });
  const [animalErrors, setAnimalErrors] = useState<Record<string, string>>({});
  const [dietNotes, setDietNotes] = useState("Oferecer em 2 refeições diárias. Medir sempre antes de servir.");

  const selectedPet = pets.find((p) => p.id === selectedPetId) ?? null;
  const filteredPets = pets.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.breed.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pendingStool = stoolCards.filter((c) => c.visible && c.score === null);

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

  const macros = calcMacros(ingredients);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof loginErrors = {};
    if (!email) errs.email = "E-mail obrigatório";
    else if (!email.includes("@")) errs.email = "E-mail inválido";
    if (!password) errs.password = "Senha obrigatória";
    setLoginErrors(errs);
    if (!Object.keys(errs).length) setScreen("app");
  }

  function handleSubmitAnimal(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!newAnimal.name.trim()) errs.name = "Nome obrigatório";
    if (!newAnimal.weight) errs.weight = "Peso obrigatório";
    setAnimalErrors(errs);
    if (!Object.keys(errs).length) {
      setPets((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          name: newAnimal.name,
          species: newAnimal.species,
          breed: newAnimal.breed || "Raça não informada",
          weight: parseFloat(newAnimal.weight) || 0,
          status: newAnimal.status,
          hasAlert: false,
          avatarColor: AVATAR_COLORS[prev.length % AVATAR_COLORS.length],
        },
      ]);
      setShowNewAnimal(false);
      setNewAnimal({ name: "", species: "Cão", breed: "", birthDate: "", weight: "", status: "Ativo", tutor: "", observations: "", startDiet: false });
      setAnimalErrors({});
    }
  }

  function handleStoolScore(cardId: string) {
    setStoolCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, score: 4, dismissing: true } : c))
    );
    setTimeout(() => {
      setStoolCards((prev) => prev.filter((c) => c.id !== cardId));
    }, 300);
  }

  function addIngredient() {
    setIngredients((prev) => [
      ...prev,
      { id: String(Date.now()), name: "", amount: 100, calPer100: 0, protein: 0, fat: 0, carbs: 0 },
    ]);
  }

  function removeIngredient(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }

  function updateIngredient(id: string, field: keyof Ingredient, value: string | number) {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }

  function getWeightData() {
    const counts: Record<string, number> = { "30d": 3, "90d": 6, "1a": WEIGHT_HISTORY.length };
    return WEIGHT_HISTORY.slice(-counts[periodFilter]);
  }

  function selectPet(id: string) {
    setSelectedPetId(id);
    setActiveTab("timeline");
    setAlertDismissed(false);
    setAppView("dashboard");
  }

  // ── Login screen ────────────────────────────────────────────────────────────
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
                <input
                  type="text"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: undefined })); }}
                  className={cn(inputCls, loginErrors.email && inputErrCls)}
                  placeholder="ana@nourisvet.com"
                />
                {loginErrors.email && <p className="text-xs text-red-500 mt-1">{loginErrors.email}</p>}
              </div>

              <div>
                <label className={labelCls}>Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: undefined })); }}
                    className={cn(inputCls, "pr-10", loginErrors.password && inputErrCls)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginErrors.password && <p className="text-xs text-red-500 mt-1">{loginErrors.password}</p>}
              </div>

              <button
                type="submit"
                className="w-full h-10 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition-colors"
              >
                Entrar
              </button>
            </form>

            <div className="mt-4 text-center">
              <button className="text-sm text-green-600 hover:text-green-700 hover:underline underline-offset-2 transition-colors">
                Esqueci minha senha
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-400 mt-5">
            Acesso apenas por convite · Nouris Vet © 2026
          </p>
        </div>
      </div>
    );
  }

  // ── Tab rendering ───────────────────────────────────────────────────────────
  function renderTimeline() {
    const data = getWeightData();
    const reversed = [...data].reverse();
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-zinc-900">Histórico de peso</h3>
          <div className="flex items-center gap-1 bg-zinc-100 rounded-md p-0.5">
            {(["30d", "90d", "1a"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setPeriodFilter(f)}
                className={cn(
                  "px-3 py-1 text-xs rounded font-medium transition-all",
                  periodFilter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {f === "30d" ? "30 dias" : f === "90d" ? "90 dias" : "1 ano"}
              </button>
            ))}
          </div>
        </div>

        <div className="relative pl-5">
          <div className="absolute left-0 top-2 bottom-2 w-px bg-zinc-200" />
          <div className="space-y-0">
            {reversed.map((rec, i) => (
              <div key={i} className="flex items-start gap-4 py-3 relative">
                <div className={cn(
                  "absolute -left-[17px] top-4 w-3 h-3 rounded-full border-2 border-white flex-shrink-0",
                  rec.alert ? "bg-red-500" : "bg-green-500"
                )} />
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xs text-zinc-400 w-16 flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {rec.date}
                  </span>
                  <span className="text-sm font-semibold text-zinc-900">{rec.weight} kg</span>
                  {rec.alert && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                      Alerta
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
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
              <button
                key={f}
                onClick={() => setPeriodFilter(f)}
                className={cn(
                  "px-3 py-1 text-xs rounded font-medium transition-all",
                  periodFilter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {f === "30d" ? "30d" : f === "90d" ? "90d" : "1a"}
              </button>
            ))}
          </div>
        </div>

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
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#16A34A"
                strokeWidth={2}
                fill="url(#wGrad)"
                dot={CustomDot as never}
                activeDot={{ r: 6, fill: "#16A34A", stroke: "white", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-4 mt-3 px-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            Peso normal
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            Alerta de peso
          </div>
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
          <button
            onClick={() => setShowDietCalc(true)}
            className="h-8 px-3 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-1.5"
          >
            <Utensils className="w-3.5 h-3.5" />
            Editar plano
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {macroCards.map((c) => (
            <div key={c.label} className="bg-white border border-zinc-200 rounded-lg p-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-1">{c.label}</p>
              <p className={cn("text-2xl font-bold", c.color)}>
                {c.value}
                <span className="text-xs font-normal text-zinc-400 ml-0.5">{c.unit}</span>
              </p>
              {c.pct !== null && (
                <div className="mt-2">
                  <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-current transition-all duration-500"
                      style={{ width: `${Math.round(c.pct * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{Math.round(c.pct * 100)}%</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ingredientes</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">Ingrediente</th>
                <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2">Qtd (g)</th>
                <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2">kcal</th>
              </tr>
            </thead>
            <tbody>
              {INIT_INGREDIENTS.map((ing) => {
                const kcal = (ing.calPer100 * ing.amount) / 100;
                return (
                  <tr key={ing.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-2.5 text-zinc-900">{ing.name}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-600">{ing.amount}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-600">{Math.round(kcal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderFezes() {
    const petStool = stoolCards.filter((c) => c.petId === selectedPetId && c.visible);
    if (petStool.length === 0) {
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-48 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-zinc-700">Sem avaliações pendentes</p>
          <p className="text-xs text-zinc-500 mt-1">Todas as fotos deste paciente foram avaliadas.</p>
        </div>
      );
    }
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <h3 className="text-sm font-semibold text-zinc-900">Triagem de fezes</h3>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            {petStool.length} pendente{petStool.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {petStool.map((card) => (
            <StoolCardView key={card.id} card={card} onScore={() => handleStoolScore(card.id)} />
          ))}
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
        {showAlert && (
          <AlertBanner petName={selectedPet.name} onDismiss={() => setAlertDismissed(true)} />
        )}

        <div className="px-6 pt-5 pb-4 border-b border-zinc-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0", selectedPet.avatarColor)}>
                {selectedPet.name[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">{selectedPet.name}</h1>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {selectedPet.breed} · {selectedPet.species} · {selectedPet.weight} kg
                </p>
                <div className="mt-1.5">
                  <StatusBadge status={selectedPet.status} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm rounded-md font-medium transition-all",
                  activeTab === t.id
                    ? "bg-green-50 text-green-700"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                {t.icon}
                {t.label}
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
        <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
          Selecione um paciente na barra lateral para ver o histórico clínico completo.
        </p>
        <button
          onClick={() => setShowNewAnimal(true)}
          className="mt-6 h-9 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Cadastrar novo animal
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
          <span className={cn(
            "px-2.5 py-1 text-sm font-medium rounded-full",
            pending.length > 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
          )}>
            {pending.length} pendente{pending.length !== 1 ? "s" : ""}
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-base font-semibold text-zinc-700">Todas as avaliações em dia!</p>
            <p className="text-sm text-zinc-400 mt-1">Nenhuma triagem pendente no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {visible.map((card) => (
              <StoolCardView key={card.id} card={card} onScore={() => handleStoolScore(card.id)} showPetName />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Shell ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-white" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-zinc-200 flex flex-col bg-white">
        <div className="px-4 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <PawPrint className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-zinc-900 text-sm">Nouris Vet</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pacientes</span>
            <button
              onClick={() => setShowNewAnimal(true)}
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo
            </button>
          </div>
          <div className="space-y-0.5 mt-1">
            {filteredPets.length === 0 ? (
              <p className="text-xs text-zinc-400 px-2 py-4 text-center">Nenhum resultado</p>
            ) : (
              filteredPets.map((pet) => (
                <PatientCard
                  key={pet.id}
                  pet={pet}
                  isSelected={selectedPetId === pet.id && appView === "dashboard"}
                  onClick={() => selectPet(pet.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="px-3 py-2 border-t border-zinc-100">
          <button
            onClick={() => setAppView("stool-global")}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors",
              appView === "stool-global"
                ? "bg-green-50 text-green-700 font-medium"
                : "text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <FlaskConical className="w-4 h-4 flex-shrink-0" />
            <span>Triagem de Fezes</span>
            {pendingStool.length > 0 && (
              <span className="ml-auto w-5 h-5 flex items-center justify-center bg-amber-500 text-white text-xs rounded-full font-semibold">
                {pendingStool.length}
              </span>
            )}
          </button>
        </div>

        <div className="px-3 py-3 border-t border-zinc-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700 flex-shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-900 truncate">Dra. Ana Costa</p>
            <p className="text-xs text-zinc-400 truncate">ana@nourisvet.com</p>
          </div>
          <button
            onClick={() => setScreen("login")}
            title="Sair"
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {appView === "stool-global"
          ? renderStoolGlobal()
          : selectedPet
          ? renderPatientProfile()
          : renderEmptyState()}
      </main>

      {/* New Animal Sheet */}
      <Sheet
        open={showNewAnimal}
        onClose={() => { setShowNewAnimal(false); setAnimalErrors({}); }}
        title="Cadastrar novo animal"
        width="480px"
        footer={
          <>
            <button
              onClick={() => { setShowNewAnimal(false); setAnimalErrors({}); }}
              className="h-9 px-4 border border-zinc-300 hover:bg-zinc-50 text-sm font-medium rounded-md transition-colors text-zinc-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitAnimal}
              className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition-colors"
            >
              Cadastrar
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
                <input
                  type="text"
                  value={newAnimal.name}
                  onChange={(e) => { setNewAnimal((p) => ({ ...p, name: e.target.value })); setAnimalErrors((p) => ({ ...p, name: "" })); }}
                  className={cn(inputCls, animalErrors.name && inputErrCls)}
                  placeholder="Ex: Bolinha"
                />
                {animalErrors.name && <p className="text-xs text-red-500 mt-1">{animalErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Espécie <span className="text-red-500">*</span></label>
                  <select
                    value={newAnimal.species}
                    onChange={(e) => setNewAnimal((p) => ({ ...p, species: e.target.value as "Cão" | "Gato" | "Outro" }))}
                    className={cn(inputCls, "cursor-pointer")}
                  >
                    <option>Cão</option>
                    <option>Gato</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    value={newAnimal.status}
                    onChange={(e) => setNewAnimal((p) => ({ ...p, status: e.target.value as Status }))}
                    className={cn(inputCls, "cursor-pointer")}
                  >
                    <option>Ativo</option>
                    <option>Pendente</option>
                    <option>Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Raça</label>
                <input
                  type="text"
                  value={newAnimal.breed}
                  onChange={(e) => setNewAnimal((p) => ({ ...p, breed: e.target.value }))}
                  className={inputCls}
                  placeholder="Ex: Golden Retriever"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Data de nascimento</label>
                  <input
                    type="date"
                    value={newAnimal.birthDate}
                    onChange={(e) => setNewAnimal((p) => ({ ...p, birthDate: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Peso atual (kg) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={newAnimal.weight}
                    onChange={(e) => { setNewAnimal((p) => ({ ...p, weight: e.target.value })); setAnimalErrors((p) => ({ ...p, weight: "" })); }}
                    className={cn(inputCls, animalErrors.weight && inputErrCls)}
                    placeholder="Ex: 5.2"
                    step="0.1"
                    min="0"
                  />
                  {animalErrors.weight && <p className="text-xs text-red-500 mt-1">{animalErrors.weight}</p>}
                </div>
              </div>

              <div>
                <label className={labelCls}>Foto do pet</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400">
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-2 h-9 px-3 border border-zinc-300 rounded-md text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Selecionar foto
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-5">
            <p className={sectionLabelCls}>Tutor responsável</p>
            <div>
              <label className={labelCls}>Buscar tutor existente</label>
              <input
                type="text"
                value={newAnimal.tutor}
                onChange={(e) => setNewAnimal((p) => ({ ...p, tutor: e.target.value }))}
                className={inputCls}
                placeholder="Nome ou e-mail do tutor..."
              />
              <p className="text-xs text-zinc-400 mt-2">
                Tutor não encontrado?{" "}
                <button type="button" className="text-green-600 hover:underline underline-offset-2">
                  Convidar por e-mail
                </button>
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-5">
            <p className={sectionLabelCls}>Observações clínicas</p>
            <textarea
              value={newAnimal.observations}
              onChange={(e) => setNewAnimal((p) => ({ ...p, observations: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors resize-none"
              placeholder="Histórico, alergias, medicamentos em uso..."
            />
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newAnimal.startDiet}
                onChange={(e) => setNewAnimal((p) => ({ ...p, startDiet: e.target.checked }))}
                className="w-4 h-4 rounded border-zinc-300 text-green-600 accent-green-600"
              />
              <span className="text-sm text-zinc-700">Iniciar plano de dieta agora</span>
            </label>
          </div>
        </form>
      </Sheet>

      {/* Diet Calculator Sheet */}
      <Sheet
        open={showDietCalc}
        onClose={() => setShowDietCalc(false)}
        title="Calculadora de Dieta"
        width="560px"
        footer={
          <>
            <button
              onClick={() => setShowDietCalc(false)}
              className="h-9 px-4 hover:bg-zinc-50 text-sm font-medium rounded-md transition-colors text-zinc-700"
            >
              Salvar como rascunho
            </button>
            <button
              onClick={() => setShowDietCalc(false)}
              className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition-colors"
            >
              Ativar plano
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Live macros */}
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

            {/* Donut */}
            <div className="flex items-center justify-center gap-8">
              <PieChart width={140} height={140}>
                <Pie
                  data={[
                    { name: "Proteína", value: Math.max(Math.round(macros.protein), 0.1) },
                    { name: "Gordura", value: Math.max(Math.round(macros.fat), 0.1) },
                    { name: "Carboidratos", value: Math.max(Math.round(macros.carbs), 0.1) },
                  ]}
                  cx={65}
                  cy={65}
                  innerRadius={42}
                  outerRadius={62}
                  dataKey="value"
                  strokeWidth={2}
                >
                  {MACRO_COLORS.map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="space-y-1.5">
                {[
                  { label: "Proteína", color: MACRO_COLORS[0] },
                  { label: "Gordura", color: MACRO_COLORS[1] },
                  { label: "Carboidratos", color: MACRO_COLORS[2] },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-2 text-xs text-zinc-600">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: m.color }} />
                    {m.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className={sectionLabelCls}>Ingredientes</p>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing) => (
                <div key={ing.id} className="grid grid-cols-[1fr_70px_70px_28px] gap-2 items-center">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(ing.id, "name", e.target.value)}
                    placeholder="Ingrediente"
                    className={cn(inputCls, "h-8 text-xs")}
                  />
                  <input
                    type="number"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(ing.id, "amount", parseFloat(e.target.value) || 0)}
                    placeholder="g"
                    className={cn(inputCls, "h-8 text-xs text-center")}
                    min="0"
                  />
                  <input
                    type="number"
                    value={ing.calPer100}
                    onChange={(e) => updateIngredient(ing.id, "calPer100", parseFloat(e.target.value) || 0)}
                    placeholder="cal/100g"
                    className={cn(inputCls, "h-8 text-xs text-center")}
                    min="0"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(ing.id)}
                    className="h-8 w-7 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_70px_70px_28px] gap-2 mt-1 px-0">
              <span className="text-xs text-zinc-400 pl-1">Nome</span>
              <span className="text-xs text-zinc-400 text-center">Qtd (g)</span>
              <span className="text-xs text-zinc-400 text-center">kcal/100g</span>
              <span />
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-zinc-100 pt-5">
            <p className={sectionLabelCls}>Instruções para o tutor</p>
            <textarea
              value={dietNotes}
              onChange={(e) => setDietNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors resize-none"
              placeholder="Frequência de refeições, preparo, observações..."
            />
          </div>
        </div>
      </Sheet>
    </div>
  );
}

// ── Stool card (outside App to avoid re-declaration on renders) ───────────────
function StoolCardView({
  card,
  onScore,
  showPetName,
}: {
  card: StoolCard;
  onScore: (score: number) => void;
  showPetName?: boolean;
}) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  function pick(score: number) {
    setSelectedScore(score);
    setTimeout(() => onScore(score), 160);
  }

  return (
    <div
      className={cn(
        "bg-white border border-zinc-200 rounded-lg overflow-hidden transition-all duration-300",
        card.dismissing ? "opacity-0 scale-95" : "opacity-100 scale-100"
      )}
    >
      <div className="bg-zinc-100 h-32 flex items-center justify-center">
        <FlaskConical className="w-10 h-10 text-zinc-300" />
      </div>

      <div className="p-3">
        {showPetName && (
          <p className="text-xs font-semibold text-zinc-700 mb-0.5">{card.petName}</p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
          <Clock className="w-3 h-3" />
          {card.date}
        </div>

        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-zinc-600">Escala Bristol</span>
          {card.score !== null || selectedScore !== null ? (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
              Avaliado
            </span>
          ) : (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
              Pendente
            </span>
          )}
        </div>

        <div className="flex gap-1 flex-wrap mt-2">
          {BRISTOL.map((b) => (
            <button
              key={b.score}
              onClick={() => pick(b.score)}
              title={b.desc}
              className={cn(
                "w-7 h-7 rounded text-xs font-semibold transition-all",
                selectedScore === b.score
                  ? "bg-green-600 text-white"
                  : b.score <= 2
                  ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  : b.score === 4
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : b.score >= 6
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {b.score}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
