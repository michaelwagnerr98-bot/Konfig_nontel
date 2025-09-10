import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, CreditCard, Package, Truck, Home, MapPin, Eye, EyeOff, X, Shield, Palette, Info } from 'lucide-react';
import { ConfigurationState, SignConfiguration } from '../types/configurator';
import { calculateSingleSignPrice, calculateDistance, getShippingInfo, calculateArea, calculateProportionalHeight } from '../utils/calculations';
import { mondayService } from '../services/mondayService';
import { getAvailableDesigns } from '../data/mockDesigns';
import SVGPreview from './SVGPreview';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<any[]>([]);
  const [showPostalCodeInput, setShowPostalCodeInput] = useState(false);
  const [tempPostalCode, setTempPostalCode] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Configuration state - simplified for pricing page
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
  });

  // Load designs on mount
  useEffect(() => {
    const loadDesigns = async () => {
      try {
        // Lade gespeicherte Konfiguration aus localStorage
        const savedConfigStr = localStorage.getItem('neon-configurator-state');
        let savedConfig = null;
        
        if (savedConfigStr) {
          try {
            savedConfig = JSON.parse(savedConfigStr);
            console.log('📦 Gespeicherte Konfiguration geladen:', savedConfig);
          } catch (e) {
            console.warn('Fehler beim Laden der gespeicherten Konfiguration:', e);
          }
        }
        
        const availableDesigns = await getAvailableDesigns();
        setDesigns(availableDesigns);
        
        if (savedConfig) {
          // Verwende gespeicherte Konfiguration
          setConfig(prev => ({
            ...prev,
            ...savedConfig,
            // Stelle sicher, dass das Design in der verfügbaren Liste ist
            selectedDesign: availableDesigns.find(d => d.id === savedConfig.selectedDesign?.id) || availableDesigns[0] || prev.selectedDesign,
          }));
          console.log('✅ Konfiguration aus localStorage wiederhergestellt');
        } else if (availableDesigns.length > 0) {
          // Fallback zur Standard-Konfiguration
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

  // Calculate individual sign prices
  const signPrices = config.signs?.map(sign => ({
    ...sign,
    price: calculateSingleSignPrice(
      sign.design,
      sign.width,
      sign.height,
      sign.isWaterproof,
      sign.isTwoPart,
      sign.hasUvPrint,
      sign.hasHangingSystem || false,
      sign.expressProduction || false
    )
  })) || [];

  // Calculate total: enabled signs + current design if not in list
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
  
  const additionalCosts = installation + actualShippingCost;
  const subtotal = enabledSignsTotal + additionalCosts;
  const tax = subtotal * 0.19;
  const gesamtpreis = subtotal + tax;

  const handleConfigChange = (updates: Partial<ConfigurationState>) => {
    setConfig(prev => ({ ...prev, ...updates }));
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

  const handleShippingChange = (shipping: any) => {
    setConfig(prev => ({ ...prev, selectedShipping: shipping }));
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
      // Demo checkout
      const orderSummary = {
        items: signPrices.filter(s => s.isEnabled).length + (isCurrentDesignInList ? 0 : 1),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: gesamtpreis.toFixed(2),
        shipping: actualShippingCost.toFixed(2),
        installation: installation.toFixed(2)
      };
      
      const confirmed = confirm(
        `🛒 DEMO CHECKOUT\n\n` +
        `Artikel: ${orderSummary.items}\n` +
        `Zwischensumme: €${orderSummary.subtotal}\n` +
        `Versand: €${orderSummary.shipping}\n` +
        `Installation: €${orderSummary.installation}\n` +
        `MwSt. (19%): €${orderSummary.tax}\n` +
        `\n💰 GESAMTPREIS: €${orderSummary.total}\n\n` +
        `Dies ist eine Demo. Möchten Sie zur Erfolgsseite weitergeleitet werden?`
      );
      
      if (confirmed) {
        navigate('/success?demo=true');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(`Checkout-Fehler: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSignUpdate = (signId: string, updates: Partial<SignConfiguration>) => {
    const updatedSigns = config.signs.map(sign =>
      sign.id === signId ? { ...sign, ...updates } : sign
    );
    handleConfigChange({ signs: updatedSigns });
  };

  // Auto-select pickup by default
  useEffect(() => {
    if (!config.selectedShipping && !config.includesInstallation) {
      handleShippingChange({
        type: 'pickup',
        name: 'Selbstabholung',
        price: 0,
        description: 'Kostenlose Abholung in 67433 Neustadt'
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Zurück zur Konfiguration</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Preiskalkulation & Bestellung</h1>
          <div className="w-32"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
          {/* Left Column - Cart Items */}
          <div className="w-full lg:col-span-2 space-y-6">
            {/* Current Design Display */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Aktuelles Design</h2>
              
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
                  <SVGPreview 
                    design={config.selectedDesign}
                    width={config.customWidth}
                    height={config.calculatedHeight}
                    className="w-16 h-16 sm:w-20 sm:h-20 mx-auto sm:mx-0"
                  />
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 space-y-2 sm:space-y-0">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-center sm:text-left">{config.selectedDesign.name}</h3>
                        <p className="text-sm text-gray-600">
                          {config.customWidth}×{config.calculatedHeight}cm
                        </p>
                      </div>
                      <div className="text-center sm:text-right">
                        <div className="text-lg sm:text-xl font-bold text-gray-800">€{currentDesignPrice.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">pro Stück</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                      {config.isWaterproof && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Wasserdicht (IP65)
                        </span>
                      )}
                      {config.isTwoPart && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                          Mehrteilig
                        </span>
                      )}
                      {config.hasUvPrint && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          UV-Druck
                        </span>
                      )}
                    </div>

                    {/* Quick Configuration Options */}
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                      <button
                        onClick={() => handleConfigChange({ isWaterproof: !config.isWaterproof })}
                        className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          config.isWaterproof
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        <span>Wasserdicht</span>
                      </button>
                      
                      <button
                        onClick={() => handleConfigChange({ hasUvPrint: !config.hasUvPrint })}
                        className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          config.hasUvPrint
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Palette className="h-3 w-3" />
                        <span>UV-Druck</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Options */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Versandoptionen</h2>
              
              {/* Pickup Option */}
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
                    <h4 className="font-medium text-gray-800 text-sm sm:text-base">Selbstabholung (Empfohlen)</h4>
                    <span className="font-bold text-green-600">Kostenlos</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Kostenlose Abholung in 67433 Neustadt</p>
                </div>
              </div>

              {/* Shipping Cost Information */}
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
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="w-full lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Bestellübersicht</h2>
              
              {/* Price Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm sm:text-base text-gray-700">
                  <span>Aktuelles Design:</span>
                  <span className="font-semibold">€{currentDesignPrice.toFixed(2)}</span>
                </div>
                
                {additionalCosts > 0 && (
                  <div className="flex justify-between text-sm sm:text-base text-gray-700">
                    <span>Zusatzkosten:</span>
                    <span className="font-semibold">€{additionalCosts.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm sm:text-base text-gray-700 border-t pt-3">
                  <span>Zwischensumme:</span>
                  <span className="font-semibold">€{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm sm:text-base text-gray-700">
                  <span>MwSt. (19%):</span>
                  <span className="font-semibold">€{tax.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-800 border-t pt-3">
                  <span>Gesamtpreis:</span>
                  <span className="text-green-600">€{gesamtpreis.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Buttons */}
              <div className="space-y-3">
                {/* Checkbox-Bestätigung */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isConfirmed}
                      onChange={(e) => setIsConfirmed(e.target.checked)}
                      className="w-5 h-5 text-green-600 focus:ring-green-500 rounded mt-0.5 flex-shrink-0"
                    />
                    <span className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                      <strong>Ich habe das Design geprüft und bestätige, dass es meinen Vorgaben entspricht.
                      Nach meiner Bestellung sind keine Änderungen oder ein Widerruf möglich.</strong>
                    </span>
                  </label>
                </div>
                
                <button 
                  onClick={handleStripeCheckout}
                  disabled={isProcessingPayment || !isConfirmed}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 sm:py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 sm:space-x-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>
                    {isProcessingPayment ? 'Wird verarbeitet...' : 
                     !isConfirmed ? 'Bestätigung erforderlich' :
                     `Jetzt bezahlen - €${gesamtpreis.toFixed(2)}`}
                  </span>
                </button>
              </div>

              {/* Payment Methods */}
              <div className="mt-4 sm:mt-6 bg-gray-50 rounded-lg p-2 sm:p-3 border">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-xs text-gray-600">Sichere Zahlung:</span>
                </div>
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 flex-wrap gap-1">
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

              <p className="text-xs text-gray-500 text-center mt-3 sm:mt-4">
                Powered by Stripe • 14 Tage Widerrufsrecht • Käuferschutz
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Postal Code Input Modal */}
      {showPostalCodeInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Postleitzahl eingeben</h3>
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
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handlePostalCodeSubmit}
                disabled={!tempPostalCode || !/^\d{5}$/.test(tempPostalCode)}
                className="w-full sm:flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Berechnen
              </button>
              <button
                onClick={() => {
                  setShowPostalCodeInput(false);
                  setTempPostalCode('');
                }}
                className="w-full sm:flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;