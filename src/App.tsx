import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Zap, ShoppingCart, Settings, User, LogOut, Menu, X } from 'lucide-react';

// Import components
import DesignSelector from './components/DesignSelector';
import ConfigurationPanel from './components/ConfigurationPanel';
import PricingCalculator from './components/PricingCalculator';
import CartCheckout from './components/CartCheckout';
import ShippingCalculationPage from './components/ShippingCalculationPage';
import CustomerHeader from './components/CustomerHeader';
import MondayStatus from './components/MondayStatus';
import NeonMockupStage from './components/NeonMockupStage';

// Auth components
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';

// Legal components
import AgbPage from './components/legal/AgbPage';
import DatenschutzPage from './components/legal/DatenschutzPage';
import ImpressumPage from './components/legal/ImpressumPage';
import WiderrufsrechtPage from './components/legal/WiderrufsrechtPage';
import ZahlungVersandPage from './components/legal/ZahlungVersandPage';

// Other components
import ProductsPage from './components/ProductsPage';
import SuccessPage from './components/SuccessPage';

// Data and types
import { getAvailableDesigns } from './data/mockDesigns';
import { ConfigurationState, NeonDesign, SignConfiguration } from './types/configurator';
import { calculateProportionalHeight, calculateSingleSignPrice } from './utils/calculations';

