import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Zap, Shield, Calculator, Plus, Truck, Ruler, Palette } from 'lucide-react';
import ConfigurationPanel from './components/ConfigurationPanel';
import PricingPage from './components/PricingPage';
import NeonMockupStage from './components/NeonMockupStage';
import MondayStatus from './components/MondayStatus';
import { ConfigurationState, NeonDesign, SignConfiguration, ShippingOption } from './types/configurator';
import { calculateProportionalHeight, calculateProportionalLedLength, calculateSingleSignPrice } from './utils/calculations';
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
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<NeonDesign[]>([]);
  
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
            customWidth: 200,
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

  // Calculate current design price
  const currentDesignPrice = calculateSingleSignPrice(
    config.selectedDesign,
    config.customWidth,
    config.calculatedHeight,
    config.isWaterproof,
    config.isTwoPart || false,
    config.hasUvPrint,
    config.hasHangingSystem || false,
    config.expressProduction || false
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="px-4 pb-8">
        {/* Mockup Stage - Full Width */}
        <div className="mb-6">
          <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl" style={{ height: '600px' }}>
            {/* Yellow bulb icon */}
            <div className="absolute top-4 left-4 z-10 bg-yellow-500 rounded-full p-3 shadow-lg">
              <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Navigation arrows */}
            <button className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 z-10">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 z-10">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Design indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <div className="w-3 h-3 bg-white/40 rounded-full"></div>
              <div className="w-3 h-3 bg-white/40 rounded-full"></div>
              <div className="w-3 h-3 bg-white/40 rounded-full"></div>
              <div className="w-3 h-3 bg-white/40 rounded-full"></div>
            </div>

            {/* Vollbild hint */}

            <NeonMockupStage
              lengthCm={Math.max(config.customWidth, config.calculatedHeight)}
              waterproof={config.isWaterproof}
              neonOn={true}
              uvOn={config.hasUvPrint || true}
              selectedBackground="ab_100cm_50%"
              onWaterproofChange={(isWaterproof) => handleConfigChange({ isWaterproof })}
            />
          </div>
        </div>

        {/* Technical Data Bar */}
        <div className="bg-gray-200 rounded-lg shadow-sm p-4 -mt-4">
          <div className="flex items-center justify-between">
            {/* Left side - Technical Data */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Technische Daten</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div>
                  <span className="text-gray-600">Elemente: </span>
                  <span className="font-bold text-green-600">{config.selectedDesign.elements}</span>
                </div>
                <div>
                  <span className="text-gray-600">LED-Länge: </span>
                  <span className="font-bold text-green-600">
                    {calculateProportionalLedLength(
                      config.selectedDesign.originalWidth,
                      config.selectedDesign.originalHeight,
                      config.selectedDesign.ledLength,
                      config.customWidth,
                      config.calculatedHeight
                    )}m
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Verbrauch: </span>
                  <span className="font-bold text-green-600">
                    {Math.round(calculateProportionalLedLength(
                      config.selectedDesign.originalWidth,
                      config.selectedDesign.originalHeight,
                      config.selectedDesign.ledLength,
                      config.customWidth,
                      config.calculatedHeight
                    ) * 8 * 1.25)}W
                  </span>
                </div>
              </div>
            </div>

            {/* Right side - Original Data */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Originale Daten</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div>
                  <span className="text-gray-600">Breite: </span>
                  <span className="font-bold text-blue-600">{config.selectedDesign.originalWidth}cm</span>
                </div>
                <div>
                  <span className="text-gray-600">Höhe: </span>
                  <span className="font-bold text-blue-600">{config.selectedDesign.originalHeight}cm</span>
                </div>
                <div>
                  <span className="text-gray-600">LED-Länge: </span>
                  <span className="font-bold text-blue-600">{config.selectedDesign.ledLength}m</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Panel - Full Width */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            {/* Left side - Title and Options */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 rounded-lg p-2">
                  <Ruler className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Konfiguration</h2>
              </div>
            </div>
            
            {/* Right side - Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  const newSign: SignConfiguration = {
                    id: `sign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    design: config.selectedDesign,
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
                }}
                className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Hinzufügen</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">€{currentDesignPrice.toFixed(2)}</span>
              </button>

              <button
                onClick={() => navigate('/pricing')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <Truck className="h-5 w-5" />
                <span>Versand berechnen</span>
              </button>
            </div>
          </div>

          {/* Size Configuration - Compact horizontal layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Width */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Breite
              </label>
              <div className="mb-3">
                <input
                  type="number"
                  min="30"
                  max={config.isTwoPart ? 1000 : Math.min(300, Math.floor((200 * config.selectedDesign.originalWidth) / config.selectedDesign.originalHeight))}
                  value={config.customWidth}
                  onChange={(e) => {
                    const newWidth = Number(e.target.value);
                    const newHeight = calculateProportionalHeight(
                      config.selectedDesign.originalWidth,
                      config.selectedDesign.originalHeight,
                      newWidth
                    );
                    
                    if (!config.isTwoPart && newHeight > 200) {
                      return;
                    }
                    
                    handleConfigChange({
                      customWidth: newWidth,
                      calculatedHeight: newHeight,
                    });
                  }}
                  className="w-full px-4 py-3 text-center text-lg font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="text-right mt-1">
                  <span className="text-sm text-gray-500">cm</span>
                </div>
              </div>
              <input
                type="range"
                min="30"
                max={config.isTwoPart ? 1000 : Math.min(300, Math.floor((200 * config.selectedDesign.originalWidth) / config.selectedDesign.originalHeight))}
                value={config.customWidth}
                onChange={(e) => {
                  const newWidth = Number(e.target.value);
                  const newHeight = calculateProportionalHeight(
                    config.selectedDesign.originalWidth,
                    config.selectedDesign.originalHeight,
                    newWidth
                  );
                  
                  if (!config.isTwoPart && newHeight > 200) {
                    return;
                  }
                  
                  handleConfigChange({
                    customWidth: newWidth,
                    calculatedHeight: newHeight,
                  });
                }}
                className="w-full appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>30cm</span>
                <span>3m</span>
              </div>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Höhe
              </label>
              <div className="bg-gray-100 px-4 py-3 rounded-lg text-center mb-3">
                <div className="text-lg font-bold text-gray-800">{config.calculatedHeight} cm</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-xs text-gray-500">Automatisch berechnet</div>
                <div className="text-xs text-gray-500">Max: 200cm</div>
              </div>
            </div>
          </div>

          {/* Option Buttons - Below width/height section */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            <button
              onClick={() => handleConfigChange({ isWaterproof: !config.isWaterproof })}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                config.isWaterproof
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className={`h-4 w-4 ${config.isWaterproof ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="font-medium">Wasserdicht</span>
              {config.isWaterproof && <span className="text-xs bg-blue-100 px-2 py-0.5 rounded">+25%</span>}
            </button>

            <button
              onClick={() => handleConfigChange({ hasUvPrint: !config.hasUvPrint })}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                config.hasUvPrint
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <Palette className={`h-4 w-4 ${config.hasUvPrint ? 'text-purple-600' : 'text-gray-400'}`} />
              <span className="font-medium">UV-Druck</span>
              {config.hasUvPrint && <span className="text-xs bg-purple-100 px-2 py-0.5 rounded">Empfohlen</span>}
            </button>

            <button
              onClick={() => handleConfigChange({ hasHangingSystem: !config.hasHangingSystem })}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                config.hasHangingSystem
                  ? 'border-gray-500 bg-gray-50 text-gray-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className={`h-4 w-4 ${config.hasHangingSystem ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="font-medium">Hängesystem</span>
              {config.hasHangingSystem && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Optional</span>}
            </button>

            <button
              onClick={() => handleConfigChange({ expressProduction: !config.expressProduction })}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                config.expressProduction
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <Zap className={`h-4 w-4 ${config.expressProduction ? 'text-orange-600' : 'text-gray-400'}`} />
              <span className="font-medium">Express</span>
              {config.expressProduction && <span className="text-xs bg-orange-100 px-2 py-0.5 rounded">+30%</span>}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
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