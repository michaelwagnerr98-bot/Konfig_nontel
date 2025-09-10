import React from 'react';
import { Ruler, Shield, Wrench, Palette, Zap, Info } from 'lucide-react';
import { ConfigurationState } from '../types/configurator';
import { calculateProportionalHeight, validateConfiguration } from '../utils/calculations';

interface ConfigurationPanelProps {
  config: ConfigurationState;
  onConfigChange: (updates: Partial<ConfigurationState>) => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onConfigChange,
}) => {
  const errors = validateConfiguration(config);
  
  // Calculate maximum width based on height constraint
  const maxWidthForHeight = Math.floor((200 * config.selectedDesign.originalWidth) / config.selectedDesign.originalHeight);
  const effectiveMaxWidth = config.isTwoPart ? 1000 : Math.min(300, maxWidthForHeight);
  
  const handleWidthChange = (newWidth: number) => {
    const newHeight = calculateProportionalHeight(
      config.selectedDesign.originalWidth,
      config.selectedDesign.originalHeight,
      newWidth
    );
    
    // Don't allow width that would make height > 200cm (unless two-part)
    if (!config.isTwoPart && newHeight > 200) {
      return;
    }
    
    onConfigChange({
      customWidth: newWidth,
      calculatedHeight: newHeight,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-purple-600 rounded-lg p-2">
          <Ruler className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Konfiguration</h2>
      </div>

      {/* Size Configuration */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Width */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Breite
          </label>
          <div className="mb-3">
            <input
              type="number"
              min="30"
              max={effectiveMaxWidth}
              value={config.customWidth}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-full px-4 py-3 text-center text-lg font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="text-right mt-1">
              <span className="text-sm text-gray-500">cm</span>
            </div>
          </div>
          <input
            type="range"
            min="30"
            max={effectiveMaxWidth}
            value={config.customWidth}
            onChange={(e) => handleWidthChange(Number(e.target.value))}
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

      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Wasserdicht */}
        <button
          onClick={() => onConfigChange({ isWaterproof: !config.isWaterproof })}
          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
            config.isWaterproof
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <Shield className={`h-8 w-8 ${config.isWaterproof ? 'text-blue-600' : 'text-gray-400'}`} />
            <div className="text-center">
              <div className="font-semibold text-gray-800">Wasserdicht</div>
              <div className="text-sm text-gray-500">+25%</div>
            </div>
          </div>
        </button>

        {/* UV-Druck */}
        <button
          onClick={() => onConfigChange({ hasUvPrint: !config.hasUvPrint })}
          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
            config.hasUvPrint
              ? 'border-purple-500 bg-purple-500 text-white'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <Palette className={`h-8 w-8 ${config.hasUvPrint ? 'text-white' : 'text-gray-400'}`} />
            <div className="text-center">
              <div className={`font-semibold ${config.hasUvPrint ? 'text-white' : 'text-gray-800'}`}>UV-Druck</div>
              <div className={`text-sm ${config.hasUvPrint ? 'text-purple-100' : 'text-gray-500'}`}>Empfohlen</div>
            </div>
          </div>
        </button>

        {/* Hängesystem */}
        <button
          onClick={() => onConfigChange({ hasHangingSystem: !config.hasHangingSystem })}
          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
            config.hasHangingSystem
              ? 'border-gray-500 bg-gray-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <svg className={`h-8 w-8 ${config.hasHangingSystem ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <div className="text-center">
              <div className="font-semibold text-gray-800">Hängesystem</div>
              <div className="text-sm text-gray-500">Optional</div>
            </div>
          </div>
        </button>

        {/* Express */}
        <button
          onClick={() => onConfigChange({ expressProduction: !config.expressProduction })}
          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
            config.expressProduction
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <Zap className={`h-8 w-8 ${config.expressProduction ? 'text-orange-600' : 'text-gray-400'}`} />
            <div className="text-center">
              <div className="font-semibold text-gray-800">Express</div>
              <div className="text-sm text-gray-500">+30%</div>
            </div>
          </div>
        </button>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-red-800 font-semibold mb-2">Bitte korrigieren Sie:</h4>
          <ul className="text-red-700 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPanel;