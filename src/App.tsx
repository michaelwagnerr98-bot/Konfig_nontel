import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Zap, Palette, Calculator, ShoppingCart, Menu, X, User, LogOut, FileText, Building, Shield, CreditCard, Truck } from 'lucide-react';
import DesignSelector from './components/DesignSelector';
import ConfigurationPanel from './components/ConfigurationPanel';
import PricingCalculator from './components/PricingCalculator';
import MockupDisplay from './components/MockupDisplay';
import CartCheckout from './components/CartCheckout';
import ShippingCalculationPage from './components/ShippingCalculationPage';
import NeonMockupStage from './components/NeonMockupStage';
import CustomerHeader from './components/CustomerHeader';
import MondayStatus from './components/MondayStatus';
import ProductsPage from './components/ProductsPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import SuccessPage from './components/SuccessPage';
import AgbPage from './components/legal/AgbPage';
import ImpressumPage from './components/legal/ImpressumPage';
import DatenschutzPage from './components/legal/DatenschutzPage';
import WiderrufsrechtPage from './components/legal/WiderrufsrechtPage';
import ZahlungVersandPage from './components/legal/ZahlungVersandPage';
import { ConfigurationState, NeonDesign, SignConfiguration, ShippingOption } from './types/configurator';
import { calculateProportionalHeight, calculateProportionalLedLength } from './utils/calculations';
import { getAvailableDesigns } from './data/mockDesigns';

// Unified App component with responsive design
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/agb" element={<AgbPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/widerrufsrecht" element={<WiderrufsrechtPage />} />
        <Route path="/zahlung-versand" element={<ZahlungVersandPage />} />
      </Routes>
    </Router>
  );
}

