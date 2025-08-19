import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerHeader from './components/CustomerHeader';
import MondayStatus from './components/MondayStatus';
import ConfigurationPanel from './components/ConfigurationPanel';
import DesignSelector from './components/DesignSelector';
import PricingCalculator from './components/PricingCalculator';
import CartCheckout from './components/CartCheckout';
import ShippingSelector from './components/ShippingSelector';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ProductsPage from './components/ProductsPage';
import SuccessPage from './components/SuccessPage';
import WiderrufsrechtPage from './components/legal/WiderrufsrechtPage';
import DatenschutzPage from './components/legal/DatenschutzPage';
import AgbPage from './components/legal/AgbPage';
import ZahlungVersandPage from './components/legal/ZahlungVersandPage';
import ImpressumPage from './components/legal/ImpressumPage';
import { ConfigurationState, SignConfiguration } from './types/configurator';
import { MOCK_DESIGNS } from './data/mockDesigns';
import { calculateProportionalHeight, calculateSingleSignPrice, calculateProportionalLedLength } from './utils/calculations';
import NeonMockupStage from './components/NeonMockupStage';
import { ShoppingCart, X, ArrowLeft, ChevronLeft, ChevronRight, Settings, FileText, Ruler, Shield, Truck, Wrench, MapPin, Info, Scissors, Palette } from 'lucide-react';
import { Edit3 } from 'lucide-react';
import ShippingCalculationPage from './components/ShippingCalculationPage';
import mondayService from './services/mondayService';

// Conditional Supabase import
let supabase: any = null;
try {
  const supabaseModule = await import('./lib/supabase');
  supabase = supabaseModule.supabase;
} catch (error) {
  console.warn('Supabase not configured, running in demo mode');
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supabase) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    } else {
      // Demo mode - no authentication
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/products" />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/products" />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/widerrufsrecht" element={<WiderrufsrechtPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/agb" element={<AgbPage />} />
        <Route path="/zahlung-versand" element={<ZahlungVersandPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/" element={<NeonConfiguratorApp />} />
      </Routes>
    </Router>
  );
}

