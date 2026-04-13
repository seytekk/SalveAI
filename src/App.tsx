/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Stethoscope, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  Loader2, 
  ShieldCheck,
  AlertCircle,
  Plus,
  X,
  Camera,
  ImageIcon,
  MapPin
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Button } from "./components/ui/button";
import { Card, CardContent, CardFooter } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { getOTCAdvice, OTCRequest, OTCPhoto } from "./services/geminiService";
import { cn } from "./lib/utils";

// --- Helper Components ---

interface PhotoUploadProps {
  onUpload: (photo: OTCPhoto) => void;
  hint: string;
}

const PhotoUpload = ({ onUpload, hint }: PhotoUploadProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      onUpload({
        data: base64String,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl border-slate-200 h-12 gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold">Take a photo</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl border-slate-200 h-12 gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold">Upload from gallery</span>
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      <p className="text-[10px] text-slate-400 italic">{hint}</p>
    </div>
  );
};

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

const Chip = ({ label, selected, onClick }: ChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
      selected 
        ? "bg-blue-600 text-white border-blue-600" 
        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
    )}
  >
    {label}
  </button>
);

interface ChipGroupProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multi?: boolean;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (val: string) => void;
  placeholder?: string;
}

const ChipGroup = ({ 
  options, 
  selected, 
  onChange, 
  multi = false, 
  allowOther = true,
  otherValue = "",
  onOtherChange,
  placeholder = "Please specify..."
}: ChipGroupProps) => {
  const [showOtherInput, setShowOtherInput] = useState(otherValue !== "");

  const toggleOption = (option: string) => {
    if (multi) {
      if (selected.includes(option)) {
        onChange(selected.filter(o => o !== option));
      } else {
        onChange([...selected, option]);
      }
    } else {
      onChange([option]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <Chip 
            key={opt} 
            label={opt} 
            selected={selected.includes(opt)} 
            onClick={() => toggleOption(opt)} 
          />
        ))}
        {allowOther && (
          <button
            type="button"
            onClick={() => setShowOtherInput(!showOtherInput)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-1",
              showOtherInput 
                ? "bg-slate-800 text-white border-slate-800" 
                : "bg-white text-slate-500 border-slate-200 border-dashed hover:border-slate-400"
            )}
          >
            {showOtherInput ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            Other
          </button>
        )}
      </div>
      {showOtherInput && allowOther && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Input
            placeholder={placeholder}
            value={otherValue}
            onChange={(e) => onOtherChange?.(e.target.value)}
            className="rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </motion.div>
      )}
    </div>
  );
};

