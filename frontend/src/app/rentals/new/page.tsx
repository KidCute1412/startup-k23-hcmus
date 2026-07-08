import { notFound } from "next/navigation";
import { RentalRequestForm } from "@/features/rentals/rental-request-form";
import { getGearById } from "@/features/catalog/mock-data";

type NewRentalPageProps = {
  searchParams: {
    gearId?: string;
  };
};

export default function NewRentalPage({ searchParams }: NewRentalPageProps) {
  const gear = searchParams.gearId ? getGearById(searchParams.gearId) : undefined;

  if (!gear) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <RentalRequestForm gear={gear} />
    </section>
  );
}
