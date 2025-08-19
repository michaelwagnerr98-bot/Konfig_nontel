import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Zap, Settings, Calculator, ShoppingCart, Eye, EyeOff, X, Plus, Edit3, Palette, Ruler, Shield, Wrench, MapPin, Scissors, Info, Package, Home, Truck, CreditCard, FileText, Building, User, LogOut, Mail, Lock, UserPlus, CheckCircle, ArrowLeft } from 'lucide-react';
import { ConfigurationState, NeonDesign, SignConfiguration } from './types/configurator';
import { calculateProportionalHeight, calculateSingleSignPrice, calculateProportionalLedLength, validateConfiguration, calculateArea, calculateDistance, getShippingInfo } from './utils/calculations';
import { getAvailableDesigns } from './data/mockDesigns';
import { mondayService } from './services/mondayService';
import CustomerHeader from './components/CustomerHeader';
import MondayStatus from './components/MondayStatus';
import NeonMockupStage from './components/NeonMockupStage';
import ProductsPage from './components/ProductsPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import SuccessPage from './components/SuccessPage';
import AgbPage from './components/legal/AgbPage';
import DatenschutzPage from './components/legal/DatenschutzPage';
import ImpressumPage from './components/legal/ImpressumPage';
import WiderrufsrechtPage from './components/legal/WiderrufsrechtPage';
import ZahlungVersandPage from './components/legal/ZahlungVersandPage';
import SVGPreview from './components/SVGPreview';

