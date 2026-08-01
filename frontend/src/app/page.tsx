import { HomeView } from "@/features/home/home-view";
import {
  getCategories as getMockCategories,
  getFeaturedGears as getMockFeatured,
} from "@/features/catalog/mock-data";
import { getCategories, getGears } from "@/services/gearService";

export default async function HomePage() {
  let categories = getMockCategories();
  let featured = getMockFeatured();

  try {
    const [categoryData, gearData] = await Promise.all([
      getCategories(),
      getGears({ limit: 6, sort: "newest" }),
    ]);
    const rootCategories = categoryData.filter(
      (category) => category.parentId === null || category.parentId === undefined,
    );

    if (rootCategories.length > 0) categories = rootCategories;
    if (gearData.data.length > 0) featured = gearData.data;
  } catch {
    // Keep the storefront usable when the API is unavailable.
  }

  return <HomeView categories={categories} featured={featured} />;
}