function App() {
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'design' | 'cart' | 'shipping'>('design');
  const [designs, setDesigns] = useState<NeonDesign[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  // Configuration state
  const [config, setConfig] = useState<ConfigurationState>({
    selectedDesign: {
      id: 'design-1',
      name: 'Classic Business Logo',
      originalWidth: 400,
      originalHeight: 200,
      elements: 5,
      ledLength: 12,
      mockupUrl: 'https://images.pexels.com/photos/1036936/pexels-photo-1036936.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
      description: 'Klassisches Firmenlogo-Design mit klaren Linien'
    },
    customWidth: 200,
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
            200
          );
          setConfig(prev => ({
            ...prev,
            selectedDesign: firstDesign,
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

  const handleShippingChange = (shipping: any) => {
    setConfig(prev => ({ ...prev, selectedShipping: shipping }));
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
    const newSign: SignConfiguration = {
      id: `sign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      design,
      width: config.customWidth,
      height: config.calculatedHeight,
      isEnabled: true,
      isWaterproof: config.isWaterproof,
      isTwoPart: config.isTwoPart || false,
      hasUvPrint: config.hasUvPrint || true,
      hasHangingSystem: config.hasHangingSystem || false,
      expressProduction: config.expressProduction || false,
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

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  // Main configurator component
  const ConfiguratorApp = () => {
    if (currentView === 'cart') {
      return (
        <CartCheckout
          config={config}
          onConfigChange={handleConfigChange}
          onShippingChange={handleShippingChange}
          onSignToggle={handleSignToggle}
          onRemoveSign={handleRemoveSign}
          onBackToDesign={() => setCurrentView('design')}
        />
      );
    }

    if (currentView === 'shipping') {
      return (
        <ShippingCalculationPage
          config={config}
          onConfigChange={handleConfigChange}
          onClose={() => setCurrentView('design')}
          onSignToggle={handleSignToggle}
          onRemoveSign={handleRemoveSign}
        />
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        {/* Customer Header */}
        <CustomerHeader
          customerName="Nontel"
          customerLogo="/assets/Logo Long White.png"
          orderToken="demo-token"
        />

        {/* Main Content */}
        <div className="pt-12 md:pt-16 px-3 sm:px-6 lg:px-8 pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Monday Status */}
            <div className="mb-4 flex justify-center">
              <MondayStatus />
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8">
              {/* Left Column - Design & Configuration */}
              <div className="lg:col-span-5 space-y-6">
                <DesignSelector
                  designs={designs}
                  selectedDesign={config.selectedDesign}
                  onDesignChange={handleDesignChange}
                  onToggleDesign={handleToggleDesign}
                  config={config}
                  signs={config.signs}
                  onSignToggle={handleSignToggle}
                  onRemoveSign={handleRemoveSign}
                  isWaterproof={config.isWaterproof}
                  isTwoPart={config.isTwoPart}
                  hasUvPrint={config.hasUvPrint}
                  onUvPrintChange={(hasUvPrint) => handleConfigChange({ hasUvPrint })}
                  onConfigChange={handleConfigChange}
                />
                <ConfigurationPanel
                  config={config}
                  onConfigChange={handleConfigChange}
                />
              </div>

              {/* Middle Column - Mockup */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
                  <div className="aspect-square">
                    <NeonMockupStage
                      lengthCm={Math.max(config.customWidth, config.calculatedHeight)}
                      waterproof={config.isWaterproof}
                      neonOn={true}
                      uvOn={config.hasUvPrint || true}
                      selectedBackground="ab_100cm_50%"
                      onBackgroundChange={() => {}}
                      onWaterproofChange={(isWaterproof) => handleConfigChange({ isWaterproof })}
                    />
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

            {/* Mobile Layout */}
            <div className="lg:hidden space-y-4">
              {/* Mobile Mockup */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="aspect-square">
                  <NeonMockupStage
                    lengthCm={Math.max(config.customWidth, config.calculatedHeight)}
                    waterproof={config.isWaterproof}
                    neonOn={true}
                    uvOn={config.hasUvPrint || true}
                    selectedBackground="ab_100cm_50%"
                    onBackgroundChange={() => {}}
                    onWaterproofChange={(isWaterproof) => handleConfigChange({ isWaterproof })}
                  />
                </div>
              </div>

              {/* Mobile Design Selector */}
              <DesignSelector
                designs={designs}
                selectedDesign={config.selectedDesign}
                onDesignChange={handleDesignChange}
                onToggleDesign={handleToggleDesign}
                config={config}
                signs={config.signs}
                onSignToggle={handleSignToggle}
                onRemoveSign={handleRemoveSign}
                isWaterproof={config.isWaterproof}
                isTwoPart={config.isTwoPart}
                hasUvPrint={config.hasUvPrint}
                onUvPrintChange={(hasUvPrint) => handleConfigChange({ hasUvPrint })}
                onConfigChange={handleConfigChange}
              />

              {/* Mobile Configuration */}
              <ConfigurationPanel
                config={config}
                onConfigChange={handleConfigChange}
              />

              {/* Mobile Pricing */}
              <PricingCalculator
                config={config}
                onRemoveSign={handleRemoveSign}
                onGoToCart={() => setCurrentView('cart')}
              />
            </div>
          </div>
        </div>

        {/* Bottom Navigation Menu - HIER IST DAS UNTERE MENÜ! */}
        {/* Bottom Navigation Menu - HIER IST DAS UNTERE MENÜ! */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 lg:hidden">
          <div className="grid grid-cols-4 h-16">
            {/* Design */}
            <button
              onClick={() => setCurrentView('design')}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                currentView === 'design'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <Zap className="h-5 w-5" />
              <span className="text-xs font-medium">Design</span>
            </button>

            {/* Warenkorb */}
            <button
              onClick={() => setCurrentView('cart')}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors relative ${
                currentView === 'cart'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs font-medium">Warenkorb</span>
              {config.signs && config.signs.filter(s => s.isEnabled).length > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {config.signs.filter(s => s.isEnabled).length}
                </div>
              )}
            </button>

            {/* Versand */}
            <button
              onClick={() => setCurrentView('shipping')}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                currentView === 'shipping'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs font-medium">Versand</span>
            </button>

            {/* User Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                mobileMenuOpen
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="text-xs font-medium">Menü</span>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
              <div className="p-4 space-y-3">
                {user ? (
                  <>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 pb-2 border-b">
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
                    <a
                      href="/login"
                      className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                      Login
                    </a>
                    <a
                      href="/signup"
                      className="block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-center"
                    >
                      Registrieren
                    </a>
                  </div>
                )}
                
                {/* Legal Links */}
                <div className="border-t pt-3 space-y-2">
                  <a href="/impressum" className="block text-sm text-gray-600 hover:text-blue-600">Impressum</a>
                  <a href="/datenschutz" className="block text-sm text-gray-600 hover:text-blue-600">Datenschutz</a>
                  <a href="/agb" className="block text-sm text-gray-600 hover:text-blue-600">AGB</a>
                  <a href="/widerrufsrecht" className="block text-sm text-gray-600 hover:text-blue-600">Widerrufsrecht</a>
                  <a href="/zahlung-versand" className="block text-sm text-gray-600 hover:text-blue-600">Zahlung & Versand</a>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        {/* Main configurator */}
        <Route path="/" element={<ConfiguratorApp />} />
        
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Legal routes */}
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/agb" element={<AgbPage />} />
        <Route path="/widerrufsrecht" element={<WiderrufsrechtPage />} />
        <Route path="/zahlung-versand" element={<ZahlungVersandPage />} />
        
        {/* Other routes */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/success" element={<SuccessPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;