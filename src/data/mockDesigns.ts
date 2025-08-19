import { NeonDesign } from '../types/configurator';
import mondayService from '../services/mondayService';

export const MOCK_DESIGNS: NeonDesign[] = [
  {
    id: 'design-1',
    name: 'Classic Business Logo',
    originalWidth: 400, // 4m
    originalHeight: 200, // 2m
    elements: 5,
    ledLength: 12,
    mockupUrl: 'https://images.pexels.com/photos/1036936/pexels-photo-1036936.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    description: 'Klassisches Firmenlogo-Design mit klaren Linien'
  },
  {
    id: 'design-2',
    name: 'Modern Script Text',
    originalWidth: 300,
    originalHeight: 100,
    elements: 8,
    ledLength: 18,
    mockupUrl: 'https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    description: 'Moderne Schreibschrift für elegante Auftritte'
  },
  {
    id: 'design-3',
    name: 'Geometric Pattern',
    originalWidth: 250,
    originalHeight: 250,
    elements: 12,
    ledLength: 25,
    mockupUrl: 'https://images.pexels.com/photos/1036641/pexels-photo-1036641.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    description: 'Geometrisches Muster für auffällige Designs'
  },
  {
    id: 'design-4',
    name: 'Restaurant Sign',
    originalWidth: 500,
    originalHeight: 150,
    elements: 6,
    ledLength: 20,
    mockupUrl: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    description: 'Perfekt für Restaurants und Gastronomie'
  },
  {
    id: 'design-5',
    name: 'Minimalist Icon',
    originalWidth: 150,
    originalHeight: 150,
    elements: 3,
    ledLength: 8,
    mockupUrl: 'https://images.pexels.com/photos/1036624/pexels-photo-1036624.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    description: 'Minimalistisches Icon-Design'
  }
];

// Function to get designs from Monday.com or fallback to mock designs
export const getAvailableDesigns = async (): Promise<NeonDesign[]> => {
  try {
    await mondayService.fetchPrices();
    const mondayDesigns = mondayService.getDesigns();
    
    if (mondayDesigns.length > 0) {
      console.log('🎨 Using Monday.com designs:', mondayDesigns.length);
      return mondayDesigns;
    }
  } catch (error) {
    console.warn('❌ Failed to load Monday.com designs, using mock designs:', error);
  }
  
  console.log('📦 Using mock designs as fallback');
  return MOCK_DESIGNS;
};