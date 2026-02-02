import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandLogo } from '../common/BrandLogo';



import { Users, UserCheck, LayoutDashboard, LogOut, Building2, Contact, Package, GraduationCap, Menu, X, FileText, Shield, Settings } from 'lucide-react';

export function AdminLayout({ children }) {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const adminUser = JSON.parse(localStorage.getItem('scafoteam_admin_user') || '{}');
    const isSuperAdmin = adminUser.role === 'superadmin';

    const handleLogout = () => {
        localStorage.removeItem('scafoteam_admin_auth');
        navigate('/');
    };

    const navItems = [
        { label: t('admin_pending_registrations'), path: '/admin/dashboard/pending', icon: Users },
        { label: t('admin_active_workers'), path: '/admin/dashboard/active', icon: UserCheck },
        { label: t('admin_projects'), path: '/admin/dashboard/projects', icon: LayoutDashboard },
        { label: t('admin_client_accounts'), path: '/admin/dashboard/clients', icon: Building2 },
        { label: t('admin_contacts'), path: '/admin/dashboard/contacts', icon: Contact },
        { label: t('admin_catalogs'), path: '/admin/dashboard/catalogs', icon: Package },
        { label: t('admin_training'), path: '/admin/dashboard/training', icon: GraduationCap },
        { label: t('admin_document_templates'), path: '/admin/dashboard/templates', icon: FileText },
    ];

    const NavLinks = ({ onClick }) => (
        <>
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
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
                )
            })}
        </>
    );

    return (
        <div className="min-h-screen flex bg-gray-100 font-sans">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-scafoteam-navy text-white flex-shrink-0 hidden md:flex flex-col border-r border-white/5 shadow-2xl">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-center h-12 overflow-hidden px-4">
                        <BrandLogo variant="white" className="h-full" />
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
                                    <div className="w-8 h-8 bg-scafoteam-gold rounded-lg flex items-center justify-center">
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
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2.5 md:hidden hover:bg-gray-50 rounded-xl transition-all active:scale-95"
                        >
                            <Menu className="w-6 h-6 text-scafoteam-navy" />
                        </button>

                        <div className="hidden md:flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-scafoteam-gold rounded-full" />
                            <h2 className="text-sm font-black text-scafoteam-navy uppercase tracking-widest">
                                {navItems.find(item => item.path === location.pathname)?.label || t('admin_panel')}
                            </h2>
                        </div>

                        {/* Mobile Brand */}
                        <BrandLogo className="h-10 md:hidden" />


                    </div>

                    <div className="flex items-center gap-1 sm:gap-3">
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
