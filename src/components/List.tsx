import cycles from "@cycles";
import { CyclePreview } from "./CyclePreview";

export function List() {
  return (
    <div className="mt-8 w-full flex sm:flex-row flex-col flex-wrap gap-8 justify-between items-center">
      {cycles.slice(0, 6).map((x, key) => (
        <CyclePreview key={key} singleCycle={x} />
      ))}
    </div>
  );
}
