import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { NeonDesign } from '../types/configurator';

interface SVGPreviewProps {
  design: NeonDesign;
  width: number;
  height: number;
  className?: string;
}

const SVGPreview: React.FC<SVGPreviewProps> = ({
  design,
  width,
  height,
  className = "w-20 h-20"
}) => {
  const [showModal, setShowModal] = useState(false);
  
  // Get the uploaded SVG from the mockup stage
  const getUploadedSvgContent = (): string | null => {
    try {
      // Look for SVG in the mockup stage with the specific data attribute
      const mockupStage = document.querySelector('[data-mockup-stage]');
      if (!mockupStage) {
        console.log('🔍 No mockup stage found');
        return null;
      }
      
      const svgElement = mockupStage.querySelector('svg');
      if (!svgElement) {
        console.log('🔍 No SVG found in mockup stage');
        return null;
      }
      
      console.log('✅ SVG found in mockup stage!');
      
      // Clone the SVG and clean it up for static display
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Remove all neon effects and filters for clean display
      clonedSvg.style.filter = 'none';
      clonedSvg.style.transform = 'none';
      
      // Clean up neon-line elements
      clonedSvg.querySelectorAll('.neon-line').forEach((el: any) => {
        el.style.filter = 'none';
        // Reset to original stroke color from data attribute
        const originalColor = el.getAttribute('data-neoncolor');
        if (originalColor) {
          el.setAttribute('stroke', originalColor);
        }
        el.setAttribute('stroke-width', '2');
      });
      
      // Remove any glow effects
      clonedSvg.querySelectorAll('*').forEach((el: any) => {
        if (el.style) {
          el.style.filter = 'none';
          el.style.boxShadow = 'none';
        }
      });
      
      // Remove any clip-path overlays that might interfere
      clonedSvg.querySelectorAll('g[clip-path]').forEach((el: any) => {
        // Keep the main groups but remove overlay effects
        if (el.style) {
          el.style.mixBlendMode = 'normal';
        }
      });
      
      // Clean up acrylic overlays for cart display
      clonedSvg.querySelectorAll('g').forEach((group: any) => {
        // Remove overlay groups that were added for acrylic effects
        if (group.getAttribute('clip-path') && !group.id && !group.getAttribute('data-role')) {
          // This is likely an overlay group, simplify it
          group.style.opacity = '0.3';
          group.style.mixBlendMode = 'normal';
        }
      });
      
      // Ensure proper sizing attributes
      clonedSvg.setAttribute('width', '100%');
      clonedSvg.setAttribute('height', '100%');
      clonedSvg.style.maxWidth = '100%';
      clonedSvg.style.maxHeight = '100%';
      clonedSvg.style.background = 'transparent';
      
      return clonedSvg.outerHTML;
    } catch (error) {
      console.error('Error getting SVG content:', error);
      return null;
    }
  };

  // Check if we have uploaded SVG content
  const uploadedSvgContent = getUploadedSvgContent();
  const hasUploadedSvg = !!uploadedSvgContent;

  const handlePreviewClick = () => {
    setShowModal(true);
  };

  const renderPreview = () => {
    if (hasUploadedSvg && uploadedSvgContent) {
      return (
        <div 
          className={`${className} bg-gray-50 border-2 border-gray-200 rounded-lg p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow group relative`}
          onClick={handlePreviewClick}
        >
          <div 
            className="max-w-full max-h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:object-contain"
            dangerouslySetInnerHTML={{ __html: uploadedSvgContent }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
            <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      );
    }

    // Fallback to mockup image
    return (
      <div 
        className={`${className} bg-gray-50 border-2 border-gray-200 rounded-lg p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow group relative`}
        onClick={handlePreviewClick}
      >
        <img
          src={design.mockupUrl}
          alt={design.name}
          className="max-w-full max-h-full object-contain rounded"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
          <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

  return (
    <>
      {renderPreview()}

      {/* Modal for enlarged view */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{design.name}</h3>
                <p className="text-sm text-gray-600">{width}×{height}cm</p>
                {hasUploadedSvg && (
                  <p className="text-xs text-green-600 font-medium">✓ Hochgeladenes SVG</p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <div className="flex items-center justify-center min-h-[400px] bg-gray-100 rounded-lg p-4">
                {hasUploadedSvg && uploadedSvgContent ? (
                  <div 
                    className="max-w-full max-h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto bg-white rounded-lg p-4 shadow-lg"
                    style={{ maxWidth: '800px', maxHeight: '600px' }}
                    dangerouslySetInnerHTML={{ __html: uploadedSvgContent }}
                  />
                ) : (
                  <img
                    src={design.mockupUrl}
                    alt={design.name}
                    className="max-w-full max-h-full object-contain"
                    style={{ maxWidth: '800px', maxHeight: '600px' }}
                  />
                )}
              </div>
              
              {/* Design Info */}
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{width}cm</div>
                    <div className="text-gray-600">Breite</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{height}cm</div>
                    <div className="text-gray-600">Höhe</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{design.elements}</div>
                    <div className="text-gray-600">Elemente</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{design.ledLength}m</div>
                    <div className="text-gray-600">LED-Länge</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SVGPreview;