function NeonConfiguratorApp() {
  const [neonOn, setNeonOn] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [config, setConfig] = useState<ConfigurationState>({
    selectedDesign: MOCK_DESIGNS[0],
    customWidth: 200, // 2m
    calculatedHeight: 100, // Will be calculated
    isWaterproof: false,
    hasUvPrint: true,
    hasHangingSystem: false,
    includesInstallation: false,
    customerPostalCode: '',
    selectedShipping: null,
    // Initialize with empty signs array
    signs: [],
  });
  
  const [availableDesigns, setAvailableDesigns] = useState(MOCK_DESIGNS);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(true);
  
  // State für temporäre "Im Warenkorb" Animation
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Mobile cart state
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [currentStep, setCurrentStep] = useState<'design' | 'cart'>('design');
  const [showShippingPage, setShowShippingPage] = useState(false);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Load designs from Monday.com on component mount
  useEffect(() => {
    const loadDesigns = async () => {
      try {
        await mondayService.fetchPrices();
        const mondayDesigns = mondayService.getDesigns();
        
        if (mondayDesigns.length > 0) {
          console.log('🎨 Monday.com Designs geladen:', mondayDesigns.length);
          setAvailableDesigns(mondayDesigns);
          // Set first Monday design as selected if available
          if (mondayDesigns[0]) {
            setConfig(prev => ({
              ...prev,
              selectedDesign: mondayDesigns[0]
            }));
          }
        } else {
          console.log('📦 Verwende Mock-Designs als Fallback');
          setAvailableDesigns(MOCK_DESIGNS);
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden der Designs:', error);
        setAvailableDesigns(MOCK_DESIGNS);
      } finally {
        setIsLoadingDesigns(false);
      }
    };

    loadDesigns();
  }, []);

  // Update height when design or width changes
  useEffect(() => {
    const newHeight = calculateProportionalHeight(
      config.selectedDesign.originalWidth,
      config.selectedDesign.originalHeight,
      config.customWidth
    );
    setConfig(prev => ({ ...prev, calculatedHeight: newHeight }));
  }, [config.selectedDesign, config.customWidth]);

  const handleConfigChange = (updates: Partial<ConfigurationState>) => {
    console.log('🔧 Config change:', updates);
    
    // Neon ausschalten bei Konfigurationsänderungen die das Design beeinflussen
    if ((updates.customWidth !== undefined || updates.calculatedHeight !== undefined || 
         updates.isWaterproof !== undefined || updates.isTwoPart !== undefined) && neonOn) {
      setNeonOn(false);
      setIsResizing(true);
      
      // Clear existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      // Neon nach 600ms wieder einschalten
      resizeTimeoutRef.current = setTimeout(() => {
        setNeonOn(true);
        setIsResizing(false);
      }, 600);
    }
    
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      
      // Reset shipping selection when installation is enabled
      if (updates.includesInstallation === true) {
        newConfig.selectedShipping = null;
      }
      
      // Update existing signs with new configuration when relevant settings change
      if (updates.isWaterproof !== undefined || updates.isTwoPart !== undefined || updates.hasUvPrint !== undefined || updates.hasHangingSystem !== undefined) {
        const updatedSigns = newConfig.signs.map(sign => ({
          ...sign,
          isWaterproof: updates.isWaterproof !== undefined ? updates.isWaterproof : newConfig.isWaterproof,
          isTwoPart: updates.isTwoPart !== undefined ? updates.isTwoPart : newConfig.isTwoPart,
          hasUvPrint: updates.hasUvPrint !== undefined ? updates.hasUvPrint : newConfig.hasUvPrint,
          hasHangingSystem: updates.hasHangingSystem !== undefined ? updates.hasHangingSystem : newConfig.hasHangingSystem,
        }));
        newConfig.signs = updatedSigns;
      }
      
      // Also update signs when width changes (this affects the current design dimensions)
      if (updates.customWidth !== undefined || updates.calculatedHeight !== undefined) {
        const updatedSigns = newConfig.signs.map(sign => {
          // Only update signs that match the current selected design
          if (sign.design.id === newConfig.selectedDesign.id) {
            return {
              ...sign,
              width: updates.customWidth !== undefined ? updates.customWidth : newConfig.customWidth,
              height: updates.calculatedHeight !== undefined ? updates.calculatedHeight : newConfig.calculatedHeight,
              // Also update hasUvPrint for the current design
              hasUvPrint: updates.hasUvPrint !== undefined ? updates.hasUvPrint : newConfig.hasUvPrint,
              hasHangingSystem: updates.hasHangingSystem !== undefined ? updates.hasHangingSystem : newConfig.hasHangingSystem,
            };
          }
          return sign;
        });
        newConfig.signs = updatedSigns;
      }
      
      console.log('🔧 New config after update:', newConfig);
      return newConfig;
    });
  };

  const handleDesignChange = (design: typeof MOCK_DESIGNS[0]) => {
    const newHeight = calculateProportionalHeight(
      design.originalWidth,
      design.originalHeight,
      design.originalWidth
    );
    setConfig(prev => ({
      ...prev,
      selectedDesign: design,
      customWidth: design.originalWidth,
      calculatedHeight: newHeight,
    }));
  };

  const handleToggleDesign = (design: typeof MOCK_DESIGNS[0], added: boolean) => {
    // Starte Animation
    setIsAddingToCart(true);
    
    // Always add new sign (ignore 'added' parameter)
    const newSign: SignConfiguration = {
      id: `sign-${design.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID for duplicates
      design: design,
      width: config.customWidth,
      height: calculateProportionalHeight(design.originalWidth, design.originalHeight, config.customWidth),
      isEnabled: true,
      isWaterproof: config.isWaterproof,
      isTwoPart: config.isTwoPart,
      hasUvPrint: config.hasUvPrint ?? true,
      hasHangingSystem: config.hasHangingSystem ?? false,
    };
    console.log('➕ Adding new sign with hasUvPrint:', newSign.hasUvPrint);
    setConfig(prev => ({
      ...prev,
      signs: [...prev.signs, newSign]
    }));
    
    // Animation nach 1 Sekunde beenden
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 1000);
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

  const handleDesignUpdate = (updatedDesign: typeof MOCK_DESIGNS[0]) => {
    setConfig(prev => ({
      ...prev,
      selectedDesign: updatedDesign
    }));
  };

  // Check if current design is already added
  const currentDesignCount = config.signs.filter(sign => sign.design.id === config.selectedDesign.id).length;
  const isCurrentDesignAdded = currentDesignCount > 0;
  // Customer data (would come from URL params or API in real implementation)
  const customerData = {
    name: "Müller GmbH & Co. KG",
    logo: "/Logo Long White.png",
    orderToken: "neon-order-8f4e2d1a-b3c5-4d6e-7f8g-9h0i1j2k3l4m",
  };
  
  // Calculate current design price for mobile cart
  const currentDesignPrice = React.useMemo(() => {
    console.log('📱 Mobile cart price calculation with hasUvPrint:', config.hasUvPrint, 'hasHangingSystem:', config.hasHangingSystem);
    const basePrice = calculateSingleSignPrice(
      config.selectedDesign,
      config.customWidth,
      config.calculatedHeight,
      config.isWaterproof,
      config.isTwoPart || false,
      config.hasUvPrint,
      config.hasHangingSystem || false,
      config.expressProduction || false
    );
    
    return basePrice;
  }, [config.selectedDesign, config.customWidth, config.calculatedHeight, config.isWaterproof, config.isTwoPart, config.hasUvPrint, config.hasHangingSystem, config.expressProduction]);
  
  // Calculate total items in cart
  const cartItemCount = config.signs.filter(s => s.isEnabled).length;

  // Calculate effective max width based on height constraints
  const maxWidthForHeight = React.useMemo(() => {
    const maxHeight = 200; // Maximum allowed height in cm
    return Math.floor((maxHeight * config.selectedDesign.originalWidth) / config.selectedDesign.originalHeight);
  }, [config.selectedDesign.originalWidth, config.selectedDesign.originalHeight]);

  const effectiveMaxWidth = React.useMemo(() => {
    if (config.isTwoPart) {
      return 1000; // 10m for two-part signs
    }
    return Math.min(300, maxWidthForHeight); // 3m or height-constrained width, whichever is smaller
  }, [config.isTwoPart, maxWidthForHeight]);

  const handleWidthChange = (newWidth: number) => {
    // Neon ausschalten während Größenänderung
    if (neonOn) {
      setNeonOn(false);
      setIsResizing(true);
    }
    
    // Clear existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    
    const newHeight = calculateProportionalHeight(
      config.selectedDesign.originalWidth,
      config.selectedDesign.originalHeight,
      newWidth
    );
    
    // Check if height exceeds 200cm and isTwoPart is not enabled
    if (newHeight > 200 && !config.isTwoPart) {
      // Don't update if it would exceed height limit
      return;
    }
    
    handleConfigChange({ 
      customWidth: newWidth,
      calculatedHeight: newHeight
    });
    
    // Neon nach 800ms wieder einschalten
    resizeTimeoutRef.current = setTimeout(() => {
      setNeonOn(true);
      setIsResizing(false);
    }, 800);
  };

  const handleGoToCart = () => {
    setCurrentStep('cart');
  };

  const handleBackToDesign = () => {
    setCurrentStep('design');
  };

  const handleShowShippingPage = () => {
    setShowShippingPage(true);
  };

  const handleCloseShippingPage = () => {
    setShowShippingPage(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 overflow-x-hidden relative">
      {!showShippingPage && (
        <CustomerHeader
          customerName={customerData.name}
          customerLogo={customerData.logo}
          orderToken={customerData.orderToken}
        />
      )}
      
      {/* Shipping Calculation Page */}
      {showShippingPage && (
        <ShippingCalculationPage
          config={config}
          onConfigChange={handleConfigChange}
          onClose={handleCloseShippingPage}
          onSignToggle={handleSignToggle}
          onRemoveSign={handleRemoveSign}
        />
      )}
      
      {/* Main Content - Hidden when shipping page is open */}
      {!showShippingPage && (
      <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-20 lg:pb-12">
        {/* Step Navigation */}
        {currentStep === 'cart' && (
          <div className="mb-6 pt-20">
            <button
              onClick={handleBackToDesign}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Zurück zur Konfiguration</span>
            </button>
          </div>
        )}
        
        {/* Desktop Title - Hidden on Mobile and in Cart */}

        {/* Mobile Layout - Completely Redesigned */}
        <div className={`lg:hidden ${currentStep === 'cart' ? 'hidden' : ''}`}>
          {/* STEP 1: Design Selection - Primary Focus */}
          <div className="bg-white rounded-2xl shadow-lg mx-4 mb-6 overflow-hidden mt-20">
            {/* Simple Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h1 className="text-xl font-bold text-white text-center">Neon-Schild Designer</h1>
            </div>
            
            {/* Design Display - Simplified */}
            <div className="p-6">
              <DesignSelector
                designs={availableDesigns}
                selectedDesign={config.selectedDesign}
                onDesignChange={handleDesignChange}
                onToggleDesign={handleToggleDesign}
                config={config}
                isWaterproof={config.isWaterproof}
                isTwoPart={config.isTwoPart}
                hasUvPrint={config.hasUvPrint}
                onUvPrintChange={(hasUvPrint) => handleConfigChange({ hasUvPrint })}
                onConfigChange={handleConfigChange}
              />
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center text-gray-500 text-sm">
                  Weitere Optionen folgen
                </div>
              </div>
            </div>
          </div>
          
          {/* STEP 2: Size - Single Focus */}
          <div className="bg-white rounded-2xl shadow-lg mx-4 mb-6 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">Größe wählen</h2>
            
            {/* Width Slider - Primary Control */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 font-medium">Breite</span>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold">
                  {config.customWidth} cm
                </div>
              </div>
              
              <input
                type="range"
                min="20"
                max={config.isTwoPart ? 1000 : 300}
                value={config.customWidth}
                onChange={(e) => handleConfigChange({ customWidth: Number(e.target.value) })}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>20cm</span>
                <span>{config.isTwoPart ? '10m' : '3m'}</span>
              </div>
            </div>
            
            {/* Height Display - Secondary Info */}
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-sm text-purple-600 font-medium mb-1">Höhe (automatisch)</div>
              <div className="text-2xl font-bold text-purple-800">{config.calculatedHeight} cm</div>
            </div>
          </div>
          
          {/* STEP 3: Options - Simplified */}
          <div className="bg-white rounded-2xl shadow-lg mx-4 mb-6 p-6">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="text-white text-xl">⚙️</div>
              <h2 className="text-lg font-bold text-gray-800 text-center">Optionen</h2>
            </div>
            
            <div className="space-y-4">
              {/* Waterproof - Simplified */}
              <label className="flex items-center justify-between p-4 bg-blue-50 rounded-xl cursor-pointer">
                <div>
                  <div className="font-semibold text-gray-800">Wasserdicht</div>
                  <div className="text-sm text-gray-500">+25% Aufpreis</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.isWaterproof}
                  onChange={(e) => handleConfigChange({ isWaterproof: e.target.checked })}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded mt-0.5 flex-shrink-0"
                />
              </label>
              
              {/* Two-Part - Simplified */}
              <label className="flex items-center justify-between p-4 bg-orange-50 rounded-xl cursor-pointer">
                <div>
                  <div className="font-semibold text-gray-800">Mehrteilig</div>
                  <div className="text-sm text-gray-500">+15% Aufpreis</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.isTwoPart || false}
                  onChange={(e) => handleConfigChange({ isTwoPart: e.target.checked })}
                  className="w-6 h-6 text-orange-600 rounded focus:ring-orange-500"
                />
              </label>
              
              <label className="flex items-start space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                <input
                  type="checkbox"
                  checked={config.hasUvPrint}
                  onChange={(e) => handleConfigChange({ hasUvPrint: e.target.checked })}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded mt-0.5 flex-shrink-0"
                />
                <div className="flex items-center space-x-1">
                  <span className="text-purple-800 font-bold text-sm">UV-Druck</span>
                  <div className="relative group">
                    <Info className="h-4 w-4 text-purple-500 hover:text-purple-700 cursor-help transition-colors flex-shrink-0" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Es werden extra Hängehalterungen eingepackt damit das Schild aufhängen kann auf zwei Stahl Drähte, ansonsten werden ganz normale Abstandhalterungen geliefert (im Preis inkl.)
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </label>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="w-4 h-4 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <div className="w-3 h-3 bg-gray-300 rounded border"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-red-600 text-lg flex-shrink-0">🔥</div>
                  <div>
                    <span className="text-gray-700 font-medium text-sm">Super EXPRESS Produktion</span>
                    <div className="text-sm text-gray-500">1 Tag • Muss telefonisch abgeklärt werden</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Desktop Layout - Unchanged */}
        <div className={`hidden lg:block ${currentStep === 'cart' ? 'lg:hidden' : ''}`}>
          {/* 1. Großer Hintergrundbereich (Produktvorschau) - Volle Breite */}
          <div className="mb-8 -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 md:-mt-12">
            {/* Großes Mockup-Bild - Volle Breite */}
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 h-[600px] pt-20 flex items-center justify-center w-full border-4 border-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 shadow-2xl overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/10 before:via-purple-500/10 before:to-pink-500/10 before:animate-pulse before:pointer-events-none after:absolute after:inset-0 after:border-2 after:border-gradient-to-r after:from-cyan-400/20 after:via-purple-400/20 after:to-pink-400/20 after:rounded-lg after:animate-pulse after:pointer-events-none">
            {/* Stylische Ecken-Ornamente */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-3 border-t-3 border-blue-400/60 rounded-tl-xl z-10"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-3 border-t-3 border-purple-400/60 rounded-tr-xl z-10"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-3 border-b-3 border-pink-400/60 rounded-bl-xl z-10"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-3 border-b-3 border-cyan-400/60 rounded-br-xl z-10"></div>
            
            {/* Glowing border effect */}
            <div className="absolute inset-2 rounded-xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse pointer-events-none z-10"></div>
            
              <NeonMockupStage
  lengthCm={config.customWidth}        // dein Breite-Wert in cm
  waterproof={config.isWaterproof}     // Wasserdicht-Knopf
  uvOn={!!config.hasUvPrint}           // UV-Druck
  neonOn={neonOn && !isResizing}       // Neon an/aus - automatisch aus während Größenänderung
/* optional – falls du diese States schon hast:
  bgBrightness={bgHelligkeit}
  neonIntensity={neonStaerke}
  sceneZoom={sceneZoom}
*/
 />
              
              <button
                onClick={() => {
                  const currentIndex = availableDesigns.findIndex(d => d.id === config.selectedDesign.id);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableDesigns.length - 1;
                  handleDesignChange(availableDesigns[prevIndex]);
                }}
                className="absolute left-6 top-1/2 transform -translate-y-1/2 transition-all duration-300"
              >
                <ChevronLeft className="h-12 w-6 text-white drop-shadow-lg" />
              </button>
              
              <button
                onClick={() => {
                  const currentIndex = availableDesigns.findIndex(d => d.id === config.selectedDesign.id);
                  const nextIndex = currentIndex < availableDesigns.length - 1 ? currentIndex + 1 : 0;
                  handleDesignChange(availableDesigns[nextIndex]);
                }}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 transition-all duration-300"
              >
                <ChevronRight className="h-12 w-6 text-white drop-shadow-lg" />
              </button>
              
              {/* Design Indicators */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                {availableDesigns.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDesignChange(availableDesigns[index])}
                    className={`w-4 h-4 rounded-full transition-all duration-300 border-2 border-white/50 ${
                      index === availableDesigns.findIndex(d => d.id === config.selectedDesign.id)
                        ? 'bg-white shadow-lg shadow-white/50 scale-125'
                        : 'bg-white/30 hover:bg-white/60 backdrop-blur-sm'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* 2. Produktinformationen direkt unter dem Mockup - ohne Container */}
            <div className="mx-4 sm:mx-6 lg:mx-8 -mt-1">
              <div className="flex items-center justify-between text-xs py-3 px-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100">
                {/* Technische Daten Abteilung - Links */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-bold text-green-800">Technische Daten</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-green-700">Elemente:</span>
                      <span className="font-bold text-green-600 ml-1">{config.selectedDesign.elements}</span>
                    </div>
                    <div>
                      <span className="text-green-700">LED-Länge:</span>
                      <span className="font-bold text-green-600 ml-1">
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
                      <span className="text-green-700">Verbrauch:</span>
                      <span className="font-bold text-green-600 ml-1">
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
                
                {/* Originale Daten Abteilung - Rechts */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-bold text-blue-800">Originale Daten</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-blue-700">Breite:</span>
                      <span className="font-bold text-blue-600 ml-1">{config.selectedDesign.originalWidth}cm</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Höhe:</span>
                      <span className="font-bold text-blue-600 ml-1">{config.selectedDesign.originalHeight}cm</span>
                    </div>
                    <div>
                      <span className="text-blue-700">LED-Länge:</span>
                      <span className="font-bold text-blue-600 ml-1">{config.selectedDesign.ledLength}m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 3. Zwei-Spalten-Layout für Konfiguration und Optionen */}
          <div className="w-full">
            {/* Links - Konfiguration */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-2">
                    <Ruler className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Konfiguration</h2>
                </div>
                
                {/* Versand berechnen Button rechts */}
                <div className="flex items-center space-x-3">
                  {/* Hinzufügen Button */}
                  {isAddingToCart ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 animate-pulse">
                        <div className="bg-green-500 rounded-full p-0.5">
                          <svg className="w-4 h-4 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-green-800 font-bold text-base animate-pulse">Im Warenkorb</span>
                        <div className="text-base font-bold text-green-800">
                          €{currentDesignPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleToggleDesign(config.selectedDesign, true)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl flex items-center space-x-3 text-lg group relative overflow-hidden z-20"
                    >
                      {/* Glowing background animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>
                      
                      <div className="bg-white/20 rounded-full p-0.5">
                        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <span className="font-bold relative z-10">{currentDesignCount > 0 ? 'Weitere hinzufügen' : 'Hinzufügen'}</span>
                      <div className="bg-white/20 rounded-full px-3 py-1 text-base font-bold">
                        €{currentDesignPrice.toFixed(2)}
                      </div>
                    </button>
                  )}
                  
                  {/* Versand berechnen Button */}
                  <div className="relative">
                    <button 
                      onClick={handleShowShippingPage}
                      className="relative bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl flex items-center space-x-3 font-bold text-lg group z-10 overflow-hidden"
                    >
                      {/* Sliding background animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
                      
                      <Truck className="h-6 w-6 relative z-10 group-hover:animate-bounce" />
                      <span className="font-bold relative z-10">Versand berechnen</span>
                    </button>
                    
                    {/* Animated Cart Counter Badge - Outside button but inside wrapper */}
                    {cartItemCount > 0 && (
                      <div className="absolute -top-3 -right-3 bg-red-500 text-white text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center animate-bounce shadow-xl border-3 border-white z-30">
                        {cartItemCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Maße einstellen */}
              <div className="space-y-3 mb-4">
                {/* Breite und Höhe in einer Reihe */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Breite */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Breite</label>
                    <div className="flex items-center space-x-2 mb-1">
                      <input
                    <div className="relative bg-transparent h-[600px] pt-20 flex items-center justify-center w-full overflow-hidden">
                        min="30"
                        max={effectiveMaxWidth}
                        value={config.customWidth}
                        onChange={(e) => handleWidthChange(Number(e.target.value))}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      {isResizing && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded animate-pulse">
                          ⚡
                        </div>
                      )}
                      {isResizing && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                          Neon wird neu berechnet...
                        </div>
                      )}
                      <span className="text-gray-600 font-medium text-sm">cm</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max={config.isTwoPart ? 1000 : 300}
                      value={config.customWidth}
                      onChange={(e) => handleConfigChange({ customWidth: Number(e.target.value) })}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>30cm</span>
                      <span>{config.isTwoPart ? '10m' : '3m'}</span>
                    </div>
                    
                    {/* Mehrteilig Option - Nur bei 300cm sichtbar */}
                    {config.customWidth >= 300 && (
                      <div className="mt-3 animate-fade-in">
                        <label className="flex items-center space-x-2 cursor-pointer p-2 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={config.isTwoPart || false}
                            onChange={(e) => handleConfigChange({ isTwoPart: e.target.checked })}
                            className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
                          />
                          <Scissors className="h-4 w-4 text-orange-600" />
                          <div className="flex items-center space-x-1 flex-1">
                            <span className="text-sm font-medium text-orange-800">Mehrteilig (+15%)</span>
                            <div className="relative group">
                              <Info className="h-4 w-4 text-orange-500 hover:text-orange-700 cursor-help transition-colors" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                Das Schild wird aus mehreren Teilen gefertigt und muss vor Ort zusammengesetzt werden
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-orange-600">Erforderlich ab 300cm</div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Höhe */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Höhe</label>
                    <div className="bg-gray-100 px-2 py-2 rounded-lg text-center mb-1">
                      <span className="text-lg font-bold text-gray-800">{config.calculatedHeight} cm</span>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Automatisch berechnet
                    </div>
                    <div className="text-xs text-gray-500 text-center mt-1">
                      Max: 200cm
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Checkbox-Optionen */}
              <div className="grid grid-cols-4 gap-2">
                {/* Wasserdicht */}
                <button
                  onClick={() => handleConfigChange({ isWaterproof: !config.isWaterproof })}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border-2 transition-all duration-300 hover:scale-105 ${
                    config.isWaterproof
                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <Shield className="h-4 w-4 mb-0.5" />
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-medium leading-tight">Wasserdicht</span>
                    <div className="relative group">
                      <Info className="h-4 w-4 text-blue-400 hover:text-blue-600 cursor-help transition-colors" />
                      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 min-w-max">
                        Für Außenbereich geeignet • UV-Schutz & Wasserschutz (IP65)
                        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs opacity-75 leading-tight">+25%</span>
                </button>
                
                {/* UV-Druck */}
                <button
                  onClick={() => handleConfigChange({ hasUvPrint: !config.hasUvPrint })}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border-2 transition-all duration-300 hover:scale-105 relative ${
                    config.hasUvPrint
                      ? 'bg-purple-500 border-purple-500 text-white shadow-lg'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <Palette className="h-4 w-4 mb-0.5" />
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-medium leading-tight">UV-Druck</span>
                    <div className="relative group">
                      <Info className="h-4 w-4 text-purple-400 hover:text-purple-600 cursor-help transition-colors" />
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 min-w-max">
                        Hochwertige UV-Farben im Hintergrund
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs opacity-75 leading-tight">Empfohlen</span>
                </button>
                
                {/* Hängesystem */}
                <button
                  onClick={() => handleConfigChange({ hasHangingSystem: !(config.hasHangingSystem || false) })}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border-2 transition-all duration-300 hover:scale-105 ${
                    config.hasHangingSystem || false
                      ? 'bg-green-500 border-green-500 text-white shadow-lg'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="text-green-600 text-lg mb-0.5">🔗</div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-medium leading-tight">Hängesystem</span>
                    <div className="relative group">
                      <Info className="h-4 w-4 text-green-400 hover:text-green-600 cursor-help transition-colors" />
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 min-w-max">
                        Spezielle Aufhängevorrichtung für die Montage an Stahlseilen. Ohne diese Option erhalten Sie Standard-Wandhalterungen.
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs opacity-75 leading-tight">Optional</span>
                </button>
                
                {/* Express Herstellung - In der Reihe */}
                <button
                  onClick={() => handleConfigChange({ expressProduction: !(config.expressProduction || false) })}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border-2 transition-all duration-300 hover:scale-105 ${
                    config.expressProduction || false
                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  <div className="text-orange-600 text-lg mb-0.5">⚡</div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-medium leading-tight">Express Herstellung</span>
                    <div className="relative group">
                      <Info className="h-4 w-4 text-orange-400 hover:text-orange-600 cursor-help transition-colors" />
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 min-w-max">
                        5 Tage anstatt 2-3 Wochen Produktionszeit
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs opacity-75 leading-tight">+30%</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cart View - Mobile and Desktop */}
        {currentStep === 'cart' && (
          <div className="pt-20 lg:pt-0">
            <CartCheckout
              isCurrentDesignAdded={isCurrentDesignAdded}
              currentWidth={config.customWidth}
              currentHeight={config.calculatedHeight}
              signs={config.signs}
              onSignToggle={handleSignToggle}
              onRemoveSign={handleRemoveSign}
              isWaterproof={config.isWaterproof}
              isTwoPart={config.isTwoPart}
              hasUvPrint={config.hasUvPrint}
              config={config}
              onConfigChange={handleConfigChange}
              onShippingChange={handleShippingChange}
            />
          </div>
        )}
      </main>

      {false && (
        <div className="hidden lg:block fixed bottom-6 right-6 z-40">
          <PricingCalculator
            config={config}
            onConfigChange={handleConfigChange}
            onRemoveSign={handleRemoveSign}
            onGoToCart={handleGoToCart}
          />
        </div>
      )}

      {/* Mobile Cart Sticky Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">
              {cartItemCount} Artikel • €{currentDesignPrice.toFixed(2)}
            </div>
            <div className="text-lg font-bold text-green-600">
              Gesamt: €{(currentDesignPrice * 1.19).toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleGoToCart}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Warenkorb
          </button>
        </div>
      </div>

      {/* Monday Status - Static Footer */}
      <div className="mt-8 mb-4">
        <MondayStatus />
      </div>
      
      {/* Footer */}
      <footer className="text-gray-500 py-4 px-4 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
              <span className="font-medium text-gray-700">© 2025, Nontel Alle Rechte vorbehalten</span>
              <a href="/widerrufsrecht" className="hover:text-blue-600 transition-colors font-medium">
                Widerrufsrecht
              </a>
              <span className="text-gray-300">•</span>
              <a href="/datenschutz" className="hover:text-blue-600 transition-colors font-medium">
                Datenschutzerklärung
              </a>
              <span className="text-gray-300">•</span>
              <a href="/agb" className="hover:text-blue-600 transition-colors font-medium">
                AGB
              </a>
              <span className="text-gray-300">•</span>
              <a href="/zahlung-versand" className="hover:text-blue-600 transition-colors font-medium">
                Zahlung und Versand
              </a>
              <span className="text-gray-300">•</span>
              <a href="/impressum" className="hover:text-blue-600 transition-colors font-medium">
                Impressum
              </a>
            </div>
          </div>
        </div>
      </footer>
      </>
      )}

    </div>
  );
}

export default App;
