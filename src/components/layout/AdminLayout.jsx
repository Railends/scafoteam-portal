import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Users, UserCheck, LayoutDashboard, LogOut, Building2, Contact, Package, GraduationCap, Menu, X, FileText, Shield } from 'lucide-react';

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
        ...(isSuperAdmin ? [{ label: t('admin_admin_management'), path: '/admin/dashboard/admins', icon: Shield }] : []),
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
            <aside className="w-64 bg-scafoteam-navy text-white flex-shrink-0 hidden md:flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-xl font-bold tracking-tight">Scafoteam Admin</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavLinks />
                </nav>
                <div className="p-4 border-t border-white/10 space-y-4">
                    <LanguageSwitcher className="px-2" showRU={false} />
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        {t('admin_logout')}
                    </button>
                </div>
            </aside>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 h-full w-64 bg-scafoteam-navy text-white z-50 transform transition-transform duration-300 md:hidden flex flex-col",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight">Scafoteam Admin</h1>
                    <button onClick={() => setMobileMenuOpen(false)} className="text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavLinks onClick={() => setMobileMenuOpen(false)} />
                </nav>
                <div className="p-4 border-t border-white/10 space-y-4">
                    <LanguageSwitcher className="px-2" />
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        {t('admin_logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Mobile Header */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:hidden sticky top-0 z-30">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6 text-scafoteam-navy" />
                    </button>
                    <span className="font-bold text-scafoteam-navy">Scafoteam Admin</span>
                    <div className="w-10" /> {/* Spacer for centering */}
                </header>
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
