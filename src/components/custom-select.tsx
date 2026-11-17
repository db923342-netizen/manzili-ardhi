import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { ChevronDown, Check, Search, X, MapPin } from "lucide-react";
import { wilayasList, getCommunesForWilaya, findWilaya, normalizeWilayaName } from "@/lib/data";

export type SelectOption = {
  value: string;
  label: string;
  subLabel?: string;
  icon?: ReactNode;
  badge?: string;
};

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "اختر...",
  searchable = false,
  searchPlaceholder = "بحث...",
  disabled = false,
  className = "",
  helperText,
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  helperText?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  const selectedOption = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.subLabel && o.subLabel.toLowerCase().includes(q)),
    );
  }, [options, searchQuery]);

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setSearchQuery("");
          }
        }}
        className={`w-full flex items-center justify-between rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition text-right cursor-pointer select-none ${
          isOpen ? "ring-2 ring-gold border-gold" : "hover:border-gold/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span
            className={selectedOption ? "font-medium text-foreground" : "text-muted-foreground"}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="rounded bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 font-bold">
              {selectedOption.badge}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180 text-gold" : ""
          }`}
        />
      </button>

      {helperText && <p className="text-[11px] text-muted-foreground px-0.5">{helperText}</p>}

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border border-border bg-card shadow-2xl max-h-72 flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
          {searchable && (
            <div className="p-2 border-b border-border bg-muted/40 sticky top-0 z-10 flex items-center gap-2">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <div className="overflow-y-auto divide-y divide-border/20 p-1 max-h-56">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                لا توجد نتائج مطابقة
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-right text-sm rounded-lg transition cursor-pointer ${
                      isSelected
                        ? "bg-gold/15 text-gold font-bold"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon}
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="text-xs text-muted-foreground">({opt.subLabel})</span>
                      )}
                    </div>
                    {isSelected && <Check size={16} className="text-gold shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomWilayaCommune({
  wilaya,
  setWilaya,
  commune,
  setCommune,
  allOption = false,
  required = false,
  disabled = false,
}: {
  wilaya: string;
  setWilaya: (w: string) => void;
  commune?: string;
  setCommune?: (c: string) => void;
  allOption?: boolean;
  required?: boolean;
  disabled?: boolean;
}) {
  const [customMode, setCustomMode] = useState(false);

  // Normalize wilaya
  const currentWilayaObj = useMemo(() => findWilaya(wilaya), [wilaya]);
  const activeWilayaName = currentWilayaObj ? currentWilayaObj.nameAr : normalizeWilayaName(wilaya);

  // Official communes for the selected wilaya
  const baseCommunes = useMemo(
    () => (activeWilayaName ? getCommunesForWilaya(activeWilayaName) : []),
    [activeWilayaName],
  );

  // Display communes list
  const displayCommunes = useMemo(() => {
    const list = [...baseCommunes];
    const trimmed = (commune ?? "").trim();
    if (trimmed && trimmed !== "__custom__" && !list.includes(trimmed)) {
      list.unshift(trimmed);
    }
    return list;
  }, [baseCommunes, commune]);

  const handleWilayaChange = (val: string) => {
    setWilaya(val);
    setCommune?.("");
    setCustomMode(false);
  };

  const isCustom = customMode || (!!commune && !baseCommunes.includes(commune) && commune !== "");

  // Convert wilayasList to SelectOption[]
  const wilayaOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [];
    if (allOption) {
      list.push({
        value: "",
        label: "كل الولايات (01 إلى 69)",
      });
    }
    wilayasList.forEach((w) => {
      list.push({
        value: w.nameAr,
        label: `${w.code} - ${w.nameAr}`,
        subLabel: w.name,
      });
    });
    return list;
  }, [allOption]);

  // Convert displayCommunes to SelectOption[]
  const communeOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [];
    if (!activeWilayaName) {
      list.push({
        value: "",
        label: allOption ? "كل البلديات (اختر ولاية للتحديد)" : "اختر الولاية أولاً",
      });
    } else {
      if (allOption) {
        list.push({
          value: "",
          label: `كل بلديات ${activeWilayaName}`,
        });
      }
    }

    displayCommunes.forEach((c) => {
      list.push({
        value: c,
        label: c,
      });
    });

    list.push({
      value: "__custom__",
      label: "✏️ كتابة اسم البلدية أو الحي يدوياً...",
    });

    return list;
  }, [activeWilayaName, allOption, displayCommunes]);

  return (
    <>
      <CustomSelect
        label="الولاية (69 ولاية)"
        value={activeWilayaName}
        onChange={handleWilayaChange}
        options={wilayaOptions}
        placeholder={allOption ? "كل الولايات (01 إلى 69)" : "اختر الولاية (01 إلى 69)"}
        searchable={true}
        searchPlaceholder="ابحث باسم الولاية أو رقمها..."
        disabled={disabled}
      />

      {isCustom ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-foreground">البلدية</label>
            <button
              type="button"
              onClick={() => {
                setCustomMode(false);
                setCommune?.(baseCommunes[0] || "");
              }}
              className="text-xs font-bold text-primary hover:text-gold cursor-pointer"
            >
              الرجوع للقائمة المنسدلة ←
            </button>
          </div>
          <div className="relative flex items-center">
            <input
              type="text"
              required={required && !allOption}
              className="w-full rounded-lg border border-input bg-card text-foreground px-3 py-2.5 pl-16 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder={
                activeWilayaName
                  ? `اكتب اسم بلدية أو حي في ${activeWilayaName}...`
                  : "اكتب اسم البلدية أو الحي..."
              }
              value={commune ?? ""}
              onChange={(e) => setCommune?.(e.target.value)}
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => {
                setCustomMode(false);
                setCommune?.(baseCommunes[0] || "");
              }}
              className="absolute left-2 rounded bg-secondary px-2 py-1 text-xs font-bold text-primary hover:bg-gold hover:text-deep transition cursor-pointer"
              title="الرجوع إلى القائمة المنسدلة"
            >
              قائمة
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground px-0.5">كتابة بلدية أو حي يدوياً</p>
        </div>
      ) : (
        <div className="space-y-1">
          <CustomSelect
            label="البلدية"
            value={commune ?? ""}
            onChange={(val) => {
              if (val === "__custom__") {
                setCustomMode(true);
                setCommune?.("");
              } else {
                setCommune?.(val);
              }
            }}
            options={communeOptions}
            placeholder={
              !activeWilayaName
                ? allOption
                  ? "كل البلديات (أو اختر ولاية)"
                  : "اختر الولاية أولاً"
                : allOption
                  ? `كل بلديات ${activeWilayaName}`
                  : `اختر بلدية من ${activeWilayaName}`
            }
            searchable={displayCommunes.length > 5}
            searchPlaceholder="ابحث عن البلدية..."
            disabled={disabled}
          />
          <div className="text-[11px] text-muted-foreground px-0.5 flex items-center justify-between">
            <span>
              {activeWilayaName
                ? displayCommunes.length > 0
                  ? `${displayCommunes.length} بلدية متوفرة`
                  : "قائمة البلديات"
                : "اختر الولاية أولاً لتظهر بلدياتها"}
            </span>
            <button
              type="button"
              onClick={() => setCustomMode(true)}
              className="font-bold text-primary hover:underline hover:text-gold transition cursor-pointer"
            >
              كتابة يدوية ✏️
            </button>
          </div>
        </div>
      )}
    </>
  );
}
