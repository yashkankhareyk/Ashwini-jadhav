import React from 'react';
import { ExternalLink } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  cloudinaryId?: string;
  affiliateLink: string;
  brand?: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const handleProductClick = () => {
    window.open(product.affiliateLink, '_blank');
  };

  return (
    <div 
      className="bg-white rounded-lg overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-lg"
      onClick={handleProductClick}
    >
      <div className="aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.imageUrl ? product.imageUrl.replace('/upload/', '/upload/w_400,f_auto,q_auto/') : ''}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      
      <div className="p-4">
        {product.brand && (
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.brand}
          </p>
        )}
        
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ₹{product.price}
          </span>
          
          <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
            <ExternalLink className="w-4 h-4 mr-1" />
            <span>Shop Now</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;