// Import hooks from react-router-dom
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<NeonConfigurator />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/agb" element={<AgbPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/widerrufsrecht" element={<WiderrufsrechtPage />} />
        <Route path="/zahlung-versand" element={<ZahlungVersandPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const NeonConfigurator: React.FC = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<NeonDesign[]>([]);
  const [currentView, setCurrentView] = useState<'design' | 'cart'>('design');
  const [showPostalCodeInput, setShowPostalCodeInput] = useState(false);
  const [tempPostalCode, setTempPostalCode] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState('ab_100cm_50%');

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
    onConfigChange: undefined,
    onShippingChange: undefined,
    onSignToggle: undefined,
    onRemoveSign: undefined,
  });

  // Load designs on component mount
  useEffect(() => {
    const loadDesigns = async () => {
      try {
        const availableDesigns = await getAvailableDesigns();
        setDesigns(availableDesigns);
        if (availableDesigns.length > 0) {
          setConfig(prev => ({ ...prev, selectedDesign: availableDesigns[0] }));
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
    if (added) {
      const newSign: SignConfiguration = {
        id: `sign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        design: design,
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
        signs: [...prev.signs, newSign]
      }));
    }
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

  const handleWidthChange = (newWidth: number) => {
    const newHeight = calculateProportionalHeight(
      config.selectedDesign.originalWidth,
      config.selectedDesign.originalHeight,
      newWidth
    );
    
    if (!config.isTwoPart && newHeight > 200) {
      return;
    }
    
    setConfig(prev => ({
      ...prev,
      customWidth: newWidth,
      calculatedHeight: newHeight,
    }));
  };

  const handleTwoPartChange = (isTwoPart: boolean) => {
    if (!isTwoPart && config.customWidth > 300) {
      const newHeight = calculateProportionalHeight(
        config.selectedDesign.originalWidth,
        config.selectedDesign.originalHeight,
        300
      );
      setConfig(prev => ({
        ...prev,
        isTwoPart,
        customWidth: 300,
        calculatedHeight: newHeight,
      }));
    } else {
      setConfig(prev => ({ ...prev, isTwoPart }));
    }
  };

  const handlePostalCodeSubmit = () => {
    if (tempPostalCode && /^\d{5}$/.test(tempPostalCode)) {
      handleConfigChange({ customerPostalCode: tempPostalCode });
      setTempPostalCode('');
      setShowPostalCodeInput(false);
    }
  };

  const handleStripeCheckout = async () => {
    setIsProcessingPayment(true);
    
    try {
      let supabase: any = null;
      try {
        const supabaseModule = await import('./lib/supabase');
        supabase = supabaseModule.supabase;
      } catch (error) {
        console.warn('Supabase not available, using demo mode');
      }
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      if (supabase && supabaseUrl && supabaseUrl !== '') {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          alert('Bitte melden Sie sich zuerst an');
          setIsProcessingPayment(false);
          return;
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price_id: 'price_1QeGJd2LCcXvM9me52rlA2op',
            success_url: `${window.location.origin}/success`,
            cancel_url: `${window.location.origin}/`,
            mode: 'payment',
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        window.location.href = data.url;
      } else {
        const confirmed = confirm(
          `🛒 DEMO CHECKOUT\n\n` +
          `Dies ist eine Demo. Möchten Sie zur Erfolgsseite weitergeleitet werden?`
        );
        
        if (confirmed) {
          window.location.href = '/success?demo=true';
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(`Checkout-Fehler: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Calculate current design price
  const currentDesignPrice = calculateSingleSignPrice(
    config.selectedDesign,
    config.customWidth,
    config.calculatedHeight,
    config.isWaterproof,
    config.isTwoPart || false,
    config.hasUvPrint || true,
    config.hasHangingSystem || false,
    config.expressProduction || false
  );

  // Calculate individual sign prices
  const signPrices = config.signs?.map(sign => ({
    ...sign,
    price: calculateSingleSignPrice(
      sign.design,
      sign.width,
      sign.height,
      sign.isWaterproof,
      sign.isTwoPart,
      sign.hasUvPrint || true,
      sign.hasHangingSystem || false,
      sign.expressProduction || false
    )
  })) || [];

  // Calculate total
  const isCurrentDesignInList = config.signs?.some(sign => sign.design.id === config.selectedDesign.id) || false;
  const enabledSignsTotal = signPrices
    .filter(sign => sign.isEnabled)
    .reduce((total, sign) => total + sign.price, 0) + 
    (isCurrentDesignInList ? 0 : currentDesignPrice);

  // Get largest dimensions for shipping calculation
  const longestSide = Math.max(config.customWidth, config.calculatedHeight);
  
  // Get distance info if postal code is available
  const distanceInfo = config.customerPostalCode 
    ? calculateDistance('67433', config.customerPostalCode)
    : { distance: 0, cityName: '' };

  // Get shipping info based on longest side and distance
  const shippingInfo = getShippingInfo(longestSide, distanceInfo.distance || undefined);
  
  // Calculate shipping cost (0 if pickup is selected OR installation is included)
  const actualShippingCost = (config.selectedShipping?.type === 'pickup' || config.includesInstallation) ? 0 : shippingInfo.cost;
  
  // Calculate additional costs (installation + shipping)
  let installation = 0;
  if (config.includesInstallation && config.customerPostalCode && /^\d{5}$/.test(config.customerPostalCode)) {
    const areaM2 = calculateArea(config.customWidth, config.calculatedHeight);
    installation = mondayService.calculateInstallationCost(areaM2, config.customerPostalCode);
  }
  
  const expressProductionCost = 0;
  const additionalCosts = installation + actualShippingCost + expressProductionCost;
  const subtotal = enabledSignsTotal + additionalCosts;
  const tax = subtotal * 0.19;
  const gesamtpreis = subtotal + tax;

  const errors = validateConfiguration(config);
  const maxWidthForHeight = Math.floor((200 * config.selectedDesign.originalWidth) / config.selectedDesign.originalHeight);
  const effectiveMaxWidth = config.isTwoPart ? 1000 : Math.min(300, maxWidthForHeight);

  const currentDesignCount = config.signs?.filter((sign: any) => sign.design.id === config.selectedDesign.id).length || 0;
  const isCurrentDesignAdded = currentDesignCount > 0;

  if (currentView === 'cart') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <CustomerHeader 
          customerName="Demo Kunde"
          orderToken="demo-token"
        />
        
        <div className="pt-12 md:pt-16">
          <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 rounded-lg p-2">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">Warenkorb & Versand</h1>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {signPrices.filter(s => s.isEnabled).length} Artikel
                  </div>
                </div>
                
                <button
                  onClick={() => setCurrentView('design')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Design anpassen</span>
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Ihre Neon-Schilder</h2>
                  
                  {signPrices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-2">Warenkorb ist leer</h3>
                      <p className="text-gray-400">Fügen Sie Designs zu Ihrem Warenkorb hinzu</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {signPrices.map((sign, index) => (
                        <div
                          key={sign.id}
                          className={`border rounded-lg p-4 transition-all duration-300 ${
                            sign.isEnabled
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-gray-50 opacity-75'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <SVGPreview 
                              design={sign.design}
                              width={sign.width}
                              height={sign.height}
                              className="w-20 h-20"
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-gray-800">{sign.design.name}</h3>
                                  <p className="text-sm text-gray-600">
                                    Design {index + 1} • {sign.width}×{sign.height}cm
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-bold text-gray-800">€{sign.price.toFixed(2)}</div>
                                  <div className="text-sm text-gray-500">pro Stück</div>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                {sign.isWaterproof && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Wasserdicht (IP65)
                                  </span>
                                )}
                                {sign.isTwoPart && (
                                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Mehrteilig
                                  </span>
                                )}
                                {sign.hasUvPrint && (
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                    UV-Druck
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleSignToggle(sign.id, !sign.isEnabled)}
                                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
                                      sign.isEnabled
                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                    }`}
                                  >
                                    {sign.isEnabled ? (
                                      <>
                                        <Eye className="h-4 w-4" />
                                        <span>Aktiv</span>
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="h-4 w-4" />
                                        <span>Inaktiv</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                
                                <button
                                  onClick={() => handleRemoveSign(sign.id)}
                                  className="flex items-center space-x-1 px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-all duration-300 text-sm font-medium"
                                >
                                  <X className="h-4 w-4" />
                                  <span>Entfernen</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shipping Options */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Versandoptionen</h2>
                  
                  <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-all duration-300 cursor-pointer mb-4 ${
                    config.includesInstallation
                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                      : config.selectedShipping && config.selectedShipping.type === 'pickup'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (config.includesInstallation) return;
                    
                    if (config.selectedShipping && config.selectedShipping.type === 'pickup') {
                      handleShippingChange(null);
                    } else {
                      handleShippingChange({
                        type: 'pickup',
                        name: 'Selbstabholung',
                        price: 0,
                        description: 'Kostenlose Abholung in 67433 Neustadt'
                      });
                    }
                  }}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      config.includesInstallation
                        ? 'border-gray-300 bg-gray-200'
                        : config.selectedShipping && config.selectedShipping.type === 'pickup'
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-400 bg-white'
                    }`}>
                      {!config.includesInstallation && 
                       (config.selectedShipping && config.selectedShipping.type === 'pickup') && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    
                    <div className={`p-2 rounded-lg ${
                      config.includesInstallation
                        ? 'bg-gray-200 text-gray-400'
                        : config.selectedShipping && config.selectedShipping.type === 'pickup'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Home className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-800">Selbstabholung (Empfohlen)</h4>
                        <span className="font-bold text-green-600">Kostenlos</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Kostenlose Abholung in 67433 Neustadt</p>
                    </div>
                  </div>

                  {longestSide >= 240 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-800">Versand verfügbar</h3>
                      </div>
                      
                      {shippingInfo.requiresPostalCode && !config.customerPostalCode ? (
                        <>
                          <p className="text-blue-700 text-sm mb-3">
                            Längste Seite: {longestSide}cm → Postleitzahl eingeben für Kostenberechnung
                          </p>
                          <button
                            onClick={() => setShowPostalCodeInput(true)}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Postleitzahl eingeben
                          </button>
                        </>
                      ) : (
                        <div className="text-sm text-blue-700">
                          <p className="mb-1">{shippingInfo.method}: €{shippingInfo.cost}</p>
                          <p>Längste Seite: {longestSide}cm → {shippingInfo.description}</p>
                          {config.customerPostalCode && (
                            <p className="mt-2 font-medium">
                              Lieferung nach {distanceInfo.cityName} ({config.customerPostalCode}) - {distanceInfo.distance} km
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Summary & Checkout */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Bestellübersicht</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-700">
                      <span>Schilder ({signPrices.filter(s => s.isEnabled).length}):</span>
                      <span className="font-semibold">€{enabledSignsTotal.toFixed(2)}</span>
                    </div>
                    
                    {additionalCosts > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Zusatzkosten:</span>
                        <span className="font-semibold">€{additionalCosts.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-gray-700 border-t pt-3">
                      <span>Zwischensumme:</span>
                      <span className="font-semibold">€{subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-gray-700">
                      <span>MwSt. (19%):</span>
                      <span className="font-semibold">€{tax.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-3">
                      <span>Gesamtpreis:</span>
                      <span className="text-green-600">€{gesamtpreis.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Checkbox-Bestätigung im Bestellprozess</h4>
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isConfirmed}
                          onChange={(e) => setIsConfirmed(e.target.checked)}
                          className="w-5 h-5 text-green-600 focus:ring-green-500 rounded mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-gray-800 leading-relaxed">
                          <strong>☑ Ich habe das Mock-up geprüft und bestätige, dass es meinen Vorgaben entspricht.
                          Nach meiner Bestellung sind keine Änderungen oder ein Widerruf möglich.</strong>
                        </span>
                      </label>
                      <p className="text-xs text-gray-600 mt-2 ml-8">
                        Ohne diese Bestätigung ist eine Auftragserteilung nicht möglich.
                      </p>
                    </div>
                    
                    <button 
                      onClick={handleStripeCheckout}
                      disabled={isProcessingPayment || !isConfirmed}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>
                        {isProcessingPayment ? 'Wird verarbeitet...' : 
                         !isConfirmed ? 'Bestätigung erforderlich' :
                         `Jetzt bezahlen - €${gesamtpreis.toFixed(2)}`}
                      </span>
                    </button>
                    
                    <button 
                      disabled={!isConfirmed}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="h-5 w-5" />
                      <span>{!isConfirmed ? 'Bestätigung erforderlich' : 'Per Rechnung bestellen'}</span>
                    </button>
                  </div>

                  <div className="mt-6 bg-gray-50 rounded-lg p-3 border">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="text-xs text-gray-600">Sichere Zahlung:</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 flex-wrap gap-1">
                      <div className="bg-white rounded px-2 py-1 shadow-sm border flex items-center">
                        <div className="w-6 h-3 bg-blue-600 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">V</span>
                        </div>
                      </div>
                      <div className="bg-white rounded px-2 py-1 shadow-sm border flex items-center">
                        <div className="w-6 h-3 flex items-center justify-center">
                          <div className="flex space-x-0.5">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full -ml-0.5"></div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded px-2 py-1 shadow-sm border flex items-center">
                        <div className="w-6 h-3 flex items-center justify-center">
                          <div className="flex space-x-0.5">
                            <div className="w-1 h-2 bg-blue-600 rounded-full"></div>
                            <div className="w-1 h-2 bg-blue-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded px-2 py-1 shadow-sm border flex items-center">
                        <div className="w-6 h-3 bg-green-600 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">€</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Powered by Stripe • 14 Tage Widerrufsrecht • Käuferschutz
                  </p>
                </div>
              </div>
            </div>

            {/* Postal Code Input Modal */}
            {showPostalCodeInput && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Postleitzahl eingeben</h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Geben Sie Ihre Postleitzahl ein, um die Versandkosten zu berechnen.
                  </p>
                  
                  <input
                    type="text"
                    placeholder="z.B. 10115"
                    value={tempPostalCode}
                    onChange={(e) => setTempPostalCode(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg mb-4"
                    maxLength={5}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handlePostalCodeSubmit();
                      }
                    }}
                  />
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePostalCodeSubmit}
                      disabled={!tempPostalCode || !/^\d{5}$/.test(tempPostalCode)}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Berechnen
                    </button>
                    <button
                      onClick={() => {
                        setShowPostalCodeInput(false);
                        setTempPostalCode('');
                      }}
                      className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <CustomerHeader 
        customerName="Demo Kunde"
        orderToken="demo-token"
      />
      
      <div className="pt-12 md:pt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Column - Design & Configuration */}
            <div className="lg:col-span-8 space-y-6">
              {/* Design Selector */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-8">
                <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-2">
                    <Palette className="h-5 md:h-6 w-5 md:w-6 text-white" />
                  </div>
                  <h2 className="text-lg md:text-2xl font-bold text-gray-800">Design auswählen</h2>
                </div>

                {/* Design Display */}
                <div className="relative lg:block">
                  <div className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-4 md:p-6 flex items-center justify-center min-h-[350px] lg:min-h-[300px] overflow-hidden transition-all duration-300 relative border-4 border-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 shadow-2xl ${
                    !isCurrentDesignAdded ? 'opacity-50 grayscale' : ''
                  } lg:rounded-b-none before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-blue-500/20 before:via-purple-500/20 before:to-pink-500/20 before:blur-sm before:-z-10`}>
                    
                    <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-blue-400/60 rounded-tl-lg"></div>
                    <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-purple-400/60 rounded-tr-lg"></div>
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-pink-400/60 rounded-bl-lg"></div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-blue-400/60 rounded-br-lg"></div>
                    
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
                    
                    <img
                      src={config.selectedDesign.mockupUrl}
                      alt={config.selectedDesign.name}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl lg:shadow-2xl relative z-10 border border-white/10"
                      style={{
                        filter: 'drop-shadow(0 0 30px rgba(236, 72, 153, 0.7)) drop-shadow(0 0 60px rgba(59, 130, 246, 0.4))',
                      }}
                    />
                    
                    {/* Navigation Arrows */}
                    <button
                      onClick={() => {
                        const currentIndex = designs.findIndex(d => d.id === config.selectedDesign.id);
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : designs.length - 1;
                        handleDesignChange(designs[prevIndex]);
                      }}
                      className="lg:hidden absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
                    >
                      <ArrowLeft className="h-6 w-6 text-gray-700" />
                    </button>
                    
                    <button
                      onClick={() => {
                        const currentIndex = designs.findIndex(d => d.id === config.selectedDesign.id);
                        const nextIndex = currentIndex < designs.length - 1 ? currentIndex + 1 : 0;
                        handleDesignChange(designs[nextIndex]);
                      }}
                      className="lg:hidden absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
                    >
                      <ArrowLeft className="h-6 w-6 text-gray-700 transform rotate-180" />
                    </button>
                    
                    {/* Design Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 lg:space-x-1.5">
                      {designs.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleDesignChange(designs[index])}
                          className={`w-4 h-4 lg:w-2.5 lg:h-2.5 rounded-full transition-all duration-300 border border-white/30 ${
                            index === designs.findIndex(d => d.id === config.selectedDesign.id)
                              ? 'bg-white shadow-lg shadow-white/50 scale-110'
                              : 'bg-white/20 hover:bg-white/40 backdrop-blur-sm'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* UV-Druck Toggle */}
                  <div className="mt-3 mb-3">
                    <button
                      onClick={() => handleConfigChange({ hasUvPrint: !config.hasUvPrint })}
                      className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${
                        config.hasUvPrint
                          ? 'bg-green-600 text-white border-green-500 shadow-lg hover:bg-green-700 active:scale-95'
                          : 'bg-red-500 text-white border-red-400 shadow-md hover:bg-red-600 active:scale-95'
                      }`}
                      title="UV-Druck Zusatzoption ein/ausschalten"
                    >
                      {config.hasUvPrint ? '✅ UV-Druck AKTIV' : '❌ UV-Druck DEAKTIVIERT'}
                    </button>
                  </div>
                  
                  {/* Navigation Arrows for Desktop */}
                  <button
                    onClick={() => {
                      const currentIndex = designs.findIndex(d => d.id === config.selectedDesign.id);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : designs.length - 1;
                      handleDesignChange(designs[prevIndex]);
                    }}
                    className="hidden lg:block absolute -left-3 lg:-left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 lg:p-2 shadow-lg transition-all duration-300 hover:scale-110"
                  >
                    <ArrowLeft className="h-5 lg:h-4 w-5 lg:w-4 text-gray-700" />
                  </button>
                  
                  <button
                    onClick={() => {
                      const currentIndex = designs.findIndex(d => d.id === config.selectedDesign.id);
                      const nextIndex = currentIndex < designs.length - 1 ? currentIndex + 1 : 0;
                      handleDesignChange(designs[nextIndex]);
                    }}
                    className="hidden lg:block absolute -right-3 lg:-right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 lg:p-2 shadow-lg transition-all duration-300 hover:scale-110"
                  >
                    <ArrowLeft className="h-5 lg:h-4 w-5 lg:w-4 text-gray-700 transform rotate-180" />
                  </button>
                </div>

                {/* Design Info */}
                <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 lg:rounded-t-none rounded-b-xl px-4 py-3 lg:px-3 lg:py-2 border-2 border-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 lg:border-t-0 mb-6 lg:mb-6 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white truncate pr-2 relative z-10">{config.selectedDesign.name}</h3>
                    <span className="text-xs font-bold text-gray-300 bg-gradient-to-r from-gray-700 to-gray-600 px-2 py-1 rounded-full flex-shrink-0 border border-gray-500/30 relative z-10">
                      #{designs.findIndex(d => d.id === config.selectedDesign.id) + 1}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:flex lg:items-center lg:justify-between gap-2 lg:gap-0 mt-2 text-xs relative z-10">
                    <div className="text-center">
                      <div className="text-gray-400 text-xs">Breite</div>
                      <div className="font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded">{config.selectedDesign.originalWidth}cm</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-xs">Höhe</div>
                      <div className="font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded">{config.selectedDesign.originalHeight}cm</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-xs">Elemente</div>
                      <div className="font-bold text-green-300 bg-green-500/20 px-2 py-0.5 rounded">{config.selectedDesign.elements}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-xs">LED</div>
                      <div className="font-bold text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded">
                        {config.selectedDesign.ledLength}m
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Section */}
                <div className="mb-3 lg:mb-4 mt-3 lg:mt-4">
                  <div className="space-y-3">
                    <button
                      onClick={() => handleToggleDesign(config.selectedDesign, true)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                    >
                      <Plus className="h-5 w-5" />
                      <span>{currentDesignCount > 0 ? 'Weitere hinzufügen' : 'Hinzufügen'}</span>
                      <div className="bg-white/20 rounded-full px-2 py-1 text-sm font-bold">
                        €{currentDesignPrice.toFixed(2)}
                      </div>
                    </button>
                    
                    {currentDesignCount > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="bg-green-500 rounded-full p-1">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-blue-800 font-semibold">
                              {currentDesignCount}x im Warenkorb
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-blue-700 mb-1">
                          LED-Schild ({config.customWidth}×{config.calculatedHeight}cm)
                          {config.isWaterproof && ' • Wasserdicht'}
                          {config.isTwoPart && ' • Mehrteilig'}
                          {config.hasUvPrint && ' • UV-Druck'}
                        </div>
                        <div className="text-lg font-bold text-blue-800">
                          €{currentDesignPrice.toFixed(2)} pro Stück
                        </div>
                        <div className="text-sm text-green-700 font-medium mt-1">
                          Gesamt: €{(currentDesignPrice * currentDesignCount).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Configuration Panel */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 space-y-4 md:space-y-6">
                <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-2">
                    <Ruler className="h-5 md:h-6 w-5 md:w-6 text-white" />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">Konfiguration</h2>
                </div>

                {/* Size Configuration */}
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-sm md:text-sm font-semibold text-gray-700 mb-2">
                        Breite
                      </label>
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="number"
                          min="20"
                          max={effectiveMaxWidth}
                          value={config.customWidth}
                          onChange={(e) => handleWidthChange(Number(e.target.value))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-medium"
                        />
                        <span className="text-gray-600 text-sm font-medium">cm</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max={effectiveMaxWidth}
                        value={config.customWidth}
                        onChange={(e) => handleWidthChange(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>20cm</span>
                        <span>{config.isTwoPart ? '10m' : '3m'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm md:text-sm font-semibold text-gray-700 mb-2">
                        Höhe
                      </label>
                      <div className="bg-gray-100 px-3 py-3 md:py-2 rounded-lg text-center mb-2">
                        <span className="text-lg md:text-lg font-bold text-gray-800">{config.calculatedHeight} cm</span>
                      </div>
                      <div className="text-xs text-gray-500 text-center mb-1">
                        Automatisch berechnet
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        Max: 200cm
                      </div>
                    </div>
                  </div>

                  {/* Two-Part Sign Option */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.isTwoPart || false}
                        onChange={(e) => handleTwoPartChange(e.target.checked)}
                        className="w-5 h-5 text-orange-600 focus:ring-orange-500 rounded"
                      />
                      <Scissors className="h-4 md:h-3 w-4 md:w-3 text-gray-500 flex-shrink-0" />
                      <div className="flex items-center space-x-1">
                        <span className="text-sm md:text-xs text-gray-600">
                          Mehrteilig (>300cm, +15%)
                        </span>
                        <div className="relative group">
                          <Info className="h-4 md:h-3 w-4 md:w-3 text-gray-400 hover:text-blue-500 cursor-help transition-colors flex-shrink-0" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 hidden md:block">
                            Das Schild wird aus mehreren Teilen gefertigt und muss vor Ort zusammengesetzt
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="border-t pt-4 md:pt-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 md:p-3 border border-blue-100">
                    <h3 className="text-xs md:text-xs font-bold text-gray-700 mb-3 md:mb-2 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Technische Daten
                    </h3>
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                      <div className="text-center">
                        <div className="text-base md:text-lg font-bold text-blue-600">{config.selectedDesign.elements}</div>
                        <div className="text-xs text-gray-600">Elemente</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base md:text-lg font-bold text-purple-600">
                          {calculateProportionalLedLength(
                            config.selectedDesign.originalWidth,
                            config.selectedDesign.originalHeight,
                            config.selectedDesign.ledLength,
                            config.customWidth,
                            config.calculatedHeight
                          )}m
                        </div>
                        <div className="text-xs text-gray-600">LED-Länge</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base md:text-lg font-bold text-green-600">
                          {Math.round(calculateProportionalLedLength(
                            config.selectedDesign.originalWidth,
                            config.selectedDesign.originalHeight,
                            config.selectedDesign.ledLength,
                            config.customWidth,
                            config.calculatedHeight
                          ) * 9 * 1.25)}W
                        </div>
                        <div className="text-xs text-gray-600">Verbrauch</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="border-t pt-4 md:pt-6">
                  <h3 className="text-sm md:text-sm font-semibold text-gray-800 mb-3">Zusatzoptionen</h3>
                  <div className="space-y-3 md:space-y-4">
                    <label className="flex items-start space-x-3 cursor-pointer p-2 md:p-0 hover:bg-gray-50 md:hover:bg-transparent rounded-lg md:rounded-none transition-colors">
                      <input
                        type="checkbox"
                        checked={config.isWaterproof}
                        onChange={(e) => handleConfigChange({ isWaterproof: e.target.checked })}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded mt-0.5 flex-shrink-0"
                      />
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <span className="text-gray-700 font-medium text-sm md:text-base">Wasserdicht (IP65)</span>
                          <div className="text-sm text-gray-500">+25% Aufpreis</div>
                        </div>
                      </div>
                    </label>

                    <div className="flex items-start space-x-3 p-2 md:p-0 rounded-lg">
                      <div className="w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <div className="w-3 h-3 bg-gray-300 rounded border"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-red-600 text-lg flex-shrink-0">🔥</div>
                        <div className="flex-1">
                          <span className="text-gray-700 font-medium text-sm md:text-base">Super EXPRESS Produktion</span>
                          <div className="text-sm text-gray-500">1 Tag • Muss telefonisch abgeklärt werden</div>
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            Brauchst du es noch schneller? Dann ruf uns unverzüglich an: +4915225325349
                          </div>
                        </div>
                        <div className="relative group">
                          <Info className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-help transition-colors flex-shrink-0" />
                          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 hidden md:block">
                            Dafür werden zusätzliche Kosten berechnet.<br/>Brauchst du es noch schneller? Dann ruf uns unverzüglich an: +4915225325349
                            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-start space-x-3 cursor-pointer p-2 md:p-0 hover:bg-gray-50 md:hover:bg-transparent rounded-lg md:rounded-none transition-colors">
                      <input
                        type="checkbox"
                        checked={config.includesInstallation}
                        onChange={(e) => handleConfigChange({ includesInstallation: e.target.checked })}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded mt-0.5 flex-shrink-0"
                      />
                      <div className="flex items-center space-x-2">
                        <Wrench className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <span className="text-gray-700 font-medium text-sm md:text-base">Montage-Service</span>
                          <div className="text-sm text-gray-500">PLZ eingeben für Kostenberechnung</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Postal Code for Installation */}
                {config.includesInstallation && (
                  <div className="border-t pt-4 md:pt-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <label className="text-sm md:text-sm font-semibold text-gray-800">
                        Ihre Postleitzahl
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="z.B. 10115"
                      value={config.customerPostalCode}
                      onChange={(e) => handleConfigChange({ customerPostalCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={5}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Benötigt für die Berechnung der Anfahrtskosten
                    </p>
                  </div>
                )}

                {/* Validation Errors */}
                {errors.length > 0 && (
                  <div className="border-t pt-4 md:pt-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h4 className="text-red-800 font-semibold mb-2">Bitte korrigieren Sie:</h4>
                      <ul className="text-red-700 text-sm space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Mockup Stage */}
              <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="h-96 relative">
                  <NeonMockupStage
                    lengthCm={longestSide}
                    waterproof={config.isWaterproof}
                    neonOn={true}
                    uvOn={config.hasUvPrint || true}
                    selectedBackground={selectedBackground}
                    onBackgroundChange={setSelectedBackground}
                    onWaterproofChange={(isWaterproof) => handleConfigChange({ isWaterproof })}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Pricing */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-4 lg:p-6 sticky top-6">
                <div className="flex items-center space-x-2 lg:space-x-3 mb-4 lg:mb-6">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-2">
                    <Calculator className="h-5 lg:h-6 w-5 lg:w-6 text-white" />
                  </div>
                  <h2 className="text-lg lg:text-xl font-bold text-gray-800">Preiskalkulation</h2>
                  
                  {signPrices.length > 0 && (
                    <div className="ml-auto">
                      <button
                        onClick={() => setCurrentView('cart')}
                        className="relative bg-blue-600 hover:bg-blue-700 text-white p-2 lg:p-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
                      >
                        <ShoppingCart className="h-5 lg:h-6 w-5 lg:w-6" />
                        <div className="absolute -top-1 lg:-top-2 -right-1 lg:-right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 lg:h-6 w-5 lg:w-6 flex items-center justify-center">
                          {signPrices.filter(s => s.isEnabled).length}
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Selbstabholung Option */}
                <div className="mb-4 lg:mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Home className="h-5 w-5 text-green-600" />
                    <h3 className="text-sm lg:text-base font-semibold text-gray-800">Selbstabholung</h3>
                  </div>

                  <div className={`flex items-center space-x-3 p-3 border-2 rounded-lg transition-all duration-300 cursor-pointer ${
                    config.includesInstallation
                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                      : config.selectedShipping && config.selectedShipping.type === 'pickup'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 lg:hover:border-gray-300 lg:hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (config.includesInstallation) return;
                    
                    if (config.selectedShipping && config.selectedShipping.type === 'pickup') {
                      handleShippingChange(null);
                    } else {
                      handleShippingChange({
                        type: 'pickup',
                        name: 'Selbstabholung',
                        price: 0,
                        description: 'Kostenlose Abholung in 67433 Neustadt'
                      });
                    }
                  }}
                  >
                    <div className={`w-5 lg:w-4 h-5 lg:h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      config.includesInstallation
                        ? 'border-gray-300 bg-gray-200'
                        : config.selectedShipping && config.selectedShipping.type === 'pickup'
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-400 bg-white'
                    }`}>
                      {!config.includesInstallation && 
                       (config.selectedShipping && config.selectedShipping.type === 'pickup') && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      config.includesInstallation
                        ? 'bg-gray-200 text-gray-400'
                        : config.selectedShipping && config.selectedShipping.type === 'pickup'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Home className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-800 text-sm truncate pr-2">Selbstabholung</h4>
                        <span className="font-bold text-sm text-gray-800 flex-shrink-0">Kostenlos</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">Kostenlose Abholung in 67433 Neustadt</p>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPostalCodeInput(true);
                        }}
                        className="mt-2 w-full px-3 py-2 lg:py-1.5 text-xs bg-blue-100 text-blue-700 rounded-md lg:hover:bg-blue-200 transition-colors"
                      >
                        Wie weit von mir?
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shipping Cost Information */}
                {signPrices.filter(s => s.isEnabled).length > 0 && !config.includesInstallation && (
                  <div className="mb-4 lg:mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <h3 className="text-sm lg:text-base font-semibold text-gray-800">Versandkosten-Information</h3>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
                      {shippingInfo.requiresPostalCode && !config.customerPostalCode ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-800 font-medium text-sm lg:text-base">PLZ erforderlich: €0</span>
                            <span className="text-blue-600 text-sm">()</span>
                          </div>
                          <p className="text-blue-700 text-sm mb-3 leading-relaxed">
                            Längste Seite: {longestSide}cm (≥240cm) → Postleitzahl eingeben für Kostenberechnung
                          </p>
                          <button
                            onClick={() => setShowPostalCodeInput(true)}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg lg:hover:bg-blue-700 transition-colors"
                          >
                            Postleitzahl eingeben
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-800 font-medium text-sm lg:text-base truncate pr-2">{shippingInfo.method}: €{shippingInfo.cost}</span>
                            <span className="text-blue-600 text-sm">({shippingInfo.days})</span>
                          </div>
                          <p className="text-blue-700 text-sm leading-relaxed">
                            Längste Seite: {longestSide}cm → {shippingInfo.description}
                          </p>
                          
                          {config.customerPostalCode && (
                            <div className="mt-3 bg-white rounded-lg p-3 border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium text-gray-700">Lieferadresse:</span>
                                </div>
                                <button
                                  onClick={() => setShowPostalCodeInput(true)}
                                  className="text-xs text-blue-600 lg:hover:text-blue-800 underline"
                                >
                                  Ändern
                                </button>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                                <div className="text-sm text-gray-800">
                                  <span className="font-medium">{distanceInfo.cityName}</span>
                                  <span className="text-gray-500 ml-1">({config.customerPostalCode})</span>
                                </div>
                                <div className="text-sm font-medium text-blue-600">
                                  {distanceInfo.distance} km
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {config.selectedShipping?.type === 'pickup' && (
                        <p className="text-green-700 text-sm font-medium mt-2">
                          ✓ Bei Selbstabholung entfallen die Versandkosten
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Costs Section */}
                {(config.isWaterproof || installation > 0 || actualShippingCost > 0 || expressProductionCost > 0) && (
                  <div className="mb-4">
                    <h3 className="text-sm lg:text-base font-semibold text-gray-800 mb-3">Zusatzkosten</h3>
                    <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                      {config.isWaterproof && (
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-gray-700 font-medium text-sm">Wasserdicht (IP65)</span>
                            <div className="text-sm text-gray-500">+25% Aufpreis</div>
                          </div>
                          <span className="font-semibold text-gray-800 text-sm lg:text-base">€{(enabledSignsTotal * 0.25).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {expressProductionCost > 0 && (
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-gray-700 font-medium text-sm">Express Herstellung</span>
                            <div className="text-sm text-gray-500">4-6 Tage statt Standard</div>
                          </div>
                          <span className="font-semibold text-gray-800 text-sm lg:text-base">€{expressProductionCost.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {installation > 0 && config.customerPostalCode && /^\d{5}$/.test(config.customerPostalCode) && (
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-gray-700 font-medium text-sm">Montage-Service</span>
                            <div className="text-sm text-gray-500 leading-relaxed">
                              Montage + Anfahrt
                              <span className="font-medium text-blue-600">
                                {' '}({distanceInfo.distance} km)
                              </span>
                            </div>
                          </div>
                          <span className="font-semibold text-gray-800 text-sm lg:text-base">€{installation.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {actualShippingCost > 0 && (
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-gray-700 font-medium text-sm">Versand</span>
                            <div className="text-sm text-gray-500 leading-relaxed">
                              {shippingInfo.method === 'Lokale Zustellung' ? `Lokale Zustellung (${distanceInfo.distance} km × €3,00)` : shippingInfo.method}
                              {config.customerPostalCode && shippingInfo.requiresPostalCode && (
                                <span className="font-medium text-blue-600">
                                  {' '}({distanceInfo.distance} km)
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-semibold text-gray-800 text-sm lg:text-base">€{actualShippingCost.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {config.includesInstallation && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-green-800 font-medium text-sm">Versandkostenfrei</span>
                          </div>
                          <p className="text-green-700 text-xs">
                            Bei Montage-Service entfallen alle Versandkosten
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Price Summary */}
                {(signPrices.length > 0 || !isCurrentDesignInList) && (
                  <div className="border-t pt-3 space-y-2 mb-4">
                    <div className="flex justify-between text-sm lg:text-base text-gray-700">
                      <span>{isCurrentDesignInList ? 'Ausgewählte Schilder:' : 'Aktuelles Design:'}</span>
                      <span className="font-semibold">€{enabledSignsTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm lg:text-base text-gray-700">
                      <span>Zusatzkosten:</span>
                      <span className="font-semibold">€{additionalCosts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm lg:text-base text-gray-700">
                      <span>Zwischensumme:</span>
                      <span className="font-semibold">€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm lg:text-base text-gray-700">
                      <span>MwSt. (19%):</span>
                      <span className="font-semibold">€{tax.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                        
                {/* Gesamtpreis */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-4 border-2 border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg lg:text-xl font-bold text-gray-800">Gesamtpreis:</span>
                    <span className="text-3xl font-bold text-green-600">
                      €{gesamtpreis.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {isCurrentDesignInList 
                      ? `${signPrices.filter(s => s.isEnabled).length} Schild(er) ausgewählt`
                      : `Aktuelles Design: ${config.selectedDesign.name}`
                    }
                    {config.customerPostalCode && (
                      <span>
                        {' '}• Entfernung: {distanceInfo.distance} km nach {distanceInfo.cityName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Savings Notification */}
                {signPrices.filter(s => s.isEnabled).length > 0 && 
                 !config.includesInstallation && 
                 actualShippingCost > 0 && 
                 longestSide > 120 && (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-3">
                    <p className="text-green-800 font-medium text-xs text-center">
                      💰 Sie können €{actualShippingCost.toFixed(2)} ersparen bei Selbstabholung!
                    </p>
                  </div>
                )}

                {/* Payment Button */}
                <div className="space-y-3">
                  <button 
                    onClick={() => setCurrentView('cart')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-lg lg:hover:from-blue-700 lg:hover:to-purple-700 transition duration-300 lg:transform lg:hover:scale-105 shadow-lg lg:hover:shadow-xl flex items-center justify-center space-x-2 lg:space-x-3 disabled:opacity-50 disabled:cursor-not-allowed lg:disabled:transform-none active:scale-95"
                    disabled={signPrices.filter(s => s.isEnabled).length === 0 && isCurrentDesignInList}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-sm lg:text-base">Warenkorb - €{gesamtpreis.toFixed(2)}</span>
                  </button>
                  
                  {/* Payment Methods */}
                  <div className="bg-gray-50 rounded-lg p-3 lg:p-2 border">
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <span className="text-xs text-gray-600">Sichere Zahlung:</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1 lg:space-x-2 flex-wrap gap-1">
                      <div className="bg-white rounded px-2 lg:px-1.5 py-1 lg:py-0.5 shadow-sm border flex items-center">
                        <div className="w-6 h-3 bg-blue-600 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">V</span>
                        </div>
                      </div>
                      <div className="bg-white rounded px-2 lg:px-1.5 py-1 lg:py-0.5 shadow-sm border flex items-center">
                        <div className="w-6 h-3 flex items-center justify-center">
                          <div className="flex space-x-0.5">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full -ml-0.5"></div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded px-2 lg:px-1.5 py-1 lg:py-0.5 shadow-sm border flex items-center">
                        <div className="w-6 h-3 flex items-center justify-center">
                          <div className="flex space-x-0.5">
                            <div className="w-1 h-2 bg-blue-600 rounded-full"></div>
                            <div className="w-1 h-2 bg-blue-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded px-2 lg:px-1.5 py-1 lg:py-0.5 shadow-sm border flex items-center">
                        <div className="w-6 h-3 bg-green-600 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">€</span>
                        </div>
                      </div>
                      <div className="bg-white rounded px-2 lg:px-1.5 py-1 lg:py-0.5 shadow-sm border flex items-center">
                        <div className="w-6 h-3 bg-red-600 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">G</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
                    Powered by Stripe • 14 Tage Widerrufsrecht • Käuferschutz
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Nontel</h3>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Professionelle LED-Neon-Schilder nach Maß. Hochwertige Qualität, 
                  individuelle Gestaltung und schnelle Lieferung.
                </p>
                <div className="text-sm text-gray-600">
                  <p>📍 Hermann-Wehrle-Str. 10, 67433 Neustadt</p>
                  <p>📞 +49 163 1661464</p>
                  <p>📧 info@nontel.de</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Rechtliches</h4>
                <div className="space-y-2 text-sm">
                  <Link to="/impressum" className="block text-gray-600 hover:text-blue-600 transition-colors">
                    Impressum
                  </Link>
                  <Link to="/datenschutz" className="block text-gray-600 hover:text-blue-600 transition-colors">
                    Datenschutz
                  </Link>
                  <Link to="/agb" className="block text-gray-600 hover:text-blue-600 transition-colors">
                    AGB
                  </Link>
                  <Link to="/widerrufsrecht" className="block text-gray-600 hover:text-blue-600 transition-colors">
                    Widerrufsrecht
                  </Link>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Service</h4>
                <div className="space-y-2 text-sm">
                  <Link to="/zahlung-versand" className="block text-gray-600 hover:text-blue-600 transition-colors">
                    Zahlung & Versand
                  </Link>
                  <a href="tel:+491631661464" className="block text-gray-600 hover:text-blue-600 transition-colors">
                    Kontakt
                  </a>
                </div>
              </div>
            </div>
            
            <div className="border-t mt-8 pt-6 flex flex-col md:flex-row items-center justify-between">
              <p className="text-sm text-gray-500">
                © 2025 Nontel. Alle Rechte vorbehalten.
              </p>
              <MondayStatus />
            </div>
          </div>
        </footer>

        {/* Postal Code Input Modal */}
        {showPostalCodeInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Postleitzahl eingeben</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Geben Sie Ihre Postleitzahl ein, um die Entfernung und Kosten zu berechnen.
              </p>
              
              <input
                type="text"
                placeholder="z.B. 10115"
                value={tempPostalCode}
                onChange={(e) => setTempPostalCode(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg mb-4"
                maxLength={5}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePostalCodeSubmit();
                  }
                }}
              />
              
              <div className="flex space-x-3">
                <button
                  onClick={handlePostalCodeSubmit}
                  disabled={!tempPostalCode || !/^\d{5}$/.test(tempPostalCode)}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Berechnen
                </button>
                <button
                  onClick={() => {
                    setShowPostalCodeInput(false);
                    setTempPostalCode('');
                  }}
                  className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;