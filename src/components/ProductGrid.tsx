import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import api from '../api/axios';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: string; // '₹1,299'
  imageUrl: string;
  cloudinaryId?: string;
  affiliateLink: string;
  brand?: string;
}

const ProductGrid: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sortOption, setSortOption] = useState<string>('default');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    handleFilterAndSort();
  }, [products, sortOption, brandFilter]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      // Ensure response.data is an array
      const productsData = Array.isArray(response.data) ? response.data : [];
      setProducts(productsData);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch products');
      setLoading(false);
      setProducts(mockProducts);
    }
  };

  const handleFilterAndSort = () => {
    // Ensure products is an array before proceeding
    if (!Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }

    let updatedProducts = [...products];

    // Filter by brand
    if (brandFilter !== 'all') {
      updatedProducts = updatedProducts.filter((p) => p.brand === brandFilter);
    }

    // Sort
    if (sortOption === 'priceLowHigh') {
      updatedProducts.sort((a, b) =>
        extractPrice(a.price) - extractPrice(b.price)
      );
    } else if (sortOption === 'priceHighLow') {
      updatedProducts.sort((a, b) =>
        extractPrice(b.price) - extractPrice(a.price)
      );
    }

    setFilteredProducts(updatedProducts);
  };

  const extractPrice = (price: string): number => {
    return parseInt(price.replace(/[^0-9]/g, ''), 10);
  };

  const mockProducts: Product[] = [
    {
      _id: '1',
      name: 'Luxury Hydrating Serum',
      description: 'Premium anti-aging serum with hyaluronic acid',
      price: '₹1,299',
      imageUrl: 'https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=400',
      affiliateLink: 'https://amazon.in/beauty-serum',
      brand: 'Beauty Co'
    },
    {
      _id: '2',
      name: 'Matte Lipstick Collection',
      description: 'Long-lasting matte lipstick in 12 shades',
      price: '₹899',
      imageUrl: 'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=400',
      affiliateLink: 'https://amazon.in/lipstick-collection',
      brand: 'Glamour'
    },
    {
      _id: '3',
      name: 'Vitamin C Face Mask',
      description: 'Brightening face mask with natural ingredients',
      price: '₹599',
      imageUrl: 'https://images.pexels.com/photos/3685538/pexels-photo-3685538.jpeg?auto=compress&cs=tinysrgb&w=400',
      affiliateLink: 'https://amazon.in/face-mask',
      brand: 'Natural Glow'
    },
    {
      _id: '4',
      name: 'Professional Makeup Brush Set',
      description: 'Complete set of premium makeup brushes',
      price: '₹1,599',
      imageUrl: 'https://images.pexels.com/photos/3685524/pexels-photo-3685524.jpeg?auto=compress&cs=tinysrgb&w=400',
      affiliateLink: 'https://amazon.in/makeup-brushes',
      brand: 'Pro Beauty'
    },
    {
      _id: '5',
      name: 'Organic Moisturizer',
      description: 'All-natural moisturizer for sensitive skin',
      price: '₹799',
      imageUrl: 'https://images.pexels.com/photos/3685531/pexels-photo-3685531.jpeg?auto=compress&cs=tinysrgb&w=400',
      affiliateLink: 'https://amazon.in/organic-moisturizer',
      brand: 'Organic Beauty'
    },
    {
      _id: '6',
      name: 'Waterproof Mascara',
      description: 'Long-lasting waterproof mascara for dramatic lashes',
      price: '₹649',
      imageUrl: 'https://images.pexels.com/photos/2113848/pexels-photo-2113848.jpeg?auto=compress&cs=tinysrgb&w=400',
      affiliateLink: 'https://amazon.in/waterproof-mascara',
      brand: 'Lash Pro'
    }
  ];

  const uniqueBrands = Array.from(new Set(products?.map((p) => p.brand))).filter(Boolean);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200"></div>
            <div className="p-2 md:p-4">
              <div className="h-3 md:h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 md:h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 md:h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 md:h-6 bg-gray-200 rounded w-16 md:w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchProducts}
          className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="px-2 md:px-4">
      {/* Filter & Sort UI */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 gap-4">
        <div>
          <label className="mr-2 font-medium text-sm md:text-base">Sort:</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border px-2 py-1 rounded text-sm md:text-base"
          >
            <option value="default">Default</option>
            <option value="priceLowHigh">Price: Low to High</option>
            <option value="priceHighLow">Price: High to Low</option>
          </select>
        </div>

        <div>
          <label className="mr-2 font-medium text-sm md:text-base">Brand:</label>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="border px-2 py-1 rounded text-sm md:text-base"
          >
            <option value="all">All Brands</option>
            {uniqueBrands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {filteredProducts && filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No products found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;