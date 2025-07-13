export interface Product {
    _id: string;
    name: string;
    imageUrl: string; // Cloudinary URL
    cloudinaryId: string;
    affiliateLink: string,
    brand: string,
    isActive: boolean,
    // ...other fields
  }