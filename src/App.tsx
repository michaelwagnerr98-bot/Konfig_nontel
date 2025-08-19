import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerHeader from './components/CustomerHeader';
import DesignSelector from './components/DesignSelector';
import ConfigurationPanel from './components/ConfigurationPanel';
import PricingCalculator from './components/PricingCalculator';
import CartCheckout from './components/CartCheckout';
import ShippingCalculationPage from './components/ShippingCalculationPage';
import NeonMockupStage from './components/NeonMockupStage';
import MondayStatus from './components/MondayStatus';
import ProductsPage from './components/ProductsPage';
import SuccessPage from './components/SuccessPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import AgbPage from './components/legal/AgbPage';
import DatenschutzPage from './components/legal/DatenschutzPage';
import ImpressumPage from './components/legal/ImpressumPage';
import WiderrufsrechtPage from './components/legal/WiderrufsrechtPage';
import ZahlungVersandPage from './components/legal/ZahlungVersandPage';
import { ConfigurationState, NeonDesign, SignConfiguration } from './types/configurator';
import { getAvailableDesigns } from './data/mockDesigns';
import { calculateProportionalHeight, calculateProportionalLedLength } from './utils/calculations';

const App: React.FC = () => {
  const [designs, setDesigns] = useState<NeonDesign[]>([]);
  const [currentView, setCurrentView] = useState<'design' | 'cart' | 'shipping'>('design');
  const [selectedBackground, setSelectedBackground] = useState<string>('ab_100cm_50%');

  const [config, setConfig] = useState<ConfigurationState>({
    selectedDesign: {
      id: 'loading',
      name: 'Lädt...',
      originalWidth: 300,
      originalHeight: 100,
      elements: 5,
      ledLength: 12,
      mockupUrl: '',
      description: 'Lädt Design...'
    },
    customWidth: 100,
    calculatedHeight: 33,
    isWaterproof: false,
    isTwoPart: false,
    hasUvPrint: true,
    hasHangingSystem: false,
    includesInstallation: false,
    expressProduction: false,
    customerPostalCode: '',
    selectedShipping: null,
    signs: [],
    isConfirmed: false,
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
            calculatedHeight: initialHeight,
          }));
        }
      } catch (error) {
        console.error('Failed to load designs:', error);
      }
    };

    loadDesigns();
  }, []);

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
      design: design,
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
      signs: [...prev.signs, newSign]
    }));
  };

  const handleSignToggle = (signId: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      signs: prev.signs.map(sign =>
        sign.id === signId ? { ...sign, isEnabled: enabled } : sign
      )
    }));
  };

  const handleRemoveSign = (signId: string) => {
    setConfig(prev => ({
      ...prev,
      signs: prev.signs.filter(sign => sign.id !== signId)
    }));
  };

  const handleShippingChange = (shipping: any) => {
    setConfig(prev => ({ ...prev, selectedShipping: shipping }));
  };

  const handleBackgroundChange = (background: string) => {
    setSelectedBackground(background);
  };

  const handleWaterproofChange = (isWaterproof: boolean) => {
    setConfig(prev => ({ ...prev, isWaterproof }));
  };

  return (
    <Router>
      <Routes>
        {/* Main Configurator */}
        <Route path="/" element={
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
            <CustomerHeader 
              customerName="Nontel"
              customerLogo="/assets/Nontel Long White.svg"
              orderToken="demo-token"
            />
            
            <div className="pt-12 md:pt-16">
              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
                {currentView === 'design' && (
                  <div className="grid lg:grid-cols-12 gap-4 md:gap-8">
                    {/* Left Column - Design & Configuration */}
                    <div className="lg:col-span-4 space-y-4 md:space-y-6">
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

                    {/* Center Column - Mockup Display */}
                    <div className="lg:col-span-5">
                      <div className="bg-white rounded-xl md:rounded-2xl shadow-xl overflow-hidden">
                        <div className="aspect-[4/3] relative">
                          <NeonMockupStage
                            lengthCm={Math.max(config.customWidth, config.calculatedHeight)}
                            waterproof={config.isWaterproof}
                            neonOn={true}
                            uvOn={config.hasUvPrint || true}
                            selectedBackground={selectedBackground}
                            onBackgroundChange={handleBackgroundChange}
                            onWaterproofChange={handleWaterproofChange}
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
                          onRemoveSign: handleRemoveSign,
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

            {/* Monday.com Status */}
            <div className="fixed bottom-4 right-4 z-50">
              <MondayStatus />
            </div>

            {/* Legal Footer */}
            <footer className="bg-white border-t border-gray-200 mt-16">
              <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-wrap justify-center space-x-6 text-sm text-gray-600">
                  <a href="/agb" className="hover:text-blue-600 transition-colors">AGB</a>
                  <a href="/datenschutz" className="hover:text-blue-600 transition-colors">Datenschutz</a>
                  <a href="/impressum" className="hover:text-blue-600 transition-colors">Impressum</a>
                  <a href="/widerrufsrecht" className="hover:text-blue-600 transition-colors">Widerrufsrecht</a>
                  <a href="/zahlung-versand" className="hover:text-blue-600 transition-colors">Zahlung & Versand</a>
                </div>
                <div className="text-center text-xs text-gray-500 mt-4">
                  © 2025 Nontel - Professionelle LED-Neon-Schilder
                </div>
              </div>
            </footer>
          </div>
        } />

        {/* Stripe Products Page */}
        <Route path="/products" element={<ProductsPage />} />
        
        {/* Success Page */}
        <Route path="/success" element={<SuccessPage />} />
        
        {/* Auth Pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Legal Pages */}
        <Route path="/agb" element={<AgbPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/widerrufsrecht" element={<WiderrufsrechtPage />} />
        <Route path="/zahlung-versand" element={<ZahlungVersandPage />} />
        
        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;