// Unified HomePage component - NO device-specific conditional rendering
function HomePage() {
  const [designs, setDesigns] = useState<NeonDesign[]>([]);
  const [currentView, setCurrentView] = useState<'design' | 'cart' | 'shipping'>('design');
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Configuration state
  const [config, setConfig] = useState<ConfigurationState>({
    selectedDesign: designs[0] || {
      id: 'loading',
      name: 'Loading...',
      originalWidth: 100,
      originalHeight: 100,
      elements: 1,
      ledLength: 1,
      mockupUrl: '',
      description: 'Loading designs...'
    },
    customWidth: 100,
    calculatedHeight: 100,
    isWaterproof: false,
    isTwoPart: false,
    hasUvPrint: true,
    hasHangingSystem: false,
    includesInstallation: false,
    expressProduction: false,
    customerPostalCode: '',
    selectedShipping: null,
    signs: [],
  });

  // Import supabase conditionally
  const [supabase, setSupabase] = useState<any>(null);
  
  useEffect(() => {
    const loadSupabase = async () => {
      try {
        const supabaseModule = await import('./lib/supabase');
        setSupabase(supabaseModule.supabase);
      } catch (error) {
        console.warn('Supabase not available, running in demo mode');
      }
    };
    loadSupabase();
  }, []);

  // Load designs on mount
  useEffect(() => {
    const loadDesigns = async () => {
      try {
        const availableDesigns = await getAvailableDesigns();
        setDesigns(availableDesigns);
        
        if (availableDesigns.length > 0) {
          const firstDesign = availableDesigns[0];
          const initialHeight = calculateProportionalHeight(
            firstDesign.originalWidth,
            firstDesign.originalHeight,
            100
          );
          
          setConfig(prev => ({
            ...prev,
            selectedDesign: firstDesign,
            customWidth: 100,
            calculatedHeight: initialHeight,
          }));
        }
      } catch (error) {
        console.error('Failed to load designs:', error);
      }
    };

    loadDesigns();
  }, []);

  // Auth state management
  useEffect(() => {
    if (!supabase) return;
    
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getCurrentUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleConfigChange = (updates: Partial<ConfigurationState>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleDesignChange = (design: NeonDesign) => {
    const newHeight = calculateProportionalHeight(
      design.originalWidth,
      design.originalHeight,
      config.customWidth
    );
    
    setConfig(prev => ({
      ...prev,
      selectedDesign: design,
      calculatedHeight: newHeight,
    }));
  };

  const handleToggleDesign = (design: NeonDesign, added: boolean) => {
    if (!added) return; // Only handle adding designs
    
    const newSign: SignConfiguration = {
      id: `sign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      design,
      width: config.customWidth,
      height: config.calculatedHeight,
      isEnabled: true,
      isWaterproof: config.isWaterproof,
      isTwoPart: config.isTwoPart,
      hasUvPrint: config.hasUvPrint,
      hasHangingSystem: config.hasHangingSystem,
      expressProduction: config.expressProduction,
    };
    
    setConfig(prev => ({
      ...prev,
      signs: [...(prev.signs || []), newSign],
    }));
  };

  const handleSignToggle = (signId: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      signs: prev.signs?.map(sign =>
        sign.id === signId ? { ...sign, isEnabled: enabled } : sign
      ) || [],
    }));
  };

  const handleRemoveSign = (signId: string) => {
    setConfig(prev => ({
      ...prev,
      signs: prev.signs?.filter(sign => sign.id !== signId) || [],
    }));
  };

  const handleShippingChange = (shipping: ShippingOption | null) => {
    setConfig(prev => ({ ...prev, selectedShipping: shipping }));
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setMobileMenuOpen(false);
  };

  // Responsive navigation component
  const Navigation = () => (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-6">
        <Link to="/products" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
          Produkte
        </Link>
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
              Login
            </Link>
            <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Registrieren
            </Link>
          </div>
        )}
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden text-gray-600 hover:text-gray-800 transition-colors"
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t shadow-lg md:hidden z-50">
          <div className="px-4 py-4 space-y-4">
            <Link 
              to="/products" 
              className="block text-gray-600 hover:text-gray-800 font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Produkte
            </Link>
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600 py-2">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Link 
                  to="/login" 
                  className="block text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registrieren
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  // Main configurator content - unified for all devices
  const ConfiguratorContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header - Responsive design */}
      <header className="bg-white shadow-sm border-b relative">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Responsive sizing */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                <Zap className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Neon-Konfigurator</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Professionelle Leuchtreklame</p>
              </div>
            </div>
            
            <Navigation />
          </div>
        </div>
      </header>

      {/* Main Content - Responsive layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {currentView === 'design' && (
          <>
            {/* Hero Section - Responsive */}
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4 md:mb-6">
                Ihr individuelles{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Neon-Schild
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Konfigurieren Sie Ihr maßgeschneidertes LED-Neon-Schild mit unserem interaktiven Designer. 
                Professionelle Qualität, faire Preise, schnelle Lieferung.
              </p>
            </div>

            {/* Main Grid - Responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              {/* Left Column - Design Selection */}

              {/* Center Column - Mockup Display */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6">
                  <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
                    <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-2">
                      <Palette className="h-5 md:h-6 w-5 md:w-6 text-white" />
                    </div>
                    <h2 className="text-lg md:text-2xl font-bold text-gray-800">Live-Vorschau</h2>
                  </div>
                  
                  {/* Responsive mockup container */}
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
                    <NeonMockupStage
                      lengthCm={Math.max(config.customWidth, config.calculatedHeight)}
                      waterproof={config.isWaterproof}
                      neonOn={true}
                      uvOn={config.hasUvPrint || true}
                      selectedBackground="ab_100cm_50%"
                      onWaterproofChange={(isWaterproof) => handleConfigChange({ isWaterproof })}
                    />
                  </div>
                  
                  {/* Technical info - Responsive grid */}
                  <div className="mt-4 md:mt-6 bg-gray-50 rounded-xl p-3 md:p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-blue-600 text-lg md:text-xl">{config.customWidth}cm</div>
                        <div className="text-gray-600 text-xs">Breite</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-purple-600 text-lg md:text-xl">{config.calculatedHeight}cm</div>
                        <div className="text-gray-600 text-xs">Höhe</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600 text-lg md:text-xl">{config.selectedDesign.elements}</div>
                        <div className="text-gray-600 text-xs">Elemente</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-pink-600 text-lg md:text-xl">
                          {calculateProportionalLedLength(
                            config.selectedDesign.originalWidth,
                            config.selectedDesign.originalHeight,
                            config.selectedDesign.ledLength,
                            config.customWidth,
                            config.calculatedHeight
                          )}m
                        </div>
                        <div className="text-gray-600 text-xs">LED-Länge</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Pricing */}
              <div className="lg:col-span-3">
                <PricingCalculator
                  config={config}
                  onRemoveSign={handleRemoveSign}
                  onGoToCart={() => setCurrentView('cart')}
                />
              </div>
            </div>

            {/* Features Section - Responsive */}
            <div className="mt-12 md:mt-16">
              <div className="text-center mb-8 md:mb-12">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                  Warum unser Neon-Konfigurator?
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Professionelle LED-Neon-Schilder mit modernster Technologie und individueller Gestaltung
                </p>
              </div>

              {/* Features grid - Responsive */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                    <Palette className="h-10 w-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">Individuelles Design</h4>
                  <p className="text-gray-600">
                    Laden Sie Ihr eigenes Logo oder Design hoch und sehen Sie es sofort in der Live-Vorschau
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                    <Calculator className="h-10 w-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">Transparente Preise</h4>
                  <p className="text-gray-600">
                    Sehen Sie alle Kosten in Echtzeit - keine versteckten Gebühren, faire Preisgestaltung
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow md:col-span-2 lg:col-span-1">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">Schnelle Lieferung</h4>
                  <p className="text-gray-600">
                    Express-Produktion in 4-6 Tagen möglich, Standard-Lieferung in 2-3 Wochen
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {currentView === 'cart' && (
          <CartCheckout
            config={config}
            onConfigChange={handleConfigChange}
            onShippingChange={handleShippingChange}
            onSignToggle={handleSignToggle}
            onRemoveSign={handleRemoveSign}
            onBackToDesign={() => setCurrentView('design')}
          />
        )}

        {currentView === 'shipping' && (
          <ShippingCalculationPage
            config={config}
            onConfigChange={handleConfigChange}
            onClose={() => setCurrentView('design')}
            onSignToggle={handleSignToggle}
            onRemoveSign={handleRemoveSign}
          />
        )}
      </main>

      {/* Footer - Responsive */}
      <footer className="bg-gray-800 text-white mt-16 md:mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Neon-Konfigurator</h3>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Professionelle LED-Neon-Schilder nach Maß. Individuelle Gestaltung, 
                transparente Preise und schnelle Lieferung für Ihr Unternehmen.
              </p>
              <div className="text-gray-400 text-sm">
                <p>Michael Wagner</p>
                <p>Hermann-Wehrle-Str. 10</p>
                <p>67433 Neustadt an der Weinstraße</p>
                <p>📞 +49 163 1661464</p>
                <p>📧 info@nontel.de</p>
              </div>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Rechtliches</h4>
              <div className="space-y-2">
                <Link to="/impressum" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                  <Building className="h-4 w-4" />
                  <span>Impressum</span>
                </Link>
                <Link to="/datenschutz" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                  <Shield className="h-4 w-4" />
                  <span>Datenschutz</span>
                </Link>
                <Link to="/agb" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                  <FileText className="h-4 w-4" />
                  <span>AGB</span>
                </Link>
                <Link to="/widerrufsrecht" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                  <FileText className="h-4 w-4" />
                  <span>Widerrufsrecht</span>
                </Link>
                <Link to="/zahlung-versand" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                  <CreditCard className="h-4 w-4" />
                  <span>Zahlung & Versand</span>
                </Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Kontakt</h4>
              <div className="space-y-2 text-gray-300">
                <p className="text-sm">Montag - Freitag</p>
                <p className="text-sm">9:00 - 18:00 Uhr</p>
                <p className="text-sm font-medium text-blue-400">+49 163 1661464</p>
                <p className="text-sm font-medium text-blue-400">info@nontel.de</p>
              </div>
            </div>
          </div>

          {/* Bottom bar - Responsive */}
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © 2025 Nontel - Michael Wagner. Alle Rechte vorbehalten.
            </p>
            <MondayStatus />
          </div>
        </div>
      </footer>
    </div>
  );

  return <ConfiguratorContent />;
}

export default App;