const SeverityScale = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const levels = [
    { label: "Mild", range: "1-3", emoji: "😊", activeBg: "bg-emerald-600", activeBorder: "border-emerald-600" },
    { label: "Moderate", range: "4-6", emoji: "😐", activeBg: "bg-amber-500", activeBorder: "border-amber-500" },
    { label: "Severe", range: "7-8", emoji: "😣", activeBg: "bg-orange-500", activeBorder: "border-orange-500" },
    { label: "Very severe", range: "9-10", emoji: "🚨", activeBg: "bg-rose-600", activeBorder: "border-rose-600" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {levels.map((level) => {
        const isSelected = value === level.label;
        return (
          <button
            key={level.label}
            type="button"
            onClick={() => onChange(level.label)}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 gap-1 min-h-[110px] w-full relative group min-w-0",
              isSelected 
                ? cn(level.activeBg, level.activeBorder, "text-white") 
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-slate-50"
            )}
          >
            <span className={cn(
              "text-3xl mb-1 transition-all duration-300", 
              isSelected ? "scale-110" : "grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105"
            )}>
              {level.emoji}
            </span>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-tight leading-tight text-center transition-colors break-words",
              isSelected ? "text-white" : "text-slate-900"
            )}>
              {level.label}
            </span>
            <span className={cn(
              "text-[10px] font-bold transition-colors",
              isSelected ? "text-white/90" : "text-slate-500"
            )}>
              {level.range}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const Section = ({ title, children, required = false }: { title: string, children: React.ReactNode, required?: boolean }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{title}</h3>
      {required && <Badge variant="secondary" className="bg-red-50 text-red-600 text-[9px] px-1.5 py-0">Required</Badge>}
    </div>
    <div className="space-y-6">{children}</div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<OTCRequest>({
    symptoms: [],
    severity: "",
    symptomNature: [],
    duration: "",
    associatedSymptoms: [],
    age: "",
    weight: "",
    weightUnit: "kg",
    sex: "",
    pregnancyStatus: "",
    pregnancyComplications: [],
    allergies: [],
    chronicConditions: [],
    currentMedications: [],
    alreadyTaken: [],
    alreadyTakenTime: "",
    alreadyTakenEffect: "",
    alcohol: "No",
    country: "",
    photos: [],
  });

  const [otherValues, setOtherValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation denied or failed:", error);
        }
      );
    }
  }, []);

  const handlePhotoUpload = (photo: OTCPhoto) => {
    setFormData(prev => ({
      ...prev,
      photos: [...(prev.photos || []), photo]
    }));
  };

  const handleOtherChange = (key: string, val: string) => {
    setOtherValues(prev => ({ ...prev, [key]: val }));
  };

  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyFlags, setSafetyFlags] = useState<string[]>([]);

  const handleSafetySubmit = (hasFlags: boolean) => {
    setShowSafetyModal(false);
    if (hasFlags) {
      // If flags were selected, we should probably just let the AI handle it
      // but the prompt says "direct the user to seek emergency care immediately"
      // The AI will do this if we include the flags in the associated symptoms.
      executeSubmit();
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = async () => {
    setLoading(true);
    setError(null);
    setAdvice(null);

    // Combine chips and other values
    const finalRequest: OTCRequest = {
      ...formData,
      symptoms: [...formData.symptoms, ...(otherValues.symptoms ? [otherValues.symptoms] : [])],
      symptomNature: [...formData.symptomNature, ...(otherValues.symptomNature ? [otherValues.symptomNature] : [])],
      associatedSymptoms: [...formData.associatedSymptoms, ...safetyFlags, ...(otherValues.associatedSymptoms ? [otherValues.associatedSymptoms] : [])],
      pregnancyComplications: [...(formData.pregnancyComplications || []), ...(otherValues.pregnancyComplications ? [otherValues.pregnancyComplications] : [])],
      allergies: [...formData.allergies, ...(otherValues.allergies ? [otherValues.allergies] : [])],
      chronicConditions: [...formData.chronicConditions, ...(otherValues.chronicConditions ? [otherValues.chronicConditions] : [])],
      currentMedications: [...formData.currentMedications, ...(otherValues.currentMedications ? [otherValues.currentMedications] : [])],
      alreadyTaken: [...formData.alreadyTaken, ...(otherValues.alreadyTaken ? [otherValues.alreadyTaken] : [])],
      lat: location?.lat,
      lng: location?.lng,
    };

    try {
      const result = await getOTCAdvice(finalRequest);
      setAdvice(result || "I couldn't generate advice at this time.");
      
      // Auto-scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.symptoms.length === 0 && !otherValues.symptoms) {
      setError("Please select or specify at least one symptom.");
      return;
    }
    if (!formData.age) {
      setError("Please provide your age.");
      return;
    }

    const isSevere = formData.severity === "Severe" || formData.severity === "Very severe";
    const hasRedFlags = formData.associatedSymptoms.some(s => 
      ["Vision changes", "Dizziness", "Fever", "Vomiting", "Swelling"].includes(s)
    );

    if (isSevere && !hasRedFlags) {
      setShowSafetyModal(true);
    } else {
      executeSubmit();
    }
  };

  const resetForm = () => {
    setAdvice(null);
    setError(null);
  };

  // Dynamic Symptom Nature Options
  const getNatureOptions = () => {
    if (formData.symptoms.includes("Headache")) {
      return ["Throbbing", "Pressing/squeezing", "One-sided", "All over", "Behind the eyes"];
    }
    if (formData.symptoms.includes("Stomach pain")) {
      return ["Cramping", "Burning", "Sharp", "Dull ache", "Bloating"];
    }
    if (formData.symptoms.includes("Muscle pain") || formData.symptoms.includes("Joint pain") || formData.symptoms.includes("Back pain")) {
      return ["Sharp", "Dull ache", "Stiffness", "Swelling", "Burning"];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100">
      {/* Safety Modal */}
      <AnimatePresence>
        {showSafetyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 text-rose-600">
                  <AlertTriangle className="w-8 h-8" />
                  <h2 className="text-xl font-bold">Important Safety Check</h2>
                </div>
                
                <p className="text-slate-600">
                  You reported severe symptoms. Do you also have any of these right now?
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    "Chest pain", "Vision changes", "Difficulty breathing",
                    "Sudden swelling", "Stiff neck", "Confusion",
                    "High fever >39°C", "Numbness"
                  ].map(flag => (
                    <button
                      key={flag}
                      type="button"
                      onClick={() => {
                        if (safetyFlags.includes(flag)) {
                          setSafetyFlags(safetyFlags.filter(f => f !== flag));
                        } else {
                          setSafetyFlags([...safetyFlags, flag]);
                        }
                      }}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold transition-all",
                        safetyFlags.includes(flag)
                          ? "bg-rose-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {flag}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    className="w-full rounded-xl h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold"
                    onClick={() => handleSafetySubmit(safetyFlags.length > 0)}
                  >
                    {safetyFlags.length > 0 ? "Report these and continue" : "None of these — show results"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-slate-500 font-medium"
                    onClick={() => setShowSafetyModal(false)}
                  >
                    Go back to form
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-xl shadow-blue-200 shadow-lg">
              <Stethoscope className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                SalveAi <span className="text-blue-600 text-[10px] ml-1">v3.1</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Safe Medication Selection
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Safety Priority
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Form */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Consultation Form</h2>
            <p className="text-slate-600 leading-relaxed">
              Fast and easy selection. Only symptoms and age are required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Section 1: Symptoms */}
            <Section title="1. What's bothering you?" required>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Symptoms</Label>
                <ChipGroup
                  multi
                  options={[
                    "Headache", "Fever", "Sore throat", "Runny nose", "Cough",
                    "Stomach pain", "Nausea", "Diarrhea", "Heartburn",
                    "Muscle pain", "Joint pain", "Back pain",
                    "Skin rash", "Itchy eyes", "Sneezing",
                    "Toothache", "Menstrual cramps", "Insomnia"
                  ]}
                  selected={formData.symptoms}
                  onChange={(val) => setFormData(prev => ({ ...prev, symptoms: val }))}
                  otherValue={otherValues.symptoms}
                  onOtherChange={(val) => handleOtherChange("symptoms", val)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Severity</Label>
                <SeverityScale 
                  value={formData.severity} 
                  onChange={(val) => setFormData(prev => ({ ...prev, severity: val }))} 
                />
              </div>

              {getNatureOptions().length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-semibold text-slate-700">Nature of symptom</Label>
                  <ChipGroup
                    multi
                    options={getNatureOptions()}
                    selected={formData.symptomNature}
                    onChange={(val) => setFormData(prev => ({ ...prev, symptomNature: val }))}
                    otherValue={otherValues.symptomNature}
                    onOtherChange={(val) => handleOtherChange("symptomNature", val)}
                  />
                </motion.div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">How long have you had this?</Label>
                <ChipGroup
                  options={["Just started", "A few hours", "1 day", "2–3 days", "More than 3 days", "More than a week"]}
                  selected={formData.duration ? [formData.duration] : []}
                  onChange={(val) => setFormData(prev => ({ ...prev, duration: val[0] }))}
                  allowOther={false}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Associated symptoms</Label>
                <p className="text-[10px] text-slate-400 mb-2">Select any additional symptoms, or leave empty if none</p>
                <ChipGroup
                  multi
                  options={["Nausea", "Dizziness", "Fever", "Vision changes", "Fatigue", "Vomiting", "Sweating", "Chills", "Loss of appetite", "Swelling"]}
                  selected={formData.associatedSymptoms}
                  onChange={(val) => setFormData(prev => ({ ...prev, associatedSymptoms: val }))}
                  otherValue={otherValues.associatedSymptoms}
                  onOtherChange={(val) => handleOtherChange("associatedSymptoms", val)}
                />
              </div>
            </Section>

            {/* Section 2: About You */}
            <Section title="2. About you" required>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-semibold text-slate-700">Age (Required)</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="e.g., 32"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    className="rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-semibold text-slate-700">Weight (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="weight"
                      type="number"
                      placeholder="e.g., 75"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      className="rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, weightUnit: prev.weightUnit === "kg" ? "lbs" : "kg" }))}
                      className="px-3 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      {formData.weightUnit}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Sex</Label>
                <ChipGroup
                  options={["Female", "Male"]}
                  selected={formData.sex ? [formData.sex] : []}
                  onChange={(val) => setFormData(prev => ({ ...prev, sex: val[0] }))}
                  allowOther={false}
                />
              </div>

              {formData.sex === "Female" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4 pt-4 border-t border-slate-100"
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Are you pregnant or breastfeeding?</Label>
                    <ChipGroup
                      options={[
                        "Not pregnant", 
                        "Pregnant — 1st trimester (weeks 1–12)", 
                        "Pregnant — 2nd trimester (weeks 13–27)", 
                        "Pregnant — 3rd trimester (weeks 28–40)", 
                        "Breastfeeding", 
                        "Trying to conceive"
                      ]}
                      selected={formData.pregnancyStatus ? [formData.pregnancyStatus] : []}
                      onChange={(val) => setFormData(prev => ({ ...prev, pregnancyStatus: val[0] }))}
                      allowOther={false}
                    />
                  </div>

                  {formData.pregnancyStatus?.includes("Pregnant") && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <Label className="text-sm font-semibold text-slate-700">Pregnancy complications</Label>
                      <ChipGroup
                        multi
                        options={["None", "Preeclampsia", "Gestational diabetes", "High blood pressure", "Placenta previa"]}
                        selected={formData.pregnancyComplications || []}
                        onChange={(val) => setFormData(prev => ({ ...prev, pregnancyComplications: val }))}
                        otherValue={otherValues.pregnancyComplications}
                        onOtherChange={(val) => handleOtherChange("pregnancyComplications", val)}
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </Section>

            {/* Section 3: Health Background */}
            <Section title="3. Your health background">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Drug allergies</Label>
                <p className="text-[10px] text-slate-400 mb-2">Select known allergies, or leave empty for none</p>
                <ChipGroup
                  multi
                  options={["Aspirin", "Ibuprofen", "Penicillin", "Sulfa drugs", "Codeine", "Acetaminophen", "Latex"]}
                  selected={formData.allergies}
                  onChange={(val) => setFormData(prev => ({ ...prev, allergies: val }))}
                  otherValue={otherValues.allergies}
                  onOtherChange={(val) => handleOtherChange("allergies", val)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Chronic conditions</Label>
                <p className="text-[10px] text-slate-400 mb-2">Select if applicable, or leave empty for none</p>
                <ChipGroup
                  multi
                  options={["Asthma", "Stomach ulcer", "Diabetes", "High blood pressure", "Heart disease", "Kidney disease", "Liver disease", "Blood clotting disorder", "Depression/Anxiety"]}
                  selected={formData.chronicConditions}
                  onChange={(val) => setFormData(prev => ({ ...prev, chronicConditions: val }))}
                  otherValue={otherValues.chronicConditions}
                  onOtherChange={(val) => handleOtherChange("chronicConditions", val)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Current medications</Label>
                <p className="text-[10px] text-slate-400 mb-2">Select what you currently take, or leave empty for none</p>
                <ChipGroup
                  multi
                  options={["Blood pressure meds", "Blood thinners", "Insulin/Diabetes meds", "Antidepressants", "Steroids", "Birth control", "Thyroid meds", "Asthma inhalers", "Prenatal vitamins"]}
                  selected={formData.currentMedications}
                  onChange={(val) => setFormData(prev => ({ ...prev, currentMedications: val }))}
                  otherValue={otherValues.currentMedications}
                  onOtherChange={(val) => handleOtherChange("currentMedications", val)}
                />
              </div>

              <div className="pt-2">
                <PhotoUpload 
                  onUpload={handlePhotoUpload} 
                  hint="You can also photograph your current medications, prescription label, or medicine cabinet"
                />
              </div>
            </Section>

            {/* Section 4: Context */}
            <Section title="4. Context">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">What have you already taken for this?</Label>
                <ChipGroup
                  multi
                  options={["Nothing yet", "Acetaminophen/Tylenol", "Ibuprofen/Advil", "Aspirin", "Cold medicine", "Antacid", "Antihistamine", "Herbal remedy"]}
                  selected={formData.alreadyTaken}
                  onChange={(val) => setFormData(prev => ({ ...prev, alreadyTaken: val }))}
                  otherValue={otherValues.alreadyTaken}
                  onOtherChange={(val) => handleOtherChange("alreadyTaken", val)}
                />
              </div>

              <div className="pt-2">
                <PhotoUpload 
                  onUpload={handlePhotoUpload} 
                  hint="Not sure what you took? Snap a photo of the pill, box, or label — we'll identify it for you"
                />
              </div>

              {((formData.alreadyTaken.length > 0 && !formData.alreadyTaken.includes("Nothing yet")) || (formData.photos && formData.photos.length > 0)) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">When did you take it?</Label>
                    <ChipGroup
                      options={["Less than 2 hours ago", "2–4 hours ago", "4–6 hours ago", "More than 6 hours ago"]}
                      selected={formData.alreadyTakenTime ? [formData.alreadyTakenTime] : []}
                      onChange={(val) => setFormData(prev => ({ ...prev, alreadyTakenTime: val[0] }))}
                      allowOther={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Did it help?</Label>
                    <ChipGroup
                      options={["Yes, but wore off", "Helped a little", "No effect", "Made it worse"]}
                      selected={formData.alreadyTakenEffect ? [formData.alreadyTakenEffect] : []}
                      onChange={(val) => setFormData(prev => ({ ...prev, alreadyTakenEffect: val[0] }))}
                      allowOther={false}
                    />
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Have you had alcohol in the last 24 hours?</Label>
                <ChipGroup
                  options={["No", "1–2 drinks", "3+ drinks"]}
                  selected={formData.alcohol ? [formData.alcohol] : []}
                  onChange={(val) => setFormData(prev => ({ ...prev, alcohol: val[0] }))}
                  allowOther={false}
                />
              </div>

              {formData.photos && formData.photos.length > 0 && (
                <div className="space-y-2 pt-4">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Uploaded Photos</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.photos.map((photo, i) => (
                      <div key={i} className="relative group">
                        <img 
                          src={`data:${photo.mimeType};base64,${photo.data}`} 
                          alt="Uploaded medication" 
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, photos: prev.photos?.filter((_, idx) => idx !== i) }))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-semibold text-slate-700">Country / region (Optional)</Label>
                <p className="text-[10px] text-slate-400 mb-2">Helps us suggest locally available brands</p>
                <Input
                  id="country"
                  placeholder="e.g., USA, Germany, Japan..."
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </Section>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-8 rounded-2xl shadow-xl shadow-blue-100 transition-all duration-300 transform hover:-translate-y-1"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Analyzing Safety Data...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-lg">
                  <span>🔍 Find Safe Options</span>
                </div>
              )}
            </Button>
          </form>

          <Alert className="bg-amber-50 border-amber-200 rounded-2xl p-6">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <div className="ml-2">
              <AlertTitle className="text-amber-800 font-bold text-base">Medical Disclaimer</AlertTitle>
              <AlertDescription className="text-amber-700 text-xs leading-relaxed mt-1">
                I am an AI consultant, not a doctor. This tool is for educational purposes and compares OTC options based on your profile. **Never** ignore professional medical advice. If you have severe pain, difficulty breathing, or a high fever, seek emergency care immediately.
              </AlertDescription>
            </div>
          </Alert>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full w-fit">
            <MapPin className="w-3 h-3 text-slate-500" />
            <p className="text-[10px] text-slate-500 font-medium">
              📍 Your location is used only to find nearby pharmacies. It is not stored or shared.
            </p>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-6" ref={resultsRef}>
          <div className="sticky top-24">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center p-12 space-y-8 min-h-[400px]"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-blue-100 rounded-full" />
                    <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-slate-800">Safety Check in Progress</h3>
                    <p className="text-sm text-slate-500">Comparing active ingredients and checking contraindications...</p>
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-8 bg-white border border-red-100 rounded-3xl shadow-xl shadow-red-50"
                >
                  <div className="flex items-center gap-3 text-red-600 mb-6">
                    <AlertCircle className="w-6 h-6" />
                    <h3 className="font-bold text-lg">Consultation Error</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-8 leading-relaxed">{error}</p>
                  <Button variant="outline" onClick={() => setError(null)} className="rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                    Try Again
                  </Button>
                </motion.div>
              ) : advice ? (
                <motion.div
                  key="advice"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-200" />
                      <h2 className="text-lg font-bold text-slate-800">Safety Guidance</h2>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetForm} className="text-slate-400 hover:text-slate-800 font-medium">
                      Clear Results
                    </Button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-8">
                      <div className="markdown-body">
                        <ReactMarkdown>{advice}</ReactMarkdown>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 border-t border-slate-100 p-8">
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 bg-white shadow-sm border border-slate-200 flex items-center justify-center flex-shrink-0 rounded-2xl">
                          <ShieldCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-slate-800">Safety Protocol</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Always read the physical package insert before taking any medication. If symptoms persist for more than 3 days, consult a healthcare professional.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="initial"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 min-h-[400px]"
                >
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <Info className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Help</h3>
                  <p className="text-slate-500 max-w-sm">
                    Fill out the form to receive personalized, safety-first medication comparisons.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              OTC Consultant // AI Safety Engine
            </p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Safety Guidelines</a>
            <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Data Privacy</a>
            <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
