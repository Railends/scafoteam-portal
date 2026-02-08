import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandLogo } from '../common/BrandLogo';
import { supabase } from '@/lib/supabase';



import { Users, UserCheck, LayoutDashboard, LogOut, Building2, Contact, Package, GraduationCap, Menu, X, FileText, Shield, Settings, Home, Info, Car } from 'lucide-react';

export function AdminLayout({ children }) {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const adminUser = JSON.parse(localStorage.getItem('scafoteam_admin_user') || '{}');
    const isSuperAdmin = adminUser.role === 'superadmin';
    const [adminMode, setAdminMode] = useState('HR'); // 'HR' or 'EMPLOYER'
    const [dynamicAlerts, setDynamicAlerts] = useState([]);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const { data: workerData } = await supabase.from('workers').select('id, name, surname, admin_data');
                const { data: vehicleData } = await supabase.from('vehicles').select('id, plate_number, make, model, inspection_expiry');

                const newAlerts = [];
                const today = new Date();

                // Contract Expiry Alerts
                workerData?.forEach(w => {
                    const expiry = w.admin_data?.contractEnd;
                    if (expiry) {
                        const days = Math.ceil((new Date(expiry) - today) / (1000 * 60 * 60 * 24));
                        if (days < 0) {
                            newAlerts.push({
                                id: `c-${w.id}`,
                                message: `${w.name} ${w.surname}: līgums BEIDZIES`,
                                severity: 'urgent'
                            });
                        } else if (days <= 7) {
                            newAlerts.push({
                                id: `c-${w.id}`,
                                message: `${w.name} ${w.surname}: beidzas līgums pēc ${days} d.`,
                                severity: 'warning'
                            });
                        }
                    }
                });

                // Vehicle Inspection Alerts
                vehicleData?.forEach(v => {
                    const expiry = v.inspection_expiry;
                    if (expiry) {
                        const expiryDate = new Date(expiry);
                        const daysDiff = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

                        if (daysDiff < 0) {
                            newAlerts.push({
                                id: `v-${v.id}`,
                                message: `${v.make} ${v.model} (${v.plate_number}): TA BEIGUSIES`,
                                severity: 'urgent'
                            });
                        } else if (daysDiff <= 7) {
                            newAlerts.push({
                                id: `v-${v.id}`,
                                message: `${v.make} ${v.model} (${v.plate_number}): TA pēc ${daysDiff} d.`,
                                severity: 'warning'
                            });
                        }
                    }
                });

                setDynamicAlerts(newAlerts);
            } catch (err) {
                console.error('Alert fetch error:', err);
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 300000); // Refresh every 5 min
        return () => clearInterval(interval);
    }, []);
    const handleLogout = () => {
        localStorage.removeItem('scafoteam_admin_auth');
        navigate('/');
    };

    const navItems = [
        // HR Mode Items
        { label: t('admin_pending_registrations'), path: '/admin/dashboard/pending', icon: Users, mode: 'HR' },
        { label: t('admin_active_workers'), path: '/admin/dashboard/active', icon: UserCheck, mode: 'HR' },
        { label: t('admin_projects'), path: '/admin/dashboard/projects', icon: LayoutDashboard, mode: 'HR' }, // Keep in HR for now as requested "current sections"
        { label: t('admin_client_accounts'), path: '/admin/dashboard/clients', icon: Building2, mode: 'HR' },
        { label: t('admin_contacts'), path: '/admin/dashboard/contacts', icon: Contact, mode: 'HR' },
        { label: t('admin_catalogs'), path: '/admin/dashboard/catalogs', icon: Package, mode: 'HR' },
        { label: t('admin_training'), path: '/admin/dashboard/training', icon: GraduationCap, mode: 'HR' },
        { label: 'Dzīvesvietas', path: '/admin/dashboard/residences', icon: Home, mode: 'HR' },
        { label: t('admin_document_templates'), path: '/admin/dashboard/templates', icon: FileText, mode: 'HR' },

        // EMPLOYER Mode Items (Placeholder for now)
        // { label: 'Stats', path: '/admin/dashboard/stats', icon: PieChart, mode: 'EMPLOYER' },
    ];

    // Placeholder alert logic - will be dynamic in real use
    const alerts = [
        { id: 1, type: 'contract', message: 'Jānim Bērziņam beidzas līgums pēc 7 dienām', severity: 'urgent' },
        { id: 2, type: 'inspection', message: 'VW GOLV (AA-1234) TA beidzas pēc 1 mēneša', severity: 'warning' }
    ];

    const hasUrgent = dynamicAlerts.some(a => a.severity === 'urgent');
    const hasWarning = dynamicAlerts.some(a => a.severity === 'warning');
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);

    const NavLinks = ({ onClick }) => (
        <>
            {navItems.filter(item => item.mode === adminMode).map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const isResidences = item.path === '/admin/dashboard/residences';
                const isFleetActive = location.pathname === '/admin/dashboard/fleet';

                return (
                    <React.Fragment key={item.path}>
                        <Link
                            to={item.path}
                            onClick={onClick}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                                isActive
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>

                        {/* Sub-menu for Autoparks specifically under Residences */}
                        {isResidences && (isActive || isFleetActive) && (
                            <div className="ml-6 mt-1 border-l-2 border-white/10 pl-2 space-y-1 animate-in slide-in-from-left-2 duration-200">
                                <Link
                                    to="/admin/dashboard/fleet"
                                    onClick={onClick}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider",
                                        isFleetActive
                                            ? "bg-scafoteam-accent text-scafoteam-navy shadow-sm"
                                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <Car className="w-4 h-4" />
                                    {t('admin_fleet')}
                                </Link>
                            </div>
                        )}
                    </React.Fragment>
                )
            })}
        </>
    );

    return (
        <div className="min-h-screen flex bg-gray-100 font-sans">
            {/* Desktop Sidebar (Nav) */}
            <aside className="w-64 bg-scafoteam-navy text-white flex-shrink-0 hidden md:flex flex-col border-r border-white/5 shadow-2xl">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-center h-12 overflow-hidden px-4">
                        <BrandLogo variant="white" className="h-full" />
                    </div>


                    <div className="flex p-1 bg-scafoteam-navy-light/30 rounded-lg mt-4 border border-white/5">
                        <button
                            onClick={() => setAdminMode('HR')}
                            className={cn(
                                "flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all",
                                adminMode === 'HR' ? "bg-white text-scafoteam-navy shadow-sm" : "text-gray-400 hover:text-white"
                            )}
                        >
                            HR
                        </button>
                        <button
                            onClick={() => setAdminMode('EMPLOYER')}
                            className={cn(
                                "flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all",
                                adminMode === 'EMPLOYER' ? "bg-white text-scafoteam-navy shadow-sm" : "text-gray-400 hover:text-white"
                            )}
                        >
                            EMPLOYER
                        </button>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <div className="px-3 mb-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Izvēlne</p>
                    </div>
                    <NavLinks />
                </nav>
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all text-sm font-bold group"
                    >
                        <div className="p-1.5 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </div>
                        {t('admin_logout')}
                    </button>
                </div>
            </aside>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-scafoteam-navy/60 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 h-full w-72 bg-scafoteam-navy text-white z-50 flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                                    <div className="w-8 h-8 bg-scafoteam-accent rounded-lg flex items-center justify-center">

                                        <Shield className="w-5 h-5 text-scafoteam-navy" />
                                    </div>
                                    <span>SCAFOTEAM</span>
                                </h1>
                                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                                <NavLinks onClick={() => setMobileMenuOpen(false)} />
                            </nav>
                            <div className="p-4 border-t border-white/10">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-4 w-full text-left rounded-xl text-red-300 bg-red-500/5 hover:bg-red-500/10 hover:text-red-200 transition-all text-sm font-bold"
                                >
                                    <LogOut className="w-5 h-5" />
                                    {t('admin_logout')}
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Modern Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-2 sm:px-4 md:px-8 sticky top-0 z-30 shadow-sm relative">
                    <div className="flex items-center gap-1.5 sm:gap-4">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 sm:p-2.5 md:hidden hover:bg-gray-50 rounded-xl transition-all active:scale-95"
                        >
                            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-scafoteam-navy" />
                        </button>

                        <div className="hidden md:flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-scafoteam-accent rounded-full" />

                            <h2 className="text-sm font-black text-scafoteam-navy uppercase tracking-widest">
                                {navItems.find(item => item.path === location.pathname)?.label || t('admin_panel')}
                            </h2>
                        </div>

                        {/* Mobile Brand */}
                        <div className="md:hidden flex items-center absolute left-1/2 -translate-x-1/2 h-7 sm:h-10">
                            <BrandLogo className="h-full" />
                        </div>


                    </div>


                    <div className="flex items-center gap-1 sm:gap-3">
                        {/* Notifications Popover */}
                        <div className="relative">
                            <button
                                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                                className={cn(
                                    "w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-300 border shadow-sm active:scale-95 relative",
                                    isAlertsOpen ? "bg-scafoteam-navy text-white shadow-lg" :
                                        hasUrgent ? "bg-red-500 text-white border-red-600 shadow-red-200" :
                                            hasWarning ? "bg-yellow-500 text-white border-yellow-600 shadow-yellow-200" :
                                                "bg-white border-gray-100 text-scafoteam-navy hover:bg-gray-50"
                                )}
                                title="Paziņojumi"
                            >
                                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                                {dynamicAlerts.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-scafoteam-accent text-scafoteam-navy text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                                        {dynamicAlerts.length}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {isAlertsOpen && (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-40 bg-transparent"
                                            onClick={() => setIsAlertsOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                                <h3 className="text-[10px] font-black text-scafoteam-navy uppercase tracking-widest">Paziņojumi ({dynamicAlerts.length})</h3>
                                                <X className="w-3.5 h-3.5 text-gray-400 cursor-pointer" onClick={() => setIsAlertsOpen(false)} />
                                            </div>
                                            <div className="max-h-[400px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                                {dynamicAlerts.length === 0 ? (
                                                    <div className="py-8 text-center">
                                                        <p className="text-xs text-gray-400 font-medium italic">Nav jaunu paziņojumu</p>
                                                    </div>
                                                ) : (
                                                    dynamicAlerts.map(alert => (
                                                        <div
                                                            key={alert.id}
                                                            className={cn(
                                                                "p-3 rounded-xl border text-[11px] font-bold leading-relaxed shadow-sm",
                                                                alert.severity === 'urgent'
                                                                    ? "bg-red-50 border-red-100 text-red-700"
                                                                    : "bg-yellow-50 border-yellow-100 text-yellow-700"
                                                            )}
                                                        >
                                                            {alert.message}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="p-3 bg-gray-50/50 border-t border-gray-50">
                                                <p className="text-[8px] text-gray-400 font-black uppercase text-center">Informācija tiek atjaunota automātiski</p>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <LanguageSwitcher />

                        <Link
                            to="/admin/dashboard/settings"
                            className={cn(
                                "w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-300 border shadow-sm active:scale-95",
                                location.pathname === '/admin/dashboard/settings'
                                    ? "bg-scafoteam-navy text-white border-scafoteam-navy shadow-lg shadow-scafoteam-navy/20"
                                    : "bg-white border-gray-100 text-scafoteam-navy hover:bg-gray-50 hover:border-scafoteam-navy/20 hover:shadow-md"
                            )}
                            title="Iestatījumi"
                        >
                            <Settings className={cn("w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-500", location.pathname === '/admin/dashboard/settings' && "rotate-90")} />
                        </Link>

                        {isSuperAdmin && (
                            <Link
                                to="/admin/dashboard/admins"
                                className={cn(
                                    "w-9 h-9 sm:w-10 sm:h-10 hidden sm:flex items-center justify-center rounded-xl transition-all duration-300 border shadow-sm active:scale-95",
                                    location.pathname === '/admin/dashboard/admins'
                                        ? "bg-scafoteam-navy text-white border-scafoteam-navy shadow-lg shadow-scafoteam-navy/20"
                                        : "bg-white border-gray-100 text-scafoteam-navy hover:bg-gray-50 hover:border-scafoteam-navy/20 hover:shadow-md"
                                )}
                                title={t('admin_admin_management')}
                            >
                                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Link>
                        )}


                        <div className="h-6 w-px bg-gray-100 mx-1 hidden md:block" />

                        <div className="hidden md:flex items-center gap-3 pl-2">
                            <div className="flex flex-col items-end">
                                <p className="text-[10px] font-black text-scafoteam-navy leading-none uppercase tracking-tighter">{adminUser.full_name || adminUser.username || 'Admin'}</p>
                                <p className="text-[8px] font-bold text-gray-400 leading-none mt-1 uppercase tracking-widest">{adminUser.role || 'User'}</p>
                            </div>

                            <div className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-scafoteam-navy shadow-inner">
                                <Shield className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </header>


                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
