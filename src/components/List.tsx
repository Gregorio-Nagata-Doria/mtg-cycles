import { FEATURED_CYCLES } from "@/lib/featured";
import { CyclePreview } from "./CyclePreview";

export function List() {
  return (
    <div className="mt-8 w-full flex sm:flex-row flex-col flex-wrap gap-8 justify-between items-center">
      {FEATURED_CYCLES.map((cycle) => (
        <CyclePreview key={cycle.slug} singleCycle={cycle} />
      ))}
    </div>
  );
}
