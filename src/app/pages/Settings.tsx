import { useCallback, useEffect, useState } from "react";
import {
  User,
  Bell,
  ChevronRight,
  Mail,
  Phone,
  Building,
  Save,
  Check,
  Globe,
  MapPin,
  Briefcase,
  Building2,
  Info,
  Sparkles,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";

const sections = [
  {
    id: "personal",
    icon: User,
    label: "Personal Information",
    description: "Profile details and account identity",
    accent: "from-blue-500 to-sky-500",
    soft: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "company",
    icon: Building2,
    label: "Company Information",
    description: "Business records and office details",
    accent: "from-violet-500 to-fuchsia-500",
    soft: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Notifications",
    description: "Alerts, reminders, and report updates",
    accent: "from-amber-500 to-orange-500",
    soft: "bg-amber-50",
    iconColor: "text-amber-600",
  },
] as const;

type SectionId = (typeof sections)[number]["id"];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionId>("personal");
  const [profile, setProfile] = useState({
    name: user?.name || "Jeremy Sendon",
    email: user?.email || "jeremy.sendon@digitalmindsbpo.com",
    phone: "+63 917 123 4567",
    role: user?.role || "Admin",
    department: "IT Operations",
    position: "System Administrator",
    dateJoined: "January 15, 2024",
  });
  const [companyInfo, setCompanyInfo] = useState({
    companyName: "Digital Minds BPO Services Inc.",
    businessType: "Business Process Outsourcing",
    industry: "Information Technology & Services",
    registrationNumber: "N/A",
    taxId: "N/A",
    email: " hr@dmibpo.com",
    phone: "N/A",
    website: "https://www.digitalmindsbpo.com",
    address: "3rd Floor, Greenwood Magsaysay Building, Magsaysay Avenue, Naga City, Philippines",
    city: "Naga City",
    province: "Camarines Sur",
    postalCode: "4400",
    country: "Philippines",
  });
  const [notifications, setNotifications] = useState({
    lowStock: true,
    outOfStock: true,
    newItem: false,
    weeklyReport: true,
    emailAlerts: true,
  });
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [profileResult, companyResult, notificationResult] = await Promise.all([
        supabase
          .from("users")
          .select("full_name, email, phone, department, position, date_joined, role")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("company_profile")
          .select("*")
          .eq("id", 1)
          .maybeSingle(),
        supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (profileResult.data) {
        setProfile({
          name: profileResult.data.full_name ?? "",
          email: profileResult.data.email ?? "",
          phone: profileResult.data.phone ?? "",
          role: profileResult.data.role ?? "User",
          department: profileResult.data.department ?? "",
          position: profileResult.data.position ?? "",
          dateJoined: profileResult.data.date_joined ?? "",
        });
      } else if (user) {
        setProfile({
          name: user.name ?? "",
          email: user.email ?? "",
          phone: "",
          role: user.role ?? "User",
          department: "",
          position: "",
          dateJoined: "",
        });
      }

      if (companyResult.data) {
        setCompanyInfo({
          companyName: companyResult.data.company_name ?? "",
          businessType: companyResult.data.business_type ?? "",
          industry: companyResult.data.industry ?? "",
          registrationNumber: companyResult.data.registration_number ?? "",
          taxId: companyResult.data.tax_id ?? "",
          email: companyResult.data.email ?? "",
          phone: companyResult.data.phone ?? "",
          website: companyResult.data.website ?? "",
          address: companyResult.data.address ?? "",
          city: companyResult.data.city ?? "",
          province: companyResult.data.province ?? "",
          postalCode: companyResult.data.postal_code ?? "",
          country: companyResult.data.country ?? "",
        });
      }

      if (notificationResult.data) {
        setNotifications({
          lowStock: Boolean(notificationResult.data.low_stock),
          outOfStock: Boolean(notificationResult.data.out_of_stock),
          newItem: Boolean(notificationResult.data.new_item),
          weeklyReport: Boolean(notificationResult.data.weekly_report),
          emailAlerts: Boolean(notificationResult.data.email_alerts),
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, [user?.id, user?.email, user?.name, user?.role]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Please sign in again to save your settings.");
      return;
    }

    try {
      setIsSaving(true);

      const { data: authData, error: authUserError } = await supabase.auth.getUser();
      const authUserId = authData.user?.id;

      if (authUserError || !authUserId) {
        throw authUserError || new Error("Unable to resolve the current auth user.");
      }

      if (activeSection === "personal") {
        const { error: profileError } = await supabase.from("users").upsert(
          {
            user_id: user.id,
            auth_id: authUserId,
            full_name: profile.name,
            email: profile.email,
            phone: profile.phone,
            department: profile.department,
            position: profile.position,
            date_joined: profile.dateJoined,
            role: profile.role,
          },
          {
            onConflict: "auth_id",
          }
        );

        if (profileError) throw profileError;

        const { error: authError } = await supabase.auth.updateUser({
          email: profile.email,
        });

        if (authError) {
          console.warn("Auth email update warning:", authError.message);
        }

        await refreshUser();
        await loadSettings();
        toast.success("Personal information saved successfully.");
      } else if (activeSection === "company") {
        const { error: companyError } = await supabase.from("company_profile").upsert(
          {
            id: 1,
            company_name: companyInfo.companyName,
            business_type: companyInfo.businessType,
            industry: companyInfo.industry,
            registration_number: companyInfo.registrationNumber,
            tax_id: companyInfo.taxId,
            email: companyInfo.email,
            phone: companyInfo.phone,
            website: companyInfo.website,
            address: companyInfo.address,
            city: companyInfo.city,
            province: companyInfo.province,
            postal_code: companyInfo.postalCode,
            country: companyInfo.country,
          },
          {
            onConflict: "id",
          }
        );

        if (companyError) throw companyError;
        await loadSettings();
        toast.success("Company information saved successfully.");
      } else if (activeSection === "notifications") {
        const { error: notificationError } = await supabase
          .from("notification_preferences")
          .upsert(
            {
              user_id: user.id,
              low_stock: notifications.lowStock,
              out_of_stock: notifications.outOfStock,
              new_item: notifications.newItem,
              weekly_report: notifications.weeklyReport,
              email_alerts: notifications.emailAlerts,
            },
            {
              onConflict: "user_id",
            }
          );

        if (notificationError) throw notificationError;
        await loadSettings();
        toast.success("Notification preferences saved successfully.");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      const message = error instanceof Error ? error.message : "Unable to save settings. Please try again.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const activeSectionData =
    sections.find((section) => section.id === activeSection) || sections[0];

  const fieldClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#B0BF00] focus:ring-4 focus:ring-[#B0BF00]/10";
  const shellCardClass =
    "overflow-hidden rounded-[28px] border border-[#B0BF00]/15 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)]";
  const labelChipClass =
    "inline-flex items-center gap-2 rounded-full border border-[#B0BF00]/20 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7f8f00]";

  const renderSectionHeader = (
    title: string,
    description: string,
    icon: typeof User,
    gradient: string
  ) => {
    const Icon = icon;

    return (
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className={labelChipClass}>Section</span>
            <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-900">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionFooter = (buttonLabel: string) => (
    <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-400">
        Last updated: {new Date().toLocaleDateString()}
      </p>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B0BF00] to-[#9aaa00] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#B0BF00]/25 transition-all duration-300 hover:from-[#9aaa00] hover:to-[#8a9600] hover:shadow-xl hover:shadow-[#B0BF00]/35 sm:w-auto"
      >
        {isSaving ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Saving...</span>
          </>
        ) : saved ? (
          <>
            <Check className="h-4 w-4" />
            <span>Saved Successfully</span>
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            <span>{buttonLabel}</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 md:space-y-7">
      <div className={shellCardClass}>
        <div className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#B0BF00] via-[#d6df63] to-[#8a9600]" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B0BF00] to-[#8a9600] text-white shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <span className={labelChipClass}>Module</span>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  System Settings
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <div className="rounded-2xl border border-[#B0BF00]/15 bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  Active Module
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {activeSectionData.label}
                </p>
              </div>
              <div className="rounded-2xl border border-[#B0BF00]/15 bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Role</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {user?.role || "User"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className={shellCardClass}>
              <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B0BF00] to-[#8a9600] text-sm font-bold text-white">
                {(user?.name || "User")
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.name || "User"}
                </p>
                <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#B0BF00]/10 px-2.5 py-1 text-[11px] font-medium text-[#7f8f00]">
                  <Shield className="h-3.5 w-3.5" />
                  {user?.role || "User"}
                </div>
              </div>
            </div>

            <div className="space-y-2 p-4">
              <p className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Navigation
              </p>
              {sections.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                      active
                        ? "border-[#B0BF00]/40 bg-gradient-to-r from-[#B0BF00] to-[#9aaa00] text-white shadow-lg shadow-[#B0BF00]/25"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#B0BF00]/30 hover:bg-slate-50 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            active ? "bg-white/20" : "bg-slate-100"
                          }`}
                        >
                          <Icon
                            className={`h-4.5 w-4.5 ${
                              active ? "text-white" : section.iconColor
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{section.label}</p>
                          <p
                            className={`mt-0.5 truncate text-xs ${
                            active ? "text-white/80" : "text-slate-500"
                            }`}
                          >
                            {section.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          active ? "translate-x-0.5 text-white" : "text-slate-300"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {activeSection === "personal" && (
            <div className={shellCardClass}>
              {renderSectionHeader(
                "Personal Information",
                "Manage your account details and keep your profile information up to date.",
                User,
                "from-blue-500 to-sky-500"
              )}

              <div className="space-y-6 p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <User className="h-3.5 w-3.5 text-blue-500" />
                      Full Name
                    </label>
                    <input className={fieldClass} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Enter your full name" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      Email Address
                    </label>
                    <input className={fieldClass} type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="your.email@company.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-blue-500" />
                      Phone Number
                    </label>
                    <input className={fieldClass} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+63 XXX XXX XXXX" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <Building className="h-3.5 w-3.5 text-blue-500" />
                      Department
                    </label>
                    <input className={fieldClass} value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} placeholder="Your department" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                      Position
                    </label>
                    <input className={fieldClass} value={profile.position} onChange={(e) => setProfile({ ...profile, position: e.target.value })} placeholder="Your position" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <Info className="h-3.5 w-3.5 text-blue-500" />
                      Date Joined
                    </label>
                    <input className={fieldClass} value={profile.dateJoined} onChange={(e) => setProfile({ ...profile, dateJoined: e.target.value })} placeholder="Employment date" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                      Role
                    </label>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-[#314865] dark:bg-[#132338]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.role}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Your role is managed centrally for security and access control.
                          </p>
                        </div>
                        <div className="inline-flex w-fit rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-[#1f3650] dark:text-slate-100">
                          System Managed
                        </div>
                      </div>
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-white/70 p-3 dark:border-[#314865] dark:bg-[#0d1a2b]">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500 dark:text-[#d7e25f]" />
                        <p className="text-xs leading-5 text-blue-700 dark:text-slate-200">
                          Role changes must be handled by the administrator through User Management.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {renderSectionFooter("Save Changes")}
              </div>
            </div>
          )}

          {activeSection === "company" && (
            <div className={shellCardClass}>
              {renderSectionHeader(
                "Company Information",
                "Review and maintain the business profile shown across the inventory system.",
                Building2,
                "from-violet-500 to-fuchsia-500"
              )}

              <div className="space-y-8 p-5 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 rounded-full bg-violet-500" />
                    <h4 className="text-sm font-bold text-slate-700">Basic Information</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <Building2 className="h-3.5 w-3.5 text-violet-500" />
                        Company Name
                      </label>
                      <input className={fieldClass} value={companyInfo.companyName} onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })} placeholder="Your company name" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-violet-500" />
                        Company Email
                      </label>
                      <input className={fieldClass} type="email" value={companyInfo.email} onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })} placeholder="contact@company.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-violet-500" />
                        Phone Number
                      </label>
                      <input className={fieldClass} value={companyInfo.phone} onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })} placeholder="+63 XXX XXX XXXX" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <Globe className="h-3.5 w-3.5 text-violet-500" />
                        Website
                      </label>
                      <input className={fieldClass} value={companyInfo.website} onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })} placeholder="https://www.yourcompany.com" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 rounded-full bg-violet-500" />
                    <h4 className="text-sm font-bold text-slate-700">Address Information</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-violet-500" />
                        Street Address
                      </label>
                      <input className={fieldClass} value={companyInfo.address} onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })} placeholder="Building, floor, street" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-violet-500" />
                        City
                      </label>
                      <input className={fieldClass} value={companyInfo.city} onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })} placeholder="City" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-violet-500" />
                        Province
                      </label>
                      <input className={fieldClass} value={companyInfo.province} onChange={(e) => setCompanyInfo({ ...companyInfo, province: e.target.value })} placeholder="Province / State" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-violet-500" />
                        Postal Code
                      </label>
                      <input className={fieldClass} value={companyInfo.postalCode} onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })} placeholder="XXXX" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <Globe className="h-3.5 w-3.5 text-violet-500" />
                        Country
                      </label>
                      <input className={fieldClass} value={companyInfo.country} onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })} placeholder="Country" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 rounded-full bg-violet-500" />
                    <h4 className="text-sm font-bold text-slate-700">Business Details</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <Briefcase className="h-3.5 w-3.5 text-violet-500" />
                        Business Type
                      </label>
                      <input className={fieldClass} value={companyInfo.businessType} onChange={(e) => setCompanyInfo({ ...companyInfo, businessType: e.target.value })} placeholder="Corporation, LLC, etc." />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <Briefcase className="h-3.5 w-3.5 text-violet-500" />
                        Industry
                      </label>
                      <input className={fieldClass} value={companyInfo.industry} onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })} placeholder="Industry sector" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <Briefcase className="h-3.5 w-3.5 text-violet-500" />
                        Registration Number
                      </label>
                      <input className={fieldClass} value={companyInfo.registrationNumber} onChange={(e) => setCompanyInfo({ ...companyInfo, registrationNumber: e.target.value })} placeholder="Business registration number" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <Briefcase className="h-3.5 w-3.5 text-violet-500" />
                        Tax ID
                      </label>
                      <input className={fieldClass} value={companyInfo.taxId} onChange={(e) => setCompanyInfo({ ...companyInfo, taxId: e.target.value })} placeholder="Tax identification number" />
                    </div>
                  </div>
                </div>
                {renderSectionFooter("Save Company Details")}
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className={shellCardClass}>
              {renderSectionHeader(
                "Notification Preferences",
                "Choose which alerts and operational updates you want to receive.",
                Bell,
                "from-amber-500 to-orange-500"
              )}

              <div className="space-y-3 p-5 sm:p-6">
                {[
                  { key: "lowStock", label: "Low Stock Alerts", desc: "Get notified when items fall below the minimum quantity threshold.", icon: "📊" },
                  { key: "outOfStock", label: "Out of Stock Alerts", desc: "Receive immediate alerts when inventory reaches zero quantity.", icon: "🚨" },
                  { key: "newItem", label: "New Item Added", desc: "Get updates whenever a new inventory item is added to the system.", icon: "✨" },
                  { key: "weeklyReport", label: "Weekly Reports", desc: "Receive a summary report every week for monitoring and review.", icon: "📈" },
                  { key: "emailAlerts", label: "Email Notifications", desc: "Send all selected alerts and updates to your registered email address.", icon: "📧" },
                ].map((item) => {
                  const checked = notifications[item.key as keyof typeof notifications];

                  return (
                    <div key={item.key} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-sm">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="shrink-0 text-2xl leading-none">{item.icon}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-pressed={checked}
                          aria-label={`${checked ? "Disable" : "Enable"} ${item.label}`}
                          onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                          className={`relative h-8 w-16 shrink-0 justify-self-start overflow-hidden rounded-full p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#B0BF00]/40 focus:ring-offset-2 focus:ring-offset-transparent sm:justify-self-end ${
                            checked
                              ? "bg-gradient-to-r from-[#B0BF00] to-[#9aaa00] shadow-lg shadow-[#B0BF00]/20 dark:shadow-none"
                              : "bg-slate-200 dark:bg-[#24324a]"
                          }`}
                        >
                          <span
                            className={`block h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                              checked ? "translate-x-8" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3">{renderSectionFooter("Save Preferences")}</div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
