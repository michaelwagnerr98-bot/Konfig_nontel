import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Zap, Palette, Calculator, ShoppingCart } from 'lucide-react';
import DesignSelector from './components/DesignSelector';
import ConfigurationPanel from './components/ConfigurationPanel';
import PricingCalculator from './components/PricingCalculator';
import PricingPage from './components/PricingPage';
import MockupDisplay from './components/MockupDisplay';
import NeonMockupStage from './components/NeonMockupStage';
import MondayStatus from './components/MondayStatus';
import { ConfigurationState, NeonDesign, SignConfiguration, ShippingOption } from './types/configurator';
import { calculateProportionalHeight, calculateProportionalLedLength } from './utils/calculations';
import { getAvailableDesigns } from './data/mockDesigns';

// Main App component
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
      </Routes>
    </Router>
  );
}

// HomePage component
function HomePage() {
  const [designs, setDesigns] = useState<NeonDesign[]>([]);
  const [currentView, setCurrentView] = useState('design');
  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header - Responsive design */}
      <header className="bg-white shadow-sm border-b relative">
        {currentView === 'design' && (
          <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Main Grid - Responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-4">
            <ConfigurationPanel
              config={config}
              onConfigChange={handleConfigChange}
            />
          </div>

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
              onGoToCart={() => navigate('/pricing')}
            />
          </div>
        </div>
      </main>
        )}
      </header>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © 2025 Nontel - Michael Wagner. Alle Rechte vorbehalten.
            </p>
            <MondayStatus />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;