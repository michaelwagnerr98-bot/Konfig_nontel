import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Zap, Shield, Calculator, Plus, Truck } from 'lucide-react';
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
          <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl" style={{ height: '400px' }}>
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

            {/* Size buttons S M L O */}
            <div className="absolute bottom-4 left-4 z-10 flex space-x-2">
              <button className="w-8 h-8 bg-gray-800/80 text-white rounded-md text-sm font-bold hover:bg-gray-700/80 transition-colors">S</button>
              <button className="w-8 h-8 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-colors">M</button>
              <button className="w-8 h-8 bg-gray-800/80 text-white rounded-md text-sm font-bold hover:bg-gray-700/80 transition-colors">L</button>
              <button className="w-8 h-8 bg-gray-800/80 text-white rounded-md text-sm font-bold hover:bg-gray-700/80 transition-colors">O</button>
            </div>

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
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
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

        {/* Configuration and Action Buttons */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            <ConfigurationPanel
              config={config}
              onConfigChange={handleConfigChange}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
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
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
            >
              <Plus className="h-5 w-5" />
              <span>Hinzufügen</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">€{currentDesignPrice.toFixed(2)}</span>
            </button>

            <button
              onClick={() => navigate('/pricing')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
            >
              <Truck className="h-5 w-5" />
              <span>Versand berechnen</span>
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