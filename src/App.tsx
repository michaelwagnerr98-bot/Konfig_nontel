import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NeonMockupStage from './components/NeonMockupStage';
import DesignSelector from './components/DesignSelector';
import ConfigurationPanel from './components/ConfigurationPanel';
import PricingCalculator from './components/PricingCalculator';
import CartCheckout from './components/CartCheckout';
import ShippingCalculationPage from './components/ShippingCalculationPage';
import CustomerHeader from './components/CustomerHeader';
import MondayStatus from './components/MondayStatus';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ProductsPage from './components/ProductsPage';
import SuccessPage from './components/SuccessPage';
import AgbPage from './components/legal/AgbPage';
import DatenschutzPage from './components/legal/DatenschutzPage';
import ImpressumPage from './components/legal/ImpressumPage';
import WiderrufsrechtPage from './components/legal/WiderrufsrechtPage';
import ZahlungVersandPage from './components/legal/ZahlungVersandPage';
import { ConfigurationState, NeonDesign, SignConfiguration } from './types/configurator';
import { getAvailableDesigns } from './data/mockDesigns';
import { calculateProportionalHeight } from './utils/calculations';

function App() {
  const [designs, setDesigns] = useState<NeonDesign[]>([]);
  const [currentView, setCurrentView] = useState<'design' | 'cart' | 'shipping'>('design');
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
    customWidth: 100,
    calculatedHeight: 50,
    isWaterproof: false,
    isTwoPart: false,
    hasUvPrint: true,
    hasHangingSystem: false,
    includesInstallation: false,
    expressProduction: false,
    customerPostalCode: '',
    selectedShipping: null,
    signs: [],
    isConfirmed: false
  });

  // Load designs on component mount
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
            calculatedHeight: initialHeight
          }));
        }
      } catch (error) {
        console.error('Failed to load designs:', error);
      }
    };

    loadDesigns();
  }, []);

  // Handler für Konfigurationsänderungen
  const handleConfigChange = (updates: Partial<ConfigurationState>) => {
    console.log('🔧 Config Update:', updates);
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Handler für Wasserdicht-Änderungen (von NeonMockupStage)
  const handleWaterproofChange = (isWaterproof: boolean) => {
    console.log('🛡️ Wasserdicht-Änderung von NeonMockupStage:', isWaterproof);
    setConfig(prev => ({
      ...prev,
      isWaterproof
    }));
  };

  // Handler für Hintergrund-Änderungen (von NeonMockupStage)
  const handleBackgroundChange = (background: string) => {
    console.log('🖼️ Hintergrund-Änderung von NeonMockupStage:', background);
    // Zusätzliche Logik falls nötig
  };

  // Handler für Design-Änderungen
  const handleDesignChange = (design: NeonDesign) => {
    const newHeight = calculateProportionalHeight(
      design.originalWidth,
      design.originalHeight,
      config.customWidth
    );
    setConfig(prev => ({
      ...prev,
      selectedDesign: design,
      calculatedHeight: newHeight
    }));
  };

  // Handler für Design-Toggle (Hinzufügen/Entfernen)
  const handleToggleDesign = (design: NeonDesign, added: boolean) => {
    if (added) {
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
        expressProduction: config.expressProduction || false
      };
      
      setConfig(prev => ({
        ...prev,
        signs: [...prev.signs, newSign]
      }));
    }
  };

  // Handler für Versand-Änderungen
  const handleShippingChange = (shipping: any) => {
    setConfig(prev => ({
      ...prev,
      selectedShipping: shipping
    }));
  };

  // Handler für Sign-Toggle
  const handleSignToggle = (signId: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      signs: prev.signs.map(sign =>
        sign.id === signId ? { ...sign, isEnabled: enabled } : sign
      )
    }));
  };

  // Handler für Sign-Entfernung
  const handleRemoveSign = (signId: string) => {
    setConfig(prev => ({
      ...prev,
      signs: prev.signs.filter(sign => sign.id !== signId)
    }));
  };

  // Handler für UV-Druck Änderungen
  const handleUvPrintChange = (hasUvPrint: boolean) => {
    console.log('🎨 UV-Druck Änderung:', hasUvPrint);
    setConfig(prev => ({
      ...prev,
      hasUvPrint
    }));
  };

  const MainConfigurator = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <CustomerHeader
        customerName="Nontel"
        customerLogo="/assets/Nontel Long White.svg"
        orderToken="demo-token"
      />
      
      <div className="pt-12 md:pt-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {currentView === 'design' && (
            <div className="grid lg:grid-cols-12 gap-4 lg:gap-8">
              {/* Left Column - Design & Configuration */}
              <div className="lg:col-span-5 space-y-4 lg:space-y-6">
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
                  onUvPrintChange={handleUvPrintChange}
                  onConfigChange={handleConfigChange}
                />
                
                <ConfigurationPanel
                  config={config}
                  onConfigChange={handleConfigChange}
                />
              </div>

              {/* Center Column - Mockup Display */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-4 lg:p-6">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <NeonMockupStage
                      lengthCm={Math.max(config.customWidth, config.calculatedHeight)}
                      waterproof={config.isWaterproof}
                      neonOn={true}
                      uvOn={config.hasUvPrint || true}
                      onWaterproofChange={handleWaterproofChange}
                      onBackgroundChange={handleBackgroundChange}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Pricing */}
              <div className="lg:col-span-3">
                <PricingCalculator
                  config={{
                    ...config,
                    onConfigChange: handleConfigChange,
                    onShippingChange: handleShippingChange,
                    onSignToggle: handleSignToggle,
                    onRemoveSign: handleRemoveSign
                  }}
                  onRemoveSign={handleRemoveSign}
                  onGoToCart={() => setCurrentView('cart')}
                />
              </div>
            </div>
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
        </div>
      </div>

      {/* Monday Status */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
        <MondayStatus />
      </div>

      {/* Legal Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-center space-x-6 text-sm text-gray-600">
            <a href="/impressum" className="hover:text-blue-600 transition-colors">Impressum</a>
            <a href="/datenschutz" className="hover:text-blue-600 transition-colors">Datenschutz</a>
            <a href="/agb" className="hover:text-blue-600 transition-colors">AGB</a>
            <a href="/widerrufsrecht" className="hover:text-blue-600 transition-colors">Widerrufsrecht</a>
            <a href="/zahlung-versand" className="hover:text-blue-600 transition-colors">Zahlung & Versand</a>
          </div>
          <div className="text-center text-gray-500 text-sm mt-4">
            © 2025 Nontel - Professionelle LED-Neon-Schilder
          </div>
        </div>
      </footer>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainConfigurator />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/agb" element={<AgbPage />} />
        <Route path="/widerrufsrecht" element={<WiderrufsrechtPage />} />
        <Route path="/zahlung-versand" element={<ZahlungVersandPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;