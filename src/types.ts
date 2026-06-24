export interface Listing {
  id: string;
  title: string;
  price: number;
  condition: string;
  category: string;
  image_url: string;
  seller_username: string;
  views: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
