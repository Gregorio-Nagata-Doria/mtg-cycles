import cycles from "@cycles";
import { setSymbolSvg } from "@/lib/setSymbols";

type Cycle = (typeof cycles)[number];

export default function setSymbol({
  singleCycle,
  size = "4px",
}: {
  singleCycle: Cycle;
  size?: string;
}) {
  const svg = setSymbolSvg(singleCycle);

  return (
    <>
      {" "}
      {svg && (
        <span
          aria-label="simbolo do set"
          role="img"
          style={{ width: size, height: size }}
          className="inline-block **:fill-current [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </>
  